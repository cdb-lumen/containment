import Phaser from 'phaser';

import { WEAPONS } from '../combat/catalog';
import type { CombatSnapshot, CombatSystem } from '../combat/CombatSystem';

const HUD_DEPTH = 10_000;
const RADAR_CENTER_X = 1206;
const RADAR_CENTER_Y = 58;
const RADAR_RADIUS = 39;
const RADAR_WORLD_RANGE = 720;

const COLORS = {
  void: 0x070a0f,
  panel: 0x111923,
  cyan: 0x69d8e7,
  orange: 0xf39237,
  bone: 0xf4efe6,
  steel: 0x81909e,
  critical: 0xff6347,
} as const;

const CSS_COLORS = {
  cyan: '#69d8e7',
  orange: '#f39237',
  bone: '#f4efe6',
  steel: '#81909e',
  critical: '#ff6347',
} as const;

const DISPLAY_FONT = '"Arial Narrow", "Trebuchet MS", Arial, sans-serif';
const UTILITY_FONT = '"Courier New", Courier, monospace';

export type RadarEnemy = Readonly<{
  x: number;
  y: number;
}>;

const finiteNumber = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

const nonNegativeInteger = (value: number): number =>
  Math.max(0, Math.trunc(finiteNumber(value)));

const formatAmmo = (value: number): string =>
  value === Number.POSITIVE_INFINITY ? '∞' : String(nonNegativeInteger(value));

const formatCredits = (value: number): string =>
  nonNegativeInteger(value).toLocaleString('en-US');

const objectiveText = (objective: string | null): string => {
  const normalized = objective?.trim();
  if (!normalized) return 'AWAITING BREACH ORDERS';
  return normalized.length > 72 ? `${normalized.slice(0, 69)}…` : normalized;
};

/** Fixed-screen, event-driven combat instruments owned by one gameplay scene. */
export class Hud {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly vitalsGraphics: Phaser.GameObjects.Graphics;
  private readonly reloadGraphics: Phaser.GameObjects.Graphics;
  private readonly radarGraphics: Phaser.GameObjects.Graphics;
  private readonly healthValue: Phaser.GameObjects.Text;
  private readonly armorValue: Phaser.GameObjects.Text;
  private readonly weaponValue: Phaser.GameObjects.Text;
  private readonly ammoValue: Phaser.GameObjects.Text;
  private readonly reloadValue: Phaser.GameObjects.Text;
  private readonly grenadesValue: Phaser.GameObjects.Text;
  private readonly medkitsValue: Phaser.GameObjects.Text;
  private readonly creditsValue: Phaser.GameObjects.Text;
  private readonly waveValue: Phaser.GameObjects.Text;
  private readonly objectiveValue: Phaser.GameObjects.Text;
  private readonly tacticalLabel: Phaser.GameObjects.Text;
  private readonly tacticalState: Phaser.GameObjects.Text;
  private readonly criticalCue: Phaser.GameObjects.Container;
  private unsubscribe: (() => void) | null = null;
  private criticalTween: Phaser.Tweens.Tween | null = null;
  private destroyed = false;

  private readonly handleSceneShutdown = (): void => {
    this.destroy();
  };

