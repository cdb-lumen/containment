import Phaser from 'phaser';

import type { WeaponId } from '../combat/types';
import { EMPTY_INPUT_STATE, type InputState } from './InputState';

type AimOrigin = Readonly<Phaser.Types.Math.Vector2Like>;

const justDown = (key: Phaser.Input.Keyboard.Key | null): boolean =>
  key !== null && Phaser.Input.Keyboard.JustDown(key);

export class DesktopInput {
  private readonly scene: Phaser.Scene;
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly registeredKeys: Phaser.Input.Keyboard.Key[] = [];
  private readonly aimPoint = new Phaser.Math.Vector2();

  private readonly wKey: Phaser.Input.Keyboard.Key | null;
  private readonly aKey: Phaser.Input.Keyboard.Key | null;
  private readonly sKey: Phaser.Input.Keyboard.Key | null;
  private readonly dKey: Phaser.Input.Keyboard.Key | null;
  private readonly reloadKey: Phaser.Input.Keyboard.Key | null;
  private readonly grenadeKey: Phaser.Input.Keyboard.Key | null;
  private readonly interactKey: Phaser.Input.Keyboard.Key | null;
  private readonly medkitKey: Phaser.Input.Keyboard.Key | null;
  private readonly pauseKey: Phaser.Input.Keyboard.Key | null;
  private readonly weaponOneKey: Phaser.Input.Keyboard.Key | null;
  private readonly weaponTwoKey: Phaser.Input.Keyboard.Key | null;
  private readonly weaponThreeKey: Phaser.Input.Keyboard.Key | null;
  private readonly weaponFourKey: Phaser.Input.Keyboard.Key | null;
  private readonly weaponFiveKey: Phaser.Input.Keyboard.Key | null;

  private previousRightButtonDown = false;
  private lastAimWorldX = 0;
  private lastAimWorldY = 0;
  private hasValidAim = false;
  private isDestroyed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.keyboard = scene.input.keyboard ?? null;
    this.cursors = this.keyboard?.createCursorKeys() ?? null;

