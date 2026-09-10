# Independent construction re-review

Verdict: PASS for the standalone first physical geometry slice, one carrier with four chamber placements. All three must-fix findings in independent-review.md are resolved for this candidate. The original review is preserved unchanged.

Reviewed checkout HEAD `e0ac00ffad50e5ebc1da9851833b18cfe6978212`, with untracked asset/source additions and the parent's package.json test-script change. This does not accept the complete equipment inventory, materials, shipping cameras, runtime or gameplay.

## Repair findings

1. Bed support passes. build.py seats the bed at z0.36 and preserves its z0.42 top. The actual chamber-section.png shows the bed against the pan rather than a continuous air gap. geometry_checks.py uses opposed BVH rays on nine interior patches of the actual bed and pan. The fresh imported-GLB test passes and moving the imported bed upward by 0.01 m is rejected. Recorded roundtrip gaps are within the 1e-5 m tolerance. This establishes mesh contact, not structural certification.
2. Fitting exposure passes. The wall has an applied Boolean seat with backing for the front plate; clamps expose outward faces at x +/-0.625. chamber-closed.png shows the complete recessed front plate and relief, plus the two camera-facing clamps crossing the lid seam. It does not show all four clamps. The imported-GLB check covers the plate and all four clamps with nine approach rays each, and separately rejects burial of each fitting. Intentional live relief is excluded as a blocker. That exclusion is appropriate for this plate and does not prove visibility from arbitrary cameras. Source envelope assertions retain the legal footprint.
3. Source documentation passes. README.md supplies dependencies, build/test commands, output-root handling and limits. references.md records URLs, construction decisions and that external consultation occurred during correction, not before initial modeling. Public CREDITS.md states procedural provenance without inventing third-party asset rights. The actual helper is geometry_checks.py, not construction_checks.py. Documentation and imports consistently use the actual name. This review checks the supplied record, not an independent reconstruction of browsing history or authorship.

## Independently inspected pixels

- evidence/chamber-closed.png: opaque domed lid, continuous seam, exposed front recess and camera-facing clamps.
- evidence/chamber-section.png: bed seated on pan, proxy below lid with overhead space, lower cradles present. This is a source-only diagnostic section, not an open shipping asset.
- evidence/row-closed.png: four closed chambers on one continuous carrier, with repeated exposed front plates and upper relief cues. No new visible assembly defect.

All six retained PNGs were independently counted and their headers measured at 1200 x 900. Only the three above were visually re-reviewed here; the others are hash-verified, not newly pixel-adjudicated. The parent's broader six-image review is separate evidence.

## Fresh verification

- `python3 tools/assets/passenger-vault/test_artifacts.py`: exit 0, 1 test passed. Manifest-listed artifact bytes and hashes match, required documents and six image entries exist, and GLB format/content assertions pass.
- `blender --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/test_geometry.py`: exit 0 on Blender 4.0.2, 7 tests passed. This imports actual chamber.glb and exercises contact/visibility plus six negative regressions in memory. It neither renders nor writes assets.
- Read build.py, geometry_checks.py, test_geometry.py, test_artifacts.py, README.md, references.md, CREDITS.md and the original review. package.json includes the artifact test in default npm test; the full npm suite was not rerun by this reviewer.
- No active Blender/reproducibility worker appeared in the process check before the focused import test. No new GPU/render/reproduction job was launched. Clean-root reproduction remains the parent's separate verification responsibility and is not claimed here.

No remaining must-fix was found in this bounded repair review. Existing cavity, envelope and source-topology assertions remain in the builder; their manifest results are not a new independent exhaustive topology/cavity probe. Materials/PBR/UV/wear, full-room routes, remaining equipment, shipping-camera readability, loading mechanics, medical/pressure certification, performance, runtime and release remain outside acceptance. No runtime edits, asset edits, commits or publishing were performed.

## Exact reviewed SHA-256 hashes

Paths are relative to repository root. This snapshot identifies the candidate, source, documents, evidence and preserved original review.

```text
7398e70744cf7f767cacb3db04de65f916eddc437dc38e5c41ab0b740af31c50  package.json
2ea26e72e699bf9c38f81e663810a11a46016c75140677c6f36d4b4a24b92f79  public/assets/passenger-vault/CREDITS.md
029a456996061b42355bff6f15a8ce274b9dbbeced00ea76f41fc972b7e8d840  public/assets/passenger-vault/chamber.glb
9e8610aa0de331ad527c26a09752b439bf34935e4c9bb448e3de09138416c11b  public/assets/passenger-vault/row-carrier.glb
67bfd5ac9da9ecc975701e0b96ac98c69577a18a7399a7d957dd12a545329d1e  tools/assets/passenger-vault/README.md
ddee78873e0fd6d86755ff3d5447ed5ae94e61cb864ebb71493446c00719bcf1  tools/assets/passenger-vault/build.py
7e0f3c9ee45570ba3d6dae290c33cbf3b5b477c58d806832dbfdaeaa2942322c  tools/assets/passenger-vault/evidence/carrier-rear.png
9ef031343a2c3b1fb6a9db82a72a184eca8ea17cf567546dd765e04478feb221  tools/assets/passenger-vault/evidence/chamber-closed.png
9f76194613b3035957c2b81670cc25c98800f9cd1eff0c6edd264804cace4933  tools/assets/passenger-vault/evidence/chamber-cutaway.png
fed8748de14045092d136751e00ec3794e1ac0e1a8f2c34bdd07e14a4b65f93a  tools/assets/passenger-vault/evidence/chamber-section.png
866606261ceebbb4f57872976b3c64eb1eebab020b644bc337084d19c0e57884  tools/assets/passenger-vault/evidence/row-closed.png
46d0229eb88527e927b6e97989ba3d7b06f8627e1d4fa18878cd5b888cb540c2  tools/assets/passenger-vault/evidence/row-top.png
d1bd55ce1c7e8124b85f1928419863041e57e3df0910955ea4e9b349d5e49cfa  tools/assets/passenger-vault/geometry_checks.py
1511b30d919f341b84c4bbd045352f16c463a3862759997d14ed5230ec33eb10  tools/assets/passenger-vault/independent-review.md
d923c2e9a60fe2daf9f1aa427e2eb1c50d19808c967f0a739325a351fd3f5dcc  tools/assets/passenger-vault/manifest.json
5f5bdeb2f80102deccea028f4cb2809109e88fa6e1b5aa792e7e68c7387ea2d2  tools/assets/passenger-vault/passenger-vault.blend
6b38e8b48cc9808239bcef42706911db23875776794b43de4f49a8cb53504f70  tools/assets/passenger-vault/references.md
c6f1f6c618ee9defda2590ca58149b48f964e2a2aa155274c15e76fe3438b3c2  tools/assets/passenger-vault/test_artifacts.py
d8bd869f89410fe1109191f21651e4ae841a7beaf3f39a284d5b778d8670b4a8  tools/assets/passenger-vault/test_geometry.py
ffdc418eeb9d1074ff48f874b46ac5dc81f7f12e38c2ce8559a9de9e74a8edfa  tools/assets/passenger-vault/test_reproducibility.py
```
