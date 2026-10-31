# Room18 supplemental circuit evidence — independent review

Qualified for the bounded two-direction traversal and sampled far-arc shielding-visibility claim, alongside the separately successful encounter at the same source. **This recording remains FAILED as a full encounter:** 928 frames, ordinary death at frame 927, 22 kills and two enemies remaining. Its original manifest and failed result must remain intact. No second full-encounter pass is awarded.

## Provenance and independent checks

Reviewed source `589dba5fb272a0508e17706c98fbacc53489e3fb`, `/workspace/room18-circuits-native`. Independently verified all 294 source-file hashes against the pinned Git objects and the postfailure source inventory, all 928 retained PNG hashes, and the recorder/helper hashes against the manifest. Source was reported clean before capture and at the separate postfailure check. The latter is explicitly a postfailure observation, not a retroactive successful recorder sourceAfter check.

The untouched failed manifest hashes to `dee78989f4d6812e8254daefe4d73a6be75d81b30776e0789572789ee0d9943e`. The separately encoded `failed-encounter-with-complete-circuits.mp4` hashes to `6edbc9df1988337f224ba0c14e36487546fb0413bda8f9f1ab9b48f91451531a`; its sidecar accurately describes encoding after failure from retained PNGs. Video is 1280×900, 20 fps, 928 frames/46.4 seconds. Independent full ffmpeg decode completed successfully; no video was overwritten. See `postfailure-provenance.json` and `/workspace/room18-circuit-independent-decode.log`.

Recomputed signed angular movement from actual recorded player positions around (600,440), independently of route labels: frames 16–328 sum **+6.259380171803617 rad**, frames 328–640 sum **−6.285204263707858 rad**. Both are approximately one full circuit with opposite signs. The recorded waypoint progression includes north, east, south and west positions, rather than merely assigning completion labels. Frame 640 is stationary at (276,440), with all 11 waypoints complete.

Independently reran production-geometry trace validation: **6,710 enemy positions, 6,686 enemy sweeps and 927 player sweeps; errors=[]**. Results: `/workspace/room18-circuit-independent-trace.json` and `.log`. Recomputed actual rectangle intersections and viewport bounds for all **927 playing frames**: zero marine/HUD intersections, pairwise HUD overlaps or offscreen HUD/body failures. This is a geometric body-envelope check, not a claim that every enemy is unobscured.

## Actual pixels

Inspected all 24 contact sheets covering all 928 frames, plus full-resolution frames 100, 550, 640, 926 and 927. Sheet review is not full-resolution inspection of every frame.

Both north passes visibly place the marine on the far-side floor above the closed core/shielding. Frame 100 has substantial enemy crowding around the marine; the shielding does not cover him. Frame 550 gives a clearer second-direction north witness: the marine is visible above the core and the floor/closed shielding separation is readable. The ring segments and closed central lid remain identifiable. Instrument text, including passenger-alive and not-armed/manual-only information, is readable in these views. These close the previously missing north/far-arc traversal witness without claiming all angles or dense hordes are clear.

HUD relocation keeps the marine clear in the inspected frames. Left-side HUD still obscures some enemy pixels, and actors overlap each other during crowding. Those limits remain explicit. Frame 640 shows completion west of the core. After completing the route, the disclosed pilot stops moving and continues firing; late enemies surround him. Frame 926 shows low health and crowd overlap; frame 927 honestly displays Mission Lost at zero health. This supports the reported ordinary loss, not a newly demonstrated shielding/navigation defect or a guarantee that another pilot would win.

Native Skip at frame 200 is recorded as dismissed/hidden while status and objective persist. The run uses the disclosed valid prior-boon checkpoint, ordinary combat/resources, native input, and fixed 50 ms frame advancement. It does not establish wall-time performance, complete campaign progression, unrestricted enemy visibility, audio-mix qualification or historical/human acceptance.

## Combined evidence decision

The original 695-frame recording at the same source separately establishes encounter completion/reward/onward travel; use its specifically verified `combat-recovered-from-pngs.mp4`, not its preserved mismatched `combat.mp4`. This new failed recording establishes both actual opposite circuits and observed north/far-arc shielding visibility before its later death. These are complementary, bounded observations, not one successful uninterrupted two-circuit encounter.

No new blocker found for that combined bounded evidence claim. Full-run failure and crowd/HUD enemy-occlusion limits must accompany publication. No renderer or shipping-source changes were made during this review.
