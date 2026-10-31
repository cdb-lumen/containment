# Room10 stage3 independent review

Verdict: PASS for bounded stage3 shell, materials, major forms and static composition. No blocking finding in the final candidate. This is not human acceptance, final room acceptance, combat validation or release approval.

Reviewed against `async-rollout-worker-prompt.md` and `map-model-production.md`. Base is `7f4c842f01532292dcd878a3949b83408c74b412`. I inspected the complete runtime/test diff, worker report, capture result and all four original PNGs through vision_analyze. I ran CPU-only checks. No source, guard, commit or publication changes were made.

## Actual pixels

All four originals are distinct 1280 by 900 captures. Their SHA-256 hashes match capture-result.json. The five recorded source hashes match the current checkout, and both changed-file snapshots match current source bytes.

- `overview-static.png`: The six-part radial crown surrounds an open central feed. The pale lip and small blue-white center remain exposed, with no roof or shield obscuring them. The elevated dish and its supporting frame sit at the far perimeter. The southeast desk is separate from the crown. Floor joints, quiet side strips and perimeter panels establish the room without drawing attention away from the equipment.
- `desktop-entry-static.png`: Pale covers and darker internal channels read as separate layers, not a single flat pedestal. The central feed remains the strongest shape. The dish top and part of the desk fall outside this framing, so this image alone does not establish those whole objects.
- `desktop-north-static.png`: The crown spacing and open center remain clear. The northern truss has visible feet and cross-bracing. The full dish is cropped here, but is present in the overview. No visible missing batch or detached fixture appears.
- `desktop-south-static.png`: The southeast desk has a readable control face, pale side pieces, restrained instrument bars and a grounded dark body. The crown and floor retain a consistent material hierarchy. No obvious floating or clipping defect appears in the visible major forms.

The room reads as cool pale ceramic and subdued alloy against a dark blue-gray deck. The alloy is fairly matte in these captures; a distinct brushed grain is not demonstrated. The dish bowl is shallow and visually plain from above. Those are model/material refinement observations for stage4, not reasons to fail this stage. The passive bars do not announce receipt of the warning. The visible objective still says to defend the uplink until the warning is received.

HUD overlap, mobile visibility and detailed object finish were not used as art gates. These are paused, staged runtime views. The overview has capture-only framing; the desktop views retain the shipping camera and HUD. Empty combat space is not evidence of crowd readability or survival.

## Technical scope and checks

Only `src/render/TransmissionChamberRoom.ts` and `src/render/TransmissionChamberRoom.test.ts` differ from the base. Collision/layout definitions, the reviewed layout JSON, registration, shared rendering, lighting, camera, HUD, AI, gameplay and milestone logic are unchanged. The original six test cases and their strict budget assertions remain intact; two stage3 cases were added.

Fresh independent execution:

- `npx vitest run src/render/TransmissionChamberRoom.test.ts`: 8 passed.
- `npx tsc --noEmit`: exit 0.
- `git diff --check 7f4c842`: exit 0.
- `node independent-check.mjs`: 65 meshes and 6348 triangles. Both original limits hold, strictly fewer than 90 meshes and fewer than 15000 triangles.

The focused suite compares exact boundary, nine solid polygons, dimensions, spawn, exit and breaches with the original reviewed layout. It checks swept routes at radii 16, 28 and 38, clear anchors, blocked solid centers, grounded fixture bounds and vertices inside the original collision outlines. Shell additions stay in the existing wall bands; deck dressing stays at or below 0.101 game units. This establishes the unchanged layout and tested route contract, not a new live movement or projectile recording.

## Batching and ownership

The batching code applies each direct child's local matrix before merging, retains owner transforms and named fixture groups, and groups only identical materials. Wall-band separation prevents shell batches from spanning unrelated bands. Negative-determinant geometry is excluded, preserving the mirrored dish back's face orientation. No material-array mesh is merged. The helper reapplies shadow and baked-environment flags to the replacement meshes.

I also built an in-memory unbatched version of the same final source, without editing the repository. It contains 184 meshes and the same 6348 triangles. A one-to-one comparison of every ordered triangle's world positions, normals and material matched within 0.00001, with no unmatched triangles. The maximum component difference was 8.940696716308594e-7. Batching reduces object count without removing surface geometry or changing material assignment in this candidate.

Scratch copies and replaced geometries are disposed. Retained meshes do not reference those discarded geometries. The focused tests verify once-only geometry disposal, once-only final geometry/material disposal and retained shadow ownership. No resource defect was found on the exercised construction/disposal path. The incompatible-geometry throw is not exercised, and this review does not certify arbitrary future input to this room-local batching code.

An initial diagnostic compared decimal-rounded strings and failed on values straddling a rounding boundary, including 4062 versus 4063 for the same transformed height. I replaced that diagnostic with direct tolerance-based, one-to-one numeric comparison. No production change was needed. An execute_code call was blocked by unattended approval policy; ordinary terminal tools completed the checks.

## Evidence limits and handoff

Capture metadata reports no console/page/request errors, aborted requests, WebGL errors or context loss. I verified retained hashes and inspected the pixels, but did not launch another browser or GPU job. The worker's full-suite and build results remain worker evidence, not independently rerun full-suite results.

The earlier over-budget candidate remains rejected history. This pass applies only to the final hashed source and final images. Parent review and publication still require their own checks. Stage4 may proceed under the production guard's authority; this report does not advance the guard or answer a human approval request.

Review artifacts added here: `independent-review.md`, `independent-check.mjs` and `independent-verification.log`. Repository source status remains the same two pre-existing modified files.
