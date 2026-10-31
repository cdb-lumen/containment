# Room12 final desktop encounter independent review

Reviewed source `45afdc0c86b55cfe075c3e5983284ab7ec17f66e`, capture `/workspace/room12-heading-final`, on 2026-10-31. No blocking finding for this bounded encounter, marine viewport/HUD-clearance, and unchanged equipment qualification. This is not formal GitHub approval or full art/horde-visibility acceptance.

## Provenance and recording

- Manifest is terminal `passed`, errors empty, with 756 sequential frames (00000–00755), 26 kills, zero remaining, reward and onward entry into Coolant Plant. Source-before and source-after are identical and clean.
- Independently checked all 290 recorded source hashes against the pinned Git tree. Harness `/workspace/campaign-desktop-hud-clearance.mjs` matches SHA256 `8e94f376f026dc269362f41c0ccfedc54a2520fa0dca29a4729286d8d1d33fb8`.
- Video SHA256 independently matches `0b66691eb51bf88af9e41757f2764d6ec83d24583be8d191ce68c2034d42cecc`. Full ffmpeg decode completed without errors; ffprobe counted 756 H.264 frames, 1280×900. Recording is 37.8 seconds at 20 fps, using fixed 50 ms production frame steps, not a wall-time performance measurement.
- Fixture uses default resources and a valid checkpoint built through prior first-offered reward choices. Those prior encounters were constructed, not recorded as played. Automated native keyboard/mouse input, ordinary encounter director, production damage/health, aim assist, and approach-to-offscreen-enemy driver policy remain disclosed. External font CSS suppression explains missing decorative glyphs.

## Independent checks

Recomputed all 755 playing-frame body/viewport and recorded visible HUD rectangle intersections: zero overlaps, zero viewport clipping; minimum body top was 23.30463954235017 pixels. This includes vitals, room label, story, run stock, build strip, Pause, desktop hint, weapon picker and ammo. The moving status/heading column used both sides. Ammo stayed right throughout, so this recording does not independently exercise ammo side switching.

Production geometry was rechecked using CPU Vite SSR and the pinned source, with `/workspace/check-room12-heading-trace.mjs`. Result `/workspace/room12-heading-independent-trace.json` has zero errors over 755 player sweeps and 4,609 enemy sweeps, agreeing with `/workspace/room12-heading-final-geometry.log` and the capture's trace-verification.json. These are occupancy/consecutive-state chord checks, not a claim of within-frame segment replay.

Native mouse Skip at frame 200 dismissed the authored dialogue and retained status/objective text; later playing frames continued. I inspected the decoded video frame 200 as well as the original image evidence.

## Actual pixel review

Viewed all 19 contact sheets covering frames 0–755, plus full-size frames 147, 199, 366, 495 and 750, reward.png, route.png and onward.png. Contact-sheet review is thumbnail-scale; it is supplemented by full-size witnesses and all-frame numerical checks, not a claim that every source pixel was inspected at native size.

The marine remains visible in the earlier north/headroom, heading and vitals failure regions. Expanded dialogue is present before Skip; after Skip, useful status/objective information remains. The recording includes continued damage, reloads, healing, late combat against the remaining brute, a readable native reward panel, route selection and actual Coolant Plant entry. The onward image is the currently integrated Coolant Plant, not qualification of a separate upcoming Room13 art candidate.

The pale sealed recorder remains the equipment focal object. The open service-panel assembly and loose plug remain visible in the full-size witnesses. `SafetyInterlockBlockout.ts` is byte-identical to both prior corrected source `2a974bd` and encounter source `bfc0126`; its dedicated test is also unchanged from `bfc0126`. This preserves the prior bounded equipment qualification rather than silently revising it.

## Limits and preserved failures

Enemies and parts of the environment do appear behind the status panels, including north-side crowds. Marine clearance does not establish dense-horde, every-enemy, every-projectile or all-environment readability. The new recording does not grant human art approval, historical dispatch acceptance, all-room release acceptance or performance certification.

Earlier recordings remain failed for their demonstrated defects: original bfc encounter HUD obstruction, the frame-147 viewport failure in room12-hud-full-final, and the frame-366 heading obstruction in room12-shared-headroom-final. The rejected 34d service-panel hardware intersection likewise remains rejected. This fresh successful recording does not relabel those attempts.

No runtime source was modified and no renderer was launched for this review.
