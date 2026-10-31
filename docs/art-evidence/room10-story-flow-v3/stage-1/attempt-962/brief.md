# Transmission chamber layout draft

Stage1 attempt962. Proposed layout only, not implemented geometry or gameplay evidence.

Six low radial waveguide segments frame an exposed central feed. The circular servicing space sits inside the retained rectangular room envelope. It is not a shield or a new circular boundary. The tall antenna and dish-feed assembly stays at the far wall. A southeast desk supports acknowledgment without adding an interaction.

The teal ribbons show tested traversal space, not painted floor, construction or an energy field. Amber lines show selected existing breach approaches. Filled polygons are proposed solids. Detailed mechanical models belong to later stages.

## Geometry contract

The proposal replaces the three original internal rectangles with nine named polygon reservations in `layout.json`. Production source remains unchanged. Width1200, height880, spawn100/440, exit1100/440 and all four breach anchors remain unchanged. No preceding-room asset is required.

The source-isolated fixture retains production boundary walls and substitutes proposed internal polygons. Unmodified production `canOccupyExpedition` and `canTraverseExpedition` validate the proposal. Parent replay passed199/199 checks, including38 clear routes and one correctly blocked feed-crossing route at each radius16,28,38. Tests cover both ring directions, inner servicing, all breach-to-defense-sector combinations and north/south entry-to-exit travel. Independent review replayed197 geometric/schema checks separately; the remaining two stored checks concern provenance.

This proves these swept routes, not autonomous pursuit, projectile coverage, pickup behavior, combat balance or native composition. Those require implemented geometry and later-stage checks. No full verifier, build, browser smoke or release claim accompanies this diagram.

## Story and next stage

Defend the uplink until the real war-warning receipt. Show WARNING RECEIVED / NEW EARTH PREPARING FOR WAR only at that milestone, using existing essential status. No evacuation or docking promise. Fatal purge evidence remains in Room11.

Independent and parent review pass this bounded layout stage. Next is rough model placement, only after another scheduler permit. The final room still needs human acceptance. No merge or deployment.

## Provenance

Runtime base `7a3f262886104fb024de9684958b3f85a8859f34`; preceding concept `07a9eaa0347e068c82b2e7b8f9298799feb92d3c`. Live room issue31 and campaign issue21 supplied the retained brief. Canonical source hashes match stage0's brief. `draw_layout.py` and `layout.json` reproduce the original PNG using Pillow and DejaVu Sans. The annotation199/199 describes this attempt's recorded result, not a live verifier embedded in the renderer. Operational tests, reviews and receipts remain outside the repository.
