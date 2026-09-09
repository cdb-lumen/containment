# Passenger Vault material code/pixel review

## Verdict

PASS for publication as bounded chamber/carrier material progress. No new must-fix defect blocks that narrow claim in the exact reviewed candidate. The visible accepted sub-result is pale closed shells separated from dark row carriers, with stronger cyan-on-dark status contrast. This is not acceptance of finished family materials, causal wear, complete material-role identification, living-occupancy readability, the full materials gate, integration, merge or release.

The whole-package material gate still FAILS at 12 signatures against 8. All previously required follow-up gates remain required. NOT INTEGRATED RUNTIME must accompany publication.

## Exact candidate and independent checks

Repository `/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout`, HEAD `9f2f37a9b77dd44aef72296144feb26631c70091`, with dirty material additions and the package test-script addition.

| Receipt | Independently checked SHA-256 |
|---|---|
| `public/assets/passenger-vault/materials/manifest.json` | `2868457c3104a3d6044bee78b08499facc7c3f067c2f64695f5e9052139dedce` |
| `docs/art-evidence/passenger-materials/current/manifest.json` | `686671c2cf5aad4e040a9c21572021c79d76936509208f56e2e27846e113b09a` |

Read the spec rereview, scoped README, recovery report, generator, material test, editable-scene importer, verifier and complete capture script. Independently executed read-only CPU assertions rather than the full verifier, as requested:

- Enumerated and decoded exactly 27 current PNGs. Checked every SHA-256, viewport, unique filename and exact requested platform/view/stage matrix. No extra or missing PNGs.
- Checked nine matched camera, player and inventory groups across neutral/material/wear. Every frame has 20 unique family/translation records, exactly 16 chambers and four carriers. Each chamber has one lid and six upward segments; each carrier has neither. All recorded bounds are finite and have positive extent. Stage and room identities agree. Recorded WebGL error arrays are empty and context-loss flags false. These are checks of retained capture data, not fresh browser execution.
- Checked all 18 delivered asset-file hashes and sizes, all construction-input hashes, final generator and capture-script receipt links, 16 provenance hashes and 381 preservation hashes.
- `python3 tools/assets/passenger-vault/test_materials.py` passed both tests. Separately checked scene selection, equal primitive counts and valid per-primitive material indices against manifest assignments for all six GLBs, covering 141 mesh/primitive records. This supplements omissions in the existing test.
- `node --check scripts/passenger-material-evidence.mjs` and `git diff --check` exited 0. The package diff only appends the material CPU test to the existing test command.

No GPU, browser, Blender, generation, broad test suite, build or full verifier was run. Clean-root reproducibility remains the prior spec/recovery result, not a new execution claimed here.

## Complete pixel matrix

All filenames below are relative to `docs/art-evidence/passenger-materials/current/`. Each row contains the exact three files checked. All 27 were triaged on newly generated contact sheets. The 21 opening/F1/south-loop/closeup frames were also loaded individually at their native dimensions. The six full-room frames received sheet-level diagnostic inspection only. There is no portrait closeup in the requested matrix.

| View | Neutral | Material | Wear | Inspection |
|---|---|---|---|---|
| Desktop opening | `desktop-opening-neutral.png` | `desktop-opening-material.png` | `desktop-opening-wear.png` | Native 1280×900 |
| Desktop F1 | `desktop-F1-neutral.png` | `desktop-F1-material.png` | `desktop-F1-wear.png` | Native 1280×900 |
| Desktop south-loop | `desktop-south-loop-neutral.png` | `desktop-south-loop-material.png` | `desktop-south-loop-wear.png` | Native 1280×900 |
| Desktop full-room | `desktop-full-room-neutral.png` | `desktop-full-room-material.png` | `desktop-full-room-wear.png` | Diagnostic sheet |
| Desktop closeup | `desktop-closeup-neutral.png` | `desktop-closeup-material.png` | `desktop-closeup-wear.png` | Native 1280×900, diagnostic projection |
| Portrait opening | `portrait-opening-neutral.png` | `portrait-opening-material.png` | `portrait-opening-wear.png` | Native 390×844 |
| Portrait F1 | `portrait-F1-neutral.png` | `portrait-F1-material.png` | `portrait-F1-wear.png` | Native 390×844 |
| Portrait south-loop | `portrait-south-loop-neutral.png` | `portrait-south-loop-material.png` | `portrait-south-loop-wear.png` | Native 390×844 |
| Portrait full-room | `portrait-full-room-neutral.png` | `portrait-full-room-material.png` | `portrait-full-room-wear.png` | Diagnostic sheet |

No blank, loading or wrong-room frame was apparent. Historical root-level screenshots were not used for current pixel acceptance.

## Pixel findings

### Accepted bounded progress

Desktop opening and F1 visibly change from nearly uniform pale rows to separate pale rounded chambers on charcoal carriers. The gaps and carrier border are easier to read. The actor remains distinct in the central route, and all four chamber groups are visible in these desktop frames. Material and wear preserve the same silhouettes and placement.

The native diagnostic closeup is the strongest evidence. Pale domed lids separate clearly from the dark carrier. Cyan waveform lines are legible against their dark recesses, unlike the weak neutral contrast. This accepts contrast, not a complete physical-material identification or a gameplay occupancy gate.

