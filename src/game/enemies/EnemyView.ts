import Phaser from 'phaser';

import { TEXTURE_KEYS } from '../art/createTextures';
import {
  CHARACTER_SKINS,
  resolveCharacterSkinTexture,
  type ResolvedCharacterSkinTexture,
} from '../art/characterSkins';
import type { QualityProfileName } from '../effects/quality';
import type { EnemySnapshot } from './EnemySystem';
import { EnemyPool } from './EnemyPool';
import { EnemyPresentationState } from './EnemyPresentationState';
import type { StandardEnemyId } from './types';

const INITIAL_POOL_SIZE = 90;
const MAX_POOL_SIZE = 150;
const HEALTH_BAR_HEIGHT = 4;
const ARMOR_BAR_HEIGHT = 3;
const BAR_GAP = 2;
const BAR_OFFSET = 8;
const ELITE_SCALE = 1.14;
const ELITE_TINT = 0xf39237;
const HEALTH_COLOR = 0x91be61;
const HEALTH_DAMAGED_COLOR = 0xe58a28;
const ARMOR_COLOR = 0x69d8e7;
const BAR_BACKGROUND = 0x070a0f;
const OVERLAY_DEPTH = 4_096;
const STALKER_CONTRAST_DEPTH = 1;
const STALKER_CONTRAST_COLOR = 0x69d8e7;
const STALKER_CONTRAST_BASE_ALPHA = 0.52;
const STANDARD_ENEMY_IDS: readonly StandardEnemyId[] = [
  'crawler', 'brute', 'spitter', 'stalker', 'carrier',
];

export type EnemyImage = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

type EnemySlot = {
  body: EnemyImage;
  art: Phaser.GameObjects.Image | null;
  presentation: EnemyPresentationState;
  framed: boolean;
  skinKey: string;
  emissiveAlpha: number;
};

export type EnemyViewPosition = Readonly<{ id: number; x: number; y: number }>;
type MutableEnemyViewPosition = { id: number; x: number; y: number };
type EnemyPresentation = Readonly<{ texture: string; displaySize: number }>;

/** Runtime enemy IDs already match authored family IDs. Procedural names are fallback textures only. */
const ENEMY_PRESENTATION: Readonly<Record<StandardEnemyId, EnemyPresentation>> = Object.freeze({
  crawler: Object.freeze({ texture: TEXTURE_KEYS.alienRunner, displaySize: 44 }),
  brute: Object.freeze({ texture: TEXTURE_KEYS.alienBrute, displaySize: 68 }),
  spitter: Object.freeze({ texture: TEXTURE_KEYS.alienSpitter, displaySize: 52 }),
  stalker: Object.freeze({ texture: TEXTURE_KEYS.alienStalker, displaySize: 50 }),
  carrier: Object.freeze({ texture: TEXTURE_KEYS.alienDrone, displaySize: 62 }),
});

const clampUnit = (value: number): number => Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, 1) : 0;
const heading = (enemy: EnemySnapshot): number => Number.isFinite(enemy.velocityX) && Number.isFinite(enemy.velocityY)
  && (enemy.velocityX !== 0 || enemy.velocityY !== 0)
  ? Math.atan2(enemy.velocityY, enemy.velocityX) : 0;

/** Phaser-only pooled presentation; EnemySystem snapshots and body identities stay authoritative. */
export class EnemyView {
  readonly group: Phaser.Physics.Arcade.Group;
  readonly activePositions: readonly EnemyViewPosition[];

  private readonly scene: Phaser.Scene;
  private readonly getPresentationTime: () => number;
  private readonly stalkerContrast: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly slotsById = new Map<number, EnemySlot>();
  private readonly idsBySprite = new Map<object, number>();
  private readonly positionsById = new Map<number, MutableEnemyViewPosition>();
  private readonly mutableActivePositions: MutableEnemyViewPosition[] = [];
  private readonly seenIds = new Set<number>();
  private readonly resolvedTextures: Readonly<Record<StandardEnemyId, ResolvedCharacterSkinTexture>>;
  private readonly initialFollowerTexture: string | null;
  private pool: EnemyPool<EnemySlot, EnemySnapshot> | null;
  private quality: QualityProfileName = 'high';
  private destroyed = false;

