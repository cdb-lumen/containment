# Room15 rough model placement review

Verdict: passed for stage2 only. Parent reviewer: Hermes art worker 9b8013f7b737, run room15-story-flow-v3-stage2-attempt1006. Independent reviewer: delegation deleg_f78bd100, retained in independent-review.md.

I inspected both original 1280x900 PNGs through vision. The northwest lathe has a readable bed, chuck, separated carriage and tailstock. Its bent arm remains distinct above it. The gantry, fixture bench and stock cabinet occupy the other three retained islands. Their different silhouettes explain a workshop, with the converted lathe as the focal point. Central and perimeter circulation remain open. This satisfies rough machinery placement, not finished infestation or material quality.

The pink resin tips look detached in projection. The broken guard reads as a raised plate rather than damage. Fine insulation and the gripped stock need stronger visual expression later. The cabinet drawers face away from the planned north-side activity point. Preserve these findings for room visuals/model iteration, without treating this bounded pass as final approval.

## Verified scope

Only src/render/InfestedWorkshop.ts, its exact-template registration in src/render/ShipEnvironments.ts and tests/InfestedWorkshop.test.ts change runtime/test source. Collision, objective, camera, HUD, shared materials and other room dispatches remain unchanged. No pending preceding-room asset is imported. Fresh origin/main remains 7a3f262886104fb024de9684958b3f85a8859f34 and is an ancestor of this branch. The source-pins file records the exact uncommitted capture source, independently verified across 92 files. Publication will commit those same bytes.

## Checks actually run

The implementation delegate ran 37 focused tests, full npm test and build, the existing layout validator and the source-pinned room capture. Parent independently reran the three new tests, npm test, npm run build and npm run test:room-evidence. All final commands passed. Parent full tests report 762 Vitest passes with one skip, plus the Node/Python asset checks. Evidence tests passed 22 cases plus 33 CPU ragdoll checks. Parent initially requested the nonexistent verify:room-evidence script; npm rejected that command. The actual test:room-evidence script then passed. This was a command-name error, not a product failure.

The retained layout validator passed eleven required assertions using real occupancy, sweeps and navigation. Radius16/28 named anchors and prescribed segments pass. Eight radius28 sampled corner discrepancies, two radius38 unreached sampled points and radius48 stress failures remain recorded. No claim of complete sampled connectivity or stronger-radius clearance follows.

Actual vertex bounds fit the inner reservations before and after production batching. Scoped tests enforce mesh/material ceilings and neighboring-template dispatch. The capture recorded no browser errors, WebGL errors or context loss. Parent verified source hashes and original image hashes against the capture records.

## Evidence limits

The overview uses fitted framing. The desktop uses production camera/composer with controlled staged actors and short fixed-step combat, no DOM HUD and no encounter director. It is not ordinary campaign play, every-lane attacker coverage, continuous combat video or mobile evidence. No full browser verifier or release acceptance is claimed. Vite retains its large-bundle warning; npm installation reported two moderate audit vulnerabilities without a dependency change.

Next stage is room visuals under a new scheduler permit. No specific human decision is needed for this bounded placement result. Final room acceptance, merge and deployment remain unauthorized.
