# Containment / Depth: complete-run pass

## Direction

A twelve-room descent through Cargo, Quarantine and the Core. The facility grows more infected, the enemy mix grows more dangerous, and the player's acquired boons create a visibly different combat style. Readable threats and movement control take priority over decorative effects. Preserve the current authored actors, mobile two-thumb control scheme and existing saved expeditions.

## Audit and implementation order

| Workstream | Confirmed issue | Implementation | Acceptance |
|---|---|---|---|
| Enemy health | World geometry can overwrite early-drawn bars | Separate final HUD render, fixed pixel size, armor indication, no bloom or depth occlusion | Damaged and full-health enemies have readable bars in high and performance modes |
| Lighting | Moving shadow camera, strong shot light and changing quality path can cause flashes/shimmer | Stable room-anchored shadow camera, bounded muzzle illumination, stable lighting across quality modes | No environmental strobe; attack flashes stay localized |
| Locomotion | Boolean movement always selects forward run | Actual collision-resolved velocity; forward/back gait; lower-body heading with upper-body aim compensation | Forward, reverse, lateral and diagonal travel preserve aim and show correct foot motion |
| Environment | Same flat material language in every room | Authored tiled PBR surfaces, three act palettes, distinct solid cover types, vents, structural trim and core utility piping | Cover matches collision footprints; readable floor, obstacle and enemy contrast |
| Boon drafting | First draft repeats three fixed choices; only three upgrades per run | Larger archetype catalog, weighted seeded rarity/synergy offers, finite paid rerolls, new choices across twelve rooms | Runs differ, offered boons work immediately or clearly require prerequisites, save/reload cannot reroll for free |
| Boon mechanics | Splash hits miss on-hit boons; secondary blasts pass through walls; effects largely invisible | Correct hit/kill event flow, bounded chain/area effects, chill/electric/burn/impact VFX and status tint | Every promised effect works on relevant weapons, no infinite proc loops or wall penetration |
| Progression | Six rooms, two noncombat rooms; enemy strength never scales | Versioned twelve-room graph, new layouts, staged enemy mixes, bounded health/damage/speed curves, act-ending elite encounters | Twelve-room route completes; late rooms demand a stronger build; original six-room saves still load |
| Run economy | Credits accumulate without purpose | Between-room credits display, paid boon rerolls and recovery/supply purchases | Costs enforced and purchases persist exactly once |
| Fairness and pacing | Planned breaches overwritten; spawn failures can block completion | Honor safe seeded breach, delayed spawn cue, fallback placement; encounter counter and clear progression | No enemies spawn on player, no uncleared room with permanently unplaceable spawns |
| Mobile robustness | Touch move area can overlap weapon controls | Correct input stacking and pointer ownership; preserve reload while moving | Weapon selection, reload and movement remain independent |

## Verification

1. Domain tests for seeded offers, prerequisites, reroll transactions, proc limits and wall visibility.
2. Legacy-save roundtrip and full new twelve-room run completion including reward/service branches.
3. Geometry reachability checks for every new layout and large enemy clearance.
4. Directional animation tests using production GLBs; final HUD pass code review and pixel-size checks.
5. Production typecheck/build and budget review for shared textures, shadow stability, particles and simultaneous enemies.

Subagents provide independent audits and environment assets. The owning agent integrates changes, reconciles cross-system contracts and publishes the complete update. Browser/device behavior is not claimed verified without an actual supported device/browser test.

## Delivered structure

| Rooms | Place | Pressure and decisions |
|---|---|---|
| 1–4 | Cargo | Swarms and brutes; optional elite branch; medical or supply stop; charging Warden |
| 5–8 | Quarantine | Spitters, flankers and carriers; another risk branch and recovery stop; Matron with three finite brood waves |
| 9–12 | The Core | Denser mixed encounters and stronger enemies; last supply decision; the Queen's timed armor, nest and exposure cycle |

Eight boon picks are available in a complete run. There are 24 unique boons in four families; acquiring three in one family activates its passive bonus. Seeded, weighted drafts draw three distinct choices and favor existing synergies without excluding alternatives. Each reward allows two paid rerolls, recorded in the checkpoint. Elite rewards guarantee an eligible rare. This pass uses unique upgrades rather than ranks, so every pick adds a new mechanic or modifier.

Enemy health, damage and speed rise gradually, while encounter counts rise from 12 in the opening room to 39 in the last ordinary combat branch. Charges and spit attacks have locked aim and visible windups. Eight-spawn groups have an additional 1.8-second schedule gap. The normal encounter cap is 18, including carrier child reservations. Spawn placement respects cover and minimum player separation. A 220ms damage grace interval prevents simultaneous overlapping contact hits from instantly consuming the entire health pool.

## Resolved audit details

- Health bars render after the world and post-processing, in constant screen pixels, with depth testing disabled. Armored enemies show blue bars, elites amber; nests also have bars.
- Shadows remain anchored to the room. Performance mode disables shadows as well as bloom. Muzzle lights are local and reduced; Queen warnings no longer strobe. Undefined smoke shader smoothing was corrected.
- Forward/back clips use measured travel velocity. Lower-body yaw follows movement while the spine preserves weapon aim. The paused-frame accumulation bug discovered during verification is covered by a production-rig test.
- Authored CC0 diffuse/normal/roughness-metalness surfaces replace the old flat map treatment. Three shared material sets add approximately 1.5MB of download; no material or light is allocated per particle.
- Boon procs include frost, arcs, ignition, wall shocks, leech and armor cues. Burn refreshes rather than stacking, direct-hit deduplication prevents shotgun pellet multiplication, secondary effects do not recursively create direct-hit events, and explosions/arcs respect cover.
- Room clear collects remaining loot before saving. Credits fund rerolls and one optional recovery/ammo purchase at each service stop. The HUD shows stock and encounter counts; the pause panel explains owned boons and family bonuses.
- Mobile controls remain independent. Stacking places weapon selection above the movement region. The HUD retains its full-screen fixed positioning, and scrollable choices accommodate narrow or short screens.

## Verification and limits

The regression suite covers twelve-room host completion, all sixteen authored layouts and actual spawn offsets, original six-room graph compatibility, checkpoint integrity, weighted offer variety, paid reroll persistence and limits, proc deduplication, burn damage, line-of-sight protection, recovery caps, elite windup and scaled slow recovery, and directional rig/weapon alignment including repeated paused frames. Existing two-pointer movement/reload tests remain passing.

The full-run test verifies transitions and boss completion with controlled kills; it is not a human difficulty study. Real iPhone Safari visual quality, frame rate and finger hit testing remain unverified in this environment. Further tuning should use actual play sessions, especially late-act ammunition pressure and performance with the Queen and multiple status effects. Original subagent audit documents in `audits/` include additional proposals; they are evidence and future options, not a claim that every proposal shipped.
