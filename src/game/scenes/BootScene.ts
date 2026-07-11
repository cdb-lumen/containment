import Phaser from 'phaser';

import {
  applyToAvailableCharacterSheets,
  characterSkinLoadDescriptors,
} from '../art/characterSkins';
import { createTextures } from '../art/createTextures';
import { STORAGE_KEY } from '../constants';
import { parseSaveData } from '../persistence/saveData';
import { SCENE_KEYS } from './sceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.boot });
  }

  preload(): void {
    for (const { key, url, frameWidth, frameHeight } of characterSkinLoadDescriptors()) {
      this.load.spritesheet(key, url, { frameWidth, frameHeight });
    }
  }

  create(): void {
    createTextures(this);
    applyToAvailableCharacterSheets(
      (key) => this.textures.exists(key),
      (key) => this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST),
    );

    const serializedSave = this.readSerializedSave();

    const saveData = parseSaveData(serializedSave);
    const prefersReducedMotion = this.prefersReducedMotion();

    const reducedMotion = prefersReducedMotion;

    this.registry.set('saveData', saveData);
    this.registry.set('settings', saveData.settings);
    this.registry.set('records', saveData.records);
    this.registry.set('reducedMotion', reducedMotion);

    this.scene.start(SCENE_KEYS.menu);
  }

  private readSerializedSave(): string | null {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private prefersReducedMotion(): boolean {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }
}
