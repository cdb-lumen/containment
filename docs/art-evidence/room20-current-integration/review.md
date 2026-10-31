# Room20 current-main integration and model review

Reviewed `dc41de9df29b8049cc3fb4960a07745e9f2cc74c` in `/workspace/containment-room20-review`, relative to main `4cb98c8` and original candidate `12e7607`. Read AGENTS.md. No renderer, source edits or commit by reviewer.

## P2 — advertised restraint-to-core attachment has a physical gap

`src/render/OverloadDraft.ts:90–91` says the vertical clevis bolts the elevated ram to the lower core frame. It does not touch that frame. Clevis steel occupies z454..462,y−24..24; its ceramic top occupies z453..463,y21..27. Nearby core-frame rails end nearz443–444; the broader lower core base reachesz463 only aty−42..−34, below the clevis.

Independent production-model diagnostic `/workspace/check-room20-ram.mjs` instantiates both groups through CPU Vite SSR. It compares each actual mesh's world-space bounding box, not aggregate group extents: **zero intersecting mesh-box pairs** between `restraint-ram` and `induction-core`. Closest boxes are still8.199453353881836 game units apart. Because even enclosing boxes are disjoint, this proves no direct mesh contact; it is not a false-positive intersection caused by rotated-member bounds. Raw result `/workspace/room20-ram-diagnostic.json` includes the nearest bounds (with a Vite startup line preceding JSON).

The ram does connect to the restraint head; this is not a claim the entire actuator floats. The defect is its missing claimed core attachment. Add a contained bracket/load path from actual core frame to clevis, then a red/green test of frame→bracket→clevis→ram contacts using real geometry, not only object names or overall ram min/max. Keep the authoritative void, head reservations and walking lanes unchanged. This defect is inherited byte-for-byte from12e7607, not introduced by the merge; prior bounded staged review does not waive it.

## Integration and ownership

`OverloadDraft.ts`, `OverloadShell.ts` and both dedicated tests are byte-identical to original12e7607. Against4cb98c8 the runtime change is only the two room model modules and AuthoredRooms reactor construction: old repeating radial clamps are replaced by distinct heads and shell finish. The merge retains Relay Racks import/dispatch; no game/story topology, main/input/HUD/camera, enemy logic or desktop gate changes occur in this delta.

The raw heads remain within the convex existing void; shell thermal apron is outside that void and within the room boundary. Existing dedicated tests verify real head vertices, reservation bounds, foundation depth, apron vertices and flush finish. Room topology, four breaches and compatibility exit remain unchanged. The compatibility exit does not establish an escape from the finale.

Batching clones/transforms raw geometry, retires each raw geometry, groups by owned material, and marks intermediates for later bake retirement. Tests check triangle/bounds parity through both stages and exactly-once resource disposal. Materials are room-owned and emitted core intensity remains static/quiet; this diff does not implement or alter sequence-driven overload emission. Named role/aggregate-bound tests do not establish every mechanical joint, as the P2 demonstrates.

Independent focused command:

```sh
npx vitest run src/render/OverloadDraft.test.ts src/render/OverloadShell.test.ts tests/StoryRoute.test.ts
```

**16 tests passed**, exit0, `/workspace/room20-independent-focused.log`. These tests did not detect the direct core attachment gap and therefore do not clear it.

Ordinary native finale combat, the explicit fatal authorization/end sequence, threat/telegraph readability around raised machinery, final-source video, required desktop verification and human art acceptance remain pending/separate. No gameplay/end-state acceptance, deployment, delivery or formal approval follows from this integration review. Later shared HUD integration also requires relevant validation.

## Follow-up: clevis P2 resolved by contained bracket

Rechecked the uncommitted correction on dc41de9. The two new steel boxes form a real direct chain: both core posts→crossbar→link→clevis→ram. For these axis-aligned boxes the exact intersections, in game units, are:

- Each post/crossbar: 5×12×6 shared volume.
- Crossbar/link: 18×12×6 shared volume.
- Link/clevis: 18×10×6 shared volume.

The existing ram enters the clevis at z455..462 around x600,y20. No rotated-member AABB overlap is used to assert these box contacts. The new test starts with the historical impossible-contact control (parent RED log `/workspace/room20-clevis-red.log`), then identifies both actual posts and checks greater-than-one-unit contact on all three box-chain edges, plus original void containment. Existing tests and bounds/material/disposal assertions are retained.

Independent old-versus-current instantiated geometry comparison `/workspace/room20-clevis-fidelity.json` confirms identical whole-model min/max bounds and the same six material identities/names; only24triangles are added (11,868→11,892). The new boxes reuse the existing owned steel material and normal raw-geometry allocation/batching path. Existing tests still verify both-stage geometry retirement and exactly-once final disposal. The ram subgroup expands toward the core intentionally; the whole model and authoritative collision do not expand.

Independent focused rerun of OverloadDraft, OverloadShell and StoryRoute: **17 tests passed**, exit0; `/workspace/room20-clevis-independent-green.log`. The rerun diagnostic `/workspace/room20-ram-fixed-diagnostic.json` also records the former zero-contact condition is gone; the specific box-chain evidence above establishes actual connection rather than relying on that coarse count.

Original P2/RED evidence remains preserved; this P2 is now **resolved**. No remaining blocking code finding in the correction. Native visibility of the bracket and the previously stated ordinary finale/end-sequence acceptance remain pending; this is not art or gameplay approval.
