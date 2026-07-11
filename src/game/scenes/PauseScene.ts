import Phaser from 'phaser';

import {
  DEFAULT_SAVE_DATA,
  saveData as persistSaveData,
  type SaveData,
} from '../persistence/saveData';
import { SCENE_KEYS } from './sceneKeys';

type PauseReason = 'manual' | 'focus';

type PauseSceneData = Readonly<{
  reason?: PauseReason;
}>;

type Quality = SaveData['settings']['quality'];

const qualityValues: readonly Quality[] = Object.freeze([
  'auto',
  'low',
  'medium',
  'high',
]);

const clampVolume = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(1, parsed));
};

const isQuality = (value: string): value is Quality =>
  qualityValues.includes(value as Quality);

const getSettings = (scene: Phaser.Scene): SaveData['settings'] => {
  const settings = scene.registry.get('settings') as
    | SaveData['settings']
    | undefined;
  return { ...DEFAULT_SAVE_DATA.settings, ...settings };
};

const getRecords = (scene: Phaser.Scene): SaveData['records'] => {
  const records = scene.registry.get('records') as SaveData['records'] | undefined;
  return { ...DEFAULT_SAVE_DATA.records, ...records };
};

export class PauseScene extends Phaser.Scene {
  private root: HTMLDivElement | null = null;
  private resumeButton: HTMLButtonElement | null = null;
  private shutdownRegistered = false;
  private reason: PauseReason = 'manual';

  private readonly handleEscape = (): void => {
    this.resumeGame();
  };

  private readonly handleShutdown = (): void => {
    this.input.keyboard?.off('keydown-ESC', this.handleEscape);
    this.root?.remove();
    this.root = null;
    this.resumeButton = null;
    this.shutdownRegistered = false;
  };

  constructor() {
    super({ key: SCENE_KEYS.pause });
  }

