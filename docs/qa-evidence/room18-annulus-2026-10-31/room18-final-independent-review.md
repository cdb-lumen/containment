# Room18 final native encounter review

Bounded result: completed ordinary encounter, native dialogue Skip, reward and onward transition are supported; no new room-model/gameplay blocker found in the observed west/south/east play. **Evidence integrity correction remains required:** the current video hash differs from the manifest. Whole-ring/all-approach qualification also remains incomplete. This review grants no human approval or broad release acceptance.

## Independent evidence checks

Source589dba5fb272a0508e17706c98fbacc53489e3fb: all294 source-file hashes match exact Git objects; source-before/source-after are identical and clean, and current tracked production/test files are clean. Harness hash matches /workspace/campaign-desktop-joint-hud.mjs. Annulus model is byte-identical to original399872f. Exactly695 frame PNGs exist. Independent ffprobe finds695 decoded1280x900 frames at20fps; full ffmpeg decode succeeds without errors (/workspace/room18-independent-decode.log).

P2 evidence mismatch: manifest video SHA256 is3f67a2ef6f0dd71aab98b116727c88f0a2ebe65787f3533ccaf11a06d18cbf55, current combat.mp4 hashes3c162bed86f64aa8dbe6801ddb6973f31bdd2d50aed842a5cc687427f8a65c16. Regeneration may explain this, but it must be documented with a corrected sidecar/current-file provenance; do not claim the original manifest matches this file. This does not by itself invalidate the source-pinned PNG sequence or prove frame alteration.

Independently reran production geometry validation into separate files: /workspace/room18-independent-trace.json and .log:5640 enemy positions,5616 enemy sweeps,694 player sweeps, errors[]. Independently recomputed overlap/viewport checks from raw rectangles for all694 playing frames: no marine/HUD, panel/panel or body/panel offscreen violation. These are envelope/DOM checks, not all-enemy visibility guarantees.

## Actual pixel review

Inspected all18 contact sheets, covering every frame00000–00694, plus full-resolution00000,00199,00200,00500 and reward/route/onward PNGs. Ring shielding, segmented jacket/closed lid, radial mounts and solid central reservation remain coherent rough-model features. East instruments are readable as PASSENGERS ALIVE and NOT ARMED / MANUAL ONLY in native frames0 and500. No bright exposed core or automatic-arming narrative is implied. Readable indication is established; small internal instrument details are not separately qualified.

Frame199 retains expanded dialogue with native Skip;200 removes only the presentation while status/objective remain. Marine remains visible in the inspected clear approaches, but enemies overlap one another and some north/west actors are hidden under status HUD or clipped at viewport edges (e.g.199/200). Do not claim all actors or telegraphs unobscured. No new shielding occlusion of the marine was seen in the observed path. The pale circulation deck contrasts with the dark reservation and enemy silhouettes, although dense bodies/effects still obscure local contacts.

Terminal manifest and pixels agree on24 kills/0 remaining and reward at elapsed34.7667 simulation seconds. Reward is actual Infirmary; route text names Manual-control chamber and preserves explicit destruction-choice story; onward PNG shows that room playing. External font suppression is disclosed; decorative arrows/Pause may show fallback squares, while action text remains legible.

## Traversal and acceptance boundary

Raw path extrema: x56..1074.473,y357.046..806.572. Summed signed angular increments about(600,440) are+3.70233/-6.22390 radians. These are cumulative back-and-forth motion, **not two full circuits**. The player does not traverse the northern arc behind the shielding. The recording therefore cannot establish marine clearance/readability there, or both complete ring directions. Far/north arc geometry is visible from the south and enemies appear on it, but this is not the missing player approach witness.

After documenting the video regeneration/hash, this evidence is suitable for a clearly bounded rough-model integration and completed-encounter claim alongside the prior code/staged-art reviews. It is insufficient to mark whole-ring/all-approach acceptance complete. The remaining concrete witness is ordinary native north-arc passage and clockwise/counterclockwise traversal with the same camera/HUD/geometry, including player/telegraph readability behind shielding. It need not be mislabeled as already covered or replaced with another distant overview. No GPU or source changes performed. Parent reports exact-head CI success; this report does not independently certify remote CI.

## Video recovery addendum — mismatch resolved for recovered filename only

Independently verified `/workspace/room18-annulus-final/combat-recovered-from-pngs.mp4` SHA256 `3f67a2ef6f0dd71aab98b116727c88f0a2ebe65787f3533ccaf11a06d18cbf55`, exactly equal to the original manifest's recorded video hash. Independent full ffmpeg decode completed successfully. Verified the sidecar's unchanged manifest hash, all 695 retained PNG hashes and preserved mismatched `combat.mp4` hash. The recovery sidecar records the actual ffmpeg command and explicitly discloses the unknown prior modification of `combat.mp4`.

This resolves the encoded-deliverable provenance blocker by byte-identical recovery under a distinct filename; it does not rehabilitate the mismatched `combat.mp4`. Use the recovered filename when publishing qualified video evidence. Original mismatch and earlier finding remain preserved. The original recorder did not hash individual PNGs, so the sidecar's PNG hashes describe their current retained bytes. North-arc player traversal, two full ring circuits, all-enemy visibility and human approval remain unclaimed; prior bounded encounter/art observations are unchanged.
