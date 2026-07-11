import {
  characterAnimation,
  type CharacterAnimationInput,
  type CharacterAnimationOutput,
} from '../art/characterAnimation';
import type { CharacterFrameName } from '../art/characterSkins';

const RECOIL_DURATION_MS = 110;
const HIT_DURATION_MS = 180;

type PresentationOptions = Pick<
  CharacterAnimationInput,
  'velocityX' | 'velocityY' | 'dead' | 'quality' | 'reducedMotion' | 'reducedFlash'
>;

export type PlayerPresentationSnapshot = Readonly<{
  frame: CharacterFrameName;
  animating: boolean;
  recoil: boolean;
  hit: boolean;
}>;

export class PlayerPresentationState {
  private recoilUntilMs = 0;
  private hitUntilMs = 0;
  private frame: CharacterFrameName = 'idleA';
  private animating = false;

  triggerRecoil(nowMs: number): void {
    if (!Number.isFinite(nowMs) || nowMs < 0) return;
    this.recoilUntilMs = Math.max(this.recoilUntilMs, nowMs + RECOIL_DURATION_MS);
  }

  triggerHit(nowMs: number): void {
    if (!Number.isFinite(nowMs) || nowMs < 0) return;
    this.hitUntilMs = Math.max(this.hitUntilMs, nowMs + HIT_DURATION_MS);
  }

  update(nowMs: number, options: PresentationOptions): CharacterAnimationOutput {
    const time = Number.isFinite(nowMs) && nowMs >= 0 ? nowMs : 0;
    const output = characterAnimation({
      skin: 'marine',
      entityId: 0,
      nowMs: time,
      attackUntilMs: this.recoilUntilMs,
      hitUntilMs: this.hitUntilMs,
      ...options,
    });
    this.frame = output.frame;
    this.animating = Math.abs(options.velocityX) + Math.abs(options.velocityY) > 0.001;
    return output;
  }

  snapshot(nowMs: number): PlayerPresentationSnapshot {
    const time = Number.isFinite(nowMs) && nowMs >= 0 ? nowMs : 0;
    return Object.freeze({
      frame: this.frame,
      animating: this.animating,
      recoil: this.recoilUntilMs > time,
      hit: this.hitUntilMs > time,
    });
  }

  reset(): void {
    this.recoilUntilMs = 0;
    this.hitUntilMs = 0;
    this.frame = 'idleA';
    this.animating = false;
  }
}
