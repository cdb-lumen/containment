import type { WeaponId } from '../combat/types';
import { EMPTY_INPUT_STATE, type InputState } from './InputState';

type Viewport = Readonly<{ width: number; height: number }>;
type Point = Readonly<{ x: number; y: number }>;
type StickSide = 'left' | 'right';
type TouchAction =
  | 'reload'
  | 'grenade'
  | 'interact'
  | 'medkit'
  | 'pause';

type TouchInputOptions = Readonly<{
  radius?: number;
  deadZone?: number;
  aimDistance?: number;
}>;

type TouchDetection = Readonly<{
  coarsePointer: boolean;
  maxTouchPoints: number;
  observedTouch?: boolean;
  override?: boolean;
}>;

type StickState = {
  pointerId: number | null;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
};

export type TouchStickVisual = Readonly<{
  active: boolean;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
}>;

export type TouchVisualState = Readonly<{
  left: TouchStickVisual;
  right: TouchStickVisual;
}>;

const DEFAULT_RADIUS = 80;
const DEFAULT_DEAD_ZONE = 0.2;
const DEFAULT_AIM_DISTANCE = 1_000;
const WEAPON_ORDER: readonly WeaponId[] = Object.freeze([
  'pistol',
  'rifle',
  'shotgun',
  'plasma',
  'rocket',
]);

const finitePositive = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const clampUnit = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

const createStick = (): StickState => ({
  pointerId: null,
  originX: 0,
  originY: 0,
  currentX: 0,
  currentY: 0,
});

const releaseStick = (stick: StickState): void => {
  stick.pointerId = null;
  stick.originX = 0;
  stick.originY = 0;
  stick.currentX = 0;
  stick.currentY = 0;
};

const vectorFor = (
  stick: StickState,
  radius: number,
  deadZone: number,
): Point => {
  if (stick.pointerId === null) return Object.freeze({ x: 0, y: 0 });
  const deltaX = stick.currentX - stick.originX;
  const deltaY = stick.currentY - stick.originY;
  const magnitude = Math.hypot(deltaX, deltaY);
  const normalizedMagnitude = Math.min(1, magnitude / radius);
  if (
    !Number.isFinite(magnitude) ||
    magnitude === 0 ||
    normalizedMagnitude <= deadZone ||
    deadZone >= 1
  ) {
    return Object.freeze({ x: 0, y: 0 });
  }
  const outputMagnitude = (normalizedMagnitude - deadZone) / (1 - deadZone);
  return Object.freeze({
    x: (deltaX / magnitude) * outputMagnitude,
    y: (deltaY / magnitude) * outputMagnitude,
  });
};

const visualFor = (stick: StickState): TouchStickVisual =>
  Object.freeze({
    active: stick.pointerId !== null,
    originX: stick.originX,
    originY: stick.originY,
    currentX: stick.currentX,
    currentY: stick.currentY,
  });

export const shouldEnableTouchControls = (detection: TouchDetection): boolean => {
  if (typeof detection.override === 'boolean') return detection.override;
  return detection.observedTouch === true || detection.coarsePointer;
};

export class TouchInputState {
  readonly #left = createStick();
  readonly #right = createStick();
  readonly #edges = new Set<TouchAction>();
  #weaponEdge: WeaponId | null = null;
  #width: number;
  #height: number;
  #radius: number;
  #deadZone: number;
  #aimDistance: number;
  #blocked = false;

