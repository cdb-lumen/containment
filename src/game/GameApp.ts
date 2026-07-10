import Phaser from 'phaser';

import { createGameConfig } from './config';

export class GameApp {
  private game: Phaser.Game | null = null;

  mount(parent: HTMLElement): void {
    this.destroy();
    this.game = new Phaser.Game(createGameConfig(parent));
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }
}
