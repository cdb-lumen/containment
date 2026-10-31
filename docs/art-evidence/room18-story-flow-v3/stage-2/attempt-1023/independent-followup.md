# Room18 independent follow-up

## Final verdict

PASS for stage2 rough placed-model art and the repaired code candidate. R1 is closed. No blocking finding remains within this review's scope. This is not finished-art, ordinary-gameplay, integrated-HUD, mobile or release acceptance.

I read `independent-review.md`, inspected the repaired source and regression, reran the focused tests, and reviewed both original `verified/native` PNGs through vision, including the changed gameplay image. I did not edit source, run GPU capture or publish.

## Repair verification

`src/render/ContainmentAnnulusBlockout.ts:51` now attaches `texture.dispose()` to its owning material's dispose event. The existing `disposeModel` disposes owned materials once per traversal. The hook therefore retires each room-owned sign texture without changing shared disposal or touching shared textures.

`tests/ContainmentAnnulusBlockout.test.ts:32-40` supplies a document-present canvas stub, builds the actual authored room, requires two textures and checks that the actual `disposeModel` calls each texture's disposal once. Global stubs and spies are restored in `finally`. This tests resource lifetime, not browser rendering. `texture-red.log` preserves the initial failure with zero texture-dispose calls.

Comparing all seven saved prior source files against the current candidate showed only the material hook and the new regression added since the first review. No placement or shared renderer change accompanied the repair.

Independent command, executed in `/home/chernodubv/dev/.cron-worktrees/containment-rooms/containment-annulus-v3`:

```text
./node_modules/.bin/vitest run tests/ContainmentAnnulusBlockout.test.ts tests/ShipEnvironments.test.ts tests/unit/expeditionGeometry.test.ts
```

Result: exit 0, 3 test files passed, 33 tests passed. This includes the document-present disposal regression and the ring-clearance checks.

`verified/checks.json` records exit 0 for the parent's fresh focused run, `npm test` and `npm run build`. I inspected these records and the aggregate/build logs, rather than rerunning the full suite or build. The build retains a large-chunk warning, not a new review blocker.

## New pixel review

The current gameplay PNG still shows a closed low lid inside the segmented jacket and dark central reservation. Both east-side status housings remain on that reservation, outside the circulation route. Their labels read PASSENGERS ALIVE and NOT ARMED / MANUAL ONLY. The red player remains distinguishable immediately south of the core, with the staged enemies farther south and southeast. No new rough-placement defect is visible.

The overview shows the full chamfered envelope and open circulation around the central assembly. It is byte-identical to the previously accepted overview, and I inspected this original again. The gameplay PNG has a different hash and received a fresh visual review, not inherited acceptance.

These are controlled staged desktop simulation images with no DOM HUD. The overview has a fitted camera. The gameplay view does not show the full room, and this checkpoint cannot establish all-approach readability or unrestricted live combat. Material finish and detailed machinery remain later-stage work.

## Source and image pins

Git HEAD is `649ceb0049278e45314deaf88d8f7ec41ca03071`. I independently hashed all 333 runtime files and all seven changed-source files, including their saved copies. All matched `verified/source-pins.json`. Its SHA-256 is `fdcf6ff89c2b303ddb42082078d1928a53509d0ec2e5f18b83d80abe2291bc6e`.

| Reviewed file | SHA-256 |
| --- | --- |
| src/render/ContainmentAnnulusBlockout.ts | `8acdcac312de11d99dd3e5d2396e103935608ebbd49efc9be101e94ed427b514` |
| tests/ContainmentAnnulusBlockout.test.ts | `0892e082280af28526c777bc4a44b0bbd458a4d0766d6cafafad93eccdc066f0` |
| verified/native/18-containment-annulus-overview.png | `42c0b34c3f6c9e2c0a9a053d08e86c7a788dccfaac05dd4582442611128044b6` |
| verified/native/18-containment-annulus-gameplay.png | `2f66e566b0560b78c51104c3cc0b21ba3a439c9a6af4d64e2d208cc8b28584a3` |

Both image hashes were independently computed and match the saved pins. The recorded capture exited 0 and reports source unchanged during capture. This follow-up supersedes only the first review's unresolved R1 and updates acceptance to these repaired-source and image pins.
