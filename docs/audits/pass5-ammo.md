# Pass 5: ammunition and encounter pacing audit

Read-only audit of containment-3d. No checkout files edited. Recommendations below are implementation guidance, not measured playtest claims.

## Diagnosis

- `src/game/combat/catalog.ts`: rifle 30+180 rounds, shotgun 8+48 shells, plasma 20+100 cells, rocket 1+8; reloads 1.6 / 2.1 / 1.8 / 2.4 seconds. New runs select shotgun. The pistol is already renewable, but switching to its lower sustained DPS feels like punishment.
- `PickupSystem.ts`: ammo is 15% of a successful drop. Per-kill ammo chances are therefore crawler 1.2%, brute 4.5%, spitter 2.7%, stalker 3.3%, carrier 4.2%. Expected ammo quantity is only 0.288–1.08 rounds per kill, versus a brute's 20 rifle bullets before act scaling. Stochastic drops cannot sustain the expedition.
- `DepthGame.collectLoot` applies all 12/24/36-round drops to the CURRENT weapon. They are wasted for pistol reserves and disproportionate for rocket reserves. Weapon swapping at pickup is an accidental optimization.
- Run v2 has supply/medical forks at depths 2, 6, 10. Choosing medical supplies no free ammo. Armory gives only rifle 60/75/90, shotgun 18/24/30, plasma 24/30/36, rocket 2. Optional 100-credit ammo purchase grants only 65% of that pack. Taking medicine should not leave the next combat room ammo-starved.
- v2 health multiplier rises from 1 to 1.605 by depth 9; elite HP is another 1.65 multiplier. Queen is 5,000 HP and renewable nests have 300 HP each. Queen alone needs at least 313 base rifle hits; misses, minions, armor windows and nests add substantially. A finite pre-boss pack cannot guarantee comfortable ammo during a long attempt.

## Recommended model: finite magazines, continuously replenished reserves

Preserve current magazines, reload durations, firing rates and damage. Ammo friction should live in reload timing and weapon selection, not permanent depletion.

| Weapon | New-run reserve and room-entry minimum | Renewable reserve per active second | Ordinary ammo pickup bundle |
|---|---:|---:|---:|
| Rifle | 240 | 6 | 60 |
| Shotgun | 64 | 1 | 12 |
| Plasma | 140 | 3 | 30 |
| Rocket | 12 | 0.5 | 2 |
| Pistol | existing infinite | unchanged | no reserve change |

Implementation rules:

1. Put replenishment in CombatSystem, using per-weapon fractional accumulators and integer reserve increments. All four reserves replenish during active gameplay, including reloading and boss armor windows. Never change loaded magazine counts through regeneration. Limit passive replenishment to the table's reserve values; preserve earned/purchased surplus above those values.
2. Room start raises each finite reserve to at least the minimum. Do this only when `enterRoom(start=true)`, after restoring/selecting the build and before starting the director. Restoring an already cleared checkpoint (`start=false`) must not repeat a grant. Do not use resource restore inside the active update loop: restore resets reloads, cooldowns and mutation state.
3. Keep existing starting magazines and mandatory reload behavior. Passive rates sustain approximately baseline continuous fire: rifle spends about 6.1 rounds/s including reloads, shotgun 0.88 shells/s, plasma 2.48 cells/s, rockets 0.42/s. Rifle's initial 240 covers the tiny baseline deficit; optional faster-reload builds still have substantial reserve headroom and replenishment between fights. For a literal zero-starvation guarantee under any future firing/reload modifier, compute regeneration as at least the modified sustainable consumption rate; avoid an invisible emergency refill rule.
4. Replace current-weapon ammo rewards with proportional bundles to all finite weapons. Keep the existing `addReserveAmmo` contract for unit tests/mutations if useful; add a separate `addAmmoPack` API and call it from pickups/services. A 24-value drop corresponds to the table's bundle; scale the 12 and 36 values by .5 and 1.5, rounding rockets to at least one. Apply the existing 100,000 hard validation ceiling.
5. Emit the ammo-pickup mutation event exactly once for the CURRENT weapon, so Magnetic Feed remains an intentional up-to-two-magazine-round bonus. Regeneration and room-entry grants must not emit pickup/reload events.
6. Baseline ammo comes from the renewable system regardless of service choice. Armory remains a bigger immediate reserve/ordnance bonus, rather than necessary survival infrastructure. Retain healing/armor prices. Update ammo pack numbers and display to match actual bundles if changed. Do not charge 100 credits for a pack that is immediately erased by a passive cap; surplus must survive.
7. Regeneration follows `DepthGame`'s active update gate. No accrual while paused, in reward/route/menu, dead or complete. Reset fractional accumulators on new run/resource restore; serialize only integer reserves, keeping pistol -1 checkpoint encoding unchanged.
8. Explain once in control/help text: “Reserves replenish during combat. Reload to refill your magazine.” A short “RESUPPLY” HUD hint at low reserves can make the mechanic legible without extra controls.