  create(data: PauseSceneData = {}): void {
    this.reason = data.reason === 'focus' ? 'focus' : 'manual';
    this.registry.set('gamePaused', true);
    this.drawBackdrop();
    this.createDialog();
    this.input.keyboard?.on('keydown-ESC', this.handleEscape);
    if (!this.shutdownRegistered) {
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);
      this.shutdownRegistered = true;
    }
    window.setTimeout(() => this.resumeButton?.focus(), 0);
  }

  private drawBackdrop(): void {
    this.add
      .rectangle(640, 360, 1_280, 720, 0x030508, 0.74)
      .setScrollFactor(0)
      .setDepth(1);
    this.add
      .rectangle(640, 360, 1_280, 6, 0x69d8e7, 0.22)
      .setScrollFactor(0)
      .setDepth(2);
  }

  private createDialog(): void {
    const parent = this.game.canvas.parentElement;
    if (parent === null) return;

    const settings = getSettings(this);
    const root = document.createElement('div');
    root.className = 'pause-overlay';
    root.innerHTML = `
      <section class="pause-panel" role="dialog" aria-modal="true" aria-labelledby="pause-title" aria-describedby="pause-status">
        <header class="pause-panel__header">
          <p class="pause-panel__eyebrow">SITE K-17 // SYSTEM HOLD</p>
          <h1 id="pause-title">Mission paused</h1>
          <p id="pause-status">${
            this.reason === 'focus'
              ? 'Focus was lost. Resume when you are ready.'
              : 'Containment timers and controls are suspended.'
          }</p>
        </header>

        <button class="pause-panel__resume" type="button">Resume mission</button>

        <div class="pause-panel__grid">
          <section class="pause-panel__section" aria-labelledby="audio-title">
            <h2 id="audio-title">Audio</h2>
            ${this.rangeMarkup('masterVolume', 'Master volume', settings.masterVolume)}
            ${this.rangeMarkup('musicVolume', 'Music volume', settings.musicVolume)}
            ${this.rangeMarkup('effectsVolume', 'Effects volume', settings.effectsVolume)}
          </section>

          <section class="pause-panel__section" aria-labelledby="display-title">
            <h2 id="display-title">Display & comfort</h2>
            <label class="pause-field pause-field--select" for="pause-quality">
              <span>Quality</span>
              <select id="pause-quality" name="quality">
                ${qualityValues
                  .map(
                    (quality) =>
                      `<option value="${quality}"${quality === settings.quality ? ' selected' : ''}>${quality[0].toUpperCase()}${quality.slice(1)}</option>`,
                  )
                  .join('')}
              </select>
            </label>
            ${this.toggleMarkup('reducedShake', 'Reduce camera shake', settings.reducedShake)}
            ${this.toggleMarkup('reducedFlash', 'Reduce bright flashes', settings.reducedFlash)}
          </section>
        </div>

        <section class="pause-panel__controls" aria-labelledby="controls-title">
          <h2 id="controls-title">Controls</h2>
          <p><strong>Desktop</strong> WASD / arrows move · Mouse aims · Click fires · G grenade · Q medkit · 1–5 weapons</p>
          <p><strong>Touch</strong> Left stick moves · Right stick aims and fires · G grenade · + medkit · W weapon</p>
        </section>

        <footer class="pause-panel__footer">
          <button class="pause-panel__secondary" data-action="restart" type="button">Restart mission</button>
          <button class="pause-panel__secondary" data-action="menu" type="button">Return to command</button>
        </footer>
      </section>
    `;
    parent.append(root);
    this.root = root;

    this.resumeButton = root.querySelector<HTMLButtonElement>('.pause-panel__resume');
    this.resumeButton?.addEventListener('click', () => this.resumeGame());
    root
      .querySelector<HTMLButtonElement>('[data-action="restart"]')
      ?.addEventListener('click', () => this.restartGame());
    root
      .querySelector<HTMLButtonElement>('[data-action="menu"]')
      ?.addEventListener('click', () => this.returnToMenu());

    for (const input of root.querySelectorAll<HTMLInputElement>('input')) {
      input.addEventListener('input', () => {
        if (input.type === 'range') this.updateRangeOutput(input);
        this.persistSettingsFromDialog();
      });
    }
    root
      .querySelector<HTMLSelectElement>('#pause-quality')
      ?.addEventListener('change', () => this.persistSettingsFromDialog());
  }

  private rangeMarkup(name: keyof SaveData['settings'], label: string, value: number): string {
    const percent = Math.round(value * 100);
    return `
      <label class="pause-field" for="pause-${name}">
        <span>${label}</span>
        <output for="pause-${name}">${percent}%</output>
        <input id="pause-${name}" name="${name}" type="range" min="0" max="1" step="0.05" value="${value}">
      </label>
    `;
  }

  private toggleMarkup(
    name: 'reducedShake' | 'reducedFlash',
    label: string,
    checked: boolean,
  ): string {
    return `
      <label class="pause-toggle" for="pause-${name}">
        <input id="pause-${name}" name="${name}" type="checkbox"${checked ? ' checked' : ''}>
        <span>${label}</span>
      </label>
    `;
  }

  private updateRangeOutput(input: HTMLInputElement): void {
    const output = this.root?.querySelector<HTMLOutputElement>(
      `output[for="${input.id}"]`,
    );
    if (output !== null && output !== undefined) {
      output.value = `${Math.round(clampVolume(input.value) * 100)}%`;
    }
  }

  private persistSettingsFromDialog(): void {
    const root = this.root;
    if (root === null) return;
    const current = getSettings(this);
    const qualityValue =
      root.querySelector<HTMLSelectElement>('#pause-quality')?.value ??
      current.quality;
    const nextSettings: SaveData['settings'] = {
      masterVolume: this.readVolume('masterVolume', current.masterVolume),
      musicVolume: this.readVolume('musicVolume', current.musicVolume),
      effectsVolume: this.readVolume('effectsVolume', current.effectsVolume),
      quality: isQuality(qualityValue) ? qualityValue : current.quality,
      reducedShake:
        root.querySelector<HTMLInputElement>('#pause-reducedShake')?.checked ??
        current.reducedShake,
      reducedFlash:
        root.querySelector<HTMLInputElement>('#pause-reducedFlash')?.checked ??
        current.reducedFlash,
    };
    const nextSave: SaveData = {
      version: 1,
      settings: nextSettings,
      records: getRecords(this),
    };
    this.registry.set('settings', nextSettings);
    this.registry.set('saveData', nextSave);
    this.registry.set(
      'reducedMotion',
      this.prefersReducedMotion() ||
        nextSettings.reducedShake ||
        nextSettings.reducedFlash,
    );
    try {
      persistSaveData(window.localStorage, nextSave);
    } catch {
      // Settings remain active for this session when storage is unavailable.
    }
  }

  private readVolume(name: string, fallback: number): number {
    const input = this.root?.querySelector<HTMLInputElement>(`[name="${name}"]`);
    return input ? clampVolume(input.value) : fallback;
  }

  private prefersReducedMotion(): boolean {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  private resumeGame(): void {
    if (document.visibilityState === 'hidden') return;
    this.registry.set('gamePaused', false);
    this.scene.resume(SCENE_KEYS.game);
    this.scene.stop();
  }

  private restartGame(): void {
    this.registry.set('gamePaused', false);
    this.scene.stop(SCENE_KEYS.game);
    this.scene.start(SCENE_KEYS.game);
    this.scene.stop();
  }

  private returnToMenu(): void {
    this.registry.set('gamePaused', false);
    this.scene.stop(SCENE_KEYS.game);
    this.scene.start(SCENE_KEYS.menu);
    this.scene.stop();
  }
}
