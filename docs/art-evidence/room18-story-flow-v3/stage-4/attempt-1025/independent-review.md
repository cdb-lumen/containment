# Room18 stage4 attempt1025 independent review

## Verdict

PASS for the bounded model-iteration goal, with non-blocking construction-readability and test-coverage findings below. Previously buried feet now read as broad shoes and paired sloping webs in both gameplay and overview. The service equipment now has visible depth, guards and retaining pieces instead of mostly flat boxes.

This is not full-room, release or human acceptance. HUD and mobile are outside this gate. I inspected retained images and ran CPU tests only. I did not launch a browser, renderer or GPU job, edit source, publish or commit.

## Evidence inspected

Attempt root: `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/containment-annulus/story-flow-v3/stage-4/attempt-1025`.

Loaded all four native originals through vision tools, not just the contact sheet:

- `before/native/18-containment-annulus-gameplay.png`
- `after/native/18-containment-annulus-gameplay.png`
- `before/native/18-containment-annulus-overview.png`
- `after/native/18-containment-annulus-overview.png`

All four are 1280 by 900 and match their manifest SHA-256 values. Also inspected the after gameplay east equipment crop at original coordinates 862,250 to 980,556. These are populated Room18 frames, not loading or blank captures. Before and after manifest camera and player values match for each view.

The manifests classify capture as controlled-live-simulation using fixed-step production combat and renderer, with inactive encounter director, no boss, no campaign progression, no DOM HUD and no real touch input. I reviewed the retained static frames, not the capture's live traversal. Reported empty capture error arrays are historical evidence, not an independently rerun browser check.

## Visual and assembly findings

- Supports pass the stage goal. On the west and south, the after images show broad contact shoes, two raised webs per support and dark channels between them. Their ends visibly meet the jacket. The before images show mostly dark outlines and small tabs. This is a substantial silhouette change at both retained scales.
- Equipment passes the improvement goal. The south inspection cartridge has a readable collar and retaining bars. The east instruments have raised frames and recessed faces. Roof saddles add visible attachment hardware without exposing the core.
- The shield remains visibly closed. The pale roof panels, central hatch and backing still cover the assembly. Neither after image introduces an exposed glowing core or an open hatch.
- `PASSENGERS ALIVE` and `NOT ARMED / MANUAL ONLY` remain readable in the gameplay original. The overview retains the same two status displays at a smaller scale. The source preserves their text and the scoped story test passes. This verifies the communicated state, not passenger animation or behavior.
- No new detached or obviously floating assembly is visible in these views. Source places shoes and the status rail on the plinth, then webs and equipment on those bases. The new construction stays visually on the dark central platform; it does not visibly enter the light circulation band. Hidden undersides and every attachment interface are not proven by these cameras.

### Non-blocking defects and limits

1. East equipment remains congested. In after gameplay around x900 to 965, y345 to 425, the radial support, rail, fins and upper edge of the lower display merge into a stack of crossing bars. The east crop confirms that the support-to-instrument relationship is less readable than the west support construction. This is a visible overlap/readability defect, not proof of an unintended solid intersection. Both labels survive. A clearer separation or explicit shared mounting bracket would improve this area.
2. North inspection hardware is mostly hidden behind the tall rear jacket. The after gameplay image shows its upper strip near x640 to 710, y198 to 208, but not the full cartridge construction. The south cartridge establishes the improvement; the north cartridge's functional shape remains unverified from these views. Do not count both as equally readable.
3. The new test named `keeps raised construction inside the exact canonical solid footprint` is a five-unit ray sample, not an exact geometric containment proof. Thin protrusions between samples could escape it. The support test samples one west shoe/web and selected display and collar points. It does not establish attachment or clearance for every repeated support, every saddle, or the crowded east interfaces. This is a coverage limitation, not a detected traversal regression.

## Technical review and fresh verification

Repository: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/containment-annulus-v3`.

Inspected the working diff and complete contents of:

- `src/render/ContainmentAnnulusBlockout.ts`
- `tests/ContainmentAnnulusBlockout.test.ts`

The diff changes stage metadata, replaces buried feet with raised shoes/webs, elaborates inspection cartridges and displays, adds roof saddles and adds CPU surface checks. Existing topology, story strings, resource disposal and traversal assertions remain in place.

Commands run in that repository:

```sh
git status --short
git diff -- src/render/ContainmentAnnulusBlockout.ts tests/ContainmentAnnulusBlockout.test.ts
./node_modules/.bin/vitest run tests/ContainmentAnnulusBlockout.test.ts
git diff --check
```

Fresh scoped test result: 1 test file passed, 9 tests passed, exit 0. This includes both ring directions and entry/exit at the asserted actor radii, core shot blocking, sampled raised-construction containment, roof surfaces, ownership disposal and story-state checks. `git diff --check` produced no diagnostics and exited 0. I did not rerun the full suite, build or live traversal.

Python standard-library and Pillow checks counted the native files, read image dimensions, verified manifest hashes and compared both current source files byte-for-byte with `after/source-snapshot`. Both match the after snapshot and source pins:

- Renderer SHA-256: `e17d91494700300afe2aa672a71c9fe18ae0e9fbe80bc054e7b056a1024e5f0c`
- Test SHA-256: `f4e5fb13f6d8aa392f0a9d72c1805e64f55ba645e1dec8948eadc3299bdc2d01`

An `execute_code` metadata-read attempt was blocked by cron policy before execution. The same read-only check completed through `terminal`; it did not block review.

Only this review file was intentionally created by the reviewer. Existing dirty source changes and untracked evidence were left in place.
