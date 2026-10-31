# Room18 independent stage2 review

## Verdict

Rough placed-model art passes this bounded desktop review. Code acceptance needs one resource-lifetime fix before this attempt is called complete. This is not finished-art, ordinary-gameplay, HUD, mobile, or release acceptance.

I inspected both original final/native PNGs through vision, the actual changed source, final test logs, source pins and capture manifest. I did not edit source, publish, launch a browser or use GPU capture. The only review deliverable is this file.

## Visual finding

The overview reads as an uninterrupted circulation area surrounding a distinct solid reservation. The low closed lid, segmented jacket and separate east-side status housings form a coherent rough assembly. Neither the jacket nor the status rail occupies the outer route. The fitted overview shows the full envelope; the staged gameplay-camera image gives the assembly a useful actor-scale comparison. The player remains distinct from the core silhouette at the retained south-side checkpoint.

The two east-side signs visibly say PASSENGERS ALIVE and NOT ARMED / MANUAL ONLY. They do not communicate an armed overload or dead passengers. The large lid is closed, without an exposed glowing reactor. These are adequate rough-stage narrative cues. Fine material identity and final machinery detail are later work, not reasons to reject this placement.

No blocking placement defect was demonstrated in these two images. This does not establish readability from every approach. In particular, the native evidence is a controlled staged simulation with production desktop camera/composer and no DOM HUD. The overview uses a fitted camera. Enemy staging and bounded simulation are not ordinary gameplay or an integrated HUD test.

## Required code fix

**R1, medium: the two room-owned sign textures are not disposed.**

`src/render/ContainmentAnnulusBlockout.ts:45-51` allocates two CanvasTextures and marks their materials as owned, but does not attach texture cleanup. `disposeModel` in `src/render/meshParts.ts:55-58` disposes owned materials and geometry, not their texture maps. Other sign builders in `AuthoredRooms.ts`, including lines 75-77, explicitly dispose the texture on material disposal.

I reproduced this with CPU-only execution of the actual TypeScript builders transpiled in memory, a minimal canvas-context stub, Three resource disposal event listeners, and the actual `disposeModel` implementation. Result:

```json
{"textures":2,"textureDisposeEvents":0,"materialDisposeEvents":8,"geometryDisposeEvents":8}
```

The stub exercises allocation and disposal only, not rendering. The new unit test runs without `document`, so it skips both sign textures and cannot catch this defect. Add room-local owned-texture cleanup and a document-present disposal test. Do not broaden shared disposal indiscriminately because other materials can use shared textures. This is a code-completion issue, not an art rejection.

## Scope, routes and bounds

Git HEAD is `649ceb0049278e45314deaf88d8f7ec41ca03071`. The worktree has seven changed or new files. Shared production changes consist of the Room18 topology entry and one renderer import plus one dispatch branch. No camera, HUD, input, combat, story or shared navigation implementation changed.

I evaluated both old and current snapshot exports programmatically using Node vm and compared their template objects by position and ID. Each snapshot contains nineteen templates before and after. In both `awakeningTopology.test.ts.snap` and `passengerBlockout.test.ts.snap`, the only changed template is `containment-annulus`. The snapshot updates do not conceal other-room changes.

Room18 has a chamfered outer boundary and one central solid void, with no detached obstacles. The focused tests exercise the complete ring in both directions at radii 16, 28 and 30, entry/exit access, breach occupancy, central rejection and a blocked cross-core shot. The fixture records 412 legal traversal checks ending at exit distance zero. These support route credibility, not a claim of unrestricted live-play coverage.

The CPU builder check, including the document-present signs, returned renderer-unit bounds min `[1.25,-0.4375,1.25]`, max `[36.25,1.65625,26.25]`. The low mass stays inside the room envelope. Merged geometry and materials retire correctly in the disposal probe; sign textures are the exception above.

## Checks and actual commands

Workdir for repository commands was `/home/chernodubv/dev/.cron-worktrees/containment-rooms/containment-annulus-v3`.

Commands I executed include:

```text
git status --short
git diff --stat
git rev-parse HEAD
git diff -- src/game/roguelike/authoredRoomTopologies.ts src/render/AuthoredRooms.ts tests/unit/authoredTopology.test.ts
git diff -- tests/unit/__snapshots__/awakeningTopology.test.ts.snap
./node_modules/.bin/vitest run tests/ContainmentAnnulusBlockout.test.ts tests/ShipEnvironments.test.ts tests/unit/expeditionGeometry.test.ts
```

The independent focused rerun exited zero: 3 files, 32 tests passed. CPU-only Node commands also parsed and compared old/current snapshot exports and transpiled the actual builder and disposal function in memory for the resource check. Python hashlib verified all 333 runtime pins, all seven saved changed-source copies, and both image hashes with no mismatches.

I inspected, rather than reran, the final parent aggregate and build commands recorded in `final/checks.json`:

- `npm test`, exit zero. Vitest reports 81 passed files and one skipped, 763 passed tests and one skipped. Additional command stages in the log completed under the same successful aggregate command.
- `npm run build`, exit zero. Runs `tsc --noEmit && vite build`. The build has the reported large-chunk warning; this review does not attribute it to Room18.
- The recorded focused command is identical to my independent rerun and also reports 32 passed tests.

The recorded capture command was:

```text
node scripts/room-evidence.mjs --rooms=containment-annulus --gameplay-all --viewport=desktop --verify-all --out=/home/chernodubv/.hermes/workspaces/containment-art-roadmap/containment-annulus/story-flow-v3/stage-2/attempt-1023/final/native
```

It exited zero, with source unchanged during capture. Both manifest results report no browser errors, WebGL error zero and no context loss. Test totals and capture success did not determine the art verdict; the two original images did.

## Reviewed pins

Both originals are 1280 by 900 pixels.

| File | SHA-256 |
| --- | --- |
| final/native/18-containment-annulus-overview.png | `42c0b34c3f6c9e2c0a9a053d08e86c7a788dccfaac05dd4582442611128044b6` |
| final/native/18-containment-annulus-gameplay.png | `63968f947840b803eafda2eacb78cc41c1b306c91a9d0baf7b14c0a11a45a3e9` |
| src/render/ContainmentAnnulusBlockout.ts | `bd9f7068fb9d00b5d1dca877a6a92161bdf70a8ed9b15863feb54a6f07688dd5` |
| src/game/roguelike/authoredRoomTopologies.ts | `b265ba88e833c688d80e8e1fdfb447f5e912d724820f77b8ffad5e114f1c653b` |
| src/render/AuthoredRooms.ts | `9e1f942c6bb27091938e91d577da5df062705a9f019a8f1b7b7524341c37648d` |
| tests/ContainmentAnnulusBlockout.test.ts | `b389eeb9a704940a0e95ea34732ea9e853433381d5aff9ec95e5f52f78b513e9` |
| tests/unit/authoredTopology.test.ts | `8c22b3167c140cd9554aeb4c8b6ceec220a420af6c2b38b76d245a18f0d9b1f1` |
| tests/unit/__snapshots__/awakeningTopology.test.ts.snap | `9a2bb3069a4c16888bb95b6449ad0f3cf5426e196e544f8787b1a6a460944e17` |
| tests/unit/__snapshots__/passengerBlockout.test.ts.snap | `84ce6a45b0141bdf59b258393034d43f37074e0f3c6828046d05e5d93acef182` |

Any source change after these pins requires fresh code verification. A texture-lifetime-only correction need not be mistaken for a new visual design verdict.
