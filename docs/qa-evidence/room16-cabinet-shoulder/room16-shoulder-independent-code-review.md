# Room16 shoulder/tissue iteration — independent review

Reviewed frozen dirty model/test delta against `f270491b133a303374d1ca7e1aaae5b42c0ed0b5`, with the final asymmetric cut base40 west/39 east+south. Independent40 focused tests and typecheck pass. Logs: `/workspace/room16-shoulder-asymmetric-independent-focused.log`, `...-typecheck.log`. No runtime edits or GPU use.

No new collision, lifecycle or preserved-assertion blocker found in that frozen version. **One concrete proposal-completion gap remains:** west terminal tissue is only sparsely exposed in native-direction sampling. Do not claim all three terminals have a broad readable tissue interior yet. This is not a shared gameplay defect or a reason to conceal/prevent a diagnostic capture; visual qualification is still required.

## Preserved failure and resolution

The intermediate uniform+1 cut-base revision hid the retained east native tissue witness: first hit `root-east-cut`, expected `root-east-tissue` at802,152 (`SwarmJunction.test.ts:128`). Parent's raised-test log and `/workspace/room16-shoulder-independent-focused.log` both preserve this failure. The latter ran around a source update and is not a stable-final qualification. Its39pass/1fail result is retained, not overwritten. Final west-only height increase restores that existing assertion without changing the test. Independent fresh frozen rerun passes40/40 and tsc.

## Shoulder and scope

The new footprint pulls the earlier out-of-contour point inward. It creates a substantial right shoulder, bottom31, mathematically bounded top≤44.3, using existing tendon material and the standard owned geometry/bake/dispose path. The lower continuous organ bed reaches at least31; the shoulder intersects actual housing and reaches over its42.5 roof. Existing wrap and fold are retained. This implements the dominant shoulder portion of the proposal, rather than falsely claiming the entire suggested left-strap/tissue construction was implemented.

Independent native-direction5×5 patch probes around(706,230),(710,236),(714,242) hit the shoulder18/25,25/25,24/25 times. Other hits are the existing engulfing fold or neighboring scute, not empty space. Across39 vertical probes atx699..701,y232..244, the shoulder top is44.06..44.30 and housing top42.5. With the shoulder bottom31, these demonstrate positive overlapping volumes through a finite strip, not just an AABB proxy or one touching point. The new test includes the shoulder in full manifold/winding/volume checks and adds real support/native exposure witnesses.

Only model and its test change. The original150-point layout, anchors, camera/gameplay, routes, dense pre/post rays, collision/triangle containment,44.8 height/material/mesh budgets and three-visit ownership checks remain. Existing cut/cabinet/cavity/scute exposure assertions remain unchanged. The manifold part count19→20 includes the new shoulder; it does not remove an old component test.

## P2 — remaining west tissue exposure/coverage gap

At `SwarmJunction.ts:94–111`, the revised curved channels change the cut surface while the underlying tissue remains34.4 high. Frozen-source independent native-direction sampling over the terminal envelopes at1-unit spacing found west tissue only3/2397 rays, east23/2550 and south47/1564. These denominators include space outside the irregular terminal and therefore are **not** percentages of visible tissue area. They do show that the west exposure is very sparse across a dense search of its envelope. Existing east/south5×5 witness neighborhoods expose13/25 and15/25 tissue hits respectively. There is no corresponding finite west tissue-patch regression; the retained west tests require the cut surface, not its underlying tissue.

The three sparse west hits are not evidence of a broad native-readable interior. Before claiming the three-terminal tissue proposal completed, shape a connected west tissue patch or channel/sheath opening over a finite region while retaining397,146 and all other old cut witnesses. Add a finite-area native-direction test for that patch instead of accepting one lucky first-hit ray. Do not move the old cut ray or cut a tiny artificial viewing hole around it. If the next capture is intentionally a partial shoulder trial, disclose this remaining limitation rather than treating it as resolved by40 tests.

Diagnostic script `/workspace/probe-room16-shoulder-asymmetric-independent.mjs`, results `/workspace/room16-shoulder-asymmetric-independent-probes.json` and `.log`. These are CPU rays, not rendered perceptual evidence. Broad shoulder readability, cabinet consumption, terminal tissue/material reading and ordinary encounter/arm emergence remain unqualified until appropriate native review. Prior failed outlines/raised-cut logs stay preserved.

## Addendum — tapered west tissue resolves the finite-exposure P2

Reviewed dirty follow-up against committed7962464c9cef6937f1856b5d89ad3dd29ee03ba5. The only runtime change is west tissue height `34.4 + 2.1*exp(-((y-134)/9)^2)`; east/south are unchanged. The smooth taper changes a connected region of the existing closed tissue mesh, not a separate patch or a hole around a ray. Top remains34.4..36.5 above bottom30, with the existing footprint/material/disposal path and all manifold/containment limits intact.

The new additive test requires all25 native-direction first hits across x385..389,y132..136 to be `root-west-tissue`, and rechecks the original397,146 cut crest. Every prior test and exposure ray remains. The earlier uniform36.5 attempt actually hid that cut crest and failed; `/workspace/room16-west-tissue-patch-tests.log` remains valid red evidence and must not be relabeled. The taper repairs that conflict geometrically.

Independent repeat of the same dense terminal-envelope probe finds west144/2397 tissue first hits (previously3/2397), with east23/2550 and south47/1564 unchanged. Denominators include exterior space, so these are comparative sampled hits, not surface-area percentages. Alongside the contiguous25-point native patch and preserved original crest, this resolves the specific sparse-west-exposure/coverage P2. Results `/workspace/room16-west-tissue-independent-probes.json`, script `/workspace/probe-room16-west-tissue-independent.mjs`; originals were not overwritten.

This is CPU geometric qualification only. It does not establish convincing torn-tissue material reading, native perceptual size or cabinet consumption, and does not supersede the preserved visual rejection. A fresh matched native review remains required.

Independent frozen-source validation for this addendum:41 focused tests pass across SwarmJunction/organicShell; `npx tsc --noEmit` exits0. Logs `/workspace/room16-west-tissue-independent-focused.log` and `...-typecheck.log`. Model/test SHA256 before and after the probe/test/typecheck sequence match exactly; recorded inventory `/workspace/room16-west-tissue-independent-source-before.json`. No new code blocker remains for the bounded shoulder/tissue candidate. No GPU or shipping edits were made.
