import Phaser from 'phaser';

import { createAccessibleSceneActions } from '../accessibility/domActions';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import {
  parseSaveData,
  saveData as persistSaveData,
  type SaveData,
} from '../persistence/saveData';
import {
  sanitizeRunResult,
  updateRunRecords,
  type RunRecordUpdate,
  type RunResult,
  type SelectedUpgrade,
} from '../run/RunState';
import { SCENE_KEYS } from './sceneKeys';

export type ResultsSceneData = Readonly<{ result: RunResult }>;

const COLORS = {
  void: 0x05070b,
  background: 0x080c12,
  panel: 0x111923,
  panelRaised: 0x17222d,
  cyan: 0x69d8e7,
  orange: 0xf39237,
  bone: 0xf4efe6,
  steel: 0x81909e,
} as const;

const CSS_COLORS = {
  void: '#05070b',
  background: '#080c12',
  panel: '#111923',
  cyan: '#69d8e7',
  orange: '#f39237',
  bone: '#f4efe6',
  steel: '#81909e',
} as const;

const DISPLAY_FONT = '"Arial Narrow", "Trebuchet MS", Arial, sans-serif';
const UTILITY_FONT = '"Courier New", Courier, monospace';
const BUTTON_WIDTH = 556;
const BUTTON_HEIGHT = 64;

const EMPTY_UPGRADES: readonly SelectedUpgrade[] = Object.freeze([]);
const FALLBACK_RESULT: RunResult = Object.freeze({
  started: true,
  ended: true,
  outcome: 'defeat',
  score: 0,
  kills: 0,
  eliteKills: 0,
  wavesCleared: 0,
  elapsedMs: 0,
  bossDefeated: false,
  creditsUnspent: 0,
  selectedUpgrades: EMPTY_UPGRADES,
});

type ButtonState = 'normal' | 'hover' | 'pressed' | 'locked';
type ResultAction = 'restart' | 'menu';

type ResultButton = {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  accent: number;
  accentCss: string;
  filled: boolean;
  action: ResultAction;
  onOver: () => void;
  onOut: () => void;
  onDown: () => void;
  onUp: () => void;
};

const cloneFallbackResult = (): RunResult =>
  Object.freeze({ ...FALLBACK_RESULT, selectedUpgrades: EMPTY_UPGRADES });

const sanitizeSceneData = (data: unknown): RunResult => {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return cloneFallbackResult();
  }
  return (
    sanitizeRunResult((data as Readonly<{ result?: unknown }>).result) ??
    cloneFallbackResult()
  );
};

const normalizeRegistrySave = (value: unknown): SaveData => {
  try {
    const serialized = JSON.stringify(value);
    return parseSaveData(typeof serialized === 'string' ? serialized : null);
  } catch {
    return parseSaveData(null);
  }
};

const formatNumber = (value: number): string =>
  Math.max(0, Math.trunc(value)).toLocaleString('en-US');

