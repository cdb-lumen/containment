import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from './constants';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { ResultsScene } from './scenes/ResultsScene';

const BACKGROUND_COLOR = '#05070b';

export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    transparent: false,
    antialias: true,
    pixelArt: false,
    scene: [BootScene, MenuScene, GameScene, ResultsScene],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
  };
}
