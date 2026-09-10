# Monitoring panel recovery proposal, bounded revision 1

Status: awaiting independent proposal re-review. The actual GLBs remain RED. No construction source repair, export, render, material, runtime, story, layout or supported-equipment changes are authorized by this document. No commit or push.

This revision responds to R1 and R2 in `panel-recovery-proposal-review.md` and the accompanying probes. It supersedes the original manual 1210 mm parking proposal. The review correctly found a hidden central grip and missing support, and demonstrated that deleting the sill and mullion wrongly passed the old checks.

## Selected construction

Keep two inset panels, but slide them on a fixed bearing shelf and stop travel earlier. Move each latch/grip toward its panel's outer trailing edge. One operator keeps the same hand on that grip throughout release, movement, service and closure. The shelf carries the weight; the holding hand controls translation and prevents tipping. The other hand performs the bounded service operation. There is no handoff, unsupported lift, hands-free parking, automatic stop or claimed full-panel extraction.

The earlier long slide was unnecessary. A 900 mm lateral stroke clears the existing 100 mm service tunnel while leaving the grip in the opened bay. This needs only a shelf, a relocated smaller latch and a shorter prescribed stroke, not split panels, articulated guides or a separate staging fixture. Both panels and all fixed equipment remain present. Open one bay at a time.

Coordinates are local Blender metres. West is negative x. T is .93 north and .68 south. Keep the 3.75 by 2.50 m reservation and the north 1.25 m / south 1.00 m height caps. All displays, bezels, instrument supports, packs and trays retain their imported bounds.

| Part | Proposed bounds |
|---|---|
| Panel 0 | x -1.85 to -1.81; y -1.16 to -.05; z .21 to T-.01 |
| Panel 1 | x -1.85 to -1.81; y .05 to 1.16; z .21 to T-.01 |
| Central bulkhead | West end -1.67 instead of -1.80; all other bounds unchanged |
| Fixed sill | x -1.85 to -1.81; y -1.17 to 1.17; z .12 to .20 |
| Fixed bearing shelf | x -1.84 to -1.69; y -1.17 to 1.17; z .20 to .21 |
| Fixed mullion | x -1.85 to -1.81; y -.04 to .04; z .21 to T |
| Latch/grip 0 | x -1.875 to -1.849; y -1.10 to -1.02; z T-.1875 to T-.1325 |
| Latch/grip 1 | x -1.875 to -1.849; y 1.02 to 1.10; same z bounds |
| Seam strips | x -1.861 to -1.849; bay centre y minus .539 to minus .521; z .23 to T-.03 |

The 40 mm panel depth is a hollow construction envelope, not a solid plate. Specify a closed 2 mm aluminum skin box with internal empty volume. Its illustrative skin mass is 9.21754 kg north and 6.12334 kg south before fittings, calculated at 2700 kg/m3. The shelf bears this load throughout; the operator is not asked to lift it one-handed. This is a construction-level load assumption, not a structural rating. The latch is a front-operable grip/release fitting, not a claim that a featureless plate provides a pull. Detailed fasteners and load certification remain outside this proposal.

## Finite supported handling sequence

Use these rigid translations for the panel, latch and seam together, with no rotation:

1. With the panel resting on the shelf, reach its trailing grip from the west. Release the latch with the holding hand without letting go. The other panel remains closed.
2. Push +.110 m in x at fixed y and z. The shelf remains under the panel.
3. Translate +.900 m in y for panel 0, or -.900 m for panel 1, at fixed x and z. Keep holding the same grip. This is an operator-controlled endpoint, not a claimed mechanical detent.
4. Hold the panel upright at that endpoint while servicing through the separate tunnel with the other hand. Do not release it or open the other panel.
5. Reverse the lateral stroke and then the inward stroke while maintaining the same hold and bearing contact. Re-engage the front latch in the closed state, then withdraw the hand along the approach corridor.

The grip proxy is 50 mm in x by 100 mm in y and z, immediately west of the latch's west face, centred at y -1.06 or 1.06 and z T-.16. This is an explicit hand-envelope assumption, not an anthropometric standard. Its intended latch contact is checked, and the latch must attach to the panel. A 100 mm square straight hand/forearm approach extends from x -2.175 to that contact face. That entire corridor follows the same two translations, conservatively including the grip and the swept acquisition/withdrawal space. Contact with the latch is the only handling exception. The panel, seam, opposite assembly, mullion, walls, worktop, tray, pack and shelf remain collision obstacles.

At service, the panel 0 trailing edge is at y -.26 and its grip centre at -.16. Panel 1 is the mirror image. Holding occupancy therefore ends at y -.11 or starts at .11, leaving 70 mm from the fixed mullion and 160 mm from the opposite panel in y. It no longer relies on squeezing a hand into the 45 mm hardware gap behind the opposite panel. The 50 mm westward grip projection that failed the original review is included throughout this revised path.