  private readonly handleSceneShutdown = (): void => {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pool = null;
    this.slotsById.clear();
    this.idsBySprite.clear();
    this.positionsById.clear();
    this.mutableActivePositions.length = 0;
    this.seenIds.clear();
  };

  constructor(scene: Phaser.Scene, getPresentationTime: () => number = () => 0) {
    this.scene = scene;
    this.getPresentationTime = getPresentationTime;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.stalkerContrast = scene.add.graphics().setDepth(STALKER_CONTRAST_DEPTH);
    this.overlay = scene.add.graphics().setDepth(OVERLAY_DEPTH);
    this.activePositions = this.mutableActivePositions;
    const hasTexture = (key: string): boolean => this.scene.textures?.exists?.(key) === true;
    const resolvedTextures = {} as Record<StandardEnemyId, ResolvedCharacterSkinTexture>;
    let initialFollowerTexture: string | null = null;
    for (const id of STANDARD_ENEMY_IDS) {
      const resolved = resolveCharacterSkinTexture(hasTexture, id);
      resolvedTextures[id] = resolved;
      if (initialFollowerTexture === null && resolved.framed) initialFollowerTexture = resolved.texture;
    }
    this.resolvedTextures = resolvedTextures;
    this.initialFollowerTexture = initialFollowerTexture;
    this.pool = this.createPool();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
  }

  get count(): number { return this.slotsById.size; }
  get visualCount(): number { return this.pool?.totalCount ?? 0; }
  get framedCount(): number {
    let count = 0;
    for (const slot of this.slotsById.values()) if (slot.framed) count += 1;
    return count;
  }
  get activeSkinKeys(): readonly string[] {
    const keys = new Set<string>();
    for (const slot of this.slotsById.values()) if (slot.framed) keys.add(slot.skinKey);
    return Object.freeze([...keys].sort());
  }

  setQuality(profile: QualityProfileName): void { this.quality = profile; }

  triggerAttack(enemyId: number): boolean {
    const slot = this.slotsById.get(enemyId);
    if (!slot) return false;
    slot.presentation.triggerAttack(this.getPresentationTime());
    return true;
  }

  sync(enemies: readonly EnemySnapshot[]): void {
    if (this.destroyed || this.pool === null) return;
    this.seenIds.clear();
    for (const enemy of enemies) this.seenIds.add(enemy.id);
    for (const [id, slot] of this.slotsById) if (!this.seenIds.has(id)) this.pool.release(slot);

    for (const enemy of enemies) {
      let slot = this.slotsById.get(enemy.id);
      if (!slot) {
        slot = this.pool.acquire(enemy) ?? undefined;
        if (!slot) continue;
        this.slotsById.set(enemy.id, slot);
        this.idsBySprite.set(slot.body, enemy.id);
        this.addPosition(enemy);
      } else this.applySnapshot(slot, enemy);
      this.updatePosition(enemy);
    }
    this.redrawOverlay(enemies);
  }

  enemyIdFor(gameObject: unknown): number | null {
    if (gameObject === null || (typeof gameObject !== 'object' && typeof gameObject !== 'function')) return null;
    return this.idsBySprite.get(gameObject) ?? null;
  }

  getSprite(id: number): EnemyImage | null { return this.slotsById.get(id)?.body ?? null; }

  clear(): void {
    if (this.destroyed || this.pool === null) return;
    this.pool.clear();
    this.stalkerContrast.clear();
    this.overlay.clear();
    this.seenIds.clear();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
    this.clear();
    this.stalkerContrast.setVisible(false);
    this.overlay.setVisible(false);
    this.pool = null;
    this.destroyed = true;
  }

