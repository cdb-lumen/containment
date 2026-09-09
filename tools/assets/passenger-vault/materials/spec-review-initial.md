# Passenger Vault chamber/carrier material spec review

## Verdict

Reviewable as a bounded material candidate. NOT a materials-gate PASS. The retained pixels support new shell/carrier and live-graphic contrast, but not accepted causal wear or complete PBR identification. Source/evidence provenance must be reconciled before signing an exact current candidate. Runtime integration is not a prerequisite for this bounded review.

Authority is `approved-production-process.md`, lines 13–18 and 28–30, and `docs/design/passenger-vault-equipment-plan.md`, lines 40–60. Construction approval is preserved, not reopened by this review.

## Snapshot and independent checks

Reviewed worktree `/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout` at HEAD `9f2f37a9b77dd44aef72296144feb26631c70091`, with uncommitted material additions and the package test-script change. HEAD alone does not identify this candidate.

- Asset manifest SHA-256: `d09fca43f75116f103c876942aa1fd14faa71e788fe7596c404dd417b6658852`.
- Evidence manifest SHA-256: `d97999e364baad31b78c347c9a16408b2d40dc5fa8a01b8c76ac2d71d3cbcde9`.
- Ran `python3 tools/assets/passenger-vault/test_materials.py`: two tests passed. These compare exported positions, normals, indices and nodes against original construction, check finite bounded UVs, embedded PNG signatures, material bindings and GLB hashes. They do not prove visual wear, proper normal orientation, distortion-free UVs or full-room budgets.
- Independently rebuilt with current `materials.py --output-root` into a temporary directory using CPU-only stdlib generation. All declared GLB and PNG file hashes matched the delivered files. No construction asset was rewritten.
- Verified all declared asset/source-GLB hashes and all evidence PNG hashes. The complete matrix has 27 unique PNGs: three stages at five desktop views and four portrait views. PNG dimensions match their declared 1280×900 or 390×844 viewport. Camera records match across each three-stage comparison.
- Inspected actual desktop neutral/material/wear closeups, desktop wear opening and full-room, and portrait wear opening/F1. This is a spec review with sampled pixel inspection, not complete independent code/pixel acceptance of every frame.

## Must fix before exact candidate acceptance

1. **Reconcile stale source receipts.** The material manifest records generator hash `ed304e0b2230b1bcfc3a5d63dce1305f6a3a9ed3264a3c153534a52410c91d0d`; current generator hashes to `2c9d60ad55240e34a9ea4befc78fc631fa69bf19df560f2e0194b51f2c4c5546`. The evidence manifest records capture-script hash `f852ec480fa122d825872c6769070c2dae3a802cad8c3b5e1afe189433fd02b2`; current script hashes to `286e90bec377277d596c353c10e87a722d77acddafaa14f53ef50f5901cc4c15`. Current exports reproduced exactly, so the generator discrepancy does not by itself require a new render. Preserve the old receipt and document the verified reconciliation. For capture changes, retain/recover the actual producing source and explain the difference, or recapture affected evidence from frozen source. Never merely substitute today's hash for the script that produced yesterday's images.

2. **Do not claim current inventory assertions ran in the retained capture.** Current `passenger-material-evidence.mjs`, lines 30–38 and 64–65, emits per-instance bounds, closed-lid and upward-segment inventory. None of the retained snapshots contains `inventory`; they contain only passenger/carrier summary counts. The desktop overview independently shows four rows of four closed chambers, but that cannot validate execution of the newer count checks. Refresh or separately verify these checks and identify their receipt honestly. Keep physical instance counts separate from pixel-readable cue counts.

3. **Add material-specific reproducibility/provenance documentation.** `CREDITS.md` still describes a geometry-only slice with no delivered textures; the inspected package README does not document this new material production path. Add a scoped material record covering original procedural texture authorship, project licensing, accepted geometry inputs, build order and commands, dependencies/Blender version, decoded-map hashes, and hashes for `material_scene.py`, the material blend and its import receipt. Do not rewrite historical construction claims as if they covered the new maps. The stdlib generator is acceptable in principle; it must be documented alongside the Blender source/import path rather than advertised as already reproducible by the old construction command alone.

## Visual findings and material requirements still open

- The three desktop closeups show a real neutral-to-material change under matching framing. Off-white closed shells separate clearly from the dark carrier, and cyan waveform shapes separate from their dark recesses. Desktop opening shows the actor, circulation and all four occupied rows. No exposed passenger, rust, blood, broken seal or abandonment treatment is visible.
- Material and wear closeups look effectively alike at ordinary inspection scale. I cannot identify meaningful wipe variation, latch hand wear or service tool marks in these pixels. Different PNG/GLB bytes are not a causal-wear pass. Obtain visibly legible, restrained, use-localized wear under the same lighting, with closeups that actually expose the latch/union/service regions. Do not brighten the room or distress the whole shell to manufacture a difference.
- The current frontal closeup does not let me reliably identify elastomer gasket, cradle/support material and functional metal fittings independently. Shell/carrier colour separation is accepted as an observation, not complete four-role PBR acceptance. Additional matched diagnostic views may establish these hidden roles, but cannot replace gameplay-scale evidence.
- Portrait opening/F1 retain actor and an open route, but clip the rows at the right edge. The waveform cues are tiny and the weapon HUD obscures southern equipment. These frames do not establish 16 readable live-state cue sets or robust portrait living-occupancy recognition without relying on explanatory text. Preserve this as unresolved for independent pixel review, not a failed construction finding. No demand to fit all 16 chambers into portrait opening is implied.

## Scope, budgets and legitimate progress

Delivered material scope is two reusable families, six alternative-stage GLBs and twelve original texture PNGs, presented as 16 chambers plus four carriers. Distribution, monitoring and finish materials are not delivered by this slice. The fixture retains service blockouts, disables the encounter and teleports the actor. Its manifest correctly labels it NOT INTEGRATED RUNTIME; full-room and closeup views are diagnostic. Keep those labels in every report and PR claim.

The asset manifest reports 76,050 placed triangles and 1,658,400 GLB bytes for the candidate plus existing other-family assets. It reports five candidate materials but twelve current whole-package signatures, explicitly failing the eight-material ceiling. Its 2,097,152-byte texture estimate assumes future inter-GLB sharing; this is not measured shipping allocation. Five merged fixture meshes do not establish the complete package's 48-added-main-pass-draw ceiling. Retained `drawCalls` rise between stages despite identical material/wear mesh counts and are not a clean added-main-pass measurement. Label these counters diagnostic and keep the whole-room budget gate open.

What can qualify as progress now is new, independently observed gameplay-scale shell/carrier/status contrast on preserved approved geometry, plus independently reproduced material assets. Record it as **bounded material evidence progress, wear and full materials gate open**. It is not a completed family-material PASS merely because the candidate is reviewable. After provenance reconciliation, full independent code/pixel review may accept a narrower PBR sub-result only for roles its actual pixels establish.

No integration, real gameplay/video, lifecycle, physical-device performance, release, merge or deployment acceptance is granted. Those later gates remain open; none must be completed merely to review this candidate.

## Review limits

No implementation edits, commit, push, browser launch, Blender execution or GPU work. Only this report was written. One CPU audit initially expected the newer inventory field and stopped with `KeyError`; a follow-up read confirmed that every retained snapshot lacks it. The author may be completing capture fixes concurrently. This verdict applies to the exact manifests above; changed receipts need follow-up review.
