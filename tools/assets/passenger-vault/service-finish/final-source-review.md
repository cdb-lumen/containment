# Final-source followup review

PASS for the final construction-family source and evidence. This report supersedes only the file identities in `final-review.md`. Its spec/code/pixel verdict and all runtime, material, visibility and release limitations remain unchanged.

## Checks

- The verifier change is exactly two explanatory comments and `and not Path(p).is_relative_to(OUT)` in the preservation filter. Removing those additions reproduces the previously reviewed verifier SHA-256 `45920967762a6f369acbb32cbd060a8f874a451e98a45de98b96ab417a333872`.
- The filter excludes only `tools/assets/passenger-vault/service-finish/` descendants, not the whole passenger-vault tree or the public GLB. Its current 683 protected tracked files match the receipt count. All 275 asset paths tracked at HEAD remain protected and byte-identical to HEAD, including distribution, monitoring, room-fit and earlier evidence. Files within OUT, including historical reviewer evidence, are outside this preservation assertion.
- Current receipt equals the parent's `flush-parent-verification.json`. Every receipt evidence hash and both checkout/retained-clean-root manifest inventories, sizes and artifact hashes match. All six recorded commands exited 0. Those recorded rebuild, layout and build results are not fresh reviewer executions.
- Authoring code, geometry tests and artifact wrapper retain their original reviewed hashes. Manifest fields outside the artifact inventory equal the staged, previously reviewed version. GLB bytes equal the staged version and retained clean-root export. Both decoded PNGs equal the staged and clean-root pixels, despite changed containers.
- Fresh CPU-only `PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_service_finish_artifacts.py` exited 0: two wrapper tests and all ten imported/source tests passed. Reopening the current blend produced the original semantic SHA-256 `9f84cc341124d2cadacdfa013c228ee666380a69bfaa62fe43324ce58d49c114`, also present in both current verifier source reports and the original receipt. No arbitrary Blender-state or blend-byte reproduction claim is made.

Decoded RGBA SHA-256 remains `d2acb0d3ff80fe04311370257a4ac5bc0b8fe6ca130afbee8012b97033e9a182` for top and `600669adbbe42bae8cad8c24d703fa540f28827630529f97ca462ed4d1032169` for oblique, each 1200 × 880. Pixel equality carries forward the original visual review; no new visual or runtime acceptance is implied.

## Current file identities

Paths are relative to `tools/assets/passenger-vault/`, except the public GLB. SHA-256 values were freshly computed.

| File | SHA-256 |
|---|---|
| `service_finish.py` | `5a691d565816815aa7b028743214ff6586cf39f4036a9b0ce4583c1731c3e5c2` |
| `test_service_finish.py` | `4674925abc43b3fbc7ed4d65a2b1b98424794dd52b4cb1ffc950649a24f8ba50` |
| `verify_service_finish.py` | `9da50b7d6731550f1e3eec4fe2f6e91460f86157ff87da8221950ce011a20679` |
| `test_service_finish_artifacts.py` | `abea873f170ab40344341f2051363660db002aabf52d12a8c437cb36c868c9e4` |
| `service-finish/service-finish.blend` | `2f514ac41b460dde0d5070857a87864ee59caa296b8218a3e1f73c276508f992` |
| `public/assets/passenger-vault/service-finish.glb` | `85517cc282d247b4a09d0daf3c56405b80f2417a5da1675e3186080ceb1337b6` |
| `service-finish/top.png` | `e4b2e97e10cc8538530cac186f7770dc3eac266ad6c6d67c29877ecd87a03cac` |
| `service-finish/oblique.png` | `9599b4a0e47ddc4b11cfc828e2e8ee8950fa0a105ab3a1473036dbbfd6557e9c` |
| `service-finish/manifest.json` | `4abc96dfe5380aa3a44f3c370300c7f21cc68e42e936ee8e69e359bb07e9d792` |
| `service-finish/verification.json` | `ee50b6cfa2695a2ad8e5a5b9cf4fe3a025c05afbfc27a84a8a227211213b0ab8` |
| `service-finish/verification.log` | `21fe7dc4fa2ceb5a5967280e3273af76c1528085a669310d3534ff1cc2eb051b` |

No blocker found. Added only this report. No implementation edits, regeneration, GPU work, commit or push.