  private createPool(): EnemyPool<EnemySlot, EnemySnapshot> {
    return new EnemyPool({
      create: (): EnemySlot => {
        const body = this.scene.physics.add.image(0, 0, TEXTURE_KEYS.alienRunner);
        this.group.add(body);
        body.body.setAllowGravity(false);
        body.body.setImmovable(true);
        body.body.enable = false;
        body.setActive(false).setVisible(false);
        const art = this.initialFollowerTexture !== null
          ? this.scene.add.image(0, 0, this.initialFollowerTexture).setActive(false).setVisible(false)
          : null;
        return {
          body, art, presentation: new EnemyPresentationState(), framed: false, skinKey: 'unknown', emissiveAlpha: 0,
        };
      },
      activate: (slot, enemy): void => {
        slot.presentation.acquire(enemy);
        this.applySnapshot(slot, enemy);
        slot.body.setActive(true);
        slot.body.body.enable = true;
        slot.body.body.reset(enemy.x, enemy.y);
      },
      deactivate: (slot): void => {
        const id = this.idsBySprite.get(slot.body);
        if (id !== undefined) {
          this.slotsById.delete(id);
          this.idsBySprite.delete(slot.body);
          this.removePosition(id);
        }
        slot.presentation.release();
        slot.framed = false;
        slot.skinKey = 'unknown';
        slot.emissiveAlpha = 0;
        slot.body.body.enable = false;
        slot.body.setActive(false).setVisible(false).setPosition(0, 0).setRotation(0).setAlpha(1)
          .setScale(1).setFlipX(false).setFlipY(false).clearTint().setFrame(0);
        slot.art?.setActive(false).setVisible(false).setPosition(0, 0).setRotation(0).setAlpha(1)
          .setScale(1).setFlipX(false).setFlipY(false).clearTint().setFrame(0);
      },
    }, INITIAL_POOL_SIZE, MAX_POOL_SIZE);
  }

  private applySnapshot(slot: EnemySlot, enemy: EnemySnapshot): void {
    const body = slot.body;
    const presentation = ENEMY_PRESENTATION[enemy.type];
    const displaySize = presentation.displaySize * (enemy.elite ? ELITE_SCALE : 1);
    const radius = Math.max(1, Number.isFinite(enemy.radius) ? enemy.radius : 1);
    const resolved = this.resolvedTextures[enemy.type];
    slot.framed = resolved.framed && slot.art !== null;
    slot.skinKey = resolved.texture;

    body.setTexture(presentation.texture).setDisplaySize(displaySize, displaySize)
      .setPosition(enemy.x, enemy.y).setAlpha(clampUnit(enemy.alpha)).setDepth(enemy.y)
      .setRotation(slot.framed ? 0 : heading(enemy)).setVisible(!slot.framed);
    if (enemy.elite) body.setTint(ELITE_TINT); else body.clearTint();

    const sourceRadius = radius / Math.max(Number.EPSILON, Math.abs(body.scaleX));
    const bodyOffset = Math.max(0, (body.width - sourceRadius * 2) / 2);
    body.body.enable = true;
    body.body.reset(enemy.x, enemy.y);
    body.setCircle(sourceRadius, bodyOffset, bodyOffset);

    if (!slot.framed || !slot.art) {
      slot.art?.setActive(false).setVisible(false);
      return;
    }

    const settings = this.scene.registry.get('settings') as { reducedFlash?: boolean } | undefined;
    const output = slot.presentation.update(
      enemy, this.getPresentationTime(), this.quality,
      this.scene.registry.get('reducedMotion') === true,
      settings?.reducedFlash === true,
    );
    slot.emissiveAlpha = output.emissiveAlpha;
    slot.art.setTexture(resolved.texture).setFrame(CHARACTER_SKINS[enemy.type].frames[output.frame])
      .setPosition(enemy.x + output.offsetX, enemy.y + output.offsetY)
      .setDisplaySize(displaySize * output.scaleX, displaySize * output.scaleY)
      .setRotation(heading(enemy) + output.rotationOffset).setAlpha(clampUnit(enemy.alpha))
      .setDepth(enemy.y).setActive(true).setVisible(true).setFlipX(false);
    if (output.hitBrightness > 0) slot.art.setTint(0xffffff);
    else if (enemy.elite) slot.art.setTint(ELITE_TINT);
    else slot.art.clearTint();
  }

