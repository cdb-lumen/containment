# Room11 rough model placement, attempt992

Passed independent and parent stage2 review. Not human room acceptance or release.

Parent inspected both original 1280x900 PNGs. Four elongated, tapered berths now contain distinct head and body forms rather than blank rectangular screens. Their small scale is appropriate to a physical ship cutaway. Individual limbs merge in the overview, so this is rough occupied-pod identity, not finished passenger detail or proof that players understand every story consequence. Two curved operator banks retain the central opening and face the board. No layout correction is needed for this stage.

Independent reviewer inspected both originals and the source, accepted the bounded stage, and ran seven focused tests. See independent-review.md.

Parent read the exact two-file diff and reran `npx vitest run tests/DiagnosticGallery.test.ts`: seven passed. `git diff --check` passed and fresh origin/main is an ancestor. The production child ran full `npm test`, which passed with 766 Vitest tests and one skipped plus chained checks; build and room-evidence tests passed. Capture completed without browser/WebGL errors. Verification commands and source hashes are retained in verification.json and source-pins.json. The expected RED test failure remains in local logs.

Runtime edits are limited to Room11 pod meshes. Layout, collision, shared systems and the prior technical repair are unchanged. Prior failed attempt972 and its budgets remain intact.

These are controlled staged simulation images without DOM HUD, not sustained gameplay, current full browser verification or release evidence. Current remote CI is checked at publication, not presumed passed. Next stage requires its own scheduler permit. No merge or deployment.
