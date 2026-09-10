# Residential Gallery story

Status: story passed independent review on September 10. Review confirmed the canonical objective, living sleepers, reveal timing, canon/design distinction and absence of new interactions. This does not pass layout or release.

Room 3 connects Passenger Vault to Communal Atrium. Its objective remains **Fight through the residential doorways.** Whole-room layout and equipment acceptance are separate from this story brief.

## Established facts

The shipping campaign names this a habitation room and supplies the cue **Packed belongings. Arrival labels for New Earth.** The player has left occupied cryogenic rows and next enters the atrium with its running welcome display. These are narrative neighbours, not a promise of seamless map transitions.

Aliens seized the migration ship during transit. The passengers remain alive and asleep; their possessions must not imply a massacre, evacuation or infection. The mercenary player still receives the AI's survival promise. Warning New Earth belongs to room 10, fatal-cost evidence to room 11 and proof of the AI's prior knowledge to room 12. Do not reveal those facts in room 3.

## Room function and chosen presentation

This passage serves cabins and shared domestic furnishings. Repeated cabin thresholds establish that purpose. One open, empty bunk alcove and a loaded luggage trolley show what the sleeping travellers left ready for arrival. A displaced bench interrupts the otherwise ordered door rhythm. These are chosen props from issue #24, not additional canonical events or biographies.

The intended entry impression is a domestic space interrupted by invasion. Keep anonymous personal traces sparse. No exposed sleeper, corpse, named family tragedy, emergency countdown or local evacuation story is added. The cause of any displaced furniture remains unspecified.

The player fights through the doorways toward Communal Atrium. No new door-unlocking, cabin exploration, trolley movement or rescue interaction is introduced. Essential meaning must remain apparent without audio or tiny labels. An empty alcove must not suggest usable floor where collision forbids entry.

## Layout handoff

Derive the complete circulation and doorway composition before detailed props. Compare the inherited four offset obstacles with a bent residential spine, preserving broad alternate routes and legal enemy approaches. Keep camera, lighting and VFX unchanged. Test entry and exit, player/enemy clearance, shots, pickups, HUD and visible occlusion together at shipping desktop/portrait cameras.

Doorway rhythm, an open bunk alcove and a loaded trolley are signature equipment. Their geometry must be believable at gameplay scale. Non-gameplay seal construction, service access, latch operation and contact mechanics are not release gates. After two cosmetic attempts, simplify the component without removing its room function.

## Sources

- Campaign at `de5198e2a80ba66f3ea6de3071c1b82f70bae0ef`: `src/game/roguelike/storyRooms.ts:4-7,13-23,29-36`.
- Current layout baseline at the same source: `src/game/roguelike/storyRoomTemplates.ts:5-9,29-35`; Residential Gallery has no override in `authoredRoomTopologies.ts`.
- Agreed scenario in shared vault at `698dab1fee5b138d6cb8d1da21ae953f31356374`, `Projects/Containment Depth - Scenario.md:11-19,24-38,44-59,111-121`. The file's proposed interactions are not current implementation requirements.
- [Issue #24](https://github.com/cdb-lumen/containment/issues/24), read September 10, supplies the domestic props and doorway-combat targets. Its pending shared-topology dependency is replaced by this room's story-derived layout review.
- User-authorized gameplay-first delivery policy, September 10, retains safety/gameplay/release gates and supersedes non-gameplay mechanical and invisible-cosmetic requirements.