  private addPosition(enemy: EnemySnapshot): void {
    if (this.positionsById.has(enemy.id)) return;
    const position = { id: enemy.id, x: enemy.x, y: enemy.y };
    this.positionsById.set(enemy.id, position);
    this.mutableActivePositions.push(position);
  }
  private updatePosition(enemy: EnemySnapshot): void {
    const position = this.positionsById.get(enemy.id);
    if (position) { position.x = enemy.x; position.y = enemy.y; }
  }
  private removePosition(id: number): void {
    const position = this.positionsById.get(id);
    if (!position) return;
    this.positionsById.delete(id);
    const index = this.mutableActivePositions.indexOf(position);
    if (index >= 0) this.mutableActivePositions.splice(index, 1);
  }

  private redrawOverlay(enemies: readonly EnemySnapshot[]): void {
    this.redrawStalkerContrast(enemies);
    this.overlay.clear();
    for (const enemy of enemies) {
      if (!this.slotsById.has(enemy.id)) continue;
      const damaged = enemy.health < enemy.maxHealth;
      const armored = enemy.maxArmor > 0;
      if (!damaged && !armored && !enemy.elite) continue;
      const alpha = clampUnit(enemy.alpha);
      const radius = Math.max(1, Number.isFinite(enemy.radius) ? enemy.radius : 1);
      const width = Math.max(24, radius * 2.2 * (enemy.elite ? ELITE_SCALE : 1));
      const left = enemy.x - width / 2;
      const healthY = enemy.y - radius - BAR_OFFSET;
      const healthRatio = clampUnit(enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 0);
      this.overlay.fillStyle(BAR_BACKGROUND, 0.82 * alpha).fillRect(left - 1, healthY - 1, width + 2, HEALTH_BAR_HEIGHT + 2);
      this.overlay.fillStyle(healthRatio > 0.35 ? HEALTH_COLOR : HEALTH_DAMAGED_COLOR, alpha)
        .fillRect(left, healthY, width * healthRatio, HEALTH_BAR_HEIGHT);
      if (armored) {
        const armorY = healthY + HEALTH_BAR_HEIGHT + BAR_GAP;
        const armorRatio = clampUnit(enemy.maxArmor > 0 ? enemy.armor / enemy.maxArmor : 0);
        this.overlay.fillStyle(BAR_BACKGROUND, 0.82 * alpha).fillRect(left - 1, armorY - 1, width + 2, ARMOR_BAR_HEIGHT + 2);
        this.overlay.fillStyle(ARMOR_COLOR, alpha).fillRect(left, armorY, width * armorRatio, ARMOR_BAR_HEIGHT);
      }
      if (enemy.elite) this.drawEliteMarker(enemy.x, healthY - 8, alpha);
    }
  }

  private redrawStalkerContrast(enemies: readonly EnemySnapshot[]): void {
    this.stalkerContrast.clear();
    const reducedMotion = this.scene.registry.get('reducedMotion') === true;
    for (const enemy of enemies) {
      const slot = this.slotsById.get(enemy.id);
      if (!slot?.framed || enemy.type !== 'stalker') continue;
      const modulation = this.quality === 'low' || reducedMotion ? 0 : slot.emissiveAlpha * 0.3;
      const alpha = clampUnit(STALKER_CONTRAST_BASE_ALPHA + modulation);
      const radius = Math.max(27, enemy.radius + 8);
      this.stalkerContrast.lineStyle(2, STALKER_CONTRAST_COLOR, alpha).beginPath();
      this.stalkerContrast.moveTo(enemy.x, enemy.y - radius)
        .lineTo(enemy.x + radius, enemy.y)
        .lineTo(enemy.x, enemy.y + radius)
        .lineTo(enemy.x - radius, enemy.y)
        .closePath().strokePath();
    }
  }

  private drawEliteMarker(x: number, y: number, alpha: number): void {
    const halfWidth = 5, halfHeight = 7;
    this.overlay.lineStyle(2, ELITE_TINT, alpha).beginPath();
    this.overlay.moveTo(x, y - halfHeight).lineTo(x + halfWidth, y).lineTo(x, y + halfHeight)
      .lineTo(x - halfWidth, y).closePath().strokePath();
  }
}
