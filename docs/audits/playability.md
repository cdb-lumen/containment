# Playability audit — Containment Depth

Read-only source and production-asset audit. No checkout edits, Sites calls, browser interactions, or new tests. Findings below distinguish confirmed implementation behavior from browser-dependent layout risks.

## Highest-priority changes

1. Fix directional marine locomotion using the existing `run_back` clip and actual movement velocity, while preserving independent upper-body aim.
2. Fix mobile HUD stacking: the joystick touch region can cover the left weapon buttons. Verify with actual touch hit testing.
3. Put medkit/grenade stock and grenade cooldown in a HUD shared by desktop and touch.
4. Preserve the final kill's loot and other useful drops at room clear. Current instant reward transition makes them unreachable.
5. Add explicit encounter/boss objectives, visible aim feedback, and clear invalid-action feedback.
6. Give death and room clear a short, readable visual beat before presenting their panels.

## Directional locomotion: confirmed cause and concrete solution

`DepthGame.player` stores only `moving:boolean`. In `DepthGame.update` it computes collision-resolved displacement but discards direction and speed. `DepthRenderer.render` passes `p.moving ? 1 : 0`. `models.ts`'s `rig.step` chooses `run`/`walk` for any moving actor; `marine.animate` rotates the entire actor toward aim. Therefore walking backward or strafing while aiming always plays a forward run in the aim direction. This is exactly the reported issue.

Production `marine.glb` clips, inspected directly from the GLB JSON:

| Clip | Duration |
| --- | ---: |
| `run` | 0.750 s |
| `run_back` | 0.750 s |
| `walk` | 1.167 s |
| `stand` | 3.333 s |
| `idle` | 6.667 s |
| `attack` | 0.267 s |
| weapon `*_delta` poses | 0.017 s each |

No strafe or death clips are present. Weapon poses exist for every weapon mapping currently used. Rig hierarchy is `origin → hips → spine → ribs`; thighs descend from hips, arms/head/weapon socket descend from ribs. There are also control/ankle nodes directly under origin, so blindly rotating only thigh bones or hips is insufficient for a robust whole-gait solution.

Recommended implementation:

- Retain `velocityX = (resolvedX - oldX) / dt` and `velocityY = (resolvedY - oldY) / dt`, zeroing them on stop, pause, room reset, and death. Use this actual velocity rather than key/joystick intent so legs stop at walls and follow sliding displacement.
- Pass a locomotion object into marine animation (`velocityX`, `velocityY`, `aim`, `dt`) or add an optional player-specific method; keep alien animation callers stable.
- Project velocity into aim space: `forward = vx*cos(aim) + vy*sin(aim)` and `lateral = -vx*sin(aim) + vy*cos(aim)`. Retain the last stable movement heading near zero speed.
- For forward movement use `run`; for backpedaling use authored `run_back`, never a negative time scale of `run`. The two run clips have identical duration, so retain a common normalized gait phase while changing weights. Add hysteresis around the sideways boundary so minor thumb/aim jitter cannot switch forward/back every frame. Fade over roughly 100–150 ms.
- Orient the lower rig toward movement for forward gait, or movement plus π for backward gait. This produces actual lateral travel using the current clips. Smooth the yaw through the shortest angle and distribute upper-body compensation through spine/ribs so chest, head, arms and weapon remain aligned to aim. Compute compensation after the animation mixer updates, from that frame's fresh pose, before sampling `tag_weapon`. Do not accumulate a correction every frame or assume a local Y rotation without accounting for the imported Z-up-to-Y-up transform.
- Clamp the pelvis/chest twist or use a brief turn adjustment around full side travel. True left/right strafe clips would improve this further, but importing them is optional; the existing forward/back plus lower-body yaw solves the reported mismatch with current assets.
- Blend idle/run by measured speed and scale cadence with speed, especially for partial thumb deflection. A barely deflected stick currently plays full-rate running because `moving` is binary.
- Preserve muzzle alignment and current weapon-specific poses. The socket needs updating after lower-body/upper-body compensation; simply rotating the body while leaving the weapon unchanged can disconnect hands from the gun.

Meaningful acceptance checks: hold aim east and move in eight directions; hold travel fixed and rotate aim through a full circle; stop against cover; move along a wall diagonally; use low thumb deflection; reverse abruptly; reload and switch weapons while backpedaling. Look for correct foot travel, stable forward/back transitions, no cumulative torso twist, and a barrel that still points where projectiles travel.

## Input and mobile controls

**Working foundations:** move and fire own different pointer IDs; both use pointer capture and handle pointerup, pointercancel, and lost capture. Auxiliary reload/heal/grenade handlers do not release the movement pointer. Blur and document hiding reset inputs and pause play; resize resets inputs. `tests/InputController.test.ts` checks pointer ownership with mocked events, but it does not test actual browser hit targets or CSS stacking.

**High-confidence mobile layout risk:** `#weapon-picker` is before `#touch-controls` in the DOM. On coarse pointers, `#move-zone` is absolutely positioned over the left 48% of the bottom 53%, while the weapon picker is centered at the bottom. No z-index lifts the picker above that later touch region. The left weapon buttons lie within the joystick region and can initiate movement instead of switching weapons. Give the picker an explicit higher stacking level or exclude its band from the movement region. Verify all five buttons with a finger while another pointer holds movement.

**Confirmed desktop omission:** medkit and grenade counts appear only in buttons inside `#touch-controls`, which is hidden for desktop. Desktop hints advertise E/G but show neither remaining stock nor grenade cooldown. Show compact shared consumable counters; keep touch buttons as controls, not the sole status display.

