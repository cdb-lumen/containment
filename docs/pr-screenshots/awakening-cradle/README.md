# Awakening cradle evidence

Only `awakening-bay` changes architecture. Twenty campaign IDs, legacy templates, starting boon choice, story and rewards stay intact.

- Baseline `fcb498b45d18782800a675931d6c9c0312ec41c9`; final source `f72e9434a27624348ba2e12b3027e2aaef74cc71`, synchronized with room13 fix #38.
- `comparison.png`: matched 1280×900 high-quality fitted-room overviews. The final overview is byte-identical after the main sync. Final combat pixels were recaptured and inspected separately.
- `before/` and `after/`: actual production `DepthGame.update`, legal spawn-to-exit traversal, moving enemies and shots. Controlled fixtures, not campaign playthroughs. Overview fits the room; gameplay uses native camera and production high-quality composer.
- `hud-desktop/` and `hud-phone/`: built production app, real new-run boon selection, pause/quality/resume, story skip and keyboard/touch firing. Low-quality interaction evidence, not matched overview comparisons. No browser errors. Captured before the room13 renderer-only sync; the final required CI repeats production input smoke.
- `video/awakening-bay-desktop.mp4`: six seconds, 120 decoded H.264/yuv420p frames, faststart. Actual fixed-step live combat with stationary high-health, zero-damage brutes. 31 shots, 480 armor damage, 456.25 units of legal movement, 480 actor checks. No fabricated effect events or interpolated frames. No browser/decoder errors; 120 distinct decoded world/actor crops. Four decoded samples visually inspected. The player briefly overlaps an enemy while passing it, as allowed by production movement.
- No phone FPS or full-run balance claim. Software WebGL recording time is not gameplay performance.

## Verification

New topology regressions failed on the old room before implementation. Focused tests cover radius-38 routes on both sides of the arm, live enemy traversal, projectiles, machinery/drop exclusion, and visible radial architecture. Baseline comparison found only awakening-bay changed among all 36 templates, including legacy templates.

`npm run verify` passed: 281 unit tests and one optional benchmark skipped, seven evidence/recorder checks, typecheck/build and desktop/touch input/restart smoke. After synchronizing #38: 284 unit tests, seven evidence checks and build passed again. The PR's required `verify` runs the full gate on the published head.

Reproduce from repository root:

```sh
npm ci
npm run verify
node scripts/room-evidence.mjs --rooms=awakening-bay --gameplay-all --verify-all --out=/tmp/awakening-evidence
node scripts/authored-room-smoke.mjs --rooms=awakening-bay --viewport=desktop --out=/tmp/awakening-hud
node scripts/authored-room-smoke.mjs --rooms=awakening-bay --viewport=phone --out=/tmp/awakening-touch
node scripts/room-demo.mjs --room=awakening-bay --source-sha=$(git rev-parse HEAD) --out=/tmp/awakening-video
```

Recorder manifests retain exact source hashes, raw frame hashes, ffprobe, decoded motion, actor checks and browser errors. The manifest's automated pixel-review placeholder is superseded by this manual review record. Before capture needed a watchdog-only extension from 120 to 360 seconds; the shipping recorder includes bounded cleanup. An initial video validation omitted armor from damage accounting; it was corrected and the entire final video was recaptured.
