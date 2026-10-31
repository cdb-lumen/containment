# Room14 independent rough placement review

## Verdict

PASS for stage 2 rough placement in the supplied images. This is not final room-art acceptance, live-gameplay verification or release approval. Source provenance needs reconciliation before publication as an exact current-source capture.

I inspected both original PNGs with the vision tool, read the worker prompt and stage 1 attempt 990 brief, and reviewed the current room builder, topology and renderer diffs, focused test source and capture adaptation. I did not read a parent verdict or inherit the builder's acceptance claims.

## Visual findings

- The overview shows a continuous west spine joining the north and south balcony arms around the dark shaft. The shaft extension separates the eastern exit landing from the south arm. Machinery stays inside the shaft rather than filling the circulation space.
- The counterweight is a single recessed, stacked mass between paired guides. Amber rollers, two upper sheaves and a large foreground X brace give it an industrial lifting-machine silhouette. Its scale relative to the staged player is appropriate for the room's main machinery. It does not read as another row of equipment racks.
- The gameplay-camera image retains the counterweight, guides, rollers, sheaves and foreground bracing together. The machinery does not visually cover the staged player on the north arm. This is one staged position, not proof of readability through an encounter.
- The west-rim junction is smaller than the shaft mechanism and stays beside the route. A dark socket, separate cyan plug and descending cyan cable are visible. Their placement passes the rough-object gate, but the cable is thin and the disconnected state is not an immediate story read at overview scale.

No rough-placement blocker is visible in these two frames.

## Concrete limitations

The sheaves partly cover the local-access sign. The farther bracing and dark cable runs merge with the shaft shadow. The foreground brace is much clearer than the back support. These are later readability and model-iteration issues, not grounds to require finished materials at this stage.

The gameplay-camera frame crops the eastern landing and outer room edges. The overview, not that frame, establishes the complete C arrangement. Neither image proves floor clearance under moving crowds, projectile behavior, lower-deck progression or the full story sentence. There is no DOM HUD or touch evidence. HUD and mobile visibility are not gates for this review.

## Focused code findings

`ServiceShaftLanding.ts` derives the floor cutout from the template boundary and void. The authored topology installs the stage 1 shaft coordinates, removes the old rectangular machine obstacles and retains the canonical spawn, exit and breach anchors. Machinery coordinates, inset curbs and the local junction follow the solid-side placement intent.

The `DepthRenderer.ts` diff adds a Room14-specific builder and batching branch. No camera, HUD, AI or shared gameplay behavior changes appear in the reviewed diff. The two changed template snapshots contain the Room14 topology replacement rather than unrelated room redesigns.

The focused test source covers canonical anchors, route sweeps, controlled updates with a pursuing brute and pickup, fixture containment, selected floor raycasts and batching bounds. I reviewed those assertions but did not run tests or certify the writer's final test results. The Node-side builder skips the canvas sign branch, so that test alone does not establish the sign's browser lifecycle or visibility.

## Evidence and provenance

Both reviewed originals are 1280 by 900 and their hashes match `evidence/manifest.json`:

- `evidence/14-service-shaft-landing-overview.png`: `4677c7d1809215b142afdabc09c75fef77579c8829b27df20cb28a36979c56c4`
- `evidence/14-service-shaft-landing-gameplay.png`: `fe5fb987c1e5d7a16e44eca07502d38a2d5464f491038312d25723f04124d2ce`

These are controlled simulation captures with staged actors and the production renderer/composer. The overview fits the room. The other image uses the production gameplay camera. Neither is live gameplay.

The original canonical capture failed with `No live player movement`. `operations/prepare-capture.py` makes an external copy of the evidence fixture and changes its initial movement from southward to northward, away from the north shaft rim. It retains the original assertions and does not edit production movement or the camera. The adapted manifest records movement, firing and damage, but only within that controlled fixture. The original failure remains part of the record.

At review time, current `DepthRenderer.ts` and `authoredRoomTopologies.ts` match their capture pins. Current `ServiceShaftLanding.ts` does not:

- Capture pin: `0c961e5876fd5ffdb1a64d0da4e35dd3dc0df5c52d94a865e543719075e6ec39`
- Reviewed current file: `a00466dcaee40110306db8f12d372a1ec774e3bc6702f9d59ce70dc9efea7003`

I cannot certify that difference as visually inert from the retained pin alone. Preserve the captured-source pin and identify the intervening edit, or obtain matching-source evidence before asserting exact current-source provenance. This limitation does not change the rough-placement verdict for the inspected pixels.

Only this review file was written. No runtime edits, GPU job, commit, push or receipt were made.
