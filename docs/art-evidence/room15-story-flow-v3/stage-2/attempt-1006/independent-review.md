# Room15 independent stage2 review

Verdict: PASSED for rough main-object placement only. No human acceptance, final-art acceptance, live-combat acceptance or release approval.

## Inspected evidence

Evidence root: `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/infested-workshop/story-flow-v3/stage-2/attempt-1006/`.

Loaded both original PNGs directly through vision, not thumbnails or contact sheets:

- `15-infested-workshop-overview.png`
- `15-infested-workshop-gameplay.png`

Read `verification.json`, `source-pins.json`, `scoped-tests.log`, `validate-layout.mjs` and the opening metadata of `manifest.json` under that root. Parsed `test-results.json` and `layout-data.json` directly. Compared the retained `InfestedWorkshop.ts` and `InfestedWorkshop.test.ts` snapshots byte-for-byte with the worktree.

Worktree root: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/infested-workshop-v3/`.

- Read all of `src/render/InfestedWorkshop.ts` and `tests/InfestedWorkshop.test.ts`.
- Read the complete current diff for `src/render/ShipEnvironments.ts` and checked Git status and HEAD.
- Read `package.json` and relevant matched context in `src/game/roguelike/storyRooms.ts` and `src/game/roguelike/storyRoomTemplates.ts`.
- Checked the empty worktree diff for `src/game/roguelike/roomTemplates.ts`.

Read canonical issue https://github.com/cdb-lumen/containment/issues/36 and its comments through live GitHub reads. Read prior layout data at `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/infested-workshop/story-flow-v3/stage-1/attempt-1005/layout-data.json`.

## Placement and story findings

The northwest object reads as a lathe rather than an anonymous infestation block. Its long bed, left chuck housing, exposed working space, carriage and right tailstock remain separable in the gameplay-angle original. The arm above that bed has visible joints and bent links. The diagonal organic brace changes its silhouette without swallowing the machine. This clears rough recognition, not final mechanical-detail readability.

The northeast gantry, southern fixture bench and southeast stock cabinet have distinct silhouettes and workshop functions. Their scale relative to the player establishes heavy installed machinery. Their placement matches the prior reserved islands. The bench and retained stock support the construction-station purpose without competing with the converted lathe.

The central cross-aisle and outer returns remain visibly open. Growth stays selective rather than carpeting the working floor. The candidate dispatcher is restricted to `infested` plus `infested-workshop`; its diff does not replace the neighboring Swarm junction treatment. Canonical source context retains Service shaft landing before this room and Swarm junction after it. The converted-workshop objective remains appropriate to that lower-deck sequence, with no added exposition or new combat dependency.

## Actual checks

Independent read-only Python checks returned:

- Both original PNG SHA-256 values match `verification.json`.
- All 92 recorded source hashes match the current worktree. HEAD is `98449b5a30842f57aa7399c84d2c04915fa6854e`; the uncommitted candidate requires its source hashes, not HEAD alone.
- Both retained source/test snapshots match the worktree byte-for-byte.
- Stage1 and stage2 template, activities, equipment and routes compare equal.
- Retained route results contain 11 checks and zero failed assertions. Radius16, radius28 and radius38 anchor/segment diagnostics have zero failures. Radius48 has one failed anchor and four failed segments.
- Sampled connectivity is not uniformly complete: radius16 reaches 2073 of 2073 nodes, radius28 reaches 1860 of 1868, radius38 reaches 1804 of 1806 and radius48 reaches 1476 of 1490.

The test source checks named machinery, original solids, the neighboring template fallback, actual-vertex reservation bounds, mesh/material budgets and bounds preservation through renderer batching. The retained scoped log reports 37 tests passed across three files. That is an inspected builder result, not an independent rerun. I did not run Vitest, route generators, a build, GPU capture or a browser. The route generator writes evidence files, so I inspected its implementation and existing output rather than executing it during this read-only review.

## Concrete shortcomings and limits

- Resin ribs currently read as short pink protrusions at the lathe base. The arm brace is visible, but directional wrapping and deliberate biological conversion remain weak compared with the machinery silhouette. Strengthen those forms during modeling without covering the chuck, carriage or ways.
- The broken guard reads more clearly as a raised plate than as damage. Peeled insulation and gripper/workpiece contact are too small to establish their story independently in these originals. Their presence in code is not proof of final visual success.
- The stock cabinet's drawers face south in the model, while the retained tool-supply activity point lies north. The stock on top supports the north-side reading, but drawer-use orientation should be reconciled before detailed interaction staging. No current route is blocked by this discrepancy.
- Automatic independent X/Z fitting preserves reservations but can stretch mechanical proportions. These frames pass rough scale review; this is not a manufacturing-proportion review.
- These are controlled staged-simulation captures without DOM HUD, not live combat. The visible attackers do not prove approaches along every legal lane or small-enemy readability throughout a fight. HUD and mobile coverage are outside this stage2 art gate.
- Existing sampled-corner and radius48 diagnostics remain limitations. Passing prescribed routes does not prove all occupiable points connect or that every actor size can traverse every lane.

No blocking stage2 placement defect found. Final materials, finer damage, growth attachment, cut-insulation readability and full gameplay evidence remain later work. Only this review file was written; runtime and capture artifacts were not modified.
