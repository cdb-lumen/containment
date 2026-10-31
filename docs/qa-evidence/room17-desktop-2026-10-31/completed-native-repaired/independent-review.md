# Independent final Room17 encounter review

No remaining blocker for the bounded encounter, marine viewport/ammo clearance and actual enemy-path legality claims at source `0fd88db6dacb07e6e99eef3104cbf8715a0139a8`. The original frame-chord failure is retained and explained by stronger path evidence, not deleted or treated as a passing chord test.

Evidence: `/workspace/room17-desktop-repaired-final`.

## Provenance and completion

The terminal recording contains 877 PNG/video frames, 41 kills, zero remaining enemies, native reward and onward gameplay in Containment Annulus. Runtime errors are empty. Independently verified all 282 recorded source-file hashes against committed Git blobs, identical clean source-before/after records, the capture-harness hash and video hash. The source worktree has no tracked modifications. The recorded video probe reports 877 decoded frames; independent full ffmpeg decoding completed without errors.

Independently recomputed raw body/ammo intersections and viewport containment across all 876 playing frames: zero overlaps, zero viewport violations, all bounds finite. Minimum body-envelope top is +26.122 px at frame735. Ammo remains on the right throughout this attempt.

## Exact replay and the frame235 chord diagnostic

Inspected and independently reran `/workspace/replay-room17-movement.mjs`. It loads production game code and the saved checkpoint, replays captured movement/fire input and the original grenade/heal/reload/weapon policy, and uses each preceding recorded camera for production aim visibility. Its sole SSR instrumentation logs the existing canMove decision and returns that same decision. No shipping source or movement outcome is changed. It matches all 877 frames: every enemy's identity/count, position, health and armor; player position/angle/health/armor; status, elapsed time, kills and encounter remaining.

The separate independent segment check recomputes `canTraverseExpedition` for all 6,847 accepted nonzero moves, verifies consecutive segment continuity, and checks 5,730 surviving-enemy frame endpoint chains against the recording. Zero errors were found. Result: `/workspace/room17-independent-segment-verification.json`.

At frame235 carrier3 actually follows these three accepted radius24 segments:

1. (507.061037519466,567.164792467004) → (506.005027416376,563.425684227131)
2. → (538.017076789942,563.425684227131)
3. → (543.281153258309,565.108228738484)

All three are legal. Two attempted knockback moves are rejected by the unchanged production callback result. The direct chord from the first point to the last cuts the rounded clearance around the blocker corner; that chord was never traversed. Thus the one failure in the preserved `trace-verification.json` diagnoses the endpoint-only sampling assumption, not a remaining illegal accepted move. The verifier still records that failure. This conclusion depends on the exact whole-recording replay and segment-chain proof, not merely constructing a possible legal route. The earlier aa4 spitter crossing remains a distinct real production bug and its failed recording is not requalified.

## Actual pixels and limits

Inspected full-resolution frames234/235 around the carrier event, frame499, the closest-top frame735, late frame850, reward and onward images. The marine stays within the viewport in these samples; north-lane framing is visibly improved. Reward text is legible and onward shows actual Containment Annulus gameplay. Enemy bodies/HUD/world geometry can still overlap; health/story/top-right UI can obscure actors, as already demonstrated in the separate static boundary pair. This evidence does not qualify all-HUD actor visibility, every animated silhouette or general readability.

This is one disclosed valid prior-reward build with default resources, native desktop controls and ordinary game rules, advanced in fixed 50 ms steps. Prior rooms are fixture construction, not played encounters; external font CSS is suppressed. No wall-time performance, all-resolution coverage, CI success or human art approval is inferred. The CPU replay verifies this capture's states and paths; it is not a claim of matching the earlier historical failed attempt.

Review used existing pixels/video and CPU diagnostics only. No renderer was launched and no shipping source was edited. Original failed evidence and the repaired recording's chord diagnostic remain preserved.
