# Weapon alignment audit — pass 5

Read-only inspection of production GLBs, original MD3s available in this workspace, and current render code. No Site checkout files were changed. Node geometry inspection stripped only texture references in memory and used Three.js GLTFLoader, AnimationMixer and deformed skin vertices. Intermediate scripts/PNGs are in the parent scratch folder.

## Main result

The guns are too large for the authored hand poses because `tools/assets/convert_weapons.py` independently normalizes each native gun length to an arbitrary world length. The right-hand `tag_weapon` attachment itself is correctly oriented and correctly follows the skeleton. Preserve its origin and rotation; scale the model inside it. The rifle and shotgun stocks currently project well behind the shoulder, and the pistol is 0.9m long against a 2.05m marine. The correction below notably improves all three and preserves the intended larger plasma/rocket silhouettes.

A coherent geometric fit is native MD3 units × `marineAssetScale / 4`, i.e. 0.0393745606 world units per MD3 unit for this marine. The /4 relationship is inferred from authored grip geometry and inspected fit, **not established by a source engine setting** (`character.cfg` says modelScale 1). Treat it as reviewed fit metadata. It is substantially better grounded than five arbitrary independent target lengths.

## Measurements and proposed zero-offset scales

Dimensions are current GLB local X width × Y height × Z length, before socket transform. All models have +Z forward. Suggested scale applies to `asset.root` inside `weaponModel`, leaving weapon/socket group scale 1. Translation (0,0,0), rotation identity, no mirroring.

| Gun | Native MD3 length | Current GLB dimensions | Actual muzzle local XYZ | Proposed multiplier | Fitted length |
|---|---:|---|---|---:|---:|
| pistol | 14.890625 | 0.1945 × 0.4646 × 0.9000 | (-0.00549, 0.00581, 0.50366) | 0.651458 | 0.5863 |
| rifle | 24.640625 | 0.1299 × 0.6392 × 1.6000 | (0.00145, 0.05943, 0.72376) | 0.606384 | 0.9702 |
| shotgun | 28.906250 | 0.1901 × 0.6253 × 1.7500 | (0.00136, 0.09744, 0.87051) | 0.650383 | 1.1382 |
| plasma | 35.343750 | 0.1991 × 0.5471 × 1.6500 | (0.00105, 0.09704, 0.94372) | 0.843421 | 1.3916 |
| rocket | 38.531250 | 0.3080 × 0.5051 × 1.8000 | (-0.00425, 0.13758, 0.71391) | 0.842862 | 1.5172 |

Implementation formula: `fitScale = marineScale * nativeLength / (4 * convertedLength)`. For fixed 2.05m marine, rounded `[.651458, .606384, .650383, .843421, .842862]` by pistol/rifle/shotgun/plasma/rocket. Multiply the entire gun asset, including its authored muzzle node, so muzzle flash automatically follows the corrected barrel. Do not multiply by the socket's 0.157498 scale directly; that would shrink already converted world-sized guns a second time.

Current geometry views: `/workspace/scratch/37ec67d68ce3/weapons-current.png` and `/workspace/scratch/37ec67d68ce3/weapons-grips.png`. Proposed geometry view: `/workspace/scratch/37ec67d68ce3/weapons-fit.png`. Orange is gun geometry, translucent grey the actual deformed marine mesh; red markers are wrist joints. They are exact orthographic geometry inspection, not textured runtime screenshots. Fitted image uses nearly identical rounded numbers to the table.

## Socket/hand evidence

Marine scaling is 0.15749824; normalized height is exactly 2.05. Runtime uses shotgun pose for initial normalization. My five-pose inspection normalizes each pose separately, changing displayed model centering slightly but not any socket-local measurements or fit conclusions.

All five right wrists in unscaled weapon/socket local coordinates are approximately `(-.04166, -.08865, -.22966)`. Rocket differs only 1.6mm in Y. Right middle knuckle is `(-.04525,-.07965,-.07876)` and distal middle-finger joint is `(.02624,-.0867,-.0609)` for all poses. This shared grip convention is precisely why origin-preserving source-unit scaling is preferable to bounding-box recentering.

| Gun | Left wrist XYZ in socket space | Left middle knuckle XYZ |
|---|---|---|
| pistol | (.09612,-.19275,-.17731) | (-.05372,-.19487,-.12113) |
| rifle | (.13862,-.13712,.15344) | (.03123,-.14145,.27201) |
| shotgun | (.10905,-.08073,.24331) | (-.02414,-.06045,.32970) |
| plasma | (.12568,-.15435,.27514) | (-.02240,-.16106,.33545) |
| rocket | (.15204,-.02624,.28931) | (.01823,-.02293,.37703) |

