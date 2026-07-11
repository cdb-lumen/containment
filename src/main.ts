import { GameApp } from './game/GameApp';
import './styles.css';

const gameRoot = document.querySelector<HTMLElement>('#game-root');

if (!gameRoot) {
  throw new Error('The game host element #game-root is missing.');
}

const portraitQuery = window.matchMedia(
  '(orientation: portrait) and (pointer: coarse)',
);
const syncPortraitAccessibility = (): void => {
  const blocked = portraitQuery.matches;
  gameRoot.inert = blocked;
  if (blocked) {
    gameRoot.setAttribute('aria-hidden', 'true');
  } else {
    gameRoot.removeAttribute('aria-hidden');
  }
};
portraitQuery.addEventListener('change', syncPortraitAccessibility);
syncPortraitAccessibility();

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
    portraitQuery.removeEventListener('change', syncPortraitAccessibility);
    gameApp.destroy();
  },
  { once: true },
);
