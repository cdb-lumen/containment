import Phaser from 'phaser';

import { UPGRADES } from './catalog';
import type { ArmorySnapshot, UpgradeOffer } from './UpgradeSystem';

const VIEWPORT_WIDTH = 1_280;
const VIEWPORT_HEIGHT = 720;
const ARMORY_DEPTH = 20_000;
const CARD_COUNT = 3;
const CARD_WIDTH = 344;
const CARD_HEIGHT = 392;
const CARD_GAP = 24;
const CARD_CENTER_Y = 384;
const CARD_ROW_WIDTH = CARD_COUNT * CARD_WIDTH + (CARD_COUNT - 1) * CARD_GAP;
const CARD_START_X = (VIEWPORT_WIDTH - CARD_ROW_WIDTH) / 2 + CARD_WIDTH / 2;
const MAX_DISPLAY_SECONDS = 999;

const COLORS = {
  void: 0x070a0f,
  panel: 0x111923,
  cyan: 0x69d8e7,
  orange: 0xf39237,
  bone: 0xf4efe6,
  steel: 0x81909e,
} as const;

const CSS_COLORS = {
  cyan: '#69d8e7',
  orange: '#f39237',
  bone: '#f4efe6',
  steel: '#81909e',
} as const;

const DISPLAY_FONT = '"Arial Narrow", "Trebuchet MS", Arial, sans-serif';
const UTILITY_FONT = '"Courier New", Courier, monospace';

type CardState = 'idle' | 'hover' | 'pressed';

type CardView = {
  readonly index: number;
  readonly container: Phaser.GameObjects.Container;
  readonly background: Phaser.GameObjects.Graphics;
  readonly number: Phaser.GameObjects.Text;
  readonly label: Phaser.GameObjects.Text;
  readonly description: Phaser.GameObjects.Text;
  readonly level: Phaser.GameObjects.Text;
  readonly cost: Phaser.GameObjects.Text;
  readonly status: Phaser.GameObjects.Text;
  readonly onPointerOver: () => void;
  readonly onPointerOut: () => void;
  readonly onPointerDown: () => void;
  readonly onPointerUp: () => void;
  state: CardState;
};

export type ArmorySelectionHandler = (offer: UpgradeOffer, index: number) => void;

const finiteNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

const finiteNonNegativeInteger = (value: number): number =>
  Math.trunc(finiteNonNegative(value));

const formatCredits = (value: number): string =>
  finiteNonNegativeInteger(value).toLocaleString('en-US');

const countdownValues = (
  snapshot: ArmorySnapshot,
): Readonly<{ progress: number; label: string }> => {
  const durationMs = finiteNonNegative(snapshot.durationMs);
  const elapsedMs = Math.min(durationMs, finiteNonNegative(snapshot.elapsedMs));
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const progress = durationMs > 0 ? remainingMs / durationMs : 0;
  const seconds = Math.min(MAX_DISPLAY_SECONDS, remainingMs / 1_000);
  const label =
    remainingMs / 1_000 > MAX_DISPLAY_SECONDS
      ? `${MAX_DISPLAY_SECONDS}+s`
      : seconds >= 100
        ? `${Math.ceil(seconds)}s`
        : `${seconds.toFixed(1)}s`;

  return { progress, label };
};

/** Fixed-screen Phaser adapter for the between-wave field armory. */
export class ArmoryOverlay {
  private readonly scene: Phaser.Scene;
  private readonly onSelect: ArmorySelectionHandler;
  private readonly root: Phaser.GameObjects.Container;
  private readonly countdownGraphics: Phaser.GameObjects.Graphics;
  private readonly countdownValue: Phaser.GameObjects.Text;
  private readonly creditsValue: Phaser.GameObjects.Text;
  private readonly cards: readonly CardView[];
  private snapshot: ArmorySnapshot | null = null;
  private visible = false;
  private activationLocked = false;
  private selectedIndex: number | null = null;
  private destroyed = false;

  private readonly handleSceneShutdown = (): void => {
    this.dispose(false);
  };

