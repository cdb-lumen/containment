# Armory carousel final independent qualification

Independent review, 2026-10-31. **No blocking finding for the bounded Room6 carousel/horseshoe implementation and this completed encounter.** Source ed13a96d88ad9d5ab85447139828b56c122644fc, evidence `/workspace/armory-carousel-joint-hud-final`. This is not blanket issue12 completion, human art approval or unrestricted enemy-visibility certification.

## Provenance, video and geometry

Independently verified all 293 source hashes against the pinned Git commit, clean identical sourceBefore/sourceAfter records, recorder hash against the preserved campaign-desktop-joint-hud.mjs (411bf9d1e892c764cad207a8ca19380348ceecb4e9f918bc0b365e2ea0d2123e), and video SHA256 e64e9650ee268dcb04d34bec2fee41cdb2ca824c179e2066cb88af23eea6ecee. Found exactly 1,089 numbered PNGs. Independently decoded the entire H264 video with ffmpeg without errors; ffprobe counted 1,089 frames at1280×900. Video duration54.45s at20fps reflects fixed-step recording, not measured device performance.

Reran the production-geometry trace verifier through CPU-only Vite SSR without overwriting original evidence: 6,108 enemy positions, 6,072 enemy inter-frame sweeps, 1,088 player sweeps, errors[]. Log `/workspace/armory-carousel-independent-trace.log`; decode log `/workspace/armory-carousel-independent-decode.log`. The snapshot chord checks all passed here; no failed movement evidence was waived or substituted with a hypothetical path.

Recomputed overlap/viewport conditions from raw recorded rectangles for all1,088 playing frames, rather than trusting boolean fields: zero marine/HUD overlaps, zero pairwise panel overlaps and zero offscreen panels. Marine minimum viewport margins: top37.336,left29.808,right32.327,bottom41.897px. The remaining frame is the reward transition. Observed status is reward with36kills/0remaining at54.4667simseconds; native reward selection, route and onward Freight hold are present. Room6 has no authored dialogue, so Skip is explicitly inapplicable; no expanded/collapsed dialogue claim is made.

## Actual pixels and bounded art decision

Inspected all28 contact sheets covering frames00000–01088, plus full-resolution frames00178,00746,00890 and01000, reward.png, route.png and onward.png. The contact sheets provide continuous visual coverage; fine detail assessment uses the full-resolution samples and the earlier three-view corrected static review.

The central spindle, radial secured rifles, exposed toothed base and open front sector now read as a coherent stationary carousel, distinct from the continuous graphite horseshoe counter. Brass edges, pale plates, work trays and two visible armor shells retain the corrected visual hierarchy. They are recognizable at native scale; the smaller hinge/vice details remain subtle. The landmark remains visible during live elite/carrier combat. The pilot travels the outer north/east/south routes and later enters the mouth/inner ring, with large enemies following through the opening. No teleport or forced route completion is present in the reviewed recorder policy. The current evidence supports the previously qualified bounded landmark art in actual gameplay, rather than relabeling the former four islands as a carousel.

At178 the marine's helmet/body is visibly inside the north frame. At746 the marine remains visible at the southeast boundary while ammo/picker/hint have moved left, correcting the prior lower-control obstruction. At890 the marine is visible in the inner ring while carriers converge at the mouth. These are new successful observations; the older178viewport and746HUD failures remain failed historical attempts.

Reward text and all three boon choices are prominent and legible in the native modal, including the rare options. The subsequent route card clearly names Freight hold, and onward.png shows actual entry. This proves the production reward presentation and selection transition, not a separate diegetic reward-placement system or newly approved task lighting. Missing decorative arrow/Pause glyphs appear as fallback squares under the disclosed external-font suppression; substantive text remains readable.

## Visibility and acceptance limits

Marine clearance is not all-actor visibility. Frame178 visibly has a large enemy partly behind the upper-left status region. Later dense groups overlap each other, smoke/attack effects and parts of the landmark; off-camera corpses/actors can also be clipped at screen edges. These are concrete limits of this recording and must not be described as every enemy/telegraph remaining unobscured. I found no new Room6-specific hidden-player, illegal movement or stalled-encounter blocker. The unchanged rifle pilot completed normally, so the conditional retry plan was not exercised and no timeout should be recorded for this run.

This is one seed, one valid prior-boon/default-resource fixture and the disclosed automated native-input policy at1280×900, with real production director/health/damage and 50ms stepping. Prior rooms were fixture construction, not played history. It does not establish all builds/weapons, all desktop configurations, wall-time FPS, universal combat readability, broad lighting approval or human/delivery acceptance. Existing CPU/desktop CI gates remain separate evidence.

## Integration fidelity

Verified ArmoryCarousel.ts, ArmoryBlockout.ts and armoryCarouselLayout.ts bytes match the earlier corrected static pin07d04f3. Thus the new encounter is exercising the corrected landmark, with subsequent shared HUD integration. Independently computed prospective merge-tree(main2a0faca,ed13a96) =27b2f87d12516e70fff2c11cc5401ae91e45b2f3, equal to the captured head tree. This equality is conditional on that main pin; it is not an unperformed merge or formal GitHub approval.

No GPU renderer was launched or shipping source modified during this review.
