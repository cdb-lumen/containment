# Room14 integrated mechanical review

Reviewed merged HEAD `bde143d5ca782ab7628fdc0ac66cbb58e3587f7f` against current-main `0bd357c9d4215ea1978afbd226ea0e87b08eb7f6`, 2026-10-31. Read-only runtime inspection and CPU geometry diagnostics; no renderer or source edits by reviewer.

## P2 — four bearing housings do not meet their mounting pads

`src/render/ServiceShaftLanding.ts:91–92`: bearing center y94, height19 gives bottom84.5; pad center80, height7 gives top83.5. All four assemblies (x478/682, z411/449) therefore have an actual one-game-unit vertical air gap. The pad bottom76.5 overlaps the guide-head top77, so the missing connection is specifically bearing-to-pad. This contradicts the intended visible bearing-support construction. It is not a claim that the entire wheel floats or that no other geometry contacts the hub/guide.

Confirmed from instantiated mesh bounds and actual-triangle ray-parity queries at `(x,84,z)`, which find no sheave material in the gap. Minimal repair: extend each pad upward while retaining its existing bottom, e.g. center81/height9, and assert contact for both bearings on both wheels. Do not expand the room footprint or alter collision to repair this small local gap. AABB contact is sufficient for these unrotated boxes, but should not stand in for the rotated-member checks below.

During review the parent added uncommitted regression tests. Independent `npx vitest run tests/unit/ServiceShaftLanding.test.ts tests/unit/authoredTopology.test.ts` returned **1 failed, 20 passed**, with the new bearing-support test failing on the real gap. This is useful RED evidence, not an integrated green run. The runtime model was unchanged during this check.

## Other sampled contact chains are connected

Diagnostic script `/workspace/check-room14-mechanics.mjs` instantiates the production model through Vite SSR. `/workspace/room14-mechanics-diagnostic.json` records world-space witnesses, tested against each mesh's actual triangles with ray parity, including the rotated cylinders; these are not aggregate group-box overlaps.

- Roller to shoe: left `(485,12,442)` and right `(675,12,442)` lie inside the actual cylindrical roller and the corresponding shoe (also the guide flange).
- Rail to shoe: `(483,12,430)` / `(677,12,430)` lie in both solids.
- Shoe to frame crossbar: `(500,12,430)` / `(660,12,430)` lie in both.
- Weight to crossbar: `(580,8,430)` lies in both; side connector to crossbar `(510,12,430)` and connector to upright `(510,12,468)` also share solid volume.
- Sloping side tie to rear joint block `(470,65.03,286)` and to guide head `(470,68.97,429)` intersect actual solids. Source endpoint construction likewise places the diagonal trusses in their joint blocks. Exact cylinder end-plane points were avoided in parity witnesses to prevent boundary ambiguity.

These witnesses establish sampled contact chains. They do not certify bearings as engineered motion hardware, complete rope routing, structural loading, every hidden joint or native visual readability. The symmetric lower shoe/frame construction uses the same dimensions; a future persistent test should cover both elevations and both sides explicitly.

## Integration conflict review

The seven runtime/test-file delta versus main is scoped to Room14: builder, authored topology, renderer dispatch, dedicated tests, two topology snapshots and authored-topology coverage. `ServiceShaftLanding.ts` and its committed dedicated test are byte-identical to original PR79 head `0d8d257` before the parent's new uncommitted tests.

`DepthRenderer.ts` adds Room14 selection and append/bake handling while retaining current-main Atrium, Passenger Vault, Awakening and other existing branches. No shared camera/HUD/control/AI changes occur in this delta. `authoredTopology.test.ts` retains all five main room IDs and probes, adds Room14 as the sixth, and confines its full-boundary exterior-probe adjustment to Room14. The existing Atrium-specific navigation exception remains. No assertion weakening found in these conflict resolutions.

The bearing P2 remains open at this reviewed runtime. Native machinery/edge/depth readability and ordinary full-C-route combat qualification remain pending. No human art approval or full-release acceptance is inferred.

## Follow-up: P2 resolved by current uncommitted repair

Rechecked the frozen follow-up on the same integrated base. Each named pad is now center81/height9: bottom76.5 is unchanged, top85.5 overlaps bearing bottom84.5 by one unit. The x/z footprint, bearing position, guide head and collision are unchanged. Independent instantiated-mesh diagnostic `/workspace/room14-mechanics-fixed-diagnostic.json` records gap=-1 for all four bearings and finds the named pad's actual solid at each former gap witness `(x,84,z)`. The original P2 and RED evidence above are retained; the P2 is now **resolved**.

The added tests are additive. Original radius16/28/30 route coordinates and legal/blocked controls, brute/pickup/contact-damage simulation, model bounds, disposal and exposure checks remain intact. Radius38 is added to the same routes, and canonical endpoints/inward breach sweeps gain coverage. The deck test samples four barycentric interior points of every top triangle and probes both sides of the mouth/shoulder before and after batching, plus legal/blocked shot controls. This meaningfully improves agreement coverage without pretending finite samples constitute exhaustive polygon intersection proof.

Bearing tests check all four named pads, unchanged bottom height, a real ray through the former gap and bearing contact. AABBs are appropriate for these axis-aligned boxes. No existing assertion was removed to make the repair pass.

The new browser lifecycle test uses a real canvas with GPU/WebGL disabled, constructs three independent visits, and observes actual append→bake→dispose. It requires both canvas and data textures, all owned source/baked geometries, materials and textures disposed exactly once, textures live until retirement, eight baked buckets, and no shared MAT.steel disposal. This validates the previously unexercised canvas path; it is not a WebGL/context-loss test or a general test of every shared cached resource.

Independent rerun:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx vitest run tests/unit/ServiceShaftLanding.test.ts tests/ServiceShaftTextureLifecycle.test.ts tests/unit/authoredTopology.test.ts
```

Result: **22 tests passed in 3 files**, exit0. Log: `/workspace/room14-mechanical-independent-green.log`. No remaining blocking finding in this repair/test delta. Full required verification and native room acceptance remain separate pending gates.