The service tunnel is 100 mm square, centred on the actual imported pack and extending from x -2.175 to its west face near -1.65. The parked panel and holding corridor are present simultaneously. Reach from the cabinet west boundary to the pack far edge remains .725 m. This proves limited one-handed inspection/tool access, not electronics extraction or an operation needing both hands inside the bay.

## Support, closure and contact contract

The fixed shelf meets the sill and both tray tops at z .20. It meets the side walls at y +/-1.17. The sill meets the deck and both side walls. The mullion now rests on the shelf at z .21 and meets the worktop at T. These are explicitly tested bearing/butt interfaces, not arbitrary collision exclusions. Packs and their original tray/deck support are unchanged.

Panel bottom z .21 bears on shelf top z .21 throughout both translations and service. Minimum x bearing is 30 mm in the closed position, rising to the full 40 mm panel depth inboard. The full 1.11 m panel width stays over the shelf in y. For constant-z axis translations over this rectangular shelf, endpoint minimum overlap bounds the continuous bearing interval. The operator supplies anti-tip control continuously; the shelf alone is not presented as a retained vertical guide.

The side, mullion and top 10 mm reveals remain. The front lower 10 mm reveal between sill top .20 and panel bottom .21 remains visible as a recess because the shelf starts 10 mm behind the panel face. Internally that recess ends at the shelf bearing surface, not an open gap beneath a floating panel. No environmental seal is claimed.

The revised closure test requires both panels, sill, mullion and shelf at their stated rectangular extents. It separately verifies shell contacts and checks new fixed parts against the rest of the assembly. Missing or displaced closure pieces cannot pass merely because their absence removes an obstacle. Only named, verified bearing/butt interfaces and the moving assembly's own fitting connections may touch. All other moving and handling clearances require 5 mm, with 10 micrometre numeric tolerance.

These are envelope tests. After proposal PASS and parent authorization, actual closed mesh surfaces, hollow construction, latch operability and the revised inventory must also be enforced by the imported geometry contracts. The old exact inventory and closed-face rays must be deliberately updated, not deleted. Preserve prior support, reach and whole-room checks.

## CPU feasibility evidence

Run from the worktree:

```sh
PYTHONDONTWRITEBYTECODE=1 blender --background --factory-startup --threads 2 --python-exit-code 1 --python tools/assets/passenger-vault/test_monitor_panel_recovery.py
PYTHONDONTWRITEBYTECODE=1 blender --background --factory-startup --threads 2 --python-exit-code 1 --python tools/assets/passenger-vault/test_monitor_panel_recovery.py -- --proposal-envelope-only
```

Fresh Blender 4.0.2 CPU results:

- Default actual imported GLBs: exit 1, 8 failed gates out of 8. New closure/support/handling requirements do not turn the rejected assets GREEN.
- Proposal envelopes against unchanged imported obstacles: exit 0 for both panels and both variants. Closed coverage/contact, continuous hardware sweep, continuous grip/approach sweep, shelf bearing and simultaneous holding/service access all pass the analytical model.
- Nineteen negative controls per panel/variant, 76 executions in total, reject for their named reason. They include deletion and displacement of every closure part, sill/mullion/shelf contact loss, blocked service, reservation escape, removal of necessary support while the bare path remains clear, and a hand/forearm blocker while the bare path remains clear. Relocating the grip back to the centre also leaves the hardware path clear but fails handling against the mullion/opposite face.
- The intermediate control targets the latch on lateral segment 1. Every moving part clears its blocker at all three waypoints. The assertion requires that segment, latch identity and blocker identity, so an unrelated endpoint failure cannot satisfy it.

Evidence files:

- `panel-recovery-revision-red.log`, complete actual-byte test output.
- `panel-recovery-revision-feasibility.log`, complete proposal-only bounds and negative-control records.
- `panel-recovery-revision-proof.json`, parsed exit codes/counts, mass arithmetic, test hash and before/after-equal source/GLB hashes.

Swept AABBs are exact for the axis-aligned box translations used here. Fixed sloped instrument AABBs are conservative. There is no authoring, object hiding/deletion, export or rendering in either mode. Only the explicitly labelled proposal mode substitutes numeric bounds; it never changes imported Blender objects or saved bytes. Existing original proposal/review logs are historical and have not been overwritten.

## Stop for independent review

Review this supported short-stroke arrangement and its tests before any construction repair. No source repair/export/render may begin until the independent reviewer returns PASS and the parent authorizes construction. This analytical pass is not that reviewer decision and is not actual asset acceptance. Story/layout and prior supported-equipment approvals remain unchanged; materials and runtime do not advance.
