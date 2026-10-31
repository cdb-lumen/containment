# Room18 current-main integration review

No blocking integration/code finding at `0cbc7df692254c8a3ee2ac26ec2d98477dee0d42` in `/workspace/containment-room18-review`, compared with main `0bd357c9d4215ea1978afbd226ea0e87b08eb7f6` and original candidate `399872f`. Read AGENTS.md. No renderer, runtime edits or commit by reviewer.

The runtime/test delta versus main is scoped to the annulus: one authored topology override, model, AuthoredRooms import/dispatch, dedicated tests and two topology snapshots. The renderer resolves annulus before the generic authored gate and preserves Relay Racks dispatch and all other main behavior. Shared gameplay, input, HUD, camera, enemy movement and desktop gates are not replaced by the old branch.

`ContainmentAnnulusBlockout.ts` is byte-identical to original399872f. The dedicated test differs only by adding radius38 to existing16/28/30 route checks, without removing coordinates or legal/blocked controls. Authored-topology conflict resolution preserves all five main rooms/probes, adds annulus as the sixth, and retains Atrium's separately documented radius38 limitation. Canonical annulus spawn/exit/breaches and living-passenger/unarmed story remain.

The model derives deck cutout/plinth from the same boundary/core data as collision. The low front jacket, recessed inspection/status assemblies and flush circulation ring remain existing room-local construction. Temporary geometry is flattened then retired; final merged geometries and owned materials are disposed by the normal root lifecycle. Canvas sign materials each retire their own texture. Existing tests exercise document-present sign disposal, actual surface rays, raised-construction containment, broad floor clearance, owned resource retirement and clockwise/counterclockwise route traversal. The non-document eight-mesh assertion excludes two browser sign materials; do not present that CPU count as the complete browser draw count.

Independent focused command:

```sh
npx vitest run tests/ContainmentAnnulusBlockout.test.ts tests/unit/authoredTopology.test.ts
```

**15 tests passed**, exit0. Log `/workspace/room18-independent-focused.log`.

Limits: original staged art acceptance is bounded historical evidence, not current-main ordinary play. Fresh native annular traversal in both directions with enemies/pickups, readability of living-passenger/not-armed instruments, HUD clearance, exact-source video and full required desktop verification remain separate acceptance requirements. No human acceptance, final authorization/overload behavior, deployment or delivery is inferred. The new shared HUD coordinator is not part of this reviewed base; later integration must preserve model parity and receive relevant validation.
