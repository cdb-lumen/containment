# Independent Room17 stage 1 review

## Verdict

Pass for the stage 1 layout draft, attempt1016. The plan establishes a clear gate gap, keeps static art reservations inside existing solids, preserves entry and exit with broad alternate lanes, and assigns meaningful activity spaces. No blocking layout finding. This verdict does not accept models, live gameplay, final room art or release.

## Evidence inspected

I loaded the original layout.png through vision and inspected its diagram and annotations. The vision display reduced the original 2400 by 1640 image to 1200 by 820. This is inspection of the supplied plan, not a gameplay capture or a regenerated substitute.

I read layout-data.json, the complete test-layout.mjs and this attempt's sourced-brief.md. I also read the canonical rollout-sources/room17-brief.json, the preceding stage 0 sourced-brief.md and production storyRooms.ts, including Room17 and the following story milestones. The canonical brief hash independently matched the layout pin, a8ef7779e1105b64b39253dd4a4ec23b3b32c96f9e10fc3b9bc5cad31a94a3d7. I did not independently fetch issue39 or PR82 or inherit their acceptance.

## Layout judgment

The gate is the visible negative space between S1 and S3. The aligned ochre G1 and G2 reservations bracket the teal open-floor strip without bridging it. The diagram identifies the 400-unit gap and shows route A crossing northward before turning east. This is a clear focal opening at plan scale. The teal fill is an editorial marker, not permission to add a platform, hazard or overhead structure.

G1 and G2 are 80 by 90 reservations inside S1 and S3. Their placement leaves the existing gap free and the existing collision contract intact. Paired drives and nested leaves have assigned locations, but the diagram does not establish whether detailed mechanisms will fit or read at gameplay zoom. That remains a later model requirement.

Entry and exit remain the existing progression anchors. The stepped central route and the north and south bypasses are visually distinct and join those same anchors. The plan does not turn the gate into a mandatory bottleneck or invent perimeter door cuts. The broad bypasses satisfy the scoped circulation requirement without changing the solids.

The activity circles have useful relationships to the geometry. Space 1 supports the approach below S1. Space 2 occupies the central maneuvering area before the gate crossing and above S2. Space 3 provides room beyond the crossing before the eastward turn. Space 4 sits in the eastern pocket beside S3 and near the exit. Space 4 is off the drawn main route, but the anchor-connectivity check supports its use as an accessible progression pocket. These are spatial allocations, not evidence of encounter pacing, enemy behavior or combat balance.

The room remains the last defensive line before the reactor. Neither the plan nor its scoped description adds an opening interaction, timed closure, crushing hazard, armed overload or escape narrative. Keeping the leaves static is consistent with the canonical combat contract. The later manual authorization is not moved into Room17.

## Independently executed checks

From the attempt directory I ran:

```sh
node test-layout.mjs /home/chernodubv/dev/.cron-worktrees/containment-rooms/shielding-gate-v3
```

The process exited 0 and reported 13 passed checks, 0 failures and 0 errors. The actual assertions cover:

- Pinned source file hashes and exact agreement between diagram data and resolved production topology, dimensions and anchors.
- Containment of both visual reservations inside their owning solids.
- Bidirectional sweeps of every route segment for standard enemy radii 14, 17, 18, 24 and 28.
- Route sweeps at half-width 50, supporting the stated 100-unit corridors under the production CPU sweep query.
- Activity-disc occupation with a radius-28 actor and sampled radial sweeps at 15-degree intervals.
- Bidirectional threshold crossing and straight shots, plus sampled occupancy of the threshold interior.
- Rejection of solid-center occupation and through-solid shots.
- Connectivity of the admitted 20-unit grid and connections for the designated anchors.

The connectivity result reached all 1915 admitted grid nodes and connected 16 anchors. These comprise entry, exit, four authored breaches, four runtime inward-offset breach positions, four activity centers and two threshold-axis endpoints. I did not rerun the separate production Vitest suite and do not count its historical log as an independently executed check.

## Preserved diagnostic and limits

The CPU run retained eight occupancy/sweep mismatches at 280,120; 420,120; 500,760; 700,760; 780,320; 780,720; 920,320; and 920,720. Circular occupancy accepts these sampled corner points while the production self-sweep rejects them. The test excludes them from graph admission and reports them explicitly. The connectivity pass therefore applies to the sweep-admitted graph, not every occupancy-positive point. This is an unresolved production-query diagnostic, not a runtime fix and not a claim that the mismatch vanished. No production code was changed.

Grid sampling does not prove continuous-space connectivity. Route checks use existing static geometry, not AI pursuit or a live encounter. The standard-enemy radius claim does not include the queen. Reservations prove footprint containment only, not mesh clearance, overhang, height, construction or recognizable machinery. No phone or desktop gameplay camera, HUD occlusion, live movement, live shooting, performance or detailed model was evaluated.

This review creates only independent-review.md in the attempt directory. No code, other artifacts or publication records were edited. Human acceptance, publication, merge and deployment remain outside this verdict.