GLTFLoader sanitizes names: authored `hand.R` becomes runtime `handR`, and `finger_middle.01.R` becomes `finger_middle01R`. Any new grip tests or corrections must use loaded names.

Socket right-handedness and forward axis are correct; do not add a 90°/180° flip or negative scale. Its unit local +Z transformed to actor local coordinates is:

| Gun | Barrel forward XYZ | Horizontal aim error |
|---|---|---:|
| pistol | (-.09915,.03395,.99449) | -5.69° |
| rifle | (.05220,.03395,.99806) | +2.99° |
| shotgun | (.13250,.03145,.99068) | +7.62° |
| plasma | (.04415,.03145,.99853) | +2.53° |
| rocket | (.06445,.02600,.99758) | +3.70° |

The barrel therefore does not exactly match ballistic horizontal aim, despite both broadly facing forward. If correcting this, yaw the shared upper pose by the inverse error before extracting the socket, so both hands and gun follow. Rotating only gun geometry would damage hand contact. The 1.5–1.95° upward pitch is harmless for top-down horizontal firing unless exact barrel-to-tracer alignment is required.

## Recoil/reload detachment

`models.ts` extracts the correct animated socket transform, then translates/rotates the entire weapon independently from static hands. Maximum recoil creates a real hand-to-grip displacement of pistol 7.5cm, rifle 6cm, shotgun 12cm, plasma 4.5cm, rocket 10cm. The `slide` group is just a whole-asset wrapper, not a separately authored mechanical slide.

At half reload, two -.28rad X/Z rotations combine to ~22.65° while hands retain their paused pose. This visibly swings the weapon out of both hands. Corrections should prioritize attachment: remove whole-weapon recoil/reload offsets, or apply bounded additive movement to a shared upper-body parent before socket extraction and then restore it before the next mixer update. For a modest effect, recoil the shared upper body by only 1–3cm / a few degrees. Avoid translating the whole marine including planted feet. If no authored reload/arm animation is being implemented, a stable hold during the reload UI is preferable to an independently rotating gun.

Pose selection itself is correct: pistol→blaster_delta, rifle→rifle_delta, shotgun→shotgun_delta, plasma→prifle_delta, rocket→lcannon_delta. Bone-mask handling applies weapon poses to the ribs subtree and preserves lower locomotion. `equip()` plays the new pose but the new socket is not sampled until `animate()`; test switching then firing in the same frame if that path can occur.

## Projectile visual consistency

`WEAPON_APPEARANCE.muzzle` is hardcoded at .64/1.19/1.2/.98/1.22 and is not the authored muzzle XYZ listed above. It is used for player projectile reveal distance `(muzzle + .37)*32` in both `AttackEffects.ts:134` and legacy `DepthRenderer.ts:176`. Actual flashes already originate from `player.muzzleWorld()`.

After changing gun scale, replace the reveal heuristic with actual muzzle distance from player along the firing direction (or coherent per-pose measured data), otherwise tracers still first appear too far forward. Bullets are simulated from player center at a fixed visual Y while gun muzzle height varies (~1.4–1.8m); avoid falsely claiming the effect is geometrically aligned until runtime screenshots verify this transition.

## Focused validation

1. Extend real-production-GLB model tests, not primitive mock geometry: all five scaled muzzle nodes stay at the barrel and all five visible model sizes match reviewed physical ranges (roughly .59/.97/1.14/1.39/1.52m lengths).
2. Check the matrix from the source tag to the unscaled weapon attachment stays identity at idle, during locomotion, at maximum recoil and at half reload. This directly catches the current detachment bug; allow only deliberate shared-rig animation.
3. For all five guns and several aim headings, compare horizontal barrel direction to the intended shot direction if aim correction is implemented. Current test merely checks muzzle lies in a positive quadrant.
4. Capture actual in-game closeups of idle/forward/strafe/backward, full recoil, half reload and weapon switch, particularly side and oblique view. The existing `PresentationUpgrade.test.ts` does not check grip, fit, reload, recoil or real barrel direction, so passing it alone does not answer the user's complaint.
5. Verify tracer reveal and muzzle flash from the fitted asset in gameplay. Existing `gun.muzzle.position.z > .4` tests local node values and won't notice a parent scale; assertions should use the weapon-root-local transformed point instead.
