# Room11 / Room12 isolation regression correction

Independent semantic review, 2026-10-31, of the uncommitted test-only change to `tests/SafetyInterlockArchitecture.test.ts` in `/workspace/containment-room11-review`. **No blocking finding; the changed expectation is legitimate and does not waive Room12 acceptance.**

The old assertion required diagnostic-gallery to equal generic engineering. That was true before Room11's intentional authored model/architecture dispatch existed; it is now contrary to the branch's intended behavior. Inspected preserved red log `/workspace/room11-interlock-isolation-red.log`: only this equality failed, with the four Room12 shell tests passing. Keep that run and the reported CI failure recorded as failures.

The correction separates the two contracts. Unknown/empty engineering IDs still compare as generic fallback, with absence of the Room12 shell. Actual diagnostic-gallery dispatch must now match the explicit DiagnosticGalleryModels plus DiagnosticGalleryArchitecture builders through production appendEnvironment. The comparison includes mesh order/names, complete world matrices, position arrays, index arrays and colors, plus a required physical ship-cutaway witness. Unexpected Room12 meshes, omitted Room11 builders or generic fallback would fail the full signature. The retained no-Room12-shell name assertion is supplementary: flattening can discard group names, so the full mesh signature provides the stronger isolation evidence.

All four direct Room12 assertions are unchanged: rear-wall/deck bounds and named features, slot/channel face separation, owned-material budget and exact disposal without shared-palette mutation, and five baked draw meshes with preserved bounds. This change alters no runtime, geometry, collision or existing dedicated Room11 test. Expected geometry is sourced from the direct builders because this is a dispatch-composition test; it does not replace independent geometry/art tests with self-derived acceptance.

Independent CPU verification:

```sh
npx vitest run tests/SafetyInterlockArchitecture.test.ts tests/DiagnosticGallery.test.ts
```

17/17 passed in two files. Log `/workspace/room11-interlock-isolation-independent.log`. No renderer, runtime edit or formal approval. Exact CI rerun and native/art requirements remain separate.
