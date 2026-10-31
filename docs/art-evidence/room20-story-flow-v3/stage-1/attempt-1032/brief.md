# Room20 stage1 layout proposal

Task room20-story-flow-v3, stage1, attempt1032. Local evidence only. No acceptance, publication or receipt claim. The parent owns independent review and publication.

## Layout

layout.png is a 2400 by 1600 top-down CPU diagram. Its boundary, central void, spawn and four breaches come from the actual final production template through createExpeditionGeometry, not the fallback obstacle rectangles in storyRoomTemplates.ts. The existing three-lobed platform and empty obstacle list are unchanged.

The proposed service allocations are rectangles entirely inside the existing central void:

| Allocation | X bounds | Y bounds |
| --- | --- | --- |
| Coolant header | 480 to 540 | 340 to 410 |
| Power bus | 660 to 720 | 340 to 410 |
| Restraint head | 565 to 635 | 480 to 540 |
| Axial core reservation | 570 to 630 | 365 to 465 |

These are footprint reservations, not mechanical models or new interactions. Later assemblies, plumbing, clamps and their full silhouettes must remain inside the void. Under-deck braces are deferred. No inherited unaccepted room asset is used.

The green loop shows a reversible retreat route around the reactor. Its shaded width represents a radius28 swept corridor, not a new floor material or hazard. W, N, E and S are proposed open defense positions. V1, V2 and V3 are viewing positions facing the service heads, not controls. Thin connectors join spawn, breaches and activity positions to the loop. Red dots show the production breach facing offset of 56 units. The diagram does not depict random enemy spawn spread.

The compatibility anchor remains 1060,440 in the source and CPU checks. It has no marker, beacon, sign or route endpoint label in the image. Room19 already authorized destruction. Room20 defends that sequence with no escape. Preserve SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED.

## Focused CPU checks

check-routes.mjs imports the actual production createExpeditionGeometry, canOccupyExpedition, canTraverseExpedition and clearPolygonTopology functions. A small Node loader resolves their extensionless TypeScript imports; Node strips types without replacing the helper logic.

Final execution recorded 179 passed assertions, zero failures and zero errors. Both radius16 and radius28 were checked for:

- Occupancy at spawn, compatibility anchor, each breach, each inward-offset breach point, all four defense positions and all three viewing positions.
- Every segment of the closed retreat loop in both directions.
- Connectivity from spawn to every listed anchor using a visibility graph whose edges require production traversal approval.
- Revalidation of every segment of every stored route.
- The exact connectors drawn in the PNG.

Complete service and core rectangle edges were tested inside the void polygon with the production continuous topology helper. The obstacle list and four-breach count were checked.

Negative controls correctly rejected a protruding head reservation, central-void occupancy, occupancy outside the boundary, the lower concave notch, body overlap at the void edge, a direct shortcut through the core and a shortcut across the lower notch. An injected full-height blocker broke connectivity at both radii. This blocker exists only in a test object, never in runtime source.

route-results.json contains the geometry export, allocations, exact anchors, loop, diagram connectors, computed routes and named assertions. Numbered run files preserve both executions. Run1 preceded the added diagram-connector assertions. Run2 is the final test result. There were no failed technical assertions. route-check-run-1.log and route-check-run-2.log retain stdout and Node experimental-loader warnings.

## Visual self-inspection

The actual PNG was loaded with vision. The initial version placed CENTRAL VOID across the lower void boundary. That defect was removed. The initial PNG, generator and manifest remain as layout-initial-label-overlap.png, generate-initial-label-overlap.py and source-manifest-initial.json.

The final PNG was loaded again. All three head rectangles and the core are visibly within the central dark footprint. The complete platform, closed retreat loop, spawn and all four breach symbols are readable. No escape marker appears. This is author self-inspection, not independent review.

## Provenance and scope

Read async-rollout-worker-prompt.md, map-model-production.md and production-guard.md before creation. Read the stage0 brief and generator at docs/art-evidence/room20-story-flow-v3/stage-0/attempt-1031. Current map-model-state.json routes Room20 to stage1. The delegated permit is attempt1032; no live preflight was invoked.

Live issue42 remained OPEN and draft PR85's branch was art/overload-floor-v3. Local HEAD was 43278df972ed306d623c61c51f596a5ca3357314. Local origin/main was 7a3f262886104fb024de9684958b3f85a8859f34 and was verified as an ancestor. Their diff contained only the prior stage0 evidence files. This subagent did not fetch or write Git refs; fresh-remote-base verification remains with the parent. Worktree status was clean before and after artifact generation.

Canonical references are src/game/roguelike/authoredRoomTopologies.ts lines76 to82, storyRoomTemplates.ts lines29 to35, storyRooms.ts lines21 to29, roomTemplates.ts and issue42 at https://github.com/cdb-lumen/containment/issues/42. Source, font and generator hashes are in source-manifest.json. No runtime, guard, receipt, other-room or repository file was modified.

An initial execute_code read attempt was blocked by unattended-execution policy. Ordinary read and terminal tools completed the work. No approval bypass was used.

## Reproduce

From this external attempt folder:

```sh
node --experimental-strip-types --experimental-loader ./ts-loader.mjs ./check-routes.mjs
python3 generate.py
```

Requires Node22 with native type stripping, Python3, Pillow and the recorded DejaVu fonts. The repository path is explicit in both scripts. Re-running the checker appends a numbered result and updates route-results.json. Keep command logs separately to preserve prior executions. The generator reads that result and writes layout.png and source-manifest.json. Two successive final renders produced identical PNG hashes, recorded in reproduction-check.json.

## Limits and remaining work

The checks establish the named routes and reservations against unchanged CPU geometry. They do not establish all possible free-space paths, AI routing, dynamic crowd clearance, weapon sightlines, service reach distances, rendering, shipping-zoom silhouettes, lighting, height clearance, burial, occlusion or the live ending. No GPU, detailed modeling, runtime edits, full verifier, gameplay session or deployment was performed. Actual overload lighting and the real post-authorization fatal sequence remain untested. Independent review and publication remain with the parent.
