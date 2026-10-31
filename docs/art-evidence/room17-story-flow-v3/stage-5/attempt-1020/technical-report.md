# Room17 final technical checks

Source: `art/shielding-gate-v3` at `6e5fbd3324a4a7a798b51519fe047dfdef3c38f0`. Verification-only work. Source hashes stayed unchanged through all checks and capture. Git status was clean before and after. No edits, commits, push, publication, receipt, guard changes, acceptance, merge or deployment.

## Results

- `npm test` exited 0. Vitest reported 81 passed files and one skipped file, with 767 passed tests and one skipped test. The command's subsequent Node and Python checks also completed successfully. See `npm-test.log` for the full composite command and results. The skipped test is not claimed as passed.
- Focused ShieldingGateBlockout, ShipEnvironments and expeditionGeometry checks passed, 36 tests across three files.
- Stage1 CPU layout checks passed, 13 checks. Standard enemy radii 14, 17, 18, 24 and 28 traverse the authored routes in both directions. The routes retain 100-unit corridor width, activity discs and an open threshold. Solids reject occupation and through-solid shots. All 1,915 admitted grid nodes and 16 anchors connect.
- `npm run build` exited 0, including TypeScript. Vite warned that a minified chunk exceeds 500 kB. No runtime repair was attempted.
- The existing room-evidence capture logic passed with Room17 only, desktop, overview plus desktop camera, and verify-all. No browser errors, WebGL errors or lost context were reported. Both PNGs decoded at 1280 by 900.

## Collision, movement and model coverage

The model tests check every assembly's bounding box against its existing collision footprint, both before and after appendEnvironment batching. They check nonnegative minimum height, reserved gate-head bounds, room-local nonemissive materials, nested leaves, cassette shells, tapered locks, dosimeter wells, bearings, traveling nut and shaft intersection, drive-clevis attachment and unchanged neighboring containment model selection.

The capture ran an actual DepthGame.update spawn-to-exit route with 384 legal movement checks and zero final exit distance. Its bounded combat fixture ran 25 fixed steps with 100 actor legality checks, four shots and 48 damage. These are controlled fixture results, not live gameplay or campaign completion. The scene retained the production desktop camera and high-quality composer. Overview alone uses the fitted overview camera.

Limits remain explicit. The CPU grid excludes eight occupancy-versus-sweep corner mismatches listed in `layout-cpu.log`. Its connectivity result covers admitted samples, not continuous-space proof. Model bounds establish containment within collision, not exact mesh-to-collider congruence or exhaustive triangle intersection checks. Ground-height bounds and the visible screenshots do not prove that every component is physically attached. No animated gate, boss, encounter director, organic waves, full campaign progression, long survival, real keyboard/touch input, DOM HUD, mobile or repeated browser resource lifecycle was tested. No dedicated new disposeModel or bakeWorld audit was added. Existing suite coverage must not be represented as a new Room17-specific disposal test.

## Asset and pixel observations

The Room17 model is procedural geometry with room-local standard materials. No new downloaded textures, sprite sheets or GLBs were introduced. Public, source, scripts, tests and package files were hashed. Renderer preparation and preload completed; captured requests and console checks were clean. This does not prove every unused asset in the campaign loads.

I inspected both new PNGs. Three shielding masses sit on dark plinths. The opposed gate heads show wheels, exposed shafts and raised lock housings. The middle threshold stays visibly open. No obvious floating assembly, missing asset, error overlay or room clipping appears in the overview. Desktop framing crops the room perimeter by design while retaining both heads and backing mass. This is a bounded pixel observation, not the independent final art verdict. Parent and independent review remain separate.

## New original captures

Both images were freshly rendered by Playwright, not copied or renamed:

- `native/17-shielding-gate-overview.png`, SHA256 `addfe0443fd4cc9c3eb8e2cd7210a053378762aa45ab6c89bb757ca280cd39bd`.
- `native/17-shielding-gate-gameplay.png`, SHA256 `147dc24ba57bb9370534d47edc35dd6c80a16711ad8a89bcf222ceafe4709adb`.

Label both as static controlled simulation, not live gameplay. The existing harness uses the filename mode `gameplay` and manifest class `controlled-live-simulation`; neither changes this reporting limit.

The new overview is byte-identical to stage4's deterministic overview. The new desktop PNG differs. No pixels or PNG metadata were altered to manufacture novelty. Commands, timestamps and original hashes are in `checks.json` and `source-pins.json`.

## Files and cleanup

All authored files are in this attempt directory. `verify-and-capture.py` adapts the prior stage's external runner. `room-evidence-external.mjs` preserves scene, timing and camera logic while moving temporary entry and Vite cache outside the checkout. `harness-adaptations.json` records each replacement and both script hashes. Build output is the ordinary ignored repository `dist` output.

`cleanup-verification.json` records 18 capture samples, at most one GPU process, no foreign browser process and seven observed owned processes. PID plus start-time checks found none still alive. No temporary room-evidence entry remains. The unrelated pre-existing Vite process at PID1074861 was left untouched. Supporting process snapshots and capture samples are retained. The external Vite cache is retained as a non-running artifact.

Parent owns publication, independent overall review, final receipt and review routing. This report does not accept the room.