  constructor(scene: Phaser.Scene, combat: CombatSystem) {
    this.scene = scene;

    const chrome = scene.add.graphics();
    this.drawChrome(chrome);

    this.vitalsGraphics = scene.add.graphics();
    this.reloadGraphics = scene.add.graphics();
    this.radarGraphics = scene.add.graphics();

    const healthLabel = this.createLabel(28, 10, 'HEALTH');
    const armorLabel = this.createLabel(28, 43, 'ARMOR');
    this.healthValue = this.createValue(357, 6, '100', 20).setOrigin(1, 0);
    this.armorValue = this.createValue(357, 39, '50', 20).setOrigin(1, 0);

    const weaponHeader = this.createLabel(404, 10, 'CURRENT WEAPON');
    this.weaponValue = this.createValue(404, 28, 'SERVICE PISTOL', 21);
    this.ammoValue = this.createValue(684, 18, '12 / ∞', 29).setOrigin(1, 0);
    this.reloadValue = scene.add.text(404, 54, '', {
      color: CSS_COLORS.orange,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
      fontStyle: 'bold',
      letterSpacing: 0.8,
    });

    const waveHeader = this.createLabel(746, 10, 'INCURSION');
    this.waveValue = this.createValue(746, 29, 'WAVE 0', 22);
    const objectiveHeader = this.createLabel(856, 10, 'OBJECTIVE');
    this.objectiveValue = scene.add.text(856, 31, 'AWAITING BREACH ORDERS', {
      color: CSS_COLORS.bone,
      fontFamily: DISPLAY_FONT,
      fontSize: '16px',
      fontStyle: 'bold',
      wordWrap: { width: 280, useAdvancedWrap: true },
      lineSpacing: 2,
    });

    const grenadeLabel = this.createLabel(34, 691, 'GRENADES');
    this.grenadesValue = this.createValue(148, 684, '3', 25);
    const medkitLabel = this.createLabel(234, 691, 'MEDKITS');
    this.medkitsValue = this.createValue(334, 684, '2', 25);
    const creditsLabel = this.createLabel(428, 691, 'CREDITS');
    this.creditsValue = this.createValue(532, 684, '0', 25);

    const tacticalLabel = scene.add.text(759, 691, 'TACTICAL LINK', {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
      letterSpacing: 1,
    });
    const tacticalState = scene.add
      .text(1117, 689, 'PROXIMITY ACTIVE', {
        color: CSS_COLORS.cyan,
        fontFamily: UTILITY_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        letterSpacing: 0.7,
      })
      .setOrigin(1, 0);
    this.tacticalLabel = tacticalLabel;
    this.tacticalState = tacticalState;

    const criticalIcon = scene.add.graphics();
    criticalIcon.fillStyle(COLORS.critical, 1);
    criticalIcon.fillTriangle(0, 20, 11, 0, 22, 20);
    criticalIcon.fillStyle(COLORS.void, 1);
    criticalIcon.fillRect(9, 6, 4, 7);
    criticalIcon.fillCircle(11, 17, 2);
    const criticalText = scene.add.text(30, 1, 'CRITICAL', {
      color: CSS_COLORS.critical,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
      fontStyle: 'bold',
      letterSpacing: 1.4,
    });
    this.criticalCue = scene.add
      .container(215, 48, [criticalIcon, criticalText])
      .setVisible(false);

    this.root = scene.add.container(0, 0, [
      chrome,
      this.vitalsGraphics,
      this.reloadGraphics,
      this.radarGraphics,
      healthLabel,
      armorLabel,
      this.healthValue,
      this.armorValue,
      weaponHeader,
      this.weaponValue,
      this.ammoValue,
      this.reloadValue,
      waveHeader,
      this.waveValue,
      objectiveHeader,
      this.objectiveValue,
      grenadeLabel,
      this.grenadesValue,
      medkitLabel,
      this.medkitsValue,
      creditsLabel,
      this.creditsValue,
      tacticalLabel,
      tacticalState,
      this.criticalCue,
    ]);
    this.root.setScrollFactor(0, 0, true).setDepth(HUD_DEPTH);

    this.drawRadar(0, 0, []);
    this.render(combat.getSnapshot());
    this.unsubscribe = combat.subscribe((snapshot) => {
      if (!this.destroyed) this.render(snapshot);
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
  }

  setTouchLayout(enabled: boolean): void {
    if (this.destroyed) return;
    this.tacticalLabel.setVisible(!enabled);
    this.tacticalState.setVisible(!enabled);
  }

  /** Redraws the existing radar surface; it never creates display objects. */
  setRadarState(
    playerX: number,
    playerY: number,
    enemies: readonly RadarEnemy[],
  ): void {
    if (this.destroyed) return;
    this.drawRadar(playerX, playerY, enemies);
  }

  /** Releases the subscription, pulse, scene hook, and all owned display objects. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.scene.events.off(
      Phaser.Scenes.Events.SHUTDOWN,
      this.handleSceneShutdown,
    );
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.stopCriticalPulse();
    this.root.destroy();
  }

  private createLabel(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, {
      color: CSS_COLORS.steel,
      fontFamily: UTILITY_FONT,
      fontSize: '16px',
      fontStyle: 'bold',
      letterSpacing: 0.9,
    });
  }

  private createValue(
    x: number,
    y: number,
    text: string,
    fontSize: number,
  ): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, {
      color: CSS_COLORS.bone,
      fontFamily: UTILITY_FONT,
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      letterSpacing: 0.5,
    });
  }

  private drawChrome(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(COLORS.void, 0.9);
    graphics.fillRect(0, 0, 1280, 78);
    graphics.fillRect(0, 678, 1280, 42);

    graphics.fillStyle(COLORS.panel, 0.72);
    graphics.fillRect(12, 8, 1256, 62);
    graphics.fillRect(12, 682, 1256, 30);

    graphics.lineStyle(1, COLORS.steel, 0.42);
    graphics.strokeRect(12, 8, 1256, 62);
    graphics.strokeRect(12, 682, 1256, 30);
    graphics.lineBetween(382, 8, 382, 70);
    graphics.lineBetween(714, 8, 714, 70);
    graphics.lineBetween(1148, 8, 1148, 70);
    graphics.lineBetween(204, 682, 204, 712);
    graphics.lineBetween(398, 682, 398, 712);
    graphics.lineBetween(700, 682, 700, 712);

    graphics.fillStyle(COLORS.cyan, 1);
    graphics.fillRect(12, 8, 126, 3);
    graphics.fillRect(700, 709, 182, 3);
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillRect(138, 8, 42, 3);
    graphics.fillRect(882, 709, 64, 3);
  }

  private render(snapshot: CombatSnapshot): void {
    const health = Math.max(0, Math.min(100, finiteNumber(snapshot.health)));
    const maxArmor = Math.max(1, finiteNumber(snapshot.maxArmor, 100));
    const armor = Math.max(0, Math.min(maxArmor, finiteNumber(snapshot.armor)));
    const critical = health <= 25;

    this.healthValue.setText(String(Math.round(health)));
    this.armorValue.setText(String(Math.round(armor)));
    this.drawVitals(health, armor, maxArmor, critical);
    this.setCriticalState(critical);

    const weapon = WEAPONS[snapshot.weaponId];
    this.weaponValue.setText(snapshot.weaponId.toUpperCase());
    this.ammoValue.setText(
      `${formatAmmo(snapshot.magazine)} / ${formatAmmo(snapshot.reserve)}`,
    );
    this.drawReload(snapshot, weapon.reloadMs);

    this.grenadesValue.setText(String(nonNegativeInteger(snapshot.grenades)));
    this.medkitsValue.setText(String(nonNegativeInteger(snapshot.medkits)));
    this.creditsValue.setText(formatCredits(snapshot.credits));
    this.waveValue.setText(`WAVE ${nonNegativeInteger(snapshot.wave)}`);
    this.objectiveValue.setText(objectiveText(snapshot.objective).toUpperCase());
  }

  private drawVitals(
    health: number,
    armor: number,
    maxArmor: number,
    critical: boolean,
  ): void {
    const graphics = this.vitalsGraphics;
    graphics.clear();

    graphics.fillStyle(COLORS.void, 0.9);
    graphics.fillRect(104, 16, 226, 12);
    graphics.fillRect(104, 49, 226, 12);

    graphics.fillStyle(critical ? COLORS.critical : COLORS.cyan, 1);
    graphics.fillRect(107, 19, 220 * (health / 100), 6);
    graphics.fillStyle(COLORS.steel, 0.9);
    graphics.fillRect(107, 52, 220 * (armor / maxArmor), 6);

    graphics.lineStyle(1, critical ? COLORS.critical : COLORS.cyan, 0.72);
    graphics.strokeRect(104, 16, 226, 12);
    graphics.lineStyle(1, COLORS.steel, 0.62);
    graphics.strokeRect(104, 49, 226, 12);
  }

  private drawReload(snapshot: CombatSnapshot, reloadMs: number): void {
    const graphics = this.reloadGraphics;
    graphics.clear();

    if (!snapshot.reloading) {
      this.reloadValue.setVisible(false);
      return;
    }

    const duration = Math.max(
      1,
      finiteNumber(snapshot.reloadDurationMs, finiteNumber(reloadMs, 1)),
    );
    const remaining = Math.max(
      0,
      Math.min(duration, finiteNumber(snapshot.reloadRemainingMs)),
    );
    const progress = Math.max(0, Math.min(1, 1 - remaining / duration));
    const percent = Math.round(progress * 100);

    this.reloadValue
      .setText(`RELOADING  ${percent}%  ·  ${(remaining / 1_000).toFixed(1)}s`)
      .setVisible(true);

    graphics.fillStyle(COLORS.void, 0.95);
    graphics.fillRect(564, 57, 120, 8);
    graphics.fillStyle(COLORS.orange, 1);
    graphics.fillRect(566, 59, 116 * progress, 4);
    graphics.lineStyle(1, COLORS.orange, 0.8);
    graphics.strokeRect(564, 57, 120, 8);
  }

  private setCriticalState(critical: boolean): void {
    if (!critical) {
      this.stopCriticalPulse();
      this.criticalCue.setAlpha(1).setVisible(false);
      return;
    }

    this.criticalCue.setVisible(true);
    if (this.scene.registry.get('reducedMotion') === true) {
      this.stopCriticalPulse();
      this.criticalCue.setAlpha(1);
      return;
    }
    if (this.criticalTween) return;

    this.criticalTween = this.scene.tweens.add({
      targets: this.criticalCue,
      alpha: { from: 0.42, to: 1 },
      duration: 420,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private stopCriticalPulse(): void {
    if (!this.criticalTween) return;
    this.criticalTween.stop();
    this.scene.tweens.remove(this.criticalTween);
    this.criticalTween = null;
  }

  private drawRadar(
    playerX: number,
    playerY: number,
    enemies: readonly RadarEnemy[],
  ): void {
    const graphics = this.radarGraphics;
    graphics.clear();

    graphics.fillStyle(COLORS.void, 0.94);
    graphics.fillCircle(RADAR_CENTER_X, RADAR_CENTER_Y, RADAR_RADIUS + 5);
    graphics.lineStyle(1, COLORS.cyan, 0.62);
    graphics.strokeCircle(RADAR_CENTER_X, RADAR_CENTER_Y, RADAR_RADIUS);
    graphics.lineStyle(1, COLORS.cyan, 0.2);
    graphics.strokeCircle(RADAR_CENTER_X, RADAR_CENTER_Y, RADAR_RADIUS / 2);
    graphics.lineBetween(
      RADAR_CENTER_X - RADAR_RADIUS,
      RADAR_CENTER_Y,
      RADAR_CENTER_X + RADAR_RADIUS,
      RADAR_CENTER_Y,
    );
    graphics.lineBetween(
      RADAR_CENTER_X,
      RADAR_CENTER_Y - RADAR_RADIUS,
      RADAR_CENTER_X,
      RADAR_CENTER_Y + RADAR_RADIUS,
    );

    const safePlayerX = finiteNumber(playerX);
    const safePlayerY = finiteNumber(playerY);
    const dotLimit = RADAR_RADIUS - 4;

    graphics.fillStyle(COLORS.orange, 1);
    for (const enemy of enemies) {
      if (!Number.isFinite(enemy.x) || !Number.isFinite(enemy.y)) continue;
      let radarX = ((enemy.x - safePlayerX) / RADAR_WORLD_RANGE) * dotLimit;
      let radarY = ((enemy.y - safePlayerY) / RADAR_WORLD_RANGE) * dotLimit;
      const distance = Math.hypot(radarX, radarY);
      if (distance > dotLimit) {
        const scale = dotLimit / distance;
        radarX *= scale;
        radarY *= scale;
      }
      graphics.fillCircle(RADAR_CENTER_X + radarX, RADAR_CENTER_Y + radarY, 2.5);
    }

    graphics.fillStyle(COLORS.cyan, 1);
    graphics.fillTriangle(
      RADAR_CENTER_X,
      RADAR_CENTER_Y - 5,
      RADAR_CENTER_X - 4,
      RADAR_CENTER_Y + 4,
      RADAR_CENTER_X + 4,
      RADAR_CENTER_Y + 4,
    );
  }
}