  constructor(scene: Phaser.Scene, onSelect: ArmorySelectionHandler) {
    this.scene = scene;
    this.onSelect = onSelect;

    const chrome = scene.add.graphics();
    this.drawChrome(chrome);

    const title = scene.add.text(72, 74, 'FIELD ARMORY', {
      color: CSS_COLORS.bone,
      fontFamily: DISPLAY_FONT,
      fontSize: '34px',
      fontStyle: 'bold',
      letterSpacing: 2.2,
    });
    const subtitle = scene.add.text(74, 118, 'SELECT ONE UPGRADE', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '17px',
      fontStyle: 'bold',
      letterSpacing: 1.6,
    });
    const keyboardHint = scene.add
      .text(1_206, 614, 'PRESS 1–3 OR SELECT A CARD', {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '15px',
        letterSpacing: 0.6,
      })
      .setOrigin(1, 0);

    const creditsLabel = scene.add
      .text(1_030, 78, 'CREDITS', {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        letterSpacing: 1.1,
      })
      .setOrigin(1, 0);
    this.creditsValue = scene.add
      .text(1_206, 70, '0', {
        color: CSS_COLORS.bone,
        fontFamily: UTILITY_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        letterSpacing: 0.6,
      })
      .setOrigin(1, 0);

    const countdownLabel = scene.add
      .text(1_030, 116, 'WINDOW', {
        color: CSS_COLORS.steel,
        fontFamily: UTILITY_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        letterSpacing: 1.1,
      })
      .setOrigin(1, 0);
    this.countdownValue = scene.add
      .text(1_206, 108, '0.0s', {
        color: CSS_COLORS.orange,
        fontFamily: UTILITY_FONT,
        fontSize: '25px',
        fontStyle: 'bold',
        letterSpacing: 0.4,
      })
      .setOrigin(1, 0);
    this.countdownGraphics = scene.add.graphics();

    this.cards = Object.freeze(
      Array.from({ length: CARD_COUNT }, (_, index) => this.createCard(index)),
    );

    this.root = scene.add.container(0, 0, [
      chrome,
      title,
      subtitle,
      keyboardHint,
      creditsLabel,
      this.creditsValue,
      countdownLabel,
      this.countdownValue,
      this.countdownGraphics,
      ...this.cards.map((card) => card.container),
    ]);
    // The armory is modal, so it intentionally sits above the combat HUD.
    this.root.setScrollFactor(0, 0, true).setDepth(ARMORY_DEPTH).setVisible(false);

    this.cards.forEach((card) => {
      card.container.setVisible(false).disableInteractive(true);
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
  }

  get isVisible(): boolean {
    return !this.destroyed && this.visible;
  }

  /** Opens a fresh selection window and clears the one-shot activation lock. */
  show(snapshot: ArmorySnapshot): void {
    if (this.destroyed) return;
    if (!snapshot.open) {
      this.hide();
      return;
    }

    this.visible = true;
    this.activationLocked = false;
    this.selectedIndex = null;
    this.snapshot = snapshot;
    this.cards.forEach((card) => {
      card.state = 'idle';
    });
    this.root.setVisible(true);
    this.render(snapshot);
  }

  /** Refreshes text and reusable Graphics only; it never allocates display objects. */
  update(snapshot: ArmorySnapshot): void {
    if (this.destroyed) return;
    if (!snapshot.open) {
      this.hide();
      return;
    }

    this.snapshot = snapshot;
    this.render(snapshot);
  }

  /** Hides the overlay and makes every card inert until the next show call. */
  hide(): void {
    if (this.destroyed) return;

    this.visible = false;
    this.activationLocked = true;
    this.selectedIndex = null;
    this.snapshot = null;
    this.root.setVisible(false);
    this.cards.forEach((card) => {
      card.state = 'idle';
      card.container.setVisible(false).disableInteractive(true);
    });
  }

  /** Keyboard integration seam for GameScene number-key handling. */
  handleSelectionIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= CARD_COUNT) return;
    if (this.destroyed || !this.visible || this.activationLocked) return;

    const snapshot = this.snapshot;
    const offer = snapshot?.offers[index];
    if (!snapshot?.open || !offer || !this.isAffordable(snapshot, offer)) return;