This is intentionally a generous model. Do not try to compensate by raising enemy HP: that reintroduces the friction through time to kill.

## Longer combat rooms at the same peak pressure

In `createEncounterPlan`, use `Math.round(oldTotalSpawns * 1.25)` for v2 combat/elite rooms. Preserve concurrent caps, base spawn interval, 650 ms warning, pauses every eight spawns, enemy HP/damage/speed, and boss values. Legacy saves may retain their old formula if preserving old encounter tuning is desired.

Representative v2 counts: depth 0 12→15; depth 1 normal 15→19, elite 20→25; depth 3 guardian 26→33; depth 4 24→30; depth 5 normal 27→34, elite 32→40; depth 7 guardian 38→48; depth 8 36→45; depth 9 normal 39→49, elite 44→55. Existing caps remain 7–16 for these rooms, including carrier child reservations.

The schedule's final dispatch is roughly 23–35% later for these examples (depth 0 14.0→17.1 s, depth 4 24.0→30.9 s, depth 7 29.8→37.6 s, depth 9 elite 31.1→38.3 s). Exact duration also depends on killing speed and occupancy; do not claim a measured 25% play duration increase. No fixed clear timer: when the final enemy dies, let the room finish immediately.

If the first normal depth-1 room is judged too long, 18 instead of 19 spawns yields a smaller increase. Otherwise use the simple uniform formula. Adding a few enemies prolongs the active encounter, while preserving current cap prevents a larger immediate mob. Do not raise both count and health or both count and spawn pauses in this pass.

## Concrete pitfalls and focused verification

- Current auto-reload call is INSIDE `if(input.fire)` despite its method comment promising reload after Fire lifts. Move `reloadIfEmpty()` outside that branch during active update, so empty magazines refill while the player dodges or releases touch Fire. Verify it does not restart a reload or trigger Hot Reload twice.
- Preserve integer finite reserves and the pistol -1 checkpoint sentinel. Validate new reserves survive checkpoint round-trip.
- Do not call `addReserveAmmo` for passive regeneration: it emits Magnetic Feed and would continuously bypass magazine limits.
- Verify 180 seconds of sustained firing for each primary weapon with actual reloads, including queen-style pauses, does not exhaust the recommended budget; check magazine decreases normally and remains empty until reload completes.
- One deterministic test should compare partitioned time updates (e.g. 100×10 ms vs 20×50 ms) for fractional rocket regeneration, cap behavior, and no magazine changes.
- One integration test should start the boss after taking every medical branch with depleted stored reserves: room entry raises all reserves; active replenishment continues with zero enemy kills.
- Replenishment must not accrue during paused/reward/dead states; finite surplus above passive cap must not be truncated.
- Check one all-weapons ammo pickup, including pistol selected, and assert a single Magnetic Feed event. Existing current-weapon `addReserveAmmo` tests need not be invalidated if the new bundle is a distinct API.
- Director test should assert new v2 totals and cap unchanged, accounting for active+reserved children+pending spawn commands. Keep the final-batch/next-update clear invariant.
- At present direct rocket blast kills are sent as mutation source `direct`, despite Scavenger/Blood Price copy saying explosion kills do not recover ammo. Avoid coupling the core supply model to this existing mismatch.