**Manual-aim feedback:** touch dragging over 20 pixels changes aim directly, but there is no right-stick knob, aim-direction cue, or assisted-target marker. Returning within 20 pixels immediately resumes auto-targeting. Add a clear aim vector/reticle and a small manual/assisted cue, with a slightly hysteretic dead zone. Nearest-target auto aim switches instantly as distances cross; retain a valid target for a small hysteresis margin to avoid involuntary spinning while kiting.

**Action feedback:** reload, medkit, and grenade handlers ignore success/failure. Touch controls remain visually available when resources are empty, health is full, or grenade cooldown is active. Readiness styling plus a quiet invalid-action cue prevents apparently ignored presses. Preserve rapid accessibility to the pistol when other weapons are empty. Its unlimited reserve is the fallback, so surface that clearly in the picker.

**Small input cleanups:** `reset()` clears pointer IDs but does not release existing captures or reset the knob transform. New joystick presses can briefly show the old knob offset. Clear its transform and release owned captures when safe. Global keydown prevents Space even on focused reward/menu buttons; scope gameplay key suppression to active gameplay and let focused UI controls retain normal activation behavior.

## Combat feedback and readable objectives

- `main.ts` shows sector/name, but no encounter phase, remaining hostiles, or wave progression. The director already exposes `remaining`, `totalSpawns`, and phase. Show one concise objective such as “Contain the breach,” then a count once spawning finishes; this makes the last enemy and room completion legible.
- The Queen's exposure is **timed**, not unlocked by nest kills: `armored → nest-spawn → vulnerable`. Correct instruction is “Survive armor; destroy nests to reduce reinforcements; attack while exposed.” Current HUD says only ARMORED/EXPOSED. Add a phase/time cue and nest health or hit feedback. Do not say destroying nests exposes the Queen unless changing the mechanic.
- Standard contact damage is applied in the same event that starts the attack animation. The visual swing therefore cannot warn the player before damage. For brutes especially, separate windup from impact with a brief readable tell and cancel/whiff rules; retain quick contact behavior for small swarm creatures if intentional. Damage flash currently gives no attack direction.
- Spitters' model facing follows their navigation target; when standing within desired range the target may be their own position, so animation can face east while shooting toward the player. Use attack-facing during firing and velocity-facing while moving, rather than blindly facing a zero-length waypoint vector.
- Weapon reload progress exists and movement continues while reloading. Auto-reload starts immediately when the last held-fire shot empties the weapon. However `reloadIfEmpty()` is called only inside `if(input.fire)`, despite its comment promising operation after fire lifts. Switching to an already empty weapon without firing leaves it empty until R/fire. Either make automatic behavior consistent or show an explicit reload prompt.
- Touch action circles have no visible text names; icons plus tiny counts require learning. The first-run screen has no controls unless Settings is opened. A short first-room hint and small labels on reload/heal/grenade would make the game playable without exploring settings first.

## Loot, progression, death and resume

**Lost final loot:** `clearRoom()` immediately sets `reward`, which stops movement/pickup updates. Drops remain rendered behind the panel but can no longer be collected; `enterRoom()` clears them. The final enemy's drop normally receives at most one collection update. Sweep useful remaining pickups into resources before constructing the clear/checkpoint snapshot, or add a brief safe loot stage with an explicit continue action. A clear receipt can report collected health/ammo without making the player search an empty room.

**Unproductive drops:** 45% of pickup-kind weight is credits, but this expedition has no spending UI, credits HUD, or credits result. Replace credit drops with useful existing supplies or deliberately surface a score; a shop is unnecessary scope expansion. Ammo pickups are applied only to the equipped weapon, so collecting them while on the infinite-reserve pistol gives no reserve benefit. Pick a finite-ammo weapon that needs supplies or distribute a small typed bundle. Health/armor/grenades can likewise be consumed at cap with no benefit; avoid presenting empty pickups as rewards.

**Death:** `DepthRenderer` immediately tilts the live marine root by 1.4 radians, but `marine.animate` still runs idle animation. Enemies also continue animating while gameplay is frozen because renderer dt is nonzero in `dead`. A short frozen/baked impact pose plus controlled collapse, followed by the result panel, is sufficient with current assets; no death clip exists. Use an explicit result transition timer rather than extending combat after death. Room-clear can receive a similarly short success beat, with safe reset of held inputs before reward cards become clickable.

**Results:** current panels report rooms and mutation count only, although kills and elapsed time already exist. A concise time/kills/build summary provides a reason to replay. If these become visible, persist them in checkpoints; `continueRun` currently restores resources/build/phase but not kills or elapsed time.

**Resume:** checkpoints intentionally exist at reward/route boundaries, death clears them, and menu explains that leaving a fight returns to the last cleared room. Keep this honest. There is no checkpoint before the first room clears, and storage failure is silent; show “Progress unavailable” only if saving actually fails, and avoid implying first-room progress is saved. Pause freezes game state and rendering for active pause/reward/route. New runs and continue reset controls; ordinary resume currently relies on the pause-time reset.

## Readability and verification limits

Reward cards already have benefit and tradeoff copy, responsive single-column portrait layout, and scrollable short-screen panels. Keep those foundations. Several HUD labels are 8–10 px, landscape cards shrink body/tradeoff text to 11/9 px, and important values such as consumables are absent on desktop. Prioritize action/resource readability over decorative microtext. Also verify boss HUD against room/vitals labels in narrow landscape and picker overlap with thumb controls.

No browser-based claim of actual touch reliability, text fit, or visual animation quality is made here. The existing source tests validate domain transitions and mocked pointer ownership, not a realistic six-room skill-based win: the completion test kills enemies through direct damage calls. After implementing the priority changes, perform one desktop and one phone-size run with genuine input, including a pause during reload, tab-hide/resume, resource reward, mutation reward, route branch, death/restart, checkpoint continue, and Queen exposure cycle.
