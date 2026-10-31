# Room15 stage4 attempt1008 independent review

Verdict: failed for bounded stage4 visual acceptance. There is meaningful mechanical refinement, but the alien attachment and brace still do not read clearly enough in the supplied native views. This is not a rejection of the room layout or a demand for final gameplay acceptance.

## Evidence and scope

Read map-model-production.md and reviewed the full worktree diff against HEAD 55da824a49bca3f2b3a9503637c7ee946845019b. Loaded all four original images with vision, without enlarged crops:

- before-gameplay.png
- before-overview.png
- capture/15-infested-workshop-gameplay.png
- capture/15-infested-workshop-overview.png

All four files are 1280 by 900. The changed assembly is the northwest lathe, at the upper left of the gameplay image. The upper-right gantry is not the changed object. Reviewed the candidate source and tests before consulting source pins. Did not use the implementation report as a verdict.

The three changed files match their source-pins.json SHA-256 entries. The diff contains the room-local model and two test files. There are no camera, HUD, topology or shared gameplay changes in that diff.

## Native visual findings

Lathe identity passes. The yellow headstock, silver chuck, horizontal copper stock, carriage, handwheel and right-hand tailstock form a more recognizable working machine. The stock now occupies the working axis rather than reading as a short loose item below the arm. This improvement survives the overview.

Supported stock passes this bounded visual check. The copper bar meets the chuck and extends to the tailstock assembly. The central dark gripper overlaps it convincingly in gameplay. The exact opposed-pad contact is source-supported rather than independently resolvable in the overview. I see no obvious floating stock in these images.

Broken guard passes as visible damage. The jagged yellow plate above the left housing replaces an ordinary-looking opened panel. Its irregular top and folded fragment are visible in gameplay and remain a broken silhouette in the overview. The individual hinge connection is less legible than the damage, so these views do not establish every mechanical attachment.

Alien resin attachment fails the intended native read. The three long parallel strands are gone, which removes the strongest cable cue. However, the replacement reads mainly as a small pale, striped fringe along the lower edge of the left housing. Its broad vertical attachment and flared upper contact are not readable across the housing in gameplay. The overview compresses it to a small mottled patch. I cannot read a continuous alien membrane gripping the casting from these pixels. Replacing the underlying geometry with a web is not enough when the visible result loses most of that web.

Tendon brace remains weak and is part of the failure. There is a pale diagonal patch beneath the rear arm, but I cannot independently trace a clear brace from the machine foot to the upper arm in the native gameplay image. It merges with the joint and yellow machinery. The overview provides no stronger confirmation. The code defines the intended connection, but the screenshots do not clearly communicate the load-bearing alien attachment.

Insulation does not earn a visual pass. I cannot distinguish a cut sheath, exposed cores and a separate peeled flap in either native view. This is a secondary finding, not the sole reason for failure. The model changes exist, but their damage story remains below the useful visibility threshold or behind the assembly.

Keep the improved stock and broken guard. A further authorized revision should make the broad resin contact and brace legible on visible faces of the existing assembly, rather than add more fine fibers or move the camera. The present review does not authorize another attempt or change any budget.

## Code and CPU verification

Ran these commands in /home/chernodubv/dev/.cron-worktrees/containment-rooms/infested-workshop-v3:

```sh
git diff HEAD --stat && git diff HEAD
npx vitest run tests/InfestedWorkshop.test.ts tests/ShipEnvironments.test.ts && git diff --check && git rev-parse HEAD && git status --short
```

The focused run passed 34 tests across 2 files. git diff --check passed. Status reported only src/render/InfestedWorkshop.ts, tests/InfestedWorkshop.test.ts and tests/ShipEnvironments.test.ts modified. A separate python3 -c command using pathlib, json, hashlib and PIL.Image verified the three source pin matches and the four original image dimensions and SHA-256 hashes.

The code adds closed variable-width resin meshes, a torn extruded guard, coaxial stock, gripper pads and separate insulation pieces. Tests cover resin endpoint containment in owner bounding boxes, stock intersection with support bounding boxes and owned-geometry disposal. The batching test explicitly distinguishes newly owned geometry from shared geometry and checks disposal. I found no reason in this diff to treat that ownership adjustment as a weakened disposal requirement.

These tests are not native visibility tests. Bounding-box contact does not establish a visible attachment or exact mesh contact. The new directional-resin anchor test does not test the tendon-brace endpoints. Guard and insulation tests largely establish named parts and separation, not readable damage. Passing CPU tests therefore does not reverse the visual verdict.

## Limits

This is one bounded independent review of supplied staged simulation stills without the DOM HUD. No GPU job, recapture, runtime edit or commit was performed. No motion, live combat, mobile interaction, final room acceptance or human acceptance is claimed. HUD absence and mobile coverage are not art failures under the current contract.

Existing route corner and radius48 failures remain as supplied context. They were not rerun, repaired or waived. No full-suite or build result is claimed as independently rerun here. The required stage4 model contact sheet was not part of the supplied four-image review set, so its delivery and quality are not verified. The visual failure above does not depend on that publication limit.
