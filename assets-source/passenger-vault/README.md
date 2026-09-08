# Passenger Vault single exemplar

Incomplete room slice. One upper chamber in the far well, not a bank rollout.

`room-fit-reference.blend` preserves the rejected room-fit revision 3 as source input. Original project-authored closed chamber geometry and packed material images are retained. Optional extraction equipment is removed by the build script, not included in the runtime GLB. The original workspace source is unchanged.

Rebuild from repository root with Blender 4.0.2 and its glTF exporter:

```sh
blender -b -t 1 --python-exit-code 1 -P scripts/build-passenger-exemplar.py
```

Outputs are `public/assets/passenger-vault/exemplar.blend`, `exemplar.glb` and `geometry-audit.json`. The editable export retains named parts and packed images. The GLB batches new static supports and services by material. Native scale is 32 game units per rendering unit.

The static audit checks actual saved room ribs and vessels, support intersections against both the native lower shell and the existing runtime lower-pod envelope, and separation between circuits. Only the two named terminal runs may meet the measured existing trunk. It is not structural certification or a maintenance simulation.

Runtime replaces one fallback atomically after validation. Its selected fallback is closed and opaque. All other passengers remain the incomplete baseline and must not be mistaken for approved bank art.

## Remaining visual gate

The closed lid is visible at shipping desktop and portrait cameras, but it reads too uniformly pale. Material separation and service/support readability need another focused visual pass before replication. Lower tiers, the other bank, consoles and whole-room acceptance remain open. Do not merge this incomplete slice as a delivered room.
