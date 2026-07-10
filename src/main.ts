import { GameApp } from './game/GameApp';
import './styles.css';

const gameRoot = document.querySelector<HTMLElement>('#game-root');

if (!gameRoot) {
  throw new Error('The game host element #game-root is missing.');
}

const gameApp = new GameApp();
gameApp.mount(gameRoot);

gameRoot.addEventListener('contextmenu', (event) => {
  if (event.target instanceof HTMLCanvasElement) {
    event.preventDefault();
  }
});

window.addEventListener(
  'beforeunload',
  () => {
    gameApp.destroy();
  },
  { once: true },
);
