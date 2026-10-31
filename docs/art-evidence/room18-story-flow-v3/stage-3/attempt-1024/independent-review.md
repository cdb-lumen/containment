# Room18 stage3 independent review

## Verdict

PASS for bounded stage3 room visuals, attempt1024. The shielded central assembly, ceramic versus metal grouping, surrounding circulation ring and alive/unarmed story read in the actual candidate images. This is not final model acceptance, overall gameplay validation, human acceptance or release approval.

I loaded and visually inspected all four original PNGs listed below through the vision tool. I read map-model-production.md, the complete current room renderer, the focused room test, and the working-tree diff. No source edits, GPU jobs, browser captures or Git commits were made for this review.

## Pixel findings

- Shielded annulus passes. The candidate replaces the stage2 blank gray disk and disconnected-looking rectangular rim pieces with a closed, pale segmented roof, a central capped hatch and a continuous dark metal outer band. The thin near-side white courses give the jacket visible thickness. There is no exposed luminous reactor or open pit in these views.
- Materials pass at room scale. Broad pale matte tiles contrast with the darker blue-gray rim and hatch border. Dark backing remains visible in the roof joints. Compared with stage2's nearly uniform gray, these large material groups are much easier to separate. The metal reads mainly through color, bands and edge treatment, not a strong specular highlight. These pixels do not establish final material polish.
- Ring composition passes. The new light octagonal circulation finish makes the route around the dark central reservation legible in the whole-room overview. The central assembly remains the focal point. The outer floor and low perimeter panels frame it without filling the ring with equipment. The desktop view retains clear central forms even with actors at the near edge.
- Story passes. In the desktop original, the east-side displays visibly read PASSENGERS ALIVE and NOT ARMED / MANUAL ONLY. Their teal and amber housings remain separate. No countdown or armed-core treatment contradicts them. Alive/unarmed describes the passenger and overload story, not an unarmed player. These static signs do not prove runtime authorization behavior.

The baseline comparison used stage2/attempt-1023/verified/native, not the earlier unverified variants. Stage3 makes a clear room-scale change rather than relying on invisible detail or metadata.

## Defects and limits

No blocking defect found for this stage.

1. The radial feet and small service tabs largely disappear into the dark central plinth at normal viewing size. The main enclosure reads, but its support and service construction remain weak. Treat this as a model-iteration concern, not accepted final assembly detail.
2. The roof is still a very regular radial pattern. The hatch and segmented jacket make it read as a sealed machine, but individual panels and the two status housings remain simple forms. Final model quality is not established by this pass.
3. The new floor ring has fine repeating screen-space texture and thin joints. Both originals retain a readable broad ring, so this is not a static composition failure. Shimmer or temporal stability was not tested.
4. The focused floor ray test samples a grid and excludes a rectangular region around the core rather than checking the exact walkable polygon everywhere. It is useful bounded evidence, not exhaustive collision/render agreement. Roof tests sample panel interiors, not every seam or side face.

The source pins label capture as controlled staged simulation with production desktop camera/composer and no DOM HUD, with a fitted overview camera. The gameplay filename is not evidence of ordinary live gameplay. HUD and mobile visibility are not gates under the supplied contract. I did not validate live traversal, combat, performance, authorization interactions or full gameplay survival.

## Code review and actual CPU checks

The working diff contains only src/render/ContainmentAnnulusBlockout.ts and tests/ContainmentAnnulusBlockout.test.ts. The renderer adds flush circulation finishes, segmented roof and jacket geometry, material separation and low perimeter cassettes. It does not change topology, shared camera, lighting, AI, navigation or story logic. Existing disposal handling remains and is exercised by the focused tests. New source geometry uses Three extrusion and cylinder construction rather than a custom deformed shell.

Executed from /home/chernodubv/dev/.cron-worktrees/containment-rooms/containment-annulus-v3:

```text
npx vitest run tests/ContainmentAnnulusBlockout.test.ts tests/unit/authoredTopology.test.ts
Test Files  2 passed (2)
Tests       13 passed (13)
Duration    869ms
Exit code   0
```

This run covers the room's fixed core and boundary, both ring directions, entry/exit connections and selected occupiable points at radii 16, 28 and 30, a blocked shot across the core, resource disposal including sign textures, sampled flush circulation surfaces, ceramic roof samples, lower front jacket and the canonical living-passenger/unarmed story. Passing tests do not substitute for the pixel findings above.

`git diff --check` also passed with no output. I did not independently rerun the full suite or build and make no new claim about those results.

## Exact evidence pins

Base HEAD read from Git was c4f8f8857743b1faf89d0eee68a85e157da56a1f. The candidate includes the dirty diff and must not be identified by HEAD alone.

All hashes below are SHA-256 computed directly from local file bytes during this review. All four originals are 1280 by 900 pixels. Image paths below are relative to containment-annulus/story-flow-v3.

| Original | SHA-256 |
| --- | --- |
| stage-3/attempt-1024/native/18-containment-annulus-gameplay.png | 9cc989d5dcdd8c6bb310a7e1f18daa06f6a5e50816117e3cefe01b9d7cca7c24 |
| stage-3/attempt-1024/native/18-containment-annulus-overview.png | db039c4f3b839abb1893a65ff36c8e937af66fbc59ba66e3e46085bbc5a10c12 |
| stage-2/attempt-1023/verified/native/18-containment-annulus-gameplay.png | 2f66e566b0560b78c51104c3cc0b21ba3a439c9a6af4d64e2d208cc8b28584a3 |
| stage-2/attempt-1023/verified/native/18-containment-annulus-overview.png | 42c0b34c3f6c9e2c0a9a053d08e86c7a788dccfaac05dd4582442611128044b6 |

| Candidate file | SHA-256 |
| --- | --- |
| src/render/ContainmentAnnulusBlockout.ts | 347238e7e5ae5c48e0cb9180e28500e9971638421e6b0290b1dd6b890a6dd448 |
| tests/ContainmentAnnulusBlockout.test.ts | c0a86978038913e54f104c7051d02b5a7a7b46c45fed95999a910bd31b83ec47 |
| attempt-1024/tracked-source.patch | f099affb3b93eacac5810b59584ac89645622fff539fceb6155e38cd12228222 |

Both changed files match source-pins.json and their retained source snapshots byte-for-byte by SHA-256. Comparing every entry in runtime_file_sha256 with the worktree returned no mismatches. The final Git status still showed only the same two writer-owned modified files. This report is the only file created by this independent review.
