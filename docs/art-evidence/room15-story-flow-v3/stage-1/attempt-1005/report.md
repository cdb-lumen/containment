# Room15 stage1 layout draft

Local draft for parent and independent review. No publication or stage acceptance is claimed. Author and visual inspector: delegated Room15 layout worker, attempt1005.

## Layout decision

Retain the exact production room, 1200 by 880 units, and all four obstacle rectangles. Entry remains 100,440 and exit 1100,440. The four breach anchors and their actual 56-unit inward spawn offsets remain unchanged. There is no authored polygon boundary or void override for this room.

The northwest 190 by 140 island holds the proposed lathe and rear-mounted manipulator as one construction station. Its inner reservation is 174 by 124 units. The shared workpiece, broken guard, resin, tendon braces and insulation must stay inside that solid. This is a footprint allocation, not proof that a finished articulated machine fits or reads in the shipping camera. The plan does not approve arm reach, height or mechanical detail.

The tall northeast island becomes the retained fabrication gantry, approached from the west. The southwest island holds an assembly fixture bench facing north. The southeast island holds a tool and stock cabinet, also accessed from the north. These are proposed equipment roles, not new interactions. No prior unaccepted kit is imported.

Keep the central cross-aisle and outer return lanes open. Four breach approaches converge on the central floor through the existing west and east lanes. The activity circles are radius28 standing reservations, not collision or objectives. Blue bands are 56-unit route envelopes, not floor paint. Entry and exit symbols identify existing anchors, not newly cut boundary openings. Selective growth stays on equipment rather than occupying walkable corners or creating hazards.

## Actual focused checks

Run from the supplied worktree:

```sh
python3 docs/art-evidence/room15-story-flow-v3/stage-1/attempt-1005/reproduce.py
```

The runner executes `validate-layout.mjs` with the local `ts-loader.mjs`, then renders twice with `render_layout.py`. It imports the unchanged production `ROOM_TEMPLATES`, `createExpeditionGeometry`, `canOccupyExpedition`, `canTraverseExpedition` and `FacilityNavigation`. The loader uses the existing primary checkout's TypeScript package as a read-only dependency. No install, node_modules symlink or runtime edit is needed.

- Eleven focused assertions pass, zero failures and errors.
- At radius16 and radius28, all 14 anchor occupancy checks and all 24 route segments pass for each radius. Anchors include entry, exit, four breaches, four runtime-offset spawns and four proposed activity centers.
- Production navigation reports exit, all four breaches and all four activity centers reachable from entry. This is the existing navigation API result, not a per-radius traversal proof.
- Every proposed equipment envelope fits strictly inside its assigned original rectangle.
- Four canonical source hashes match the stage0 source pins and the guard's recorded baseline.
- HEAD remains `89725b920eca96e375f34abcef5d7e72ed631495`, with base `7a3f262886104fb024de9684958b3f85a8859f34` as ancestor. Runtime source is unchanged. All worktree writes stay in this attempt directory. Git whitespace check passes.
- The original PNG decodes at 1800 by 1280, stays below the publication size limit and regenerates byte-identically. Exact bytes and SHA256 are in `verification.json`. Source hashes and font pin are in `source-pins.json`. `artifact-manifest.json` hashes the deliverables.

## Stronger diagnostics and limits

The 20-unit sampled graph uses production occupancy for candidate nodes and production swept traversal for every edge. At radius16 it reaches all 2073 sampled legal points. At radius28 it reaches 1860 of 1868. The eight excluded corner points remain in `test-results.json` and are marked as pink crosses on the plan. Circular occupancy admits these points while conservative rectangle-expanded sweeps reject them. They were not filtered away to manufacture full connectivity. Required anchors and authored routes avoid them. This is an existing movement-contract limitation with unchanged geometry, not a newly disconnected room island. Do not claim all legal space is sweep-connected or a continuous-space proof.

Radius38 passes the same anchor and route tests but its sampled graph reaches 1804 of 1806 points. Radius48 is deliberately stronger stress and fails one activity anchor plus four route segments. The main east-west route and east approaches pass only 40 units south of the tall obstacle. Radius48 therefore does not fit those centerlines. Activity A also has only 40 units to its machine's south face. These results do not authorize radius48 actors or support arbitrary enlarged clearance. All diagnostic coordinates and segment results are preserved.

No live pursuit, converging-attacker video, enemy visibility, projectile, model, material, browser, GPU or full verifier claim is made. Production geometry and navigation helpers were actually exercised. Model placement and live behavior remain later-stage work under the appropriate permit. No shared AI or navigation repair is attempted.

## Own visual inspection

I loaded the original `layout.png` with the vision tool and inspected the complete room. The full boundary, four solids, entry, exit, breach markers and clear central route are visible together. The gold lathe-and-arm symbol reads differently from the gantry, bench and cabinet. Equipment symbols remain inside the white solid outlines. The activity rings sit on adjacent open floor, linked to the central aisle. The side key separates proposals from retained geometry, and the footer explicitly limits the evidence to a top-down concept.

At the tool's reduced preview, minor coordinate and diagnostic labels are small, but the room plan, main labels and object roles remain readable. This is adequate for a layout draft. It is not a final machinery illustration. Stage0 concerns about convincing workpiece support, organic resin and cut insulation remain unresolved until model stages. Parent and independent review are still required.

## Execution issues

The unattended environment blocked `execute_code`; ordinary tools completed the task. The first Node loader run stopped because a production JSON import lacked Node's import attribute. The attempt-local loader now loads JSON data without changing production sources. The completed rerun is recorded in `validation.log`. Node also emits a deprecation-direction warning for its experimental loader interface; this does not fail execution.

Only this attempt's repository and workspace directories were written. No commit, publication, guard edit, acceptance, merge, deployment or GPU job occurred.
