# Independent panel recovery proposal re-review

## Decision

PASS for the bounded revision 1 construction proposal and its CPU envelope tests as a basis for source repair, subject to parent authorization. R1 and R2 from `panel-recovery-proposal-review.md` are resolved at this gate. No proposal-stage must fixes remain.

This is not actual asset acceptance or manufacturing certification. The existing GLBs remain RED. Story/layout and prior supported-equipment approvals are not reopened by this review. No product source edit, export or render was performed.

## Fresh execution

Reviewed the complete revised proposal and test logic, the prior review and probes, and revision proof. Confirmed worktree HEAD `9ece1c8`.

Executed both commands from the worktree with bytecode writes disabled:

```sh
PYTHONDONTWRITEBYTECODE=1 blender --background --factory-startup --threads 2 --python-exit-code 1 --python tools/assets/passenger-vault/test_monitor_panel_recovery.py
PYTHONDONTWRITEBYTECODE=1 blender --background --factory-startup --threads 2 --python-exit-code 1 --python tools/assets/passenger-vault/test_monitor_panel_recovery.py -- --proposal-envelope-only
```

- Default mode exited 1 with 8 failed gates out of 8, as required for unrepaired actual assets.
- Proposal-only mode exited 0 for both panels in both variants.
- All 19 named negative controls ran per panel/variant, 76 executions total. Assertions require their specified failure reason, rather than merely some failure.
- Before/after SHA-256 values for `monitoring.py` and both actual GLBs were equal.

Full subprocess stdout, stderr, exit codes, hashes and independently recomputed dimensions are saved in `panel-recovery-rereview-evidence.json`. The reviewed test SHA-256 is `92f9084ab7d1ba8fee64a416fbc36c746b10e5691b4bb600e5c3826569d560ea`.

## R1 resolved: handling and support

The revised sequence identifies one operator, one continuous trailing grip, a shelf carrying the load, and a separate hand for limited service. It explicitly excludes unsupported lifting, a grip transfer, hands-free parking, full extraction and two-handed internal service. A manually controlled endpoint and anti-tip hold are coherent construction assumptions here; an automatic stop or retained guide is not necessary to approve this particular proposal.

The finite grip and approach boxes in `check_handling`, lines 112-150, follow both translation segments continuously. Fixed geometry remains an obstacle. Co-moving panel and seam clearance is checked in relative coordinates, and only intended latch contact is exempted. The stationary service tunnel is tested against the holding approach at the reached position. Reversing the same translations gives the same collision and bearing intervals.

Independent arithmetic confirms the parked grip centres at y +/-0.16 m, with 70 mm y clearance to the mullion and 160 mm to the opposite panel. This removes the old concealed central-grip conflict rather than ignoring the hand's westward projection.

Shelf bearing is required separately from collision exceptions. Checking endpoint minimum overlaps is valid for these constant-z, axis-aligned translations over a rectangular shelf. The closed minimum x bearing is 30 mm, and the panel remains fully supported across its y width. The documented hollow 2 mm aluminum skin assumption gives approximately 9.21754 kg north and 6.12334 kg south before fittings, independently reproduced. These are sufficient load/support assumptions for construction planning, not ratings for the shelf, fitting or operator.

## R2 resolved: enforcing the proposed construction

`check_closure`, lines 60-92, now requires exact rectangular extents for both panels, sill, mullion and shelf. It checks the named shell/bearing contacts separately and checks the added fixed parts against other geometry. The shelf/panel collision exception is backed by `check_handling` bearing requirements; it is not an unverified permission to float or intersect. The intentional reveals are preserved without claiming a seal.

The original hardware sweep, reservation and reached service-tunnel checks remain in `check_path`, lines 153-180. Swept AABBs are exact occupied unions for the proposed translating boxes. Imported non-box obstacle bounds can reject conservatively; they do not create false empty space.

The strengthened intermediate control proves that every moving part clears the blocker at all three waypoints, then requires lateral segment 1, the specific latch and the specific blocker in the failure. Missing/displaced closure controls cannot pass simply by removing an obstacle. Separate controls remove necessary support or obstruct the handling corridor while explicitly asserting that the bare hardware path still clears. Moving the grip back to the old central position likewise leaves the hardware path clear and fails the handling check against the mullion/opposite face. These directly cover the prior review's concrete counterexamples.

## Boundary of this PASS

Proposal substitution is confined to copied numeric bounds. This does not establish that repaired meshes exist, that a box-shaped latch is operable, or that outer bounds imply closed hollow skins. Revision 1 explicitly carries those requirements into the source-repair gate, which is appropriate.

After parent authorization, implement and verify the specified hollow panels and front-operable fitting, update the exact inventory and actual closed-surface/contact contracts deliberately, and rerun actual-byte recovery plus preserved support, reach and whole-room checks. Keep stationary geometry present in opening-state diagnostics. Those are existing next-gate obligations, not grounds for another proposal revision or permission to accept the current GLBs.