Southern desktop chambers retain upward-facing waveform marks after the row rotation. In opening/F1/south-loop material frames, those marks remain visible near the far ends of the southern lids. They are small, but not absent. The source inventory is therefore supported by some visible southern cues, not evidence of universally readable living status.

### Still unaccepted, required before broader approval

1. **Causal wear is not demonstrated.** Even the native closeup material/wear pair does not let me identify shell wipe history, latch hand polishing or service-tool contact. Broad surfaces look effectively alike. The generator contains localized roughness/color formulas, but source intent and unequal bytes are not visual acceptance. Stronger evidence and/or treatment is required for that gate.
2. **The required material roles cannot all be identified from these pixels.** I can distinguish the pale shell and dark carrier, plus status recesses. I cannot confidently identify a rubber gasket as rubber or distinguish metallic fittings and the cradle's physical material without consulting assignments. Closeup shell shading is broad and fairly flat. No complete four-role PBR PASS.
3. **Portrait occupancy evidence remains limited.** Opening/F1 clip the equipment at the right edge; the ammunition panel covers substantial southern chamber bodies. South-loop shows rows cut at both horizontal edges, with the same panel over the lower-right equipment. Some waveform marks remain visible above the panel, but they are tiny. The actor and local empty route remain visible in these static frames. That does not establish occupied-row comprehension or moving-gameplay readability. This is not a new requirement to fit all 16 chambers into portrait opening.
4. **Full-room diagnostic framing is not a workaround.** The portrait full-room sheet shows equipment shrunk into a small central room. It proves neither shipping framing nor cue readability.
5. **Whole-room acceptance remains blocked.** The manifest reports 12 material signatures and a false whole-package budget flag. Five fixture materials/merged meshes do not waive the eight-material cap or prove the added-main-pass draw ceiling. Texture sharing, installed memory, other-family materials and shipping performance remain unmeasured here.

These findings prevent broader acceptance, not truthful publication of the bounded contrast result.

## Code and fixture assessment

`materials.py:78–117` appends UV/image buffers and replaces material bindings without rewriting accepted position/normal/index data or nodes. The executed contract and supplemental primitive checks support this exact candidate. Base color and packed roughness/metallic textures are assigned separately; gasket and status use factors. No unsupported normal-map claim was found.

UVs use dominant-normal projection normalized within each primitive, with atlas halves selected by role/name at `materials.py:85–94`. Bounded finite UVs do not prove distortion-free mapping, consistent texel density or credible wear placement. The same formulas repeat across cloned chambers. These limits matter to the unfinished wear gate, but no visible defect defeats shell/carrier contrast.

`passenger-material-evidence.mjs:21–41,69–74` creates an encounter-disabled temporary transformed build, skips row blockouts and adds material variants only in that fixture. It retains production renderer/composer and uses shipping framing for opening/F1/south-loop. Full-room and closeup explicitly modify projection. Variant changes render the frozen composer, while inventory/camera assertions and current receipts support matched comparisons. Geometry is merged by material name, which is valid for this fixed shared palette but would need a stronger material identity contract if extended to heterogeneous assets. Diagnostic draw counts must not be sold as shipping draw budgets.

`material_scene.py` imports delivered wear GLBs into a factory-startup scene, validates finite data and image color spaces, links copies into rows, packs images and saves a separate material fixture. It does not open the construction blend. The retained blend/import hashes match provenance; this review does not claim a fresh Blender inspection.

The existing material tests are useful geometry/UV/hash smoke contracts, not a materials acceptance gate. They zip primitives without asserting equal primitive counts and do not directly assert each binding against the intended role. The supplemental checks passed those exact-candidate conditions. Their budget assertion uses the candidate count, not the known-failing whole-package count. Keep the full-gate failure explicit rather than interpreting green tests as its acceptance.

### Tooling cautions, not blockers for retaining this candidate

- The capture script's no-argument default at line 9 points at the historical evidence root and can overwrite old screenshots/manifest. Lines 67–72 and 107 also clear/remove `temporary-build` under the selected output. Follow the scoped README's fresh destination command. Do not run it without a fresh explicit destination. A future tooling hardening change should refuse existing evidence destinations before capture.
- Browser launch uses `--no-sandbox` and software-renderer flags. Treat this as trusted-local fixture tooling, not a browser command for untrusted content or a physical-device benchmark.
- The full verifier writes `recovery/verification.json`; it is not a purely read-only audit. It was intentionally not run here. Its source checks aggregate inventory counts but omits some per-instance and bounds checks present in the capture script; this review independently checked those stronger conditions in every retained frame.

## Publication wording and file effects

Suggested bounded statement:

> Independent code/pixel review accepts visible shell/carrier separation and diagnostic status contrast on preserved chamber/carrier geometry. The 27-frame current evidence set and source receipts pass independent CPU integrity checks. Causal wear, complete PBR-role identification, gameplay occupancy readability and the full materials gate remain unaccepted. The whole-package material cap fails at 12 against 8. NOT INTEGRATED RUNTIME.

Created only this report as the requested authored deliverable. Created two temporary review contact sheets under `/tmp/pv-review-desktop.jpg` and `/tmp/pv-review-portrait.jpg`. No implementation, asset, receipt, construction file, Git index or external system was edited. No execution blocker encountered.
