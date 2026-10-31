# Room16 stage2 parent review

PASS for corrected rough model placement, not finished room art or human acceptance.

The parent inspected both revised original PNGs at 1280 by 900. The three-root silhouette, central dark cavity and surrounding distributor remain distinct. The model fills the intended northern location while leaving the southern combat space and northern bypass open. The overview shows a broken far-wall beam and its supported lower end. Its separation is now physical rather than a dark patch. Straight repeated plates and plain sidewalls are still rough forms; organic construction and finished materials remain later-stage work.

The first independent review failed the original model's fallback-height shot coherence and called out weak gantry damage. Those original PNGs, source copies, source hashes, review and failed regression logs remain intact. The parent reproduced both defects before changing source. The repair raises only the Room16 sealed body to the demonstrated projectile plane, compresses the upper fittings and breaks the gantry end. The stage1 footprint, routes, anchors, camera envelope and shared systems are unchanged. Independent re-review passed the corrected source and pixels.

Actual final commands passed:

- `npx vitest run src/render/SwarmJunction.test.ts`: 10 tests.
- `npm test`: 769 Vitest tests passed, one skipped, plus the required Node and Python asset checks completed successfully.
- `npm run build`: TypeScript and Vite passed, with the existing large-chunk warning.
- `npm run test:room-evidence`: passed on the initial candidate. Its scripts and affected inputs are unchanged by the two-file model correction.
- Independent focused review: 81 tests across five files passed on the corrected candidate.
- Canonical room-evidence capture ran for Room16 only with `--gameplay-all --viewport=desktop --verify-all`. The corrected capture exited zero, preserved its complete source pins and left no owned processes. The parent checked both images and their manifest.

Tests cover exact XY footprint, radius16/28 swept routes and sampled connectivity, all other template equality, material batching, pre/post bake bounds and occupancy, resource disposal, the supported gantry break and the demonstrated 0.95-height shot case. They do not establish every weapon muzzle height or grenade arc. Earlier aggregate failures, the implementation child's interrupted test run, initial review failure and the changed candidate height assertion are retained, not recast as passes.

These images are controlled simulation with staged actors and production camera/composer, without DOM HUD. The overview has fitted framing. They are not ordinary live gameplay, three-arm encounter stress, mobile/touch, full browser verifier or release evidence. No shared engine, camera, HUD, AI, other-room art, human acceptance, merge or deployment change is part of this stage.

Next: room visuals only after the guard consumes the exact receipt and emits a new stage permit.
