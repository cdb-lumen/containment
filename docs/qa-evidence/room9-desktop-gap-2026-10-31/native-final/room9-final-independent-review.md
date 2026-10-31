# Room9 final desktop encounter — independent review

No remaining blocker found for this bounded encounter and movement qualification at `5b4a8dff20e76852b6ac12908df81c34b39c8f6f`. This does not establish general art approval, all-HUD visibility, or replace the separate pistol-gap geometry/shot tests.

## Provenance and encounter

Reviewed `/workspace/room9-desktop-final`. Independently matched all 287 recorded source-file hashes to the pinned Git commit. Source before/after records are identical and clean. Saved harness `/workspace/campaign-desktop-visibility.mjs` matches manifest SHA `0243ee0ac443a597e1d5a569870ebc7d6442ac3e735acf0fb8287f628f43e653`. Combat video hash matches; there are 556 PNG frames; independent ffmpeg full decode succeeds and ffprobe counts 556 frames at 1280×900.

The native fixed-step encounter reaches reward with 24 kills, zero remaining, then enters Transmission chamber. No authored dialogue exists here, and Skip is explicitly inapplicable. The fixture uses validated prior-room reward choices/default resources; those earlier encounters are not claimed played. Main frame/native inputs are advanced at 50 ms, so this is not a wall-time performance result. External font CSS suppression is disclosed.

## Frame443 diagnostic resolved by actual production path

The retained `trace-verification.json` reports one failing snapshot chord, carrier13 at frame443. I reviewed and independently reran `/workspace/replay-campaign-movement.mjs` against the exact source. Its only production transform wraps the original `canMove` callback to record the same returned decision. It recreates checkpoint, initial update/weapon selection, recorded native inputs/action policy and previous-camera aim visibility. All 556 states match, including enemy positions/health/armor, player position/angle, player health/armor, kills, remaining, status and elapsed time.

I separately validated all 4279 accepted nonzero segments using production `canTraverseExpedition`, their continuous per-frame chains and 3510 final enemy endpoint comparisons, plus 555 player sweeps: no errors. Diagnostic script `/workspace/check-room9-segments.mjs` and results `/workspace/room9-independent-segment-verification.json` preserve this independent check.

At frame443 the carrier follows six legal accepted segments, with three diagonal knockback attempts rejected. It starts at `(359.975603,355.603828)`, moves to `(361.982248,358.703714)`, slides horizontally through x377.088895, x393.230789 and x410.388958 at y358.703714, then moves via `(412.663421,353.667021)` to `(414.721440,349.109633)`. The direct start/end chord cuts a blocked corner; the actual path does not. This is evidence of the actual replayed path, not merely a hypothetical legal detour. The original chord failure remains preserved as a diagnostic, rather than silently discarded or classified as a game movement pass by the initial verifier.

## Pixels and visibility limits

Independently recomputed raw body/ammo rectangle intersections and viewport containment for all 555 playing frames: none fail. Minimum body top is 358.672943 pixels at frame95. Viewed actual contact-sheet frames160–199 and440–479, full-resolution frame443 and540, and reward/onward images. The marine is visible in these sampled combat poses; the central cabinet and four racks retain readable distinct forms, and reward/onward panels are legible.

Enemies can still be partly hidden by the upper-left story/status panel or the upper-right label; frame443 visibly demonstrates this. Body-versus-ammo/viewport checks do not certify enemy visibility or all HUD obstruction. The separately proposed status-column repair is not present in this source and is not qualified by this recording. Some decorative glyphs render as missing-character boxes under the disclosed font suppression.

This encounter primarily exercises shotgun combat. The specific radius4 pistol path at y514 remains supported by the separately reviewed production shot/whole-mesh regression and matched static evidence; this video is not asserted to demonstrate that exact shot. No renderer or shipping-source modifications were made for this independent review, and no human art approval, historical dispatch or full-release acceptance is inferred.
