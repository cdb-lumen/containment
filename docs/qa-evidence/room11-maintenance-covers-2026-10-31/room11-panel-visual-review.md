# Room11 maintenance covers — independent static visual review

Bounded result: the repair adds visibly separate closed maintenance covers to the outward faces of both console banks. I do not confidently read the individual hinge barrels and latches as mechanisms at normal shipping scale; these are small edge details, especially in overview. The images support “closed access covers with seams,” not a strong claim that opening mechanics are independently legible. No new static obstruction is apparent in the three inspected views. This is not full room-art or combat acceptance.

Inspected all six original PNGs: center-native, reading-apron-native and room-overview before/after. The baseline console fronts read largely as continuous pale cabinet faces with vertical divisions. The repaired native views introduce four rectangular inset/seamed faces along the lower outside edge, two per bank. The dark surrounds make their closed-cover boundaries distinguishable while the instruments above remain dominant. The reading-apron view provides the same detail at shipping zoom; the overview establishes placement and unchanged room organization but reduces the hinge/latch details further. These are closed panels; no open lid or animation is demonstrated or required by this bounded repair.

## Provenance and source

Before: `43491a4bdf2fbd5f35159fa8b863104dd2f0ee63`, `/workspace/room11-panels-before`.
After: `a272b2f38d20307c18aa026690af03cca1154075`, `/workspace/room11-panels-after`.

Both manifests are terminal passed with errors empty and clean, identical sourceBefore/sourceAfter records. Independently verified every one of the 291 source-file hashes in each manifest against its exact Git commit and all six PNG SHA-256 hashes: no mismatch. Both native poses have identical before/after player and camera/projection metrics, zoom 1, loading false and GL error zero. The explicit fitted overview is not the shipping projection.

Harness `/workspace/room11-panel-native-inspect.mjs` matches the recorded SHA-256 `d18807a65330e08a55a457fc07deb64a757de188987c120027daed5bcd7ba858`. It stages legal player positions (600,440) and (600,260), settles the renderer for 60 frames, and retains native HUD/projection for the two native views. It does not run encounter simulation during those settling frames. The source delta is only 14 model lines plus 16 test lines. Current worktree HEAD observed as `6d5350563500c032c1524c34479c43b1d0c2fdfc`; the model and dedicated tests remain byte-identical to captured a272b2f despite later integration.

**Evidence documentation correction required before publication:** both original manifest disclosures contain copied Room16 text about “organ approaches,” “rounded underbody” and “human enclosure.” Those claims do not describe this Room11 capture. Preserve the original manifests/harness hashes and add an explicit correction or sidecar identifying the actual diagnostic-gallery center/reading-apron, closed-maintenance-cover comparison. The independently checked room, poses, source and pixels support the bounded result despite that stale prose; do not silently rewrite the originals or repeat the incorrect disclosure.

## Code/test interpretation and remaining limits

The source adds four covers, dark rims, paired cylindrical hinges and opposite latches inside the existing reservation. Existing geometry/route controls remain. The dedicated test checks four actual cover meshes, contact with their rims/hinges/latches and an outward first-hit exposure ray. This supports physical existence and exposure, but its ray is not the shipping camera and AABB contact alone is not proof of visual readability. My native-pixel judgment above deliberately remains narrower.

No renderer was launched, no runtime file was changed, and no new test suite was run for this static evidence review. Preserve prior code-review/test results separately. The images do not establish live traversal, enemy emergence, all-frame HUD visibility, encounter completion, performance, full art-brief completion, historical dispatch or human approval. If distinct hinge mechanics at normal scale are an explicit acceptance criterion, that remains unresolved by this capture rather than passed on mesh names or tests.
