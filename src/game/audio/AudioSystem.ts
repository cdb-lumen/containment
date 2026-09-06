import type { CombatSnapshot } from '../combat/CombatSystem';

export type AudioVolumes = Readonly<{ master: number; music: number; effects: number }>;
type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
type Voice = { source: AudioBufferSourceNode; gain: GainNode; nodes: AudioNode[]; kind: 'effect' | 'music' | 'reload' };
const clamp01 = (n: number): number => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
const FILES = [
  'pistol-1.wav', 'pistol-2.wav', 'pistol-3.wav',
  'rifle-1.wav', 'rifle-2.wav', 'rifle-3.wav',
  'shotgun-1.wav', 'shotgun-2.wav', 'shotgun-3.wav',
  'rocket.wav', 'plasma.wav', 'explosion.wav', 'alien-impact.wav',
  'switch.wav', 'click.wav', 'reload.wav', 'ambient.mp3', 'tension.mp3',
] as const;
type Sample = typeof FILES[number];
const encodedAssets = new Map<Sample, Promise<ArrayBuffer | null>>();
const loadEncoded = (name: Sample): Promise<ArrayBuffer | null> => {
  let request = encodedAssets.get(name);
  if (!request) {
    request = fetch(`${import.meta.env.BASE_URL}assets/audio/${name}`)
      .then(response => response.ok ? response.arrayBuffer() : null).catch(() => null);
    encodedAssets.set(name, request);
  }
  return request;
};

/** Local, licensed samples. A gesture unlocks Safari audio; loading never blocks
 * play. Music crossfades between two composed ambience tracks, beneath weapons. */
