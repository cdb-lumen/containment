# Room18 layout draft

Attempt1022, stage1. This is a proposed plan, not implemented room geometry, a gameplay capture or human acceptance.

## Purpose

The player circles a shielded reactor jacket, reads the living-passenger and unarmed-overload states, then reaches the exit to Room19. Room18 does not authorize destruction. The objective remains `Circle the shielding. Reach manual controls. Overload is NOT armed.` The separate story remains `PASSENGERS ALIVE. Manual authorization still required.`

## Baseline and proposal

`storyRoomTemplates.ts` supplies the 1200 by 880 envelope, entry at 100,440, exit at 1100,440 and breaches at 100,100, 1100,100, 100,780 and 1100,780. Importing the actual production template confirms Room18 has no authored polygon override. Its baseline is a rectangular floor and five rectangular solids. The center is 470,310 with size260 by260. The four detached solids are 280,180, 800,180, 280,620 and 800,620, each size120 by100. The diagram puts this baseline in its own inset.

The proposal keeps the source envelope and all canonical anchors. It replaces the five blockers with one chamfered central solid and an inset outer boundary. The core spans x360..840 and y240..640, centered at the source envelope center600,440. It includes the complete old central footprint. The four detached solids are removed, not silently retained. The outer floor spans x40..1160 and y40..840, with40-unit corner clips. Exact vertices are in `layout-data.json`.

These offsets and the larger480 by400 center are design decisions in game units, not measurements claimed from canon. The 200-unit north/south cardinal floor bands follow from outer y40/840 and inner y240/640. East/west cardinal bands are320 units. Those are axis measurements, not minimum clearance claims for every curved or chamfered location. Source dimensions constrain the proposal; they do not prescribe these new dimensions. No metres conversion is assumed.

The floor is one connected ring, not painted lines across disconnected platforms. The teal upper route travels clockwise from entry toward exit. The amber lower route travels counterclockwise toward the same exit. The complete closed ring is checked in both directions, including the two directions' common east and west portions. Entry and exit connectors stay open. Neither direction cuts through the solid center.

## Activity reservations

- N at600,160 and S at600,720 reserve walkable inspection positions beside the central jacket. These are design/read positions, not new interactions.
- V at930,350 reads a passenger-vitals indicator inside the east core footprint at815,350. It says PASSENGERS ALIVE.
- A at930,490 reads the separate authorization indicator inside the east core footprint at815,490. It says OVERLOAD IS NOT ARMED. Manual authorization remains required.
- Both east activity points sit beside the continuous east lane. They do not create a gate or mandatory arming sequence. The same exit serves both ring directions.

Solid panel assemblies must stay inside the core footprint. Services stay under deck or inside solid footprints. Radial buttresses below the circulation edge are a later model reservation, not extra blockers in this draft. Height, low camera-facing shielding and far-arc player visibility need actual stage2/3 scene evidence. No new core damage, countdown or armed lighting is proposed.

## Real CPU checks

`check_layout.cjs` imports the production template, `createExpeditionGeometry`, `canOccupyExpedition`, `canTraverseExpedition`, `hasClearExpeditionShot` and `FacilityNavigation`. It substitutes only the proposed boundary, solid void and obstacle list in an in-memory geometry. It does not change runtime files. The same generated `layout-data.json` drives the PNG.

The executed run returned224 assertions and0 failures. It checked canonical anchors, all proposed activity positions, the four56-unit inward breach offsets used by `DepthGame`, every full-ring and entry-to-exit route segment, each activity approach, central occupancy rejection and central-crossing rejection. Radius16 is the source player radius,28 is the story-template lane contract, and30 is the production navigation clearance. Radius0/4/7/12 center-crossing probes are geometric proxies only, not bullet or pickup simulations.

At20-unit sampling, the radius16,28 and30 floor graphs each had one component, respectively1620,1380 and1360 nodes. Nodes and edges both use the production swept predicate. No occupancy-versus-self-sweep disagreements occurred for this proposal. Every required and proposed anchor joined this sampled graph. Production navigation reported every checked anchor reachable from an exit-targeted prepared field. This is sampled reachability, not continuous-space proof or a pursuit run.

The source helpers reject center-crossing sight and swept paths. Enemy movement, shots and pickups share the intended solid-center contract, but no live combat, projectile lifecycle, pickup collection, avoidance or pursuit was run. Full tests, build, browser screenshots and camera verification are outside this layout-only artifact. No gameplay acceptance claim follows from224 assertions.

## Evidence and reproduction

- `layout-draft.png` is the final1800 by1320 authored plan.
- `layout-initial.png` preserves the first render. Its clockwise caption intersected the route and the baseline dashed inset crossed center text. The final source moves the caption and isolates baseline geometry in the sidebar. This was a presentation correction, not a geometry retry.
- `render_layout.py` is deterministic Pillow source using DejaVu Sans.
- `check_layout.cjs`, `layout-data.json` and `checks.json` retain exact draft geometry and detailed CPU results.
- `verify_package.py` checks source pins, canonical snapshot equality, PNG decoding and deterministic regeneration. `package-verification.json` records actual results.

From this directory run `node check_layout.cjs REPO TYPESCRIPT_JS`, then `python render_layout.py`. The default TypeScript module is read from `/home/chernodubv/dev/alien-shooter-containment/node_modules/typescript/lib/typescript.js` because the authorized worktree has no node_modules. Only the compiler is borrowed. All game imports resolve to the authorized Room18 worktree. No package installation or source mutation is needed.

Canonical source commit is7a3f262886104fb024de9684958b3f85a8859f34. The working branch baseline isbb42726d736a15f3ff16d69c297804f43508535c. The live Room18 brief is https://github.com/cdb-lumen/containment/issues/40. PR83 was read as open and draft on branch `art/containment-annulus-v3`. Historical stage0 attempt1021 informed story intent, not geometry claims. Source hashes are retained in the check and verification reports.

Only this attempt's evidence files are added to the repository. No runtime changes, other-room assets, commit, push, remote publication or receipt were made by this artifact worker. Independent and parent review remain pending.