  constructor(viewport: Viewport, options: TouchInputOptions = {}) {
    this.#width = finitePositive(viewport.width, 1);
    this.#height = finitePositive(viewport.height, 1);
    this.#radius = finitePositive(options.radius ?? DEFAULT_RADIUS, DEFAULT_RADIUS);
    this.#deadZone = clampUnit(options.deadZone ?? DEFAULT_DEAD_ZONE);
    this.#aimDistance = finitePositive(
      options.aimDistance ?? DEFAULT_AIM_DISTANCE,
      DEFAULT_AIM_DISTANCE,
    );
  }

  get visualState(): TouchVisualState {
    return Object.freeze({
      left: visualFor(this.#left),
      right: visualFor(this.#right),
    });
  }

  get hasActivePointers(): boolean {
    return this.#left.pointerId !== null || this.#right.pointerId !== null;
  }

  get hasActiveAimPointer(): boolean {
    return this.#right.pointerId !== null;
  }

  setViewport(viewport: Viewport): void {
    this.#width = finitePositive(viewport.width, this.#width);
    this.#height = finitePositive(viewport.height, this.#height);
    this.suspend();
  }

  setBlocked(blocked: boolean): void {
    this.#blocked = blocked;
    if (blocked) this.suspend();
  }

  pointerDown(pointerId: number, x: number, y: number): boolean {
    if (
      this.#blocked ||
      !Number.isSafeInteger(pointerId) ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      y < 0 ||
      x > this.#width ||
      y > this.#height
    ) {
      return false;
    }
    if (this.#left.pointerId === pointerId || this.#right.pointerId === pointerId) {
      return false;
    }

    const side: StickSide = x < this.#width / 2 ? 'left' : 'right';
    const stick = side === 'left' ? this.#left : this.#right;
    if (stick.pointerId !== null) return false;

    stick.pointerId = pointerId;
    stick.originX = x;
    stick.originY = y;
    stick.currentX = x;
    stick.currentY = y;
    return true;
  }

  pointerMove(pointerId: number, x: number, y: number): void {
    if (this.#blocked || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const stick = this.#stickOwnedBy(pointerId);
    if (stick === null) return;
    const deltaX = x - stick.originX;
    const deltaY = y - stick.originY;
    const magnitude = Math.hypot(deltaX, deltaY);
    if (magnitude > this.#radius) {
      stick.currentX = stick.originX + (deltaX / magnitude) * this.#radius;
      stick.currentY = stick.originY + (deltaY / magnitude) * this.#radius;
      return;
    }
    stick.currentX = x;
    stick.currentY = y;
  }

  pointerUp(pointerId: number): void {
    const stick = this.#stickOwnedBy(pointerId);
    if (stick !== null) releaseStick(stick);
  }

  pointerCancel(pointerId: number): void {
    this.pointerUp(pointerId);
  }

  press(action: TouchAction): void {
    if (!this.#blocked) this.#edges.add(action);
  }

  pressWeapon(weaponId: WeaponId): void {
    if (!this.#blocked) this.#weaponEdge = weaponId;
  }

  read(origin: Point): InputState {
    const originX = Number.isFinite(origin.x) ? origin.x : 0;
    const originY = Number.isFinite(origin.y) ? origin.y : 0;
    if (this.#blocked) {
      this.#clearEdges();
      return Object.freeze({
        ...EMPTY_INPUT_STATE,
        aimWorldX: originX,
        aimWorldY: originY,
      });
    }

    const movement = vectorFor(this.#left, this.#radius, this.#deadZone);
    const aim = vectorFor(this.#right, this.#radius, this.#deadZone);
    const fireHeld = aim.x !== 0 || aim.y !== 0;
    const result = Object.freeze({
      movementX: movement.x,
      movementY: movement.y,
      aimWorldX: originX + aim.x * this.#aimDistance,
      aimWorldY: originY + aim.y * this.#aimDistance,
      fireHeld,
      reloadPressed: this.#edges.has('reload'),
      grenadePressed: this.#edges.has('grenade'),
      interactPressed: this.#edges.has('interact'),
      medkitPressed: this.#edges.has('medkit'),
      pausePressed: this.#edges.has('pause'),
      weaponPressed: this.#weaponEdge,
    });
    this.#clearEdges();
    return result;
  }

  suspend(): void {
    releaseStick(this.#left);
    releaseStick(this.#right);
    this.#clearEdges();
  }

  #stickOwnedBy(pointerId: number): StickState | null {
    if (this.#left.pointerId === pointerId) return this.#left;
    if (this.#right.pointerId === pointerId) return this.#right;
    return null;
  }

  #clearEdges(): void {
    this.#edges.clear();
    this.#weaponEdge = null;
  }
}

type TouchInputHost = Readonly<{
  canvas: HTMLCanvasElement;
  parent: HTMLElement;
}>;

type TouchInputAdapterOptions = Readonly<{
  override?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
}>;

const queryCoarsePointer = (): boolean => {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
};

const maxTouchPoints = (): number => {
  try {
    return navigator.maxTouchPoints;
  } catch {
    return 0;
  }
};

const createButton = (
  className: string,
  label: string,
  shortLabel: string,
): HTMLButtonElement => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `touch-controls__button ${className}`;
  button.setAttribute('aria-label', label);
  button.textContent = shortLabel;
  return button;
};

export class TouchInput {
  readonly #host: TouchInputHost;
  readonly #state: TouchInputState;
  readonly #onEnabledChange: ((enabled: boolean) => void) | undefined;
  readonly #root: HTMLDivElement;
  readonly #leftBase: HTMLDivElement;
  readonly #leftKnob: HTMLDivElement;
  readonly #rightBase: HTMLDivElement;
  readonly #rightKnob: HTMLDivElement;
  readonly #weaponButton: HTMLButtonElement;
  readonly #override: boolean | undefined;
  #observedTouch = false;
  #destroyed = false;
  #weaponIndex = 0;
  #lastEnabled: boolean | null = null;

  constructor(host: TouchInputHost, options: TouchInputAdapterOptions = {}) {
    this.#host = host;
    this.#override = options.override;
    this.#onEnabledChange = options.onEnabledChange;
    this.#state = new TouchInputState({
      width: host.canvas.width,
      height: host.canvas.height,
    });

    const root = document.createElement('div');
    root.className = 'touch-controls';
    root.setAttribute('aria-label', 'Touch controls');
    root.setAttribute('role', 'group');
    this.#root = root;

    const [leftBase, leftKnob] = this.#createStick('left', 'Movement stick');
    const [rightBase, rightKnob] = this.#createStick('right', 'Aim and fire stick');
    this.#leftBase = leftBase;
    this.#leftKnob = leftKnob;
    this.#rightBase = rightBase;
    this.#rightKnob = rightKnob;

    const pause = createButton('touch-controls__pause', 'Pause game', 'Ⅱ');
    const grenade = createButton('touch-controls__grenade', 'Throw grenade', 'G');
    const medkit = createButton('touch-controls__medkit', 'Use medkit', '+');
    const weapon = createButton('touch-controls__weapon', 'Switch weapon', 'W1');
    this.#weaponButton = weapon;

    this.#bindAction(pause, 'pause');
    this.#bindAction(grenade, 'grenade');
    this.#bindAction(medkit, 'medkit');
    weapon.addEventListener('pointerdown', this.#handleWeaponPress);
    weapon.addEventListener('click', this.#handleWeaponClick);

    root.append(leftBase, rightBase, pause, grenade, medkit, weapon);
    host.parent.append(root);
    host.canvas.addEventListener('pointerdown', this.#handlePointerDown, {
      passive: false,
    });
    host.canvas.addEventListener('pointermove', this.#handlePointerMove, {
      passive: false,
    });
    host.canvas.addEventListener('pointerup', this.#handlePointerUp, {
      passive: false,
    });
    host.canvas.addEventListener('pointercancel', this.#handlePointerCancel, {
      passive: false,
    });
    window.addEventListener('resize', this.#handleResize);
    this.#syncBounds();
    this.#syncVisibility();
    this.#renderSticks();
  }

  get observedTouch(): boolean {
    return this.#observedTouch;
  }

  get hasActivePointers(): boolean {
    return this.#state.hasActivePointers;
  }

  get hasActiveAimPointer(): boolean {
    return this.#state.hasActiveAimPointer;
  }

  get enabled(): boolean {
    return shouldEnableTouchControls({
      coarsePointer: queryCoarsePointer(),
      maxTouchPoints: maxTouchPoints(),
      observedTouch: this.#observedTouch,
      override: this.#override,
    });
  }

  read(origin: Point): InputState {
    this.#renderSticks();
    return this.#state.read(origin);
  }

  setBlocked(blocked: boolean): void {
    this.#state.setBlocked(blocked);
    this.#root.classList.toggle('touch-controls--blocked', blocked);
    this.#renderSticks();
  }

  setModalBlocked(blocked: boolean): void {
    this.#root.inert = blocked;
    this.#root.setAttribute('aria-hidden', String(blocked));
    if (blocked) this.suspend();
  }

  suspend(): void {
    this.#state.suspend();
    this.#renderSticks();
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.suspend();
    this.#host.canvas.removeEventListener('pointerdown', this.#handlePointerDown);
    this.#host.canvas.removeEventListener('pointermove', this.#handlePointerMove);
    this.#host.canvas.removeEventListener('pointerup', this.#handlePointerUp);
    this.#host.canvas.removeEventListener('pointercancel', this.#handlePointerCancel);
    window.removeEventListener('resize', this.#handleResize);
    this.#weaponButton.removeEventListener('pointerdown', this.#handleWeaponPress);
    this.#weaponButton.removeEventListener('click', this.#handleWeaponClick);
    this.#root.remove();
  }

  #createStick(side: StickSide, label: string): [HTMLDivElement, HTMLDivElement] {
    const base = document.createElement('div');
    base.className = `touch-controls__stick touch-controls__stick--${side}`;
    base.setAttribute('aria-hidden', 'true');
    base.dataset.label = label;
    const knob = document.createElement('div');
    knob.className = 'touch-controls__stick-knob';
    base.append(knob);
    return [base, knob];
  }

  #bindAction(button: HTMLButtonElement, action: TouchAction): void {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.#observeTouch(event);
      this.#state.press(action);
    });
    button.addEventListener('click', (event) => {
      if (event.detail !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      this.#state.press(action);
    });
  }

  #handleWeaponPress = (event: PointerEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.#observeTouch(event);
    this.#advanceWeapon();
  };

  #handleWeaponClick = (event: MouseEvent): void => {
    if (event.detail !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.#advanceWeapon();
  };

  #advanceWeapon(): void {
    this.#weaponIndex = (this.#weaponIndex + 1) % WEAPON_ORDER.length;
    const weapon = WEAPON_ORDER[this.#weaponIndex];
    this.#state.pressWeapon(weapon);
    this.#weaponButton.textContent = `W${this.#weaponIndex + 1}`;
    this.#weaponButton.setAttribute('aria-label', `Switch weapon: ${weapon}`);
  }

  #handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.#observeTouch(event);
    const point = this.#canvasPoint(event);
    if (!this.#state.pointerDown(event.pointerId, point.x, point.y)) return;
    event.preventDefault();
    try {
      this.#host.canvas.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic pointer events may not have a native capture record.
    }
    this.#renderSticks();
  };

  #handlePointerMove = (event: PointerEvent): void => {
    if (!this.#state.hasActivePointers) return;
    const point = this.#canvasPoint(event);
    this.#state.pointerMove(event.pointerId, point.x, point.y);
    event.preventDefault();
    this.#renderSticks();
  };

  #handlePointerUp = (event: PointerEvent): void => {
    this.#state.pointerUp(event.pointerId);
    this.#renderSticks();
  };

  #handlePointerCancel = (event: PointerEvent): void => {
    this.#state.pointerCancel(event.pointerId);
    this.#renderSticks();
  };

  #handleResize = (): void => {
    this.#state.setViewport({
      width: this.#host.canvas.width,
      height: this.#host.canvas.height,
    });
    this.#syncBounds();
    this.#syncVisibility();
    this.#renderSticks();
  };

  #observeTouch(event: PointerEvent): void {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.#observedTouch = true;
    this.#syncVisibility();
  }

  #canvasPoint(event: PointerEvent): Point {
    const bounds = this.#host.canvas.getBoundingClientRect();
    const width = finitePositive(bounds.width, this.#host.canvas.width);
    const height = finitePositive(bounds.height, this.#host.canvas.height);
    return Object.freeze({
      x: ((event.clientX - bounds.left) / width) * this.#host.canvas.width,
      y: ((event.clientY - bounds.top) / height) * this.#host.canvas.height,
    });
  }

  #syncBounds(): void {
    const canvasBounds = this.#host.canvas.getBoundingClientRect();
    const parentBounds = this.#host.parent.getBoundingClientRect();
    this.#root.style.left = `${canvasBounds.left - parentBounds.left}px`;
    this.#root.style.top = `${canvasBounds.top - parentBounds.top}px`;
    this.#root.style.width = `${canvasBounds.width}px`;
    this.#root.style.height = `${canvasBounds.height}px`;
  }

  #syncVisibility(): void {
    const enabled = this.enabled;
    this.#root.classList.toggle('touch-controls--visible', enabled);
    if (enabled !== this.#lastEnabled) {
      this.#lastEnabled = enabled;
      this.#onEnabledChange?.(enabled);
    }
  }

  #renderSticks(): void {
    const visual = this.#state.visualState;
    this.#renderStick(this.#leftBase, this.#leftKnob, visual.left, 'left');
    this.#renderStick(this.#rightBase, this.#rightKnob, visual.right, 'right');
  }

  #renderStick(
    base: HTMLDivElement,
    knob: HTMLDivElement,
    stick: TouchStickVisual,
    side: StickSide,
  ): void {
    const bounds = this.#host.canvas.getBoundingClientRect();
    const scaleX = bounds.width / finitePositive(this.#host.canvas.width, 1);
    const scaleY = bounds.height / finitePositive(this.#host.canvas.height, 1);
    const fallbackX = side === 'left' ? bounds.width * 0.18 : bounds.width * 0.82;
    const fallbackY = bounds.height * 0.74;
    const originX = stick.active ? stick.originX * scaleX : fallbackX;
    const originY = stick.active ? stick.originY * scaleY : fallbackY;
    const currentX = stick.active ? stick.currentX * scaleX : originX;
    const currentY = stick.active ? stick.currentY * scaleY : originY;
    base.style.setProperty('--stick-x', `${originX}px`);
    base.style.setProperty('--stick-y', `${originY}px`);
    knob.style.setProperty('--knob-x', `${currentX - originX}px`);
    knob.style.setProperty('--knob-y', `${currentY - originY}px`);
    base.classList.toggle('touch-controls__stick--active', stick.active);
  }
}
