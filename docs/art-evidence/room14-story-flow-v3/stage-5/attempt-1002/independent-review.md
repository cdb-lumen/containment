# Room14 overall independent review

Verdict: passed for bounded room-art and focused technical validation at source ec7e10550415fcc5f4daa0c5ea7b9460e86e9595. No blocking visual defect found in the two inspected originals. This is not human room acceptance, ordinary campaign validation or release approval. Publication, parent review and receipt remain with the parent.

Reviewer: delegated verification subagent, independent of the runtime implementation. I ran the checks and capture, read the actual room builder, topology, collision functions, model tests, canonical story and stage0 brief, and inspected both original PNGs with native vision. I read the active production policies and prior stage4 capture and independent review. I did not edit runtime, shared source, policy, guard state or prior evidence.

## Source and evidence

Worktree /home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3, branch art/service-shaft-landing-v3. The clean HEAD matches the delegated pin. source-pins-before.json and source-pins-after.json hash tracked source, scripts, tests and package files. The pins match exactly and both Git statuses are empty.

Both original screenshots are 1280 by 900, decoded successfully, and match the capture manifest. Their hashes differ from all 18 distinct earlier Room14 PNG hashes found locally. artifact-verification.json records the measured bytes, hashes and metrics.

| Original | SHA256 |
| --- | --- |
| final/14-service-shaft-landing-overview.png | 364ef561c07cd0507b9510f073c4407db67e6c5705219175b19785018cde30e9 |
| final/14-service-shaft-landing-gameplay.png | c8e71fbc41923e88370bfa75dc43a7728aec9e76506d8e07b59cb446a7fd1548 |

These are controlled simulation captures with no DOM HUD. The desktop image retains production camera and high-quality composition, including world health bars. The overview uses the inherited fitted camera. The fixture has an inactive encounter director, no boss and no campaign progression. It is not a recorded ordinary playthrough.

I reused the external stage4 Room14 script in operations/capture-room14.mjs. Its only behavioral change stages the player three verified route nodes later than the earlier midpoint. The player starts at x652,y224, and the unchanged legal-enemy selection adapts to that location. The inherited northward movement correction remains. All original assertions remain. No pixels were edited and no runtime file changed. Novelty comes from actual staged actors and the corresponding production camera follow, not an image treatment.

## Story, layout and style

The overview shows a continuous west connection between broad north and south balcony runs, with the exit landing on the right reached from the north. The shaft extends to the east wall below that landing. It does not suggest a usable shortcut across the machinery. The whole room fits inside the overview.

The dark recessed shaft, bright guide rails, twin sheaves and exposed weight stack read as lift machinery. Amber edge posts and the LOCAL ACCESS ONLY sign separate the working floor from the shaft. The pale loose cable and empty dark socket at the west local junction support the canonical AI-disconnection story without inventing an interaction. The exact phrase about losing AI below the landing remains in storyRooms.ts, not in these HUD-free pixels. The cable's precise connector gap is small in the overview; the desktop view and source clarify it.

Repeated grate panels follow usable floor instead of filling the shaft. Dark steel, zinc and restrained amber keep the machinery distinct from the deck. Both images show the rear X brace above the weight without covering the sign. The desktop view crops the outer room, as expected for production framing, while retaining the complete main machinery and local junction.

## Models, construction and collision

The two sheaves have visible rims and spokes rather than flat disks. The source adds axles, front and rear bearing blocks, bearing bases and guide-head support. The weight frame reaches the guide-shoe region. Side ties connect the head region to the rear posts. Both X braces terminate in upright joint blocks. No obvious floating machinery or floor intrusion is visible. The front brace partly hides the lower weight and connections, so these views do not establish every hidden joint or a mechanically complete animated rope system.

The floor mesh derives its cutout from the same template void polygon used by expedition geometry. The topology retains the canonical spawn at 100,440, exit at 1100,440 and four breaches. No obstacle rectangles were added. The focused tests verify the full C route at radii 16, 28 and 30, forbid the east shortcut, and use real DepthGame updates with a pursuing brute, pickup collection and eventual contact damage. They also test deck surface rays, machinery vertices in solid space, batching bounds, material and grain-texture disposal, rear-truss ray visibility and assembly parts.

The collision contract is a two-dimensional solid shaft. hasClearExpeditionShot also rejects paths through its polygon. This is not per-triangle bullet collision or a claim that open air above the shaft is shootable. The reviewed code and pixels agree on an impassable machinery area and a connected floor route. I found no room-local walkable floor hidden under blocking machinery. Vertex containment and selected rays do not exhaustively prove every triangle or projectile-height intersection.

## Fresh execution

Exact commands, timestamps and exit codes are retained in command-results.json and the named logs. All executed test, build and capture commands returned exit 0.

- npm test: 81 Vitest files passed, one skipped; 770 tests passed, one skipped. The subsequent Node tests and Python asset checks completed successfully. The skip remains a skip, not a pass.
- npm run build: TypeScript and Vite completed. The large-chunk warning remains in npm-build.log.
- npm run test:room-evidence: 22 tests passed, zero failures, plus the successful 33-check CPU self-test.
- npx vitest run tests/unit/ServiceShaftLanding.test.ts: 11 passed.
- npx vitest run tests/unit/ServiceShaftLanding.test.ts tests/unit/authoredTopology.test.ts tests/unit/expeditionGeometry.test.ts tests/StoryRoute.test.ts: four files, 29 tests passed. See focused-route-model.log.
- node operations/capture-room14.mjs --rooms=service-shaft-landing --gameplay-all --verify-all --viewport=desktop --quality=high --out=<attempt>/final: one overview and one desktop original captured. The retained command uses absolute paths.

The capture performed 412 real movement updates to the exit with exit distance zero. Its combat fixture performed 25 updates, four shots, 48 damage and 100 legal-actor checks. Three enemies and one bullet remained. Both image rows report WebGL error zero, no context loss and no strict browser errors. Duplicate module aborts are retained in the manifest and accepted only when that exact URL also completed, as required by the inherited script.

## Ownership, failures and limits

The pre-capture process inspection found no competing room capture or smoke job. The existing login Chrome, including its GPU helper, and unrelated containment-boons Vite server were left untouched. Exclusivity means one owned art capture job, not the absence of every browser GPU helper on the host. All commands ran serially.

The capture closed its browser and server and removed its temporary entry. cleanup.json records no .room-evidence entries, no capture-owned browser/server process and clean Git status. Capture port5173 is no longer listening. Two later static servers belong to open-strong/idle-maintainer, confirmed in other-process-ownership.json, and were not stopped.

There were no test or capture failures in this attempt. One exploratory file read used the wrong historical stage0 attempt path, attempt997, and returned File not found. File discovery found attempt989 and its actual brief was read. This lookup error is preserved here rather than hidden. All command logs and original outputs remain.

No full smoke verifier, organic encounter, mobile/touch session, DOM HUD validation, continuous combat performance run or engineering load analysis was performed. Those are not established by this review. No commit, publication, receipt, merge, deployment or guard invocation was performed.
