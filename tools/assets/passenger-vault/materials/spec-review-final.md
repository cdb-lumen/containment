# Passenger Vault material spec rereview

## Verdict

PASS for the bounded publishable candidate's SPEC review. The recovery closes the three prior source-receipt, inventory and documentation must-fixes. It faithfully reports chamber/carrier material evidence progress without waiving the approved material requirements.

This is not a full materials-gate PASS, a completed family-material PASS, permission to integrate or a release/merge approval. Publication may describe a reviewable, reproducible shell/carrier material candidate with retained evidence. Independent current code/pixel acceptance remains required before claiming an accepted visual sub-result. The parent owns that review and publication. No Git staging or publication was performed here.

Authority remains `approved-production-process.md`, lines 13–18 and 28–30, and `docs/design/passenger-vault-equipment-plan.md`, lines 40–60. Prior construction acceptance is preserved, not reopened. This rereview supersedes only the prior report's exact-candidate blockers, not its unaccepted visual requirements.

## Exact candidate and fresh checks

Worktree: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout`. Candidate receipts identify base `9f2f37a9b77dd44aef72296144feb26631c70091`; material additions remain uncommitted. Base commit alone does not identify the candidate.

| Receipt or source | Verified SHA-256 |
|---|---|
| `public/assets/passenger-vault/materials/manifest.json` | `2868457c3104a3d6044bee78b08499facc7c3f067c2f64695f5e9052139dedce` |
| `docs/art-evidence/passenger-materials/current/manifest.json` | `686671c2cf5aad4e040a9c21572021c79d76936509208f56e2e27846e113b09a` |
| `tools/assets/passenger-vault/materials.py` | `2c9d60ad55240e34a9ea4befc78fc631fa69bf19df560f2e0194b51f2c4c5546` |
| `scripts/passenger-material-evidence.mjs` | `414dbe2d93bf34e71edeeb98c298bdcb71fb987af20f9d1a29b3ec2fbfb81c5f` |

Fresh execution in this review:

- `python3 tools/assets/passenger-vault/verify_material_candidate.py` exited 0. Clean-root CPU regeneration matched all six GLBs, twelve PNGs and the manifest byte-for-byte. The checker verified twelve decoded RGB map hashes and PNG CRCs, construction source hashes, all provenance-listed source/document/import hashes and 381 pinned preservation files.
- The same checker verified exactly 27 unique current screenshots, their file hashes and viewport dimensions, nine matched camera groups and matching per-view inventories across neutral/material/wear. Every frame records 16 chambers, four carriers, 16 closed lids and 96 upward mesh segments, with no recorded WebGL errors or context loss. These are audited capture records, not a new browser execution.
- A separate CPU assertion pass checked all 540 per-instance records against the final capture script's stronger contract: valid family, one lid and six upward segments per chamber, zero of each per carrier, finite bounds and positive extent on all axes. It also checked stage/room/summary fields and proved that all 18 GLB/PNG hashes match the preserved previous asset receipt. Exit 0.
- `python3 tools/assets/passenger-vault/test_materials.py` exited 0, two tests passed. This verifies preserved construction positions, normals, indices and nodes, bounded finite UVs, material bindings, embedded PNG signatures and delivered hashes. It does not prove distortion-free UVs or visual material identification.
- `git diff --check` exited 0. Status shows the existing package test-script change and material additions, not new shipping-runtime edits.

## Prior must-fixes resolved

1. Source receipts are reconciled. The material manifest now matches the final generator and reproduces exactly. `recovery/previous-asset-manifest.json` preserves the stale receipt; asset bytes did not change. The new `current/` manifest matches the final capture-script hash and refreshed asset-manifest hash. Historical root-level evidence and its older manifest remain preserved rather than receiving substituted hashes. The documented fresh capture and its complete inventory-bearing records support the current candidate; the older evidence must not be cited as execution of the final script.

2. Inventory assertions have current evidence. The final capture script records unique family/translation instances and asserts individual lid/segment counts and finite positive bounds at lines 89–96. Those fields are present in every current frame and pass independent CPU rechecking. The manifest explicitly distinguishes physical mesh inventory from pixel-readable live-state cues. This closes the missing-inventory defect without converting 96 mesh segments into a readability result.

3. Material-specific reproducibility and credits are present. `tools/assets/passenger-vault/materials/README.md` documents dependencies, Blender 4.0.2 import, stdlib generation, clean-root reproduction, separate editable Blender import, immutable historical evidence and current audit commands. `public/assets/passenger-vault/materials/CREDITS.md` documents original procedural authorship, no third-party texture inputs, reused accepted geometry and the project's MIT license. The project `LICENSE` confirms MIT and copyright 2026 Lumen. Manifest decoded-map hashes and provenance hashes cover the generator, `material_scene.py`, blend, import receipt and import log. The retained Blender scene is correctly described as downstream editable source, not a claim that the older construction command alone reproduces these new textures. No normal map is claimed.

## Full materials gate remains failed or unproven

These are required follow-up acceptance items, not optional polish and not waived by this SPEC PASS.

- Causal wear remains unaccepted. Prior independent pixels did not establish readable shell wipe variation, latch hand wear or service tool marks. The recovery report still says material and wear look alike at its inspection scale. Different asset bytes or code implementing wear cannot pass the matched-light visual requirement.
- Full four-role PBR identification remains unaccepted. Shell/carrier contrast does not establish independently identifiable gasket, cradle/support and functional fittings. In particular, the dark gasket is not accepted merely because a material assignment exists. The current pixel reviewer must identify the required roles without labels.
- Living-occupancy readability remains unaccepted. Six named upward segments per chamber do not establish 16 readable cue sets. Portrait opening/F1 clipping, small cues and HUD occlusion remain reported limitations. The evidence must establish occupied-row, actor and route readability at the required gameplay framing. This does not impose a new demand that all 16 chambers fit into portrait opening.
- The whole-room shared-material cap explicitly fails: 12 current whole-package signatures exceed the ceiling of 8. Five candidate materials and the manifest's candidate-only remaining-slot figure do not cure that failure or establish available whole-room headroom.
- Whole-room budget acceptance is incomplete. Current all-family totals are 76,050 placed triangles and 1,658,400 GLB bytes. The 2,097,152-byte decoded texture figure assumes future inter-GLB sharing and mip allocation; it is not measured shipping storage. Five merged fixture meshes and diagnostic renderer counters do not establish the 48-added-main-pass draw ceiling. Actual installed sharing and measured package totals remain required.
- Distribution, monitoring and finish materials are outside this two-family slice. They have not passed their material requirements.

## Allowed progress claim and scope boundary

A faithful publication claim is:

> Bounded chamber/carrier material evidence progress on preserved approved geometry. Source receipts, current physical inventory and reproducibility documentation pass SPEC rereview. Current evidence contains matched neutral/material/wear frames; independent current code/pixel acceptance remains pending. Causal wear, complete PBR role identification, live-cue readability and the full materials gate remain open. The whole-package material cap currently fails at 12 against 8. NOT INTEGRATED RUNTIME.

The current manifest, README, credits and recovery report maintain these boundaries. They label encounter-disabled, teleported fixture views as unintegrated, full-room/closeup projections as diagnostic, renderer counters as diagnostic and portrait as emulation. The old report's shell/carrier/status contrast observation is legitimate prior evidence, not automatic acceptance of all refreshed pixels. This review establishes corrected evidence integrity and truthful scope, not a newly completed visual gate or a new geometry outcome.

No owner integration, real gameplay/video, lifecycle, physical-device performance, finished-room, release, merge or deployment acceptance is granted. None is a prerequisite merely to publish this bounded candidate for review; all remain prerequisites where required by their later gates.

## Review limits and file effects

Read the prior review, approved requirements, recovery report/provenance/verification, generator, capture assertions, material manifest, README, credits and license. No browser, GPU, Blender, full build or broad test suite was run here; recovery claims for those earlier runs are not recast as fresh independent results. No new pixel inspection was performed in this SPEC-only rereview.

Created only this report as authored work. The requested CPU verifier also rewrote `recovery/verification.json` with the same report content already inspected, as its implementation specifies. Its temporary regeneration directory was removed by the verifier. No code, construction asset, shipping runtime, Git index, commit or external record was edited. An initial batched-read helper was blocked by the profile; ordinary read and terminal tools completed the review. An initial credits lookup used the tools directory; the documented material credits were then found and reviewed under `public/assets/passenger-vault/materials/`.
