import Phaser from 'phaser';

import { TEXTURE_KEYS } from '../art/createTextures';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { GAME_EVENTS } from '../events';
import type { SaveData } from '../persistence/saveData';
import { SCENE_KEYS } from './sceneKeys';

const COLORS = {
  background: 0x070a0f,
  panel: 0x111923,
  cyan: 0x69d8e7,
  orange: 0xf39237,
  bone: 0xf4efe6,
  steel: 0x81909e,
} as const;

const CSS_COLORS = {
  background: '#070a0f',
  panel: '#111923',
  cyan: '#69d8e7',
  orange: '#f39237',
  bone: '#f4efe6',
  steel: '#81909e',
} as const;

const DISPLAY_FONT = '"Arial Narrow", "Trebuchet MS", Arial, sans-serif';
const UTILITY_FONT = '"Courier New", Courier, monospace';
const BUTTON_WIDTH = 598;
const BUTTON_HEIGHT = 72;

type ButtonState = 'normal' | 'hover' | 'pressed' | 'locked';

const formatScore = (score: number): string =>
  Math.max(0, Math.trunc(score)).toLocaleString('en-US');

const formatTime = (timeMs: number | null): string => {
  if (timeMs === null) return '--:--';
  const totalSeconds = Math.max(0, Math.floor(timeMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export class MenuScene extends Phaser.Scene {
  private startButton: Phaser.GameObjects.Container | null = null;
  private startButtonBackground: Phaser.GameObjects.Graphics | null = null;
  private startButtonLabel: Phaser.GameObjects.Text | null = null;
  private deploymentStatus: Phaser.GameObjects.Text | null = null;
  private scannerTween: Phaser.Tweens.Tween | null = null;
  private gameTransition: Phaser.Time.TimerEvent | null = null;
  private activated = false;
  private shutdownRegistered = false;

  private readonly handlePointerOver = (): void => {
    if (this.activated) return;
    this.drawButton('hover');
    this.input.setDefaultCursor('pointer');
  };

  private readonly handlePointerOut = (): void => {
    if (this.activated) return;
    this.drawButton('normal');
    this.input.setDefaultCursor('default');
  };

  private readonly handlePointerDown = (): void => {
    if (this.activated) return;
    this.drawButton('pressed');
  };

  private readonly handlePointerUp = (): void => {
    this.activateStart();
  };

  private readonly handleKeyboardActivate = (): void => {
    this.activateStart();
  };

  private readonly handleShutdown = (): void => {
    const keyboard = this.input.keyboard;
    keyboard?.off('keydown-ENTER', this.handleKeyboardActivate);
    keyboard?.off('keydown-SPACE', this.handleKeyboardActivate);

    if (this.startButton) {
      this.startButton.off('pointerover', this.handlePointerOver);
      this.startButton.off('pointerout', this.handlePointerOut);
      this.startButton.off('pointerdown', this.handlePointerDown);
      this.startButton.off('pointerup', this.handlePointerUp);
    }

    this.input.setDefaultCursor('default');

    if (this.scannerTween) {
      this.scannerTween.stop();
      this.tweens.remove(this.scannerTween);
      this.scannerTween = null;
    }

    if (this.gameTransition) {
      this.gameTransition.remove(false);
      this.gameTransition = null;
    }

    this.startButton = null;
    this.startButtonBackground = null;
    this.startButtonLabel = null;
    this.deploymentStatus = null;
    this.activated = false;
    this.shutdownRegistered = false;
  };

  constructor() {
    super({ key: SCENE_KEYS.menu });
  }

  create(): void {
    this.activated = false;
    this.cameras.main.setBackgroundColor(CSS_COLORS.background);
    this.drawFrame();
    this.drawCommandPanel();
    this.drawContainmentMap();
    this.bindStartControls();

    if (!this.shutdownRegistered) {
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);
      this.shutdownRegistered = true;
    }
  }

  private drawFrame(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.background, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.fillStyle(COLORS.panel, 1);
    graphics.fillRect(32, 32, 1216, 640);
    graphics.lineStyle(2, COLORS.steel, 0.42);
    graphics.strokeRect(32, 32, 1216, 640);
    graphics.lineStyle(1, COLORS.cyan, 0.28);
    graphics.lineBetween(704, 64, 704, 642);

    graphics.fillStyle(COLORS.cyan, 1);
    graphics.fillRect(32, 32, 188, 4);
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillRect(220, 32, 84, 4);

    this.add.text(64, 54, 'SITE K-17  //  CONTAINMENT COMMAND', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '18px',
      letterSpacing: 1.4,
    });

    this.add
      .text(1216, 54, 'LOCAL SYSTEM  /  OFFLINE READY', {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '17px',
        letterSpacing: 1,
      })
      .setOrigin(1, 0);

    this.add
      .text(
        640,
        688,
        'Original code, visuals, and audio. Unofficial fan-made tribute; no affiliation or endorsement is implied.',
        {
          color: CSS_COLORS.steel,
          fontFamily: DISPLAY_FONT,
          fontSize: '18px',
        },
      )
      .setOrigin(0.5, 0.5);
  }

  private drawCommandPanel(): void {
    this.add.text(64, 100, 'ALIEN SHOOTER', {
      color: CSS_COLORS.bone,
      fontFamily: DISPLAY_FONT,
      fontSize: '49px',
      fontStyle: 'bold',
      letterSpacing: 2.5,
    });

    this.add.text(64, 151, 'CONTAINMENT', {
      color: CSS_COLORS.orange,
      fontFamily: DISPLAY_FONT,
      fontSize: '62px',
      fontStyle: 'bold',
      letterSpacing: 1.5,
    });

    this.add.text(66, 219, 'UNOFFICIAL FAN-MADE WEB TRIBUTE', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '17px',
      letterSpacing: 1.1,
    });

    this.add.text(64, 264, 'MISSION BRIEFING', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      letterSpacing: 1.4,
    });

    this.add.text(
      64,
      292,
      'Survive eight escalating waves. Re-arm between incursions, then destroy the teleporter queen before the facility is overrun.',
      {
        color: CSS_COLORS.bone,
        fontFamily: DISPLAY_FONT,
        fontSize: '21px',
        lineSpacing: 7,
        wordWrap: { width: 596, useAdvancedWrap: true },
      },
    );

    this.createStartButton();
    this.drawControlsAndRecords();
  }

  private createStartButton(): void {
    const background = this.add.graphics();
    const label = this.add
      .text(0, 0, 'START CONTAINMENT', {
        color: CSS_COLORS.background,
        fontFamily: UTILITY_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        letterSpacing: 1.5,
      })
      .setOrigin(0.5);

    const button = this.add
      .container(363, 405, [background, label])
      .setSize(BUTTON_WIDTH, BUTTON_HEIGHT)
      .setInteractive({ useHandCursor: true });

    this.startButton = button;
    this.startButtonBackground = background;
    this.startButtonLabel = label;
    this.drawButton('normal');

    this.deploymentStatus = this.add
      .text(363, 449, 'AWAITING DEPLOYMENT', {
        color: CSS_COLORS.cyan,
        fontFamily: UTILITY_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        letterSpacing: 1.4,
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
  }

  private drawButton(state: ButtonState): void {
    const background = this.startButtonBackground;
    const label = this.startButtonLabel;
    if (!background || !label) return;

    background.clear();
    if (state === 'locked') {
      background.fillStyle(COLORS.panel, 1);
      background.lineStyle(2, COLORS.steel, 0.72);
      label.setColor(CSS_COLORS.steel);
    } else {
      const fillAlpha = state === 'pressed' ? 0.72 : state === 'hover' ? 0.9 : 1;
      background.fillStyle(COLORS.orange, fillAlpha);
      background.lineStyle(
        state === 'hover' ? 3 : 2,
        state === 'hover' ? COLORS.cyan : COLORS.bone,
        1,
      );
      label.setColor(CSS_COLORS.background);
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

  private drawControlsAndRecords(): void {
    this.add.text(64, 486, 'DESKTOP CONTROLS', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      letterSpacing: 1.2,
    });

    const controls = [
      ['MOVE', 'WASD / ARROWS'],
      ['AIM + FIRE', 'MOUSE / LEFT CLICK'],
      ['GRENADE', 'RIGHT CLICK / G'],
      ['RELOAD / INTERACT', 'R / E'],
      ['PAUSE', 'ESC'],
    ] as const;

    controls.forEach(([action, binding], index) => {
      const column = index < 3 ? 0 : 1;
      const row = column === 0 ? index : index - 3;
      const x = column === 0 ? 64 : 374;
      const y = 515 + row * 29;
      this.add.text(x, y, action, {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '16px',
      });
      this.add
        .text(x + 286, y, binding, {
          color: CSS_COLORS.bone,
          fontFamily: UTILITY_FONT,
          fontSize: '16px',
        })
        .setOrigin(1, 0);
    });

    const records = this.registry.get('records') as
      | SaveData['records']
      | undefined;
    const bestScore = records?.bestScore ?? 0;
    const bestTimeMs = records?.bestTimeMs ?? null;

    const recordGraphics = this.add.graphics();
    recordGraphics.fillStyle(COLORS.background, 0.66);
    recordGraphics.fillRect(64, 607, 596, 48);
    recordGraphics.lineStyle(1, COLORS.steel, 0.36);
    recordGraphics.strokeRect(64, 607, 596, 48);
    recordGraphics.lineBetween(362, 607, 362, 655);

    this.add.text(82, 618, 'BEST SCORE', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
    });
    this.add
      .text(342, 615, formatScore(bestScore), {
        color: CSS_COLORS.bone,
        fontFamily: UTILITY_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    this.add.text(382, 618, 'BEST CLEAR', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
    });
    this.add
      .text(642, 615, formatTime(bestTimeMs), {
        color: CSS_COLORS.bone,
        fontFamily: UTILITY_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
  }

  private drawContainmentMap(): void {
    this.add.text(748, 100, 'CONTAINMENT RADAR', {
      color: CSS_COLORS.bone,
      fontFamily: DISPLAY_FONT,
      fontSize: '29px',
      fontStyle: 'bold',
      letterSpacing: 1.3,
    });
    this.add.text(748, 137, 'LIVE BREACH GEOMETRY  /  SECTOR NORTH', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
      letterSpacing: 0.7,
    });

    const centerX = 976;
    const centerY = 377;
    const radius = 194;
    const radar = this.add.graphics();

    radar.fillStyle(COLORS.background, 0.82);
    radar.fillCircle(centerX, centerY, radius + 15);
    radar.lineStyle(2, COLORS.cyan, 0.64);
    radar.strokeCircle(centerX, centerY, radius);
    radar.lineStyle(1, COLORS.cyan, 0.2);
    radar.strokeCircle(centerX, centerY, 64);
    radar.strokeCircle(centerX, centerY, 128);
    radar.lineBetween(centerX - radius, centerY, centerX + radius, centerY);
    radar.lineBetween(centerX, centerY - radius, centerX, centerY + radius);

    radar.lineStyle(8, COLORS.panel, 1);
    radar.strokeRect(centerX - 118, centerY - 111, 236, 222);
    radar.lineStyle(3, COLORS.steel, 0.58);
    radar.strokeRect(centerX - 112, centerY - 105, 102, 82);
    radar.strokeRect(centerX + 9, centerY - 105, 103, 82);
    radar.strokeRect(centerX - 112, centerY + 6, 76, 99);
    radar.strokeRect(centerX - 17, centerY + 6, 129, 99);
    radar.lineStyle(3, COLORS.orange, 0.86);
    radar.lineBetween(centerX - 10, centerY - 64, centerX + 9, centerY - 64);
    radar.lineBetween(centerX - 36, centerY + 52, centerX - 17, centerY + 52);

    const breachPoints = [
      [centerX - 78, centerY - 73],
      [centerX + 73, centerY - 63],
      [centerX - 69, centerY + 59],
      [centerX + 67, centerY + 57],
      [centerX + 7, centerY - 145],
    ] as const;
    radar.fillStyle(COLORS.orange, 1);
    breachPoints.forEach(([x, y]) => {
      radar.fillCircle(x, y, 5);
      radar.lineStyle(1, COLORS.orange, 0.4);
      radar.strokeCircle(x, y, 11);
    });

    this.add
      .image(centerX - 74, centerY - 73, TEXTURE_KEYS.alienRunner)
      .setDisplaySize(42, 42)
      .setAlpha(0.82);
    this.add
      .image(centerX + 74, centerY + 58, TEXTURE_KEYS.alienDrone)
      .setDisplaySize(42, 42)
      .setAlpha(0.82);
    this.add
      .image(centerX + 5, centerY - 145, TEXTURE_KEYS.alienBrute)
      .setDisplaySize(50, 50)
      .setAlpha(0.78);

    const scannerSweep = this.add.graphics({ x: centerX, y: centerY });
    scannerSweep.fillStyle(COLORS.cyan, 0.08);
    scannerSweep.fillTriangle(0, 0, -45, -radius + 9, 45, -radius + 9);
    scannerSweep.lineStyle(2, COLORS.cyan, 0.66);
    scannerSweep.lineBetween(0, 0, 0, -radius + 9);

    const reducedMotion = this.registry.get('reducedMotion') === true;
    if (!reducedMotion) {
      this.scannerTween = this.tweens.add({
        targets: scannerSweep,
        angle: 360,
        duration: 5_000,
        ease: 'Linear',
        repeat: -1,
      });
    }

    this.add.text(748, 606, 'THREAT CONTACTS', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
    });
    this.add
      .text(1200, 599, '05', {
        color: CSS_COLORS.orange,
        fontFamily: UTILITY_FONT,
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.add.text(748, 632, 'SCANNER LINK STABLE', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
      letterSpacing: 0.8,
    });
  }

  private bindStartControls(): void {
    const button = this.startButton;
    if (!button) return;

    button.on('pointerover', this.handlePointerOver);
    button.on('pointerout', this.handlePointerOut);
    button.on('pointerdown', this.handlePointerDown);
    button.on('pointerup', this.handlePointerUp);

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-ENTER', this.handleKeyboardActivate);
    keyboard?.on('keydown-SPACE', this.handleKeyboardActivate);
  }

  private activateStart(): void {
    if (this.activated) return;
    this.activated = true;

    this.drawButton('locked');
    this.startButton?.disableInteractive(true);
    this.input.setDefaultCursor('default');
    this.deploymentStatus?.setVisible(true);
    this.game.events.emit(GAME_EVENTS.startRun);
    this.gameTransition = this.time.delayedCall(50, () => {
      this.gameTransition = null;
      this.scene.start(SCENE_KEYS.game);
    });
  }
}