    this.activationLocked = true;
    this.selectedIndex = index;
    this.renderCards(snapshot);
    this.onSelect(offer, index);
  }

  /** Idempotently releases listeners and owned display objects. */
  destroy(): void {
    this.dispose(true);
  }

  private createCard(index: number): CardView {
    const background = this.scene.add.graphics();
    const left = -CARD_WIDTH / 2;
    const top = -CARD_HEIGHT / 2;

    const number = this.scene.add
      .text(left + 28, top + 22, String(index + 1), {
        color: CSS_COLORS.cyan,
        fontFamily: UTILITY_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    const label = this.scene.add.text(left + 60, top + 20, '', {
      color: CSS_COLORS.bone,
      fontFamily: DISPLAY_FONT,
      fontSize: '23px',
      fontStyle: 'bold',
      wordWrap: { width: CARD_WIDTH - 84, useAdvancedWrap: true },
      lineSpacing: 1,
    });
    const description = this.scene.add.text(left + 24, top + 104, '', {
      color: CSS_COLORS.bone,
      fontFamily: DISPLAY_FONT,
      fontSize: '18px',
      lineSpacing: 5,
      wordWrap: { width: CARD_WIDTH - 48, useAdvancedWrap: true },
    });
    const level = this.scene.add.text(left + 24, top + 248, '', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      letterSpacing: 0.6,
    });
    const cost = this.scene.add.text(left + 24, top + 282, '', {
      color: CSS_COLORS.bone,
      fontFamily: UTILITY_FONT,
      fontSize: '20px',
      fontStyle: 'bold',
      letterSpacing: 0.5,
    });
    const status = this.scene.add.text(left + 24, top + 336, '', {
      color: CSS_COLORS.cyan,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
      fontStyle: 'bold',
      letterSpacing: 0.55,
    });

    const onPointerOver = (): void => {
      this.setCardState(index, 'hover');
    };
    const onPointerOut = (): void => {
      this.setCardState(index, 'idle');
    };
    const onPointerDown = (): void => {
      this.setCardState(index, 'pressed');
    };
    const onPointerUp = (): void => {
      this.handleSelectionIndex(index);
    };

    const container = this.scene.add
      .container(
        CARD_START_X + index * (CARD_WIDTH + CARD_GAP),
        CARD_CENTER_Y,
        [background, number, label, description, level, cost, status],
      )
      .setSize(CARD_WIDTH, CARD_HEIGHT)
      .setInteractive({ useHandCursor: true });

    container.on('pointerover', onPointerOver);
    container.on('pointerout', onPointerOut);
    container.on('pointerdown', onPointerDown);
    container.on('pointerup', onPointerUp);

    return {
      index,
      container,
      background,
      number,
      label,
      description,
      level,
      cost,
      status,
      onPointerOver,
      onPointerOut,
      onPointerDown,
      onPointerUp,
      state: 'idle',
    };
  }

  private setCardState(index: number, state: CardState): void {
    if (this.destroyed || !this.visible || this.activationLocked) return;
    const snapshot = this.snapshot;
    const offer = snapshot?.offers[index];
    if (!snapshot || !offer || !this.isAffordable(snapshot, offer)) return;

    const card = this.cards[index];
    if (!card) return;
    card.state = state;
    this.drawCard(card, true, this.selectedIndex === index);
  }

  private render(snapshot: ArmorySnapshot): void {
    this.creditsValue.setText(formatCredits(snapshot.credits));
    this.drawCountdown(snapshot);
    this.renderCards(snapshot);
  }

  private renderCards(snapshot: ArmorySnapshot): void {
    this.cards.forEach((card) => {
      const offer = snapshot.offers[card.index];
      const hasOffer = this.visible && offer !== undefined;
      card.container.setVisible(hasOffer);

      if (!offer || !hasOffer) {
        card.state = 'idle';
        card.container.disableInteractive(true);
        return;
      }

      const definition = UPGRADES[offer.id];
      const affordable = this.isAffordable(snapshot, offer);
      card.label.setText(definition.label.toUpperCase());
      card.description.setText(definition.description);
      card.level.setText(
        `LVL ${finiteNonNegativeInteger(offer.level)} → ${finiteNonNegativeInteger(offer.nextLevel)}`,
      );
      card.cost.setText(`COST  ${formatCredits(offer.cost)} CR`);
      card.status
        .setText(affordable ? 'AVAILABLE' : 'INSUFFICIENT CREDITS')
        .setColor(affordable ? CSS_COLORS.cyan : CSS_COLORS.steel);

      const interactive = affordable && !this.activationLocked;
      if (interactive) {
        if (!card.container.input?.enabled) card.container.setInteractive();
      } else {
        card.state = 'idle';
        if (card.container.input?.enabled) card.container.disableInteractive(true);
      }
      this.drawCard(card, affordable, this.selectedIndex === card.index);
    });
  }

  private isAffordable(snapshot: ArmorySnapshot, offer: UpgradeOffer): boolean {
    return (
      offer.affordable &&
      Number.isFinite(offer.cost) &&
      offer.cost >= 0 &&
      Number.isFinite(snapshot.credits) &&
      snapshot.credits >= offer.cost
    );
  }

  private drawChrome(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(COLORS.void, 0.48);
    graphics.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    graphics.fillStyle(COLORS.void, 0.88);
    graphics.fillRoundedRect(32, 52, 1_216, 616, 6);
    graphics.lineStyle(1, COLORS.steel, 0.58);
    graphics.strokeRoundedRect(32, 52, 1_216, 616, 6);

    graphics.lineStyle(1, COLORS.cyan, 0.28);
    graphics.lineBetween(64, 164, 1_216, 164);
    graphics.lineBetween(64, 602, 1_216, 602);
    graphics.fillStyle(COLORS.cyan, 1);
    graphics.fillRect(32, 52, 154, 3);
    graphics.fillRect(64, 162, 168, 3);
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillRect(186, 52, 52, 3);
    graphics.fillRect(232, 162, 58, 3);
  }

  private drawCountdown(snapshot: ArmorySnapshot): void {
    const countdown = countdownValues(snapshot);
    const graphics = this.countdownGraphics;
    const barX = 1_052;
    const barY = 145;
    const barWidth = 154;

    this.countdownValue.setText(countdown.label);
    graphics.clear();
    graphics.fillStyle(COLORS.panel, 0.96);
    graphics.fillRect(barX, barY, barWidth, 7);
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillRect(barX + 2, barY + 2, (barWidth - 4) * countdown.progress, 3);
    graphics.lineStyle(1, COLORS.orange, 0.7);
    graphics.strokeRect(barX, barY, barWidth, 7);
  }

  private drawCard(card: CardView, affordable: boolean, selected: boolean): void {
    const graphics = card.background;
    const left = -CARD_WIDTH / 2;
    const top = -CARD_HEIGHT / 2;
    const hovered = card.state === 'hover';
    const pressed = card.state === 'pressed';
    const emphasis = selected || hovered || pressed;

    graphics.clear();
    graphics.fillStyle(
      pressed || selected ? COLORS.orange : COLORS.panel,
      pressed ? 0.2 : selected ? 0.15 : hovered ? 0.97 : 0.92,
    );
    graphics.fillRoundedRect(left, top, CARD_WIDTH, CARD_HEIGHT, 4);

    graphics.lineStyle(
      emphasis ? 3 : 2,
      COLORS.orange,
      affordable ? (emphasis ? 1 : 0.82) : 0.26,
    );
    graphics.strokeRoundedRect(left, top, CARD_WIDTH, CARD_HEIGHT, 4);

    graphics.fillStyle(COLORS.cyan, affordable ? 0.9 : 0.36);
    graphics.fillRect(left + 18, top + 69, CARD_WIDTH - 36, 2);
    graphics.fillRect(left + 18, top + 320, CARD_WIDTH - 36, 1);
    graphics.fillRect(left + 18, top + 18, 20, 2);
    graphics.fillRect(left + 18, top + 18, 2, 20);
    graphics.fillRect(left + CARD_WIDTH - 38, top + CARD_HEIGHT - 20, 20, 2);
    graphics.fillRect(left + CARD_WIDTH - 20, top + CARD_HEIGHT - 38, 2, 20);

    if (selected) {
      graphics.fillStyle(COLORS.orange, 1);
      graphics.fillRect(left, top + 18, 5, CARD_HEIGHT - 36);
    }
  }

  private dispose(destroyDisplayObjects: boolean): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.visible = false;
    this.activationLocked = true;
    this.snapshot = null;

    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
    this.cards.forEach((card) => {
      card.container.off('pointerover', card.onPointerOver);
      card.container.off('pointerout', card.onPointerOut);
      card.container.off('pointerdown', card.onPointerDown);
      card.container.off('pointerup', card.onPointerUp);
    });

    // During Scene shutdown Phaser owns the already-detached display list. Explicit
    // destroy calls still release the overlay when it is removed before shutdown.
    if (destroyDisplayObjects) this.root.destroy();
  }
}