const formatTime = (timeMs: number | null): string => {
  if (timeMs === null) return '--:--';
  const totalSeconds = Math.max(0, Math.floor(timeMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export class ResultsScene extends Phaser.Scene {
  private result: RunResult = cloneFallbackResult();
  private buttons: ResultButton[] = [];
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private removeAccessibleActions: (() => void) | null = null;
  private transitioned = false;
  private shutdownRegistered = false;

  private readonly handleRestartKey = (): void => {
    this.transitionTo('restart');
  };

  private readonly handleMenuKey = (): void => {
    this.transitionTo('menu');
  };

  private readonly handleShutdown = (): void => {
    const keyboard = this.input.keyboard;
    keyboard?.off('keydown-ENTER', this.handleRestartKey);
    keyboard?.off('keydown-SPACE', this.handleRestartKey);
    keyboard?.off('keydown-ESC', this.handleMenuKey);
    keyboard?.off('keydown-M', this.handleMenuKey);

    for (const button of this.buttons) {
      button.container.off('pointerover', button.onOver);
      button.container.off('pointerout', button.onOut);
      button.container.off('pointerdown', button.onDown);
      button.container.off('pointerup', button.onUp);
      if (button.container.active) button.container.disableInteractive();
    }
    this.buttons = [];
    this.input.setDefaultCursor('default');

    if (this.pulseTween) {
      this.pulseTween.stop();
      this.tweens.remove(this.pulseTween);
      this.pulseTween = null;
    }
    this.removeAccessibleActions?.();
    this.removeAccessibleActions = null;

    this.transitioned = false;
    this.shutdownRegistered = false;
  };

  constructor() {
    super({ key: SCENE_KEYS.results });
  }

  init(data: unknown): void {
    this.result = sanitizeSceneData(data);
  }

  create(): void {
    this.transitioned = false;
    this.buttons = [];

    const currentSave = normalizeRegistrySave(this.registry.get('saveData'));
    const recordUpdate = updateRunRecords(currentSave.records, this.result);
    const nextSave: SaveData = {
      version: 1,
      settings: { ...currentSave.settings },
      records: { ...recordUpdate.best },
    };

    try {
      if (typeof window !== 'undefined') {
        persistSaveData(window.localStorage, nextSave);
      }
    } catch {
      // The result remains usable when storage is unavailable or denied.
    }

    this.registry.set('saveData', nextSave);
    this.registry.set('records', nextSave.records);
    this.registry.set('settings', nextSave.settings);

    this.cameras.main.setBackgroundColor(CSS_COLORS.void);
    this.drawBackdrop();
    this.drawHeader();
    this.drawScorePanel(recordUpdate);
    this.drawTacticalSummary();
    this.drawUpgrades();
    this.drawRecords(recordUpdate);
    this.createActions();
    this.bindControls();
    const parent = this.game.canvas.parentElement;
    if (parent) {
      const outcome = this.result.outcome === 'victory' ? 'Mission complete' : 'Mission failed';
      this.removeAccessibleActions = createAccessibleSceneActions(
        parent,
        'Mission results',
        `${outcome}. Score ${Math.max(0, Math.trunc(this.result.score)).toLocaleString('en-US')}. Choose an action.`,
        [
          { label: 'Restart run', activate: () => this.transitionTo('restart') },
          { label: 'Return to menu', activate: () => this.transitionTo('menu') },
        ],
      );
    }

    if (!this.shutdownRegistered) {
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);
      this.shutdownRegistered = true;
    }
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.void, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.lineStyle(1, COLORS.steel, 0.07);
    for (let x = 0; x <= GAME_WIDTH; x += 64) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y <= GAME_HEIGHT; y += 48) {
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }

    graphics.fillStyle(COLORS.background, 0.97);
    graphics.fillRect(32, 26, 1216, 668);
    graphics.lineStyle(2, COLORS.steel, 0.46);
    graphics.strokeRect(32, 26, 1216, 668);

    graphics.fillStyle(COLORS.cyan, 1);
    graphics.fillRect(32, 26, 178, 4);
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillRect(210, 26, 86, 4);

    graphics.lineStyle(1, COLORS.cyan, 0.2);
    graphics.lineBetween(64, 138, 1216, 138);
    graphics.fillStyle(
      this.result.outcome === 'victory' ? COLORS.cyan : COLORS.orange,
      0.82,
    );
    graphics.fillRect(64, 136, 216, 3);

    const pulse = this.add.graphics();
    pulse.fillStyle(
      this.result.outcome === 'victory' ? COLORS.cyan : COLORS.orange,
      0.9,
    );
    pulse.fillCircle(1198, 59, 5);
    pulse.lineStyle(
      1,
      this.result.outcome === 'victory' ? COLORS.cyan : COLORS.orange,
      0.55,
    );
    pulse.strokeCircle(1198, 59, 11);

    if (this.registry.get('reducedMotion') !== true) {
      this.pulseTween = this.tweens.add({
        targets: pulse,
        alpha: { from: 0.42, to: 1 },
        duration: 1_100,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private drawHeader(): void {
    const victory = this.result.outcome === 'victory';
    this.add.text(64, 46, 'SITE K-17  //  AFTER ACTION REPORT', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '17px',
      fontStyle: 'bold',
      letterSpacing: 1.2,
    });

    this.add
      .text(1178, 46, victory ? 'ARCHIVE STATUS  /  SECURED' : 'ARCHIVE STATUS  /  BREACH', {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '16px',
        letterSpacing: 0.8,
      })
      .setOrigin(1, 0);

    this.add.text(
      64,
      78,
      victory ? 'CONTAINMENT SECURED' : 'MARINE DOWN // FACILITY LOST',
      {
        color: victory ? CSS_COLORS.cyan : CSS_COLORS.orange,
        fontFamily: DISPLAY_FONT,
        fontSize: victory ? '42px' : '38px',
        fontStyle: 'bold',
        letterSpacing: 1.5,
      },
    );
  }

  private drawScorePanel(recordUpdate: RunRecordUpdate): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.panelRaised, 0.82);
    graphics.fillRect(64, 158, 352, 266);
    graphics.lineStyle(1, COLORS.steel, 0.38);
    graphics.strokeRect(64, 158, 352, 266);
    graphics.fillStyle(
      this.result.outcome === 'victory' ? COLORS.cyan : COLORS.orange,
      0.9,
    );
    graphics.fillRect(64, 158, 5, 266);

    this.add.text(88, 178, 'FINAL SCORE', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '17px',
      fontStyle: 'bold',
      letterSpacing: 1.2,
    });
    this.add.text(86, 207, formatNumber(this.result.score), {
      color: CSS_COLORS.bone,
      fontFamily: UTILITY_FONT,
      fontSize: '58px',
      fontStyle: 'bold',
      letterSpacing: 1,
    });

    if (recordUpdate.isNewBestScore) {
      this.add.text(88, 281, 'NEW RECORD  //  SCORE', {
        color: CSS_COLORS.orange,
        fontFamily: UTILITY_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        letterSpacing: 1.1,
      });
    } else {
      this.add.text(88, 281, 'RUN ARCHIVED', {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '17px',
        letterSpacing: 1.1,
      });
    }

    graphics.lineStyle(1, COLORS.steel, 0.26);
    graphics.lineBetween(88, 319, 392, 319);
    this.add.text(88, 340, 'QUEEN SIGNAL', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
    });
    this.add
      .text(392, 336, this.result.bossDefeated ? 'NEUTRALIZED' : 'ACTIVE', {
        color: this.result.bossDefeated ? CSS_COLORS.cyan : CSS_COLORS.orange,
        fontFamily: UTILITY_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.add.text(
      88,
      380,
      this.result.bossDefeated ? 'TELEPORTER NEST COLLAPSED' : 'FACILITY CONTROL LOST',
      {
        color: CSS_COLORS.bone,
        fontFamily: UTILITY_FONT,
        fontSize: '16px',
      },
    );
  }

  private drawTacticalSummary(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.panel, 0.78);
    graphics.fillRect(432, 158, 352, 266);
    graphics.lineStyle(1, COLORS.steel, 0.32);
    graphics.strokeRect(432, 158, 352, 266);

    this.add.text(456, 178, 'TACTICAL SUMMARY', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '17px',
      fontStyle: 'bold',
      letterSpacing: 1.1,
    });

    const stats = [
      ['HOSTILES', formatNumber(this.result.kills)],
      ['ELITE KILLS', formatNumber(this.result.eliteKills)],
      ['WAVES CLEARED', formatNumber(this.result.wavesCleared)],
      ['ELAPSED', formatTime(this.result.elapsedMs)],
      ['CREDITS', formatNumber(this.result.creditsUnspent)],
      ['BOSS STATUS', this.result.bossDefeated ? 'DEFEATED' : 'AT LARGE'],
    ] as const;

    stats.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 456 + column * 158;
      const y = 222 + row * 62;
      this.add.text(x, y, label, {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '15px',
      });
      this.add.text(x, y + 21, value, {
        color: label === 'BOSS STATUS' && !this.result.bossDefeated
          ? CSS_COLORS.orange
          : CSS_COLORS.bone,
        fontFamily: UTILITY_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      });
    });
  }

  private drawUpgrades(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.panel, 0.78);
    graphics.fillRect(800, 158, 416, 266);
    graphics.lineStyle(1, COLORS.steel, 0.32);
    graphics.strokeRect(800, 158, 416, 266);

    this.add.text(824, 178, 'FIELD MODIFICATIONS', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '17px',
      fontStyle: 'bold',
      letterSpacing: 1.1,
    });

    if (this.result.selectedUpgrades.length === 0) {
      this.add.text(824, 229, 'NO FIELD MODIFICATIONS', {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        letterSpacing: 0.7,
      });
      return;
    }

    this.result.selectedUpgrades.forEach((upgrade, index) => {
      const y = 215 + index * 25;
      if (index % 2 === 0) {
        graphics.fillStyle(COLORS.background, 0.42);
        graphics.fillRect(816, y - 3, 384, 24);
      }
      this.add.text(824, y, upgrade.label.toUpperCase(), {
        color: CSS_COLORS.bone,
        fontFamily: UTILITY_FONT,
        fontSize: '16px',
      });
      this.add
        .text(1184, y, `LV ${upgrade.level}`, {
          color: CSS_COLORS.orange,
          fontFamily: UTILITY_FONT,
          fontSize: '16px',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0);
    });
  }

  private drawRecords(recordUpdate: RunRecordUpdate): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.panelRaised, 0.7);
    graphics.fillRect(64, 442, 1152, 102);
    graphics.lineStyle(1, COLORS.steel, 0.36);
    graphics.strokeRect(64, 442, 1152, 102);
    for (let x = 352; x < 1216; x += 288) {
      graphics.lineBetween(x, 454, x, 532);
    }

    const entries = [
      ['PREVIOUS SCORE', formatNumber(recordUpdate.previous.bestScore), false],
      ['BEST SCORE', formatNumber(recordUpdate.best.bestScore), recordUpdate.isNewBestScore],
      ['PREVIOUS CLEAR', formatTime(recordUpdate.previous.bestTimeMs), false],
      ['BEST CLEAR', formatTime(recordUpdate.best.bestTimeMs), recordUpdate.isNewBestTime],
    ] as const;

    entries.forEach(([label, value, isNew], index) => {
      const x = 84 + index * 288;
      this.add.text(x, 458, label, {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      });
      this.add.text(x, 480, value, {
        color: CSS_COLORS.bone,
        fontFamily: UTILITY_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      });
      if (isNew) {
        this.add.text(x, 516, 'NEW RECORD', {
          color: CSS_COLORS.orange,
          fontFamily: UTILITY_FONT,
          fontSize: '15px',
          fontStyle: 'bold',
          letterSpacing: 0.8,
        });
      }
    });
  }

  private createActions(): void {
    this.buttons.push(
      this.createButton(
        342,
        'RESTART RUN  [ENTER]',
        COLORS.orange,
        CSS_COLORS.orange,
        true,
        'restart',
      ),
      this.createButton(
        938,
        'RETURN TO COMMAND  [ESC]',
        COLORS.cyan,
        CSS_COLORS.cyan,
        false,
        'menu',
      ),
    );

    this.add.text(64, 658, 'SPACE  /  RESTART', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '15px',
      letterSpacing: 0.7,
    });
    this.add
      .text(1216, 658, 'M  /  COMMAND MENU', {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '15px',
        letterSpacing: 0.7,
      })
      .setOrigin(1, 0);
  }

  private createButton(
    x: number,
    labelText: string,
    accent: number,
    accentCss: string,
    filled: boolean,
    action: ResultAction,
  ): ResultButton {
    const background = this.add.graphics();
    const label = this.add
      .text(0, 0, labelText, {
        color: CSS_COLORS.bone,
        fontFamily: UTILITY_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        letterSpacing: 0.9,
      })
      .setOrigin(0.5);
    const container = this.add
      .container(x, 596, [background, label])
      .setSize(BUTTON_WIDTH, BUTTON_HEIGHT)
      .setInteractive({ useHandCursor: true });

    const button: ResultButton = {
      container,
      background,
      label,
      accent,
      accentCss,
      filled,
      action,
      onOver: () => undefined,
      onOut: () => undefined,
      onDown: () => undefined,
      onUp: () => undefined,
    };

    button.onOver = (): void => {
      if (this.transitioned) return;
      this.paintButton(button, 'hover');
      this.input.setDefaultCursor('pointer');
    };
    button.onOut = (): void => {
      if (this.transitioned) return;
      this.paintButton(button, 'normal');
      this.input.setDefaultCursor('default');
    };
    button.onDown = (): void => {
      if (this.transitioned) return;
      this.paintButton(button, 'pressed');
    };
    button.onUp = (): void => {
      this.transitionTo(button.action);
    };

    container.on('pointerover', button.onOver);
    container.on('pointerout', button.onOut);
    container.on('pointerdown', button.onDown);
    container.on('pointerup', button.onUp);
    this.paintButton(button, 'normal');
    return button;
  }

  private paintButton(button: ResultButton, state: ButtonState): void {
    const { background, label } = button;
    background.clear();

    if (state === 'locked') {
      background.fillStyle(COLORS.panel, 0.9);
      background.lineStyle(1, COLORS.steel, 0.5);
      label.setColor(CSS_COLORS.steel);
    } else {
      const pressed = state === 'pressed';
      const hover = state === 'hover';
      if (button.filled) {
        background.fillStyle(button.accent, pressed ? 0.7 : hover ? 0.9 : 0.82);
        label.setColor(CSS_COLORS.void);
      } else {
        background.fillStyle(
          hover ? button.accent : COLORS.panelRaised,
          hover ? 0.2 : pressed ? 0.58 : 0.76,
        );
        label.setColor(hover ? CSS_COLORS.bone : button.accentCss);
      }
      background.lineStyle(hover ? 3 : 2, button.accent, hover ? 1 : 0.84);
    }

    background.fillRoundedRect(
      -BUTTON_WIDTH / 2,
      -BUTTON_HEIGHT / 2,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      4,
    );
    background.strokeRoundedRect(
      -BUTTON_WIDTH / 2,
      -BUTTON_HEIGHT / 2,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      4,
    );
  }

  private bindControls(): void {
    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-ENTER', this.handleRestartKey);
    keyboard?.on('keydown-SPACE', this.handleRestartKey);
    keyboard?.on('keydown-ESC', this.handleMenuKey);
    keyboard?.on('keydown-M', this.handleMenuKey);
  }

  private isPortraitBlocked(): boolean {
    try {
      return window.matchMedia(
        '(orientation: portrait) and (pointer: coarse)',
      ).matches;
    } catch {
      return false;
    }
  }

  private transitionTo(action: ResultAction): void {
    if (this.transitioned || this.isPortraitBlocked()) return;
    this.transitioned = true;
    this.input.setDefaultCursor('default');

    for (const button of this.buttons) {
      this.paintButton(button, 'locked');
      button.container.disableInteractive();
    }

    this.scene.start(action === 'restart' ? SCENE_KEYS.game : SCENE_KEYS.menu);
  }
}
