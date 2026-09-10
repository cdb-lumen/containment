# Residential Gallery whole-room layout proposal

Status: independently reviewed proposal, approved for a neutral blockout experiment only. Layout remains unpassed. The sourced story passed independent review. Do not begin detailed equipment before gameplay and shipping-camera blockout acceptance.

Review identified three blockout risks: apparent walkable gaps inside the bunk/packing solids, cabin fronts without credible backing, and actor occlusion from prop height. Resolve them in whole-room massing, not detailed equipment. Current desktop/phone baseline images show generic seating/table islands, not this proposal; their controlled combat has no DOM HUD or campaign progression evidence.

## Retain the playable map

Keep the current 1200 by 880 floor, entry at 100,440, exit at 1100,440 and all four collision rectangles. The inherited offsets already allow a residential passage with alternate routes. Replace their generic banquette/table identity with domestic functions. A narrow enforced zigzag would remove useful flanks without serving the objective, so it is not the first candidate.

[Annotated whole-map plan](residential-gallery-layout.svg). Coordinates are gameplay units, 32 units per renderer metre. The diagram describes reservations, not final geometry.

| Zone | Current solid x,y,width,height | Proposed function |
|---|---|---|
| A | 280,160,240,100 | Northwest cabin frontage, closed thresholds facing south |
| B | 280,520,120,200 | Empty bunk/storage alcove facing north |
| C | 650,270,260,100 | Northeast cabin frontage, closed thresholds facing south |
| D | 780,570,140,150 | Loaded trolley, luggage storage and displaced bench |

Raised geometry must remain inside its solid. The solid must also be visibly occupied. A tiny trolley cannot justify an invisible blocking rectangle; if the packing bay cannot read honestly, revise both renderer and collision together before freezing layout. The open bunk recess contains bed/storage, not apparently walkable empty floor. No new door or cabin interaction is implied.

## Circulation and sightlines

Retain direct entry-to-exit movement and shots along y440, the north and south perimeter loops at y100/y780 and the cross-connection at x580. Keep the four breach anchors at 100,100; 1100,100; 100,780; 1100,780 and their inward spawn offsets clear.

A flush floor guide may bend slightly through 100,440 → 560,440 → 600,420 → 1040,420 → 1100,440. This is visual composition, not a constrained path or a new raised obstacle. No railing, overhead bridge or closed doorway crosses a legal floor lane. Services remain within fixture solids or rear architecture.

The middle band is 150 units wide and the central cross-connection 130 units. CPU rectangle reconnaissance clears the selected route segments at radii16/28/38. This is conservative geometric feasibility only, not production navigation or an accepted layout. An earlier guide at y400 failed the radius38 stress envelope and was rejected before rendering.

## Entry and whole-room acceptance

At unchanged shipping desktop and portrait cameras, the entry must show the player, repeated cabin thresholds and an obvious route. Inspect the empty bunk and loaded trolley from legal player positions. Near-side backs and door frames must not conceal enemies on legal floor. Overview images locate every zone but cannot pass native appearance or HUD checks.

Use a room3-specific renderer path. Do not change Communal Atrium's shared habitation treatment by accident. Retain camera/light/VFX settings. Prefer simple low-detail masses before original detailed Blender equipment.

Before accepting layout, verify production player movement, every enemy approach, clear and blocked shots, legal drops/pickups and unchanged objective/progression. Compare actual raised mesh bounds with the four solids. Capture entry, middle, exit and both southern bays with the real HUD at shipping desktop/portrait scale. Review the complete room independently. No mechanical service, bearing or latch criteria are added.

## Source and next step

Baseline `de5198e2a80ba66f3ea6de3071c1b82f70bae0ef`, `storyRoomTemplates.ts:9,29-35`, `ShipEnvironments.ts:41-50,163-231` and `DepthRenderer.ts:130-189`.

Next: evaluate the current whole-room baseline, then implement this low-detail domestic blockout with targeted production regressions. Equipment, full verifier, native visual acceptance, actual gameplay video and release remain pending. Refs [#24](https://github.com/cdb-lumen/containment/issues/24).
