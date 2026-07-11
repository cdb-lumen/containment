import Phaser from 'phaser';

import { createTextures, TEXTURE_KEYS } from '../art/createTextures';
import {
  FACILITY_LAYOUT,
  type FacilityBreach,
  type FacilityDoor,
  type FacilityPoint,
  type QueenArena,
} from './facilityLayout';

type DoorRuntime = Readonly<{
  definition: FacilityDoor;
  sprite: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
}>;

const ROOM_FLOOR_TINTS: Record<string, number> = {
  plate: 0xffffff,
  grate: 0x9fb2bc,
  reinforced: 0xc1a589,
};

export class FacilityWorld {
  private readonly scene: Phaser.Scene;
  private readonly worldObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly breachMarkers = new Map<string, Phaser.GameObjects.Graphics>();
  private readonly doors = new Map<string, DoorRuntime>();
  private readonly staticBlockers: Phaser.Physics.Arcade.StaticGroup;
  private wave = 0;
  private isDestroyed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    createTextures(scene);
    this.staticBlockers = scene.physics.add.staticGroup();
    this.buildFacility();
    this.reset();
  }

  get playerSpawn(): FacilityPoint {
    return FACILITY_LAYOUT.playerSpawn;
  }

  get queenArena(): QueenArena {
    return FACILITY_LAYOUT.queenArena;
  }

  get armoryZone(): typeof FACILITY_LAYOUT.armoryZone {
    return FACILITY_LAYOUT.armoryZone;
  }

  get activeBreaches(): readonly FacilityBreach[] {
    return FACILITY_LAYOUT.breaches.filter(
      ({ unlockWave }) => unlockWave <= this.wave,
    );
  }

  get colliderGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.staticBlockers;
  }

  setWaveAccess(wave: number): void {
    if (this.isDestroyed || !Number.isFinite(wave)) return;
    this.wave = Math.max(this.wave, Math.max(0, Math.floor(wave)));

    for (const runtime of this.doors.values()) {
      if (runtime.definition.unlockWave <= this.wave) {
        this.setDoorOpen(runtime, true);
      }
    }
    this.updateBreachMarkers();
  }

  openForWave(waveNumber: number): void {
    this.setWaveAccess(waveNumber);
  }

  getActiveBreaches(): readonly FacilityBreach[] {
    return this.activeBreaches;
  }

  getArmoryZone(): typeof FACILITY_LAYOUT.armoryZone {
    return FACILITY_LAYOUT.armoryZone;
  }

  openAllDoors(): void {
    if (this.isDestroyed) return;
    for (const runtime of this.doors.values()) this.setDoorOpen(runtime, true);
  }

  reset(): void {
    if (this.isDestroyed) return;
    this.wave = 0;
    for (const runtime of this.doors.values()) {
      this.setDoorOpen(runtime, runtime.definition.initialState === 'open');
    }
    this.updateBreachMarkers();
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.breachMarkers.clear();
    this.doors.clear();
    this.staticBlockers.clear(true, true);
    for (const object of this.worldObjects) object.destroy();
    this.worldObjects.length = 0;
  }

  private track<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.worldObjects.push(object);
    return object;
  }

  private buildFacility(): void {
    const backdrop = this.track(
      this.scene.add
        .rectangle(1280, 720, 2560, 1440, 0x070a0f)
        .setDepth(-20),
    );
    backdrop.setStrokeStyle(4, 0x263640, 1);

    for (const room of FACILITY_LAYOUT.rooms) {
      const texture = room.floor === 'grate' ? TEXTURE_KEYS.grate : TEXTURE_KEYS.floor;
      const floor = this.track(
        this.scene.add.tileSprite(
          room.x + room.width / 2,
          room.y + room.height / 2,
          room.width - 16,
          room.height - 16,
          texture,
        ),
      );
      floor.setTint(ROOM_FLOOR_TINTS[room.floor]);
      floor.setDepth(-10);

      const roomFrame = this.track(this.scene.add.graphics().setDepth(-8));
      roomFrame.lineStyle(3, 0x263640, 0.9);
      roomFrame.strokeRect(room.x, room.y, room.width, room.height);
      roomFrame.lineStyle(1, 0x69d8e7, 0.12);
      roomFrame.strokeRect(room.x + 10, room.y + 10, room.width - 20, room.height - 20);

      this.track(
        this.scene.add
          .text(room.x + 24, room.y + 20, room.label, {
            fontFamily: 'Consolas, ui-monospace, monospace',
            fontSize: '18px',
            color: '#81909e',
            letterSpacing: 2,
          })
          .setDepth(3),
      );
    }

    for (const hazard of FACILITY_LAYOUT.hazardZones) {
      this.track(
        this.scene.add
          .tileSprite(
            hazard.x + hazard.width / 2,
            hazard.y + hazard.height / 2,
            hazard.width,
            hazard.height,
            TEXTURE_KEYS.hazard,
          )
          .setDepth(-6),
      );
    }

    this.buildZoneMarkings();

    for (const wall of FACILITY_LAYOUT.walls) {
      const wallSprite = this.staticBlockers.create(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        TEXTURE_KEYS.wall,
      ) as Phaser.Types.Physics.Arcade.ImageWithStaticBody;
      wallSprite
        .setDisplaySize(wall.width, wall.height)
        .setDepth(wall.y + wall.height)
        .refreshBody();
    }

    for (const door of FACILITY_LAYOUT.doors) {
      const sprite = this.staticBlockers.create(
        door.x + door.width / 2,
        door.y + door.height / 2,
        TEXTURE_KEYS.door,
      ) as Phaser.Types.Physics.Arcade.ImageWithStaticBody;
      sprite
        .setDisplaySize(door.width, door.height)
        .setDepth(door.y + door.height + 1)
        .refreshBody();
      this.doors.set(door.id, { definition: door, sprite });
    }

    for (const prop of FACILITY_LAYOUT.props) {
      const key =
        prop.kind === 'console'
          ? TEXTURE_KEYS.console
          : prop.kind === 'crate'
            ? TEXTURE_KEYS.crate
            : prop.kind === 'barrel'
              ? TEXTURE_KEYS.barrel
              : prop.kind === 'generator'
                ? TEXTURE_KEYS.generator
                : prop.kind === 'teleporter'
                  ? TEXTURE_KEYS.teleporter
                  : TEXTURE_KEYS.armory;
      const image = this.track(
        this.scene.add
          .image(
            prop.x + prop.width / 2,
            prop.y + prop.height / 2,
            key,
          )
          .setDisplaySize(prop.width, prop.height)
          .setDepth(prop.y + prop.height),
      );
      if (prop.rotation !== undefined) image.setAngle(prop.rotation);
    }

    for (const breach of FACILITY_LAYOUT.breaches) {
      const marker = this.track(this.scene.add.graphics().setDepth(8));
      marker.lineStyle(3, 0xf39237, 1);
      marker.strokeCircle(breach.x, breach.y, 21);
      marker.lineBetween(breach.x - 28, breach.y, breach.x + 28, breach.y);
      marker.lineBetween(breach.x, breach.y - 28, breach.x, breach.y + 28);
      this.breachMarkers.set(breach.id, marker);
    }
  }

  private buildZoneMarkings(): void {
    const zones = this.track(this.scene.add.graphics().setDepth(0));
    const armory = FACILITY_LAYOUT.armoryZone;
    zones.fillStyle(0xf39237, 0.07);
    zones.fillRect(armory.x, armory.y, armory.width, armory.height);
    zones.lineStyle(3, 0xf39237, 0.65);
    zones.strokeRect(armory.x, armory.y, armory.width, armory.height);

    const turret = FACILITY_LAYOUT.turretZone;
    zones.fillStyle(0x69d8e7, 0.06);
    zones.fillRect(turret.x, turret.y, turret.width, turret.height);
    zones.lineStyle(3, 0x69d8e7, 0.55);
    zones.strokeRect(turret.x, turret.y, turret.width, turret.height);

    const queen = FACILITY_LAYOUT.queenArena;
    zones.lineStyle(5, 0xf39237, 0.7);
    zones.strokeRoundedRect(queen.x + 12, queen.y + 12, queen.width - 24, queen.height - 24, 24);
    zones.lineStyle(2, 0x69d8e7, 0.38);
    zones.strokeCircle(queen.safeCenter.x, queen.safeCenter.y, queen.safeRadius);
    zones.strokeCircle(queen.safeCenter.x, queen.safeCenter.y, queen.safeRadius - 46);

    const armoryIcon = this.track(
      this.scene.add
        .image(
          armory.x + armory.width / 2,
          armory.y + armory.height / 2,
          TEXTURE_KEYS.armory,
        )
        .setDepth(2),
    );
    armoryIcon.setAlpha(0.75);

    const turretIcon = this.track(
      this.scene.add
        .image(
          turret.x + turret.width / 2,
          turret.y + turret.height / 2,
          TEXTURE_KEYS.turret,
        )
        .setDepth(2),
    );
    turretIcon.setAlpha(0.75);
  }

  private setDoorOpen(runtime: DoorRuntime, isOpen: boolean): void {
    runtime.sprite.body.enable = !isOpen;
    runtime.sprite.setAlpha(isOpen ? 0.2 : 1);
    runtime.sprite.setTint(isOpen ? 0x69d8e7 : 0xffffff);
    if (!isOpen) runtime.sprite.refreshBody();
  }

  private updateBreachMarkers(): void {
    const activeIds = new Set(this.activeBreaches.map(({ id }) => id));
    for (const [id, marker] of this.breachMarkers) {
      marker.setAlpha(activeIds.has(id) ? 1 : 0.15);
    }
  }
}
