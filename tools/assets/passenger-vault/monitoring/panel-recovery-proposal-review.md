# Independent panel recovery proposal review

## Decision

MUST FIX before authoring the construction repair or exporting assets. The proposed panels have a collision-free rigid-body path within the reservation, but manually supporting and controlling them along that path and during service is not established. This is a bounded proposal rejection, not a demand for manufacturing drawings, an animation, or gameplay changes.

The existing GLBs remain rejected. Story/layout and earlier equipment approvals are unaffected.

## Reviewed and independently executed

Read `panel-recovery-proposal.md`, `test_monitor_panel_recovery.py`, `monitoring.py`, `monitor_contract.py`, `test_monitor_geometry.py`, `final-review.md`, and `parent-checkpoint.md`.

Reran the default regression and the proposal-only mode with Blender background/factory startup, two CPU threads, Python exit code 1, and bytecode writes disabled. No author, export, render, object hiding, or product edit was performed.

- Actual imported GLBs: exit 1, 8 failed gates of 8.
- Proposal numeric envelopes against unchanged imported obstacles: exit 0 for both variants, including the supplied negative controls.
- Full subprocess output is in `panel-recovery-review-probes.json`.
- Additional CPU bounds probes and reviewed source/proposal hashes are in `panel-recovery-review-math.json`.

## What is sound

The 110 mm inward translation followed by a 1210 mm lateral translation is geometrically feasible for the specified panel/latch/seam boxes. Moving the bulkhead west end to -1.67 removes the original obstruction. The opposite panel remains present, and the moving assembly remains present at its parked position. Reversing the translations has the same swept occupancy.

The swept AABB implementation is sufficient for these single-axis translations. Fixed sloped geometry makes rejection conservative, not clearance falsely permissive. Reservation checks include latch and seam projections and the variant height cap.

The 100 by 100 mm access tunnel is a real improvement over the old excluded-panel ray test. It proves a finite approach to the pack west face with the modeled parked assembly present. It does not prove a holding hand fits, that support is available, or that both holding and servicing can occur together. It also does not prove electronics extraction, which the proposal correctly excludes.

## R1: Specify a reachable handling and support arrangement

Proposal lines 17 and 55 require continuous manual support but do not identify grips, a handoff sequence, or how the parked panel is held while servicing. `check_path` lines 52-78 moves only hardware and then checks an unrelated service tunnel. It therefore tests the path of an externally controlled rigid body, not the proposed handling procedure.

The central latch finishes behind the opposite closed face. The claimed 45 mm latch-to-panel gap is hardware clearance, not a demonstrated hand passage. An independent illustrative grip box extending 50 mm west of the latch and 100 mm in y and z overlaps the opposite closed panel by 5 mm at the parked state. Its lateral sweep also overlaps the fixed mullion by 5 mm in x. This repeats for both panels and both heights. These are positive geometric overlaps, not just failures of the test's 5 mm clearance threshold.

That proxy is an explicit assumption, not an anthropometric standard. It disproves this simple grip-following interpretation; it does not prove every possible thin-finger or trailing-edge handoff impossible. A trailing-edge hold may be possible, but no such operation is specified or checked. Counting the unobstructed service tunnel cannot fill that gap.

Required proposal revision:

- State how the panel is controlled from latch release through translation, any grip transfer, parked service, and reverse closure. State whether one or two people are required.
- Specify finite hand/tool occupancy and reachable grip locations for that sequence. Check them against the fixed mullion, opposite face, worktop, tray and pack, and check the holding occupancy together with the service tunnel. Human occupancy outside the cabinet need not obey the hardware reservation, but may not pass through its shell.
- Alternatively propose a simple retained support/guide and stop arrangement. Include its actual occupied geometry and contact exceptions in the proposal/tests before authoring. No detailed mechanism or load certification is required.
- Resolve the manual-load assumption at construction level. A 40 mm outer depth is not a lightweight construction specification. The north/south panel box volumes are 0.031524/0.020424 cubic metres. If interpreted as solid aluminum at an illustrative 2700 kg/m3, those would be 85.1148/55.1448 kg. These are conditional examples, not measured asset masses. A lightweight hollow panel assumption or supported arrangement is enough; an unspecified solid plate should not silently become a one-hand-held panel.

## R2: Make tests enforce the selected construction

Keep the current sweep and finite-access checks. Add regression coverage for the R1 handling/support arrangement so hardware clearance alone cannot pass it. Include a fault that blocks a grip/handoff or removes necessary support while leaving the bare panel path clear. Require that fault to fail for its intended handling/support reason.

Also specify and enforce the revised closure/contact contract. I removed `service_mullion` and `service_sill` from the proposal bounds in memory; both `check_closed` and `check_path` still returned no failures for all four panel/variant combinations. They are obstruction tests, not enclosure-completeness tests. This matters because the old exact inventory and closed-face ray assertions must change for the repair. The revised contract must require the sill/mullion, verify their intended shell contacts and face coverage, and reject their deletion or displacement. Preserve intentional 10 mm reveals rather than demanding a seal. Deliberate support contacts must be tested separately from the moving-part clearance rule.

The current intermediate-obstacle negative control only asserts that some path finding exists. Strengthen it to assert the intended intermediate segment and blocker identity, with clear start/final poses. This prevents an unrelated endpoint failure from masquerading as continuous-sweep coverage.

## Bounded next gate

Revise only the proposal and CPU/regression evidence to close R1 and R2, then request proposal re-review. Do not export on the present feasibility-mode pass. Once the handling arrangement and test contract are accepted, the parent can authorize the source repair, actual-byte tests, preserved prior contracts, and opening-state diagnostics with all stationary geometry present.
