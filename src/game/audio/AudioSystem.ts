export type AudioVolumes = Readonly<{
  master: number;
  music: number;
  effects: number;
}>;

type BrowserAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

const DEFAULT_VOLUMES: AudioVolumes = {
  master: 0.8,
  music: 0.65,
  effects: 0.8,
};

/**
 * Asset-free Web Audio sound and music. Call unlock() from a user gesture before
 * playing sounds. Every other method is safe before unlock and in non-browser
 * environments.
 */
export class AudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private volumes: AudioVolumes;
  private intensity = 0;
  private musicPaused = false;
  private destroyed = false;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private droneSources: AudioScheduledSourceNode[] = [];
  private droneProcessingNodes: AudioNode[] = [];
  private readonly activeSources = new Set<AudioScheduledSourceNode>();

  constructor(volumes: Partial<AudioVolumes> = {}) {
    this.volumes = {
      master: clamp01(volumes.master ?? DEFAULT_VOLUMES.master),
      music: clamp01(volumes.music ?? DEFAULT_VOLUMES.music),
      effects: clamp01(volumes.effects ?? DEFAULT_VOLUMES.effects),
    };
  }

  /** Creates/resumes AudioContext. Must be invoked synchronously from a gesture handler. */
  async unlock(): Promise<boolean> {
    if (this.destroyed) return false;
    let initializingContext: AudioContext | null = null;

    try {
      if (!this.context) {
        if (typeof window === 'undefined') return false;
        const AudioContextClass =
          window.AudioContext ?? (window as BrowserAudioWindow).webkitAudioContext;
        if (!AudioContextClass) return false;

        const context = new AudioContextClass();
        initializingContext = context;
        const masterGain = context.createGain();
        const musicGain = context.createGain();
        const effectsGain = context.createGain();
        effectsGain.connect(masterGain);
        musicGain.connect(masterGain);
        masterGain.connect(context.destination);
        this.context = context;
        this.masterGain = masterGain;
        this.musicGain = musicGain;
        this.effectsGain = effectsGain;
        this.applyVolumes();
        initializingContext = null;
      }

      if (this.context.state === 'suspended') await this.context.resume();
      if (!this.musicPaused) this.startMusic();
      return this.context.state === 'running';
    } catch {
      if (initializingContext) {
        if (this.context === initializingContext) {
          this.context = null;
          this.masterGain = null;
          this.musicGain = null;
          this.effectsGain = null;
        }
        if (initializingContext.state !== 'closed') {
          void initializingContext.close().catch(() => undefined);
        }
      }
      return false;
    }
  }

  setVolumes(volumes: Partial<AudioVolumes>): void {
    this.volumes = {
      master: clamp01(volumes.master ?? this.volumes.master),
      music: clamp01(volumes.music ?? this.volumes.music),
      effects: clamp01(volumes.effects ?? this.volumes.effects),
    };
    this.applyVolumes();
  }

  setMasterVolume(value: number): void {
    this.setVolumes({ master: value });
  }

  setMusicVolume(value: number): void {
    this.setVolumes({ music: value });
  }

  setEffectsVolume(value: number): void {
    this.setVolumes({ effects: value });
  }

  /** 0 = ambient, 1 = maximum combat pressure. */
  setMusicIntensity(value: number): void {
    this.intensity = clamp01(value);
  }

  pauseMusic(): void {
    this.musicPaused = true;
    this.stopMusicTimer();
    if (this.context && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.04);
    }
  }

  pauseAll(): void {
    this.pauseMusic();
    for (const source of [...this.activeSources]) {
      try {
        source.stop();
      } catch {
        // Already stopped sources are harmless.
      }
    }
  }

  /** Resumes music only; call unlock() from a gesture first if the context is suspended. */
  resumeMusic(): void {
    if (this.destroyed) return;
    this.musicPaused = false;
    this.applyVolumes();
    if (this.context?.state === 'running') this.startMusic();
  }

  resumeAll(): void {
    this.resumeMusic();
  }

  playPistol(): void {
    this.tone(170, 78, 0.09, 0.24, 'square', 1800);
    this.noise(0.055, 0.11, 2600);
  }

  playRifle(): void {
    this.tone(130, 62, 0.065, 0.19, 'sawtooth', 2300);
    this.noise(0.045, 0.09, 3500);
  }

  playShotgun(): void {
    this.noise(0.2, 0.34, 1800, 0.65);
    this.tone(105, 42, 0.18, 0.32, 'square', 900);
  }

  playPlasma(): void {
    this.tone(760, 125, 0.24, 0.2, 'sine', 4200, 0.035);
    this.tone(390, 910, 0.16, 0.09, 'triangle', 3000);
  }

  playRocket(): void {
    this.noise(0.42, 0.22, 900, 0.8);
    this.tone(92, 31, 0.42, 0.28, 'sawtooth', 700);
  }

  playExplosion(): void {
    this.noise(0.72, 0.48, 650, 1.2);
    this.tone(75, 24, 0.65, 0.38, 'sine', 420);
  }

  playAlien(): void {
    this.tone(210, 55, 0.42, 0.16, 'sawtooth', 1250, 0.025);
    this.noise(0.28, 0.1, 1100);
  }

  playPickup(): void {
    this.tone(440, 880, 0.09, 0.1, 'sine', 3600);
    this.scheduleTone(0.075, 660, 1320, 0.12, 0.08, 'sine', 4200);
  }

  playAlarm(): void {
    this.tone(310, 540, 0.25, 0.13, 'square', 1350);
    this.scheduleTone(0.29, 540, 310, 0.25, 0.11, 'square', 1350);
  }

  playUI(): void {
    if (this.usable()) {
      this.tone(720, 980, 0.045, 0.055, 'sine', 5000);
      return;
    }
    void this.unlock().then((unlocked) => {
      if (unlocked) this.tone(720, 980, 0.045, 0.055, 'sine', 5000);
    });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopMusicTimer();
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Already stopped sources are harmless.
      }
    }
    this.activeSources.clear();
    this.droneSources = [];
    this.droneProcessingNodes = [];
    this.effectsGain?.disconnect();
    this.musicGain?.disconnect();
    this.masterGain?.disconnect();
    const context = this.context;
    this.context = null;
    this.effectsGain = null;
    this.musicGain = null;
    this.masterGain = null;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }

  private applyVolumes(): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.masterGain?.gain.setTargetAtTime(this.volumes.master, now, 0.015);
    this.effectsGain?.gain.setTargetAtTime(this.volumes.effects, now, 0.015);
    this.musicGain?.gain.setTargetAtTime(
      this.musicPaused ? 0 : this.volumes.music,
      now,
      0.025,
    );
  }

  private usable(): boolean {
    return Boolean(
      !this.destroyed &&
        this.context?.state === 'running' &&
        this.effectsGain &&
        this.musicGain,
    );
  }

  private track(
    source: AudioScheduledSourceNode,
    processingNodes: readonly AudioNode[] = [],
  ): void {
    this.activeSources.add(source);
    source.addEventListener(
      'ended',
      () => {
        this.activeSources.delete(source);
        try {
          source.disconnect();
        } catch {
          // Some Web Audio implementations throw on repeat disconnect.
        }
        for (const node of processingNodes) {
          try {
            node.disconnect();
          } catch {
            // Some Web Audio implementations throw on repeat disconnect.
          }
        }
      },
      { once: true },
    );
  }

  private tone(
    from: number,
    to: number,
    duration: number,
    level: number,
    shape: OscillatorType,
    cutoff: number,
    delay = 0,
  ): void {
    this.scheduleTone(delay, from, to, duration, level, shape, cutoff);
  }

  private scheduleTone(
    delay: number,
    from: number,
    to: number,
    duration: number,
    level: number,
    shape: OscillatorType,
    cutoff: number,
  ): void {
    if (!this.usable()) return;
    const context = this.context!;
    const effectsGain = this.effectsGain!;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(Math.max(1, from), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), start + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter);
    filter.connect(envelope);
    const processingNodes: AudioNode[] = [filter, envelope];
    if (delay > 0) {
      const echo = context.createDelay(0.12);
      const echoGain = context.createGain();
      echo.delayTime.value = Math.min(0.12, delay);
      echoGain.gain.value = 0.28;
      filter.connect(echo).connect(echoGain).connect(envelope);
      processingNodes.push(echo, echoGain);
    }
    envelope.connect(effectsGain);
    this.track(oscillator, processingNodes);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noise(duration: number, level: number, cutoff: number, drive = 0): void {
    if (!this.usable()) return;
    const context = this.context!;
    const effectsGain = this.effectsGain!;
    const frameCount = Math.max(1, Math.ceil(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    envelope.gain.setValueAtTime(level, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter);
    const processingNodes: AudioNode[] = [filter, envelope];

    if (drive > 0) {
      const distortion = context.createWaveShaper();
      const curve = new Float32Array(128);
      for (let index = 0; index < curve.length; index += 1) {
        const x = (index * 2) / (curve.length - 1) - 1;
        curve[index] = Math.tanh(x * (1 + drive * 12));
      }
      distortion.curve = curve;
      filter.connect(distortion).connect(envelope);
      processingNodes.push(distortion);
    } else {
      filter.connect(envelope);
    }
    envelope.connect(effectsGain);
    this.track(source, processingNodes);
    source.start();
    source.stop(context.currentTime + duration + 0.01);
  }

  private startMusic(): void {
    if (!this.usable() || this.musicPaused || this.musicTimer) return;
    this.startDrone();
    this.musicTimer = setInterval(() => this.musicTick(), 240);
    this.musicTick();
  }

  private startDrone(): void {
    if (!this.usable() || this.droneSources.length > 0) return;
    const context = this.context!;
    const musicGain = this.musicGain!;
    const droneBus = context.createGain();
    const filter = context.createBiquadFilter();
    droneBus.gain.value = 0.055;
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    droneBus.connect(filter).connect(musicGain);
    this.droneProcessingNodes.push(droneBus, filter);
    for (const [frequency, detune] of [[46, -7], [69, 5]] as const) {
      const oscillator = context.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      oscillator.connect(droneBus);
      this.track(oscillator);
      this.droneSources.push(oscillator);
      oscillator.start();
    }
  }

  private musicTick(): void {
    if (!this.usable() || this.musicPaused) return;
    const context = this.context!;
    const musicGain = this.musicGain!;
    const step = this.musicStep++;
    const intensity = this.intensity;

    if (step % 2 === 0) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = 'square';
      oscillator.frequency.value = step % 8 === 0 ? 92 : 69;
      const now = context.currentTime;
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.025 + intensity * 0.045, now + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      oscillator.connect(envelope).connect(musicGain);
      this.track(oscillator, [envelope]);
      oscillator.start(now);
      oscillator.stop(now + 0.12);
    }

    if (intensity > 0.2 && step % (intensity > 0.7 ? 1 : 2) === 0) {
      const duration = 0.045;
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      const highpass = context.createBiquadFilter();
      const envelope = context.createGain();
      highpass.type = 'highpass';
      highpass.frequency.value = step % 4 === 0 ? 900 : 3200;
      envelope.gain.setValueAtTime(0.025 + intensity * 0.055, context.currentTime);
      envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      source.buffer = buffer;
      source.connect(highpass).connect(envelope).connect(musicGain);
      this.track(source, [highpass, envelope]);
      source.start();
      source.stop(context.currentTime + duration);
    }
  }

  private stopMusicTimer(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    for (const source of this.droneSources) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    }
    for (const node of this.droneProcessingNodes) {
      try {
        node.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    this.droneSources = [];
    this.droneProcessingNodes = [];
  }
}