export class AudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private musicDuck: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private volumes: AudioVolumes;
  private readonly buffers = new Map<Sample, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private readonly voices = new Set<Voice>();
  private readonly variants = new Map<string, number>();
  private readonly lastPlayed = new Map<string, number>();
  private stems: Voice[] = [];
  private reloadVoices: Voice[] = [];
  private musicStartedAt = 0;
  private musicPosition = 0;
  private intensity = 0;
  private musicPaused = false;
  private effectsPaused = false;
  private destroyed = false;
  private previousCombat: CombatSnapshot | null = null;

  static async preload(): Promise<void> {
    await Promise.all(FILES.map(loadEncoded));
  }

  constructor(volumes: Partial<AudioVolumes> = {}) {
    this.volumes = { master: clamp01(volumes.master ?? .8), music: clamp01(volumes.music ?? .65), effects: clamp01(volumes.effects ?? .8) };
  }

  /** AudioContext creation/resume occurs before the first await, inside gesture. */
  async unlock(): Promise<boolean> {
    if (this.destroyed) return false;
    try {
      if (!this.context) {
        if (typeof window === 'undefined') return false;
        const Audio = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
        if (!Audio) return false;
        const context = new Audio();
        this.context = context;
        this.masterGain = context.createGain();
        this.effectsGain = context.createGain();
        this.musicGain = context.createGain();
        this.musicDuck = context.createGain();
        this.compressor = context.createDynamicsCompressor();
        this.compressor.threshold.value = -8;
        this.compressor.knee.value = 10;
        this.compressor.ratio.value = 8;
        this.compressor.attack.value = .003;
        this.compressor.release.value = .18;
        this.effectsGain.connect(this.masterGain);
        this.musicGain.connect(this.musicDuck).connect(this.masterGain);
        this.masterGain.connect(this.compressor).connect(context.destination);
        this.applyVolumes();
      }
      const context = this.context;
      if (context.state === 'suspended' || String(context.state) === 'interrupted') await context.resume();
      if (this.destroyed || context !== this.context) return false;
      this.loading ??= Promise.all(FILES.map(async name => {
        try {
          const data = await loadEncoded(name);
          if (!data || this.destroyed) return;
          const buffer = await context.decodeAudioData(data.slice(0));
          if (!this.destroyed) {
            this.buffers.set(name, buffer);
            this.startMusic();
          }
        } catch { /* A missing sample must not stop the game or other sounds. */ }
      })).then(() => undefined);
      await this.loading;
      if (this.destroyed || context !== this.context) return false;
      this.startMusic();
      return context.state === 'running';
    } catch { return false; }
  }

  setVolumes(volumes: Partial<AudioVolumes>): void {
    this.volumes = { master: clamp01(volumes.master ?? this.volumes.master), music: clamp01(volumes.music ?? this.volumes.music), effects: clamp01(volumes.effects ?? this.volumes.effects) };
    this.applyVolumes();
  }
  setMasterVolume(value: number): void { this.setVolumes({ master: value }); }
  setMusicVolume(value: number): void { this.setVolumes({ music: value }); }
  setEffectsVolume(value: number): void { this.setVolumes({ effects: value }); }
  setMusicIntensity(value: number): void {
    const next = clamp01(value);
    if (Math.abs(next - this.intensity) < .01) return;
    this.intensity = next; this.mixMusic();
  }
  pauseMusic(): void {
    this.musicPaused = true;
    if (this.context && this.stems.length) this.musicPosition += this.context.currentTime - this.musicStartedAt;
    for (const voice of this.stems) this.stopVoice(voice);
    this.stems = [];
  }
  pauseAll(): void {
    this.pauseMusic(); this.effectsPaused = true;
    for (const voice of [...this.voices]) this.stopVoice(voice);
    this.reloadVoices = [];
  }
  resumeMusic(): void { if (!this.destroyed) { this.musicPaused = false; this.startMusic(); } }
  resumeAll(): void {
    this.effectsPaused = false; this.resumeMusic();
    if (this.previousCombat?.reloading) this.playReload(this.previousCombat.reloadRemainingMs, true);
  }

  playPistol(): void { this.weapon('pistol', .55); }
  playRifle(): void { this.weapon('rifle', .40); }
  playShotgun(): void { this.weapon('shotgun', .65); }
  playPlasma(): void { this.play('plasma.wav', .34); this.duckMusic(); }
  playRocket(): void { this.play('rocket.wav', .58); this.duckMusic(); }
  playGrenade(): void { this.play('switch.wav', .20, { rate: .92 }); }
  playExplosion(pan = 0, distance = 0): void {
    if (!this.rateLimit('explosion', .07)) return;
    this.play('explosion.wav', .70 / (1 + Math.max(0, distance) / 650), { pan }); this.duckMusic();
  }
  playAlien(pan = 0, distance = 0): void {
    if (this.rateLimit('alien', .18)) this.play('alien-impact.wav', .25 / (1 + Math.max(0, distance) / 380), { pan, rate: .88 + Math.random() * .14 });
  }
  playConfirmedHit(blocked=false): void {
    if (this.rateLimit('confirmed-hit', .055)) this.play(blocked?'switch.wav':'alien-impact.wav',blocked?.10:.20,{rate:blocked?1.4:1.65});
  }
  playBodyImpact(pan = 0, distance = 0): void {
    if (this.rateLimit('body-impact', .10)) this.play('alien-impact.wav', .42 / (1 + Math.max(0,distance) / 450), {pan, rate: .68 + Math.random() * .08});
  }
  playPickup(): void { if (this.rateLimit('pickup', .09)) this.play('switch.wav', .14, { rate: 1.12 }); }
  playAlarm(): void {
    // A restrained facility warning: paired pulses, not a sweeping arcade siren.
    if (!this.usable() || this.effectsPaused) return;
    const context = this.context!;
    for (const delay of [0, .32]) {
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .18), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const t = i / context.sampleRate;
        const env = Math.min(1, t / .012) * Math.min(1, (.18 - t) / .025);
        samples[i] = (Math.sin(t * Math.PI * 2 * 480) + .22 * Math.sin(t * Math.PI * 2 * 960)) * env * .16;
      }
      this.playBuffer(buffer, .35, { delay });
    }
  }
  playUI(): void {
    if (this.usable()) this.play('click.wav', .10, { allowPaused: true });
    else void this.unlock().then(ok => { if (ok) this.play('click.wav', .10, { allowPaused: true }); });
  }

  /** Subscribe to authoritative state so manual, automatic and cancelled reloads
   * produce exactly one correctly timed mechanical sequence. */
  syncCombat(snapshot: CombatSnapshot): void {
    const previous = this.previousCombat;
    this.previousCombat = snapshot;
    if (snapshot.dead || !snapshot.reloading || previous?.weaponId !== snapshot.weaponId) this.cancelReload();
    if (previous && previous.weaponId !== snapshot.weaponId && !snapshot.dead) this.play('switch.wav', .22);
    if (snapshot.reloading && (!previous?.reloading || previous.weaponId !== snapshot.weaponId)) this.playReload(snapshot.reloadRemainingMs);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.pauseAll(); this.destroyed = true;
    this.buffers.clear(); this.previousCombat = null;
    for (const node of [this.effectsGain, this.musicGain, this.musicDuck, this.masterGain, this.compressor]) node?.disconnect();
    const context = this.context; this.context = null;
    this.effectsGain = null; this.musicGain = null; this.musicDuck = null; this.masterGain = null; this.compressor = null;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }

  private weapon(family: 'pistol' | 'rifle' | 'shotgun', level: number): void {
    const variant = (this.variants.get(family) ?? 0) % 3 + 1;
    this.variants.set(family, variant);
    this.play(`${family}-${variant}.wav` as Sample, level, { rate: .987 + Math.random() * .026 });
    this.duckMusic();
  }
  private playReload(durationMs: number, resume = false): void {
    this.cancelReload();
    const duration = Math.max(.15, durationMs / 1000);
    // Source regions are the recorded magazine release, insertion, and slide.
    // Their timing follows gameplay without speeding up the Foley's pitch.
    const cues = resume ? [[Math.max(0, duration - .36), 1.00, .34]] : [
      [0, .08, .20], [Math.max(.08, duration * .48 - .1), .52, .30], [Math.max(.12, duration - .36), 1.00, .34],
    ];
    for (const [delay, offset, length] of cues) {
      const voice = this.play('reload.wav', .62, { delay, offset, duration: length, kind: 'reload' });
      if (voice) this.reloadVoices.push(voice);
    }
  }
  private cancelReload(): void { for (const voice of this.reloadVoices) this.stopVoice(voice); this.reloadVoices = []; }
  private usable(): boolean { return !this.destroyed && this.context?.state === 'running' && this.effectsGain !== null; }
  private rateLimit(key: string, interval: number): boolean {
    if (!this.usable() || this.effectsPaused) return false;
    const now = this.context!.currentTime;
    if (now - (this.lastPlayed.get(key) ?? -Infinity) < interval) return false;
    this.lastPlayed.set(key, now); return true;
  }
  private play(name: Sample, level: number, options: { rate?: number; pan?: number; delay?: number; offset?: number; duration?: number; kind?: Voice['kind']; allowPaused?: boolean } = {}): Voice | null {
    const buffer = this.buffers.get(name);
    return buffer ? this.playBuffer(buffer, level, options) : null;
  }
  private playBuffer(buffer: AudioBuffer, level: number, options: { rate?: number; pan?: number; delay?: number; offset?: number; duration?: number; kind?: Voice['kind']; allowPaused?: boolean } = {}): Voice | null {
    if (!this.usable() || (this.effectsPaused && !options.allowPaused)) return null;
    if (this.voices.size >= 32) {
      const oldest = [...this.voices].find(voice => voice.kind === 'effect');
      if (oldest) this.stopVoice(oldest); else return null;
    }
    const context = this.context!, source = context.createBufferSource(), gain = context.createGain();
    const start = context.currentTime + (options.delay ?? 0), rate = options.rate ?? 1;
    const offset = Math.max(0, options.offset ?? 0);
    const duration = Math.max(.01, Math.min(options.duration ?? buffer.duration, buffer.duration - offset) / rate);
    source.buffer = buffer; source.playbackRate.value = rate;
    // Millisecond edge ramps prevent clicks while preserving the gun transient.
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + .0015);
    gain.gain.setValueAtTime(level, start + Math.max(.002, duration - .015));
    gain.gain.linearRampToValueAtTime(0, start + duration);
    source.connect(gain);
    const nodes: AudioNode[] = [gain];
    if (options.pan && context.createStereoPanner) {
      const pan = context.createStereoPanner(); pan.pan.value = Math.max(-.8, Math.min(.8, options.pan));
      gain.connect(pan).connect(this.effectsGain!); nodes.push(pan);
    } else gain.connect(this.effectsGain!);
    const voice: Voice = { source, gain, nodes, kind: options.kind ?? 'effect' };
    this.track(voice);
    source.start(start, offset, duration * rate);
    return voice;
  }
  private track(voice: Voice): void {
    this.voices.add(voice);
    voice.source.addEventListener('ended', () => this.release(voice), { once: true });
  }
  private release(voice: Voice): void {
    if (!this.voices.has(voice)) return;
    this.voices.delete(voice); voice.source.disconnect();
    for (const node of voice.nodes) node.disconnect();
  }
  private stopVoice(voice: Voice): void {
    if (!this.voices.has(voice)) return;
    try { voice.source.stop(); } catch { /* Already ended. */ }
    this.release(voice);
  }
  private applyVolumes(): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.masterGain?.gain.setTargetAtTime(this.volumes.master * .85, now, .025);
    this.effectsGain?.gain.setTargetAtTime(this.volumes.effects, now, .025);
    this.musicGain?.gain.setTargetAtTime(this.volumes.music, now, .15);
  }
  private duckMusic(): void {
    if (!this.usable() || this.effectsPaused || !this.musicDuck || this.volumes.effects === 0) return;
    const now = this.context!.currentTime, param = this.musicDuck.gain;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(.52, now, .018);
    param.setTargetAtTime(1, now + .10, .28);
  }
  private startMusic(): void {
    if (!this.usable() || this.musicPaused || this.stems.length) return;
    const context = this.context!;
    if (!this.buffers.has('ambient.mp3') || !this.buffers.has('tension.mp3')) return;
    this.musicStartedAt = context.currentTime;
    for (const name of ['ambient.mp3', 'tension.mp3'] as const) {
      const buffer = this.buffers.get(name)!, source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer; source.loop = true; gain.gain.value = 0;
      source.connect(gain).connect(this.musicGain!);
      const voice: Voice = { source, gain, nodes: [gain], kind: 'music' };
      this.track(voice); this.stems.push(voice);
      source.start(context.currentTime, this.musicPosition % buffer.duration);
    }
    this.mixMusic();
  }
  private mixMusic(): void {
    if (!this.context) return;
    const mix = clamp01((this.intensity - .20) / .65);
    this.stems[0]?.gain.gain.setTargetAtTime(Math.cos(mix * Math.PI / 2) * .82, this.context.currentTime, 1.1);
    this.stems[1]?.gain.gain.setTargetAtTime(Math.sin(mix * Math.PI / 2) * .75, this.context.currentTime, 1.1);
  }
}
