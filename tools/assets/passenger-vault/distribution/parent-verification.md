# Distribution family acceptance

PASS for two source-only distribution banks after independent spec, code and pixel review. This is a construction gate, not material, runtime or release acceptance. Story and whole-room layout remain the previously passed gates; no layout or campaign changes were made.

The parent read the builder and independent review and inspected all five native PNGs. The sealed front panels, low south variant and seated pump/exchanger construction are visible. Whole-room placement retains open circulation around the accepted rows. The foreground wall hides the south service face in that overview; the separate south image shows it. Grain and faint fittings limit small-detail claims. Shipping visibility remains unverified.

## Fresh parent execution

- `PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_distribution_reproducibility.py` exited 0. Clean-root Blender build, imported-geometry fault tests and CPU artifact check each exited 0. Both new GLBs and both accepted row GLBs matched bytes; all five decoded PNGs matched at 1200 by 800.
- `PYTHONDONTWRITEBYTECODE=1 npm test` exited 0. 493 Vitest cases passed, one skipped; both Node cases and all three Python artifact suites passed.
- `npm run build` exited 0. Existing large-chunk warning remains. No browser smoke or full `npm run verify` was run for this source-only slice.
- The new CPU artifact check is included in canonical `npm test`. The Blender fault run rejects nine faults for each variant.

The independent reviewer checked the author's retained clean root `/tmp/passenger-distribution-clean-tjr2rj7x`. Parent rerun used `/tmp/passenger-distribution-clean-p9ow9l_q` and refreshed only clean-run logs and `reproducibility.json`. The original `reproduction.log` retains the author's execution. Builder, tests, GLBs and reviewed image bytes are unchanged. Parent logs live in the worker workspace under `passenger-vault/distribution-parent-{reproduction,tests,build}.log`.

Current exports are intentionally unbatched, with 145 meshes per bank. They must meet the later room-wide draw-call and material budgets before runtime use. Monitoring, flush services, materials, loading safety, finished shipping-camera evidence, real gameplay video and release gates remain open. No merge or room-2 deployment is authorized by this checkpoint.