    if (this.cursors !== null) {
      this.registeredKeys.push(
        this.cursors.up,
        this.cursors.down,
        this.cursors.left,
        this.cursors.right,
        this.cursors.space,
        this.cursors.shift,
      );
    }

    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.wKey = this.addKey(keyCodes.W);
    this.aKey = this.addKey(keyCodes.A);
    this.sKey = this.addKey(keyCodes.S);
    this.dKey = this.addKey(keyCodes.D);
    this.reloadKey = this.addKey(keyCodes.R);
    this.grenadeKey = this.addKey(keyCodes.G);
    this.interactKey = this.addKey(keyCodes.E);
    this.medkitKey = this.addKey(keyCodes.Q);
    this.pauseKey = this.addKey(keyCodes.ESC);
    this.weaponOneKey = this.addKey(keyCodes.ONE);
    this.weaponTwoKey = this.addKey(keyCodes.TWO);
    this.weaponThreeKey = this.addKey(keyCodes.THREE);
    this.weaponFourKey = this.addKey(keyCodes.FOUR);
    this.weaponFiveKey = this.addKey(keyCodes.FIVE);
  }

  read(
    camera: Phaser.Cameras.Scene2D.Camera,
    origin?: AimOrigin,
    allowPointerInput = true,
  ): InputState {
    if (this.isDestroyed) return Object.freeze({ ...EMPTY_INPUT_STATE });

    const pointer = this.scene.input.activePointer;
    let movementX = 0;
    let movementY = 0;

    if (!this.isDestroyed) {
      const left = this.aKey?.isDown === true || this.cursors?.left.isDown === true;
      const right = this.dKey?.isDown === true || this.cursors?.right.isDown === true;
      const up = this.wKey?.isDown === true || this.cursors?.up.isDown === true;
      const down = this.sKey?.isDown === true || this.cursors?.down.isDown === true;
      movementX = Number(right) - Number(left);
      movementY = Number(down) - Number(up);

      if (movementX !== 0 && movementY !== 0) {
        movementX *= Math.SQRT1_2;
        movementY *= Math.SQRT1_2;
      }
    }

    let aimWorldX = this.hasValidAim ? this.lastAimWorldX : 0;
    let aimWorldY = this.hasValidAim ? this.lastAimWorldY : 0;

    if (!this.hasValidAim && this.isFinitePoint(origin)) {
      aimWorldX = origin.x;
      aimWorldY = origin.y;
    }

    if (
      !this.isDestroyed &&
      allowPointerInput &&
      Number.isFinite(pointer.x) &&
      Number.isFinite(pointer.y)
    ) {
      try {
        const worldPoint = camera.getWorldPoint(pointer.x, pointer.y, this.aimPoint);
        if (Number.isFinite(worldPoint.x) && Number.isFinite(worldPoint.y)) {
          aimWorldX = worldPoint.x;
          aimWorldY = worldPoint.y;
          this.lastAimWorldX = aimWorldX;
          this.lastAimWorldY = aimWorldY;
          this.hasValidAim = true;
        }
      } catch {
        // A shutting-down camera may reject conversion; preserve the last finite aim.
      }
    }

    let reloadPressed = false;
    let keyboardGrenadePressed = false;
    let interactPressed = false;
    let medkitPressed = false;
    let pausePressed = false;
    let weaponPressed: WeaponId | null = null;

    if (!this.isDestroyed) {
      reloadPressed = justDown(this.reloadKey);
      keyboardGrenadePressed = justDown(this.grenadeKey);
      interactPressed = justDown(this.interactKey);
      medkitPressed = justDown(this.medkitKey);
      pausePressed = justDown(this.pauseKey);

      const weaponOnePressed = justDown(this.weaponOneKey);
      const weaponTwoPressed = justDown(this.weaponTwoKey);
      const weaponThreePressed = justDown(this.weaponThreeKey);
      const weaponFourPressed = justDown(this.weaponFourKey);
      const weaponFivePressed = justDown(this.weaponFiveKey);

      if (weaponOnePressed) weaponPressed = 'pistol';
      else if (weaponTwoPressed) weaponPressed = 'rifle';
      else if (weaponThreePressed) weaponPressed = 'shotgun';
      else if (weaponFourPressed) weaponPressed = 'plasma';
      else if (weaponFivePressed) weaponPressed = 'rocket';
    }

    const rightButtonDown =
      !this.isDestroyed && allowPointerInput && pointer.rightButtonDown();
    const rightButtonPressed = rightButtonDown && !this.previousRightButtonDown;
    this.previousRightButtonDown = rightButtonDown;

    return Object.freeze({
      movementX,
      movementY,
      aimWorldX,
      aimWorldY,
      fireHeld: !this.isDestroyed && allowPointerInput && pointer.primaryDown,
      reloadPressed,
      grenadePressed: keyboardGrenadePressed || rightButtonPressed,
      interactPressed,
      medkitPressed,
      pausePressed,
      weaponPressed,
    });
  }

  clearEdges(): void {
    if (this.isDestroyed) return;

    justDown(this.reloadKey);
    justDown(this.grenadeKey);
    justDown(this.interactKey);
    justDown(this.medkitKey);
    justDown(this.pauseKey);
    justDown(this.weaponOneKey);
    justDown(this.weaponTwoKey);
    justDown(this.weaponThreeKey);
    justDown(this.weaponFourKey);
    justDown(this.weaponFiveKey);
    this.previousRightButtonDown = this.scene.input.activePointer.rightButtonDown();
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.previousRightButtonDown = false;
    this.hasValidAim = false;

    if (this.keyboard !== null) {
      for (const key of this.registeredKeys) {
        this.keyboard.removeKey(key, true, true);
      }
    }
    this.registeredKeys.length = 0;
  }

  private addKey(keyCode: number): Phaser.Input.Keyboard.Key | null {
    if (this.keyboard === null) return null;
    const key = this.keyboard.addKey(keyCode);
    this.registeredKeys.push(key);
    return key;
  }

  private isFinitePoint(point: AimOrigin | undefined): point is AimOrigin {
    return (
      point !== undefined &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y)
    );
  }
}
