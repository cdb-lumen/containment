# Independent material-budget review

## Verdict

Bounded PASS for the seven-file candidate's exported palette ceiling of at most eight unique material definitions. No must-fix issue found within this CPU/code review scope. This is not full material, PBR, wear, visual, runtime, or release acceptance.

Reviewed worktree `/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout` at HEAD `bcbae8053a68623e4e2f46487582ab1015b6e3c3`. The only tracked change against HEAD was `package.json`; candidate assets, scripts and receipts were untracked. No repository source or asset was modified by this review. No GPU, browser, commit, or external publication was used.

## Fresh verification

- `PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_material_budget.py`: exit 0, four tests passed in 0.079 seconds. Includes byte preservation, semantic palette bindings, source/output hash receipts and clean temporary-root reproduction. Temporary outputs were outside the repository and cleaned by the test.
- `PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/verify_material_budget.py`: exit 0, reports 12 to 8 unique definitions and 12 to 8 unique used definitions.
- A separate inline Python audit, without importing generator, test or verifier code, independently decoded all fourteen source/candidate GLBs. It validated GLB magic/version/file lengths, aligned JSON and BIN chunk lengths, buffer size, triangle modes, index-count divisibility and material references. It resolved material texture identity using embedded image hashes, MIME type and sampler values. It independently obtained the same counts below and verified whole binary and all non-material JSON equality for every pair. Exit 0.
- `git diff --check`: exit 0.

| Measure | Source package | Candidate |
|---|---:|---:|
| Unique material definitions, all slots | 12 | 8 |
| Unique used material definitions | 12 | 8 |
| Selected seven-GLB bytes | 1,658,400 | 1,657,628 |
| Placed triangles, chamber x16 and carrier x4 | 76,050 | 76,050 |

The placement total uses the documented multiplicities; it is not a runtime draw or scene-capture measurement.

| Family | Triangles per GLB | Material slots | Independently counted primitive bindings |
|---|---:|---:|---|
| chamber | 3,620 | 5 | shell 3; matte gasket 4; carrier 2; metal 6; live cyan 12 |
| row-carrier | 1,504 | 5 | carrier 12; metal 8 |
| distribution-north | 4,860 | 3 | recess 43; enclosure 16; mechanism 86 |
| distribution-south | 4,860 | 3 | recess 43; enclosure 16; mechanism 86 |
| monitor-north | 684 | 3 | recess 6; enclosure 12; mechanism 7 |
| monitor-south | 684 | 3 | recess 6; enclosure 12; mechanism 7 |
| service-finish | 1,026 | 2 | recess 13; enclosure 13 |

## Why the budget result is legitimate

`material_budget.py:28-44` maps named gaskets/panel seams to recess, shells/cover markings to enclosure and mechanisms to mechanism. Unknown ancillary names fail generation. The three definitions have distinct base-color values of 0.16, 0.48 and 0.32, with metallic 0, roughness 0.72 and double-sided rendering. Each is actually bound to primitives. These are meaningful authored-role distinctions at the data level, not three unused labels or a material-removal loophole. Their visual adequacy remains unverified.

`material_budget.py:47-61` changes only material definitions. Independent comparisons confirm original slot counts and every primitive binding remain intact, together with nodes, scenes, hierarchy, accessors and all binary geometry/UV/image data. Chamber and carrier files are byte-identical to prior wear exports, preserving all five existing definitions. The carrier's unused slots remain included in the full-package count; excluding them does not manufacture the result.

Eight means eight distinct resolved definitions across the package, not eight serialized material objects, runtime resources or draw calls. Repeated definitions and separate GLB-local slots still exist. The documented caveat is necessary and correct.

## Code, tests and documentation

- `test_material_budget.py:43-52` counts the complete seven-family package, including unused definitions. Lines 55-63 verify that changed embedded image content changes the signature while material renaming does not. Lines 65-90 enforce unchanged chamber/carrier bytes and exact ancillary non-material JSON/binary preservation, plus explicit palette roles. Lines 92-107 check receipts and clean-root reproducibility.
- `verify_material_budget.py:33-41` correctly limits its status to exported count and reports incomplete visuals and unverified runtime sharing. Its decoder/signature comes from the regression test, so it is separate from the generator but not independent of that test. This review supplies an additional independent parser/count check.
- The GLB readers and signature resolver are specialized to the current embedded-image, explicit-sampler, JSON/BIN assets. They are not general-purpose glTF validators. Independently checking the current files found no invalid container or unsupported feature that undermines this result. Future alternate GLB structures should get parser coverage before reuse.
- The standalone verifier checks counts and triangle totals, while stronger geometry and semantic preservation checks live in the test suite. Use both commands for this acceptance scope.
- `package.json` only appends `python3 tools/assets/passenger-vault/test_material_budget.py` to the existing normal test chain. It does not wire the candidate into runtime or remove prior checks.
- Inspected `materials/budget-recovery/REPORT.md`, preservation receipt, relevant RED/GREEN/test/build log evidence, and candidate credits. Report lines 7, 28, 39 and 54-60 correctly distinguish candidate-count success, selected-package bytes, historical evidence and incomplete visual/runtime gates. Credits likewise state that ancillary PBR is unfinished and the candidate is not integrated.
- Stored npm evidence reports 515 Vitest passes and one skip, the chained four-test suite passing, and a successful build with a chunk-size warning. Those are author receipts, not fresh independent full-suite/build runs. This review freshly ran only the focused CPU commands and independent audit above.

## Gates still open

Changed ancillary base colors and service-finish roughness invalidate any inference from old screenshots. No new pixels were accepted here. Full PBR-role identification, causal wear, matched-light and gameplay-scale visual acceptance, occupancy/live-cue readability, actual resource sharing, draw-call and decoded-memory budgets, runtime integration/lifecycle and device performance remain open. Do not promote this bounded PASS into any of those gates.

Only this independent review file was created. No must-fix blocker was found for the stated palette-budget outcome.
