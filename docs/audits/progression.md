# Progression audit and concrete next pass

Read-only audit of `containment-3d` on 2026-09-05. No checkout changes made. These are implementation recommendations and initial playtest targets, not claims of tested balance.

## What the current game actually does

- `run.ts`: six depths; exactly three ordinary/elite encounters, two service rooms, and one Queen. Eight legal routes. All branch choices merge immediately. Template seed changes layout/order but not the overall expedition structure.
- `EncounterDirector.ts`: normal counts at depths 0/2/3 are 14/22/26; the elite depth-3 branch has 34, with first brute elite and 18% additional elite chance. Caps are 8/12/14 or 18. Spawn intervals 900 ms ordinary / 720 ms elite. Medical and armory start and clear synchronously with no play.
- Enemy health/speed/damage never scale with depth. `CombatSystem.setWave()` stores a display value. Elite enemies double health and damage; an elite brute has 640 health + 320 armor and 70 contact damage. Elite visual/spawn clearance uses enlargement in the host, but EnemySystem retains ordinary collision radius.
- A run normally grants three mutations. First choice reliably establishes Breacher, Cryogenic, or Scavenger. There are 12 unique mutations with prerequisite checks and no replacement/skip reward path.
- All five guns are usable immediately, with substantial initial ammunition: rifle 30+180, shotgun 8+48, plasma 20+100, rockets 1+8; pistol reserve is infinite. Health 100 and two 50-HP medkits make the current supply choice fairly forgiving.
- Medical grants 35 HP + 15 armor; supplies grant 45 rifle / 18 shotgun / 20 plasma / 2 rockets + one grenade. There is no credit sink, although kills and pickups award credits.
- Queen has 5,000 health, a repeating 2 s armored / 1 s nest / 4 s exposed cycle, 2/4/6 nests by health thirds, and 900 ms targeting rings. Existing renderer does display those rings. Nest count and spawn rate are the main late-fight escalation.
- Room-boundary saves rigorously validate exact schemas, ordered paths, living resources and deterministic seed graphs. Saves deliberately preserve an unresolved reward or route, and leaving combat rolls back to the last room boundary.

## Highest-priority gaps and risks

1. **Changing the graph in place invalidates existing saves.** Checkpoints are v1; IDs and legality regenerate from current `generateRun(seed)`. There is also a literal `completedNodeIds.length <= 6` in `checkpoints.ts`. Keep the complete v1 graph generator and validation path intact and dispatch by ruleset version. Versioning only JSON while regenerating every run through the new graph is insufficient.
2. **Spawning will silently lose variety or softlock new rooms.** `DepthGame.encounterEvents` sorts all breaches and always chooses the farthest one, replacing the seeded selection. Pending placements try 25 local positions forever with no alternative-breach/reachable-cell fallback. A permanently obstructed child or breach request keeps occupancy positive forever. Keep pending commands counted, but relocate a command through a deterministic safe fallback after a bounded placement delay.
3. **Simply increasing elite damage creates unfair spikes.** Current double damage makes elite brute contact 70. Do not multiply that by an aggressive depth curve. Separate health, armor, speed and damage modifiers and introduce ability telegraphs before raising difficulty.
4. **Encounter roles need authored composition.** Brute `armored-charge` is only a catalog label: actual code has armor and pursuit, no charge state. Spitter and stalker behaviors work in open sightlines; when occluded, the navigation callback overrides their desired target with a path to the player. Route toward the role's desired target or re-enter standoff after obtaining sight.
5. **A speed curve needs `baseSpeed`.** `EnemySystem.setSlow` always rebuilds speed from `ENEMIES[type].speed`; chilling an enemy would erase new per-room speed scaling unless the instance stores its scaled unslowed speed.
6. **Room completion strands drops.** Host switches immediately to reward, which freezes pickups and movement, then next-room setup resets pickups. Last-kill drops and uncollected resources disappear. Settle remaining drops exactly once before snapshot/save, or create an explicit short cleanup phase. Recommended smallest change: collect remaining drops through one shared resource receipt function on clear.
7. **Credits currently have no player meaning.** Add a small deterministic service purchase choice and display credits wherever that decision is made. Avoid building a shop UI whose actions bypass expedition receipts or checkpoint boundaries.
8. **Ammo starvation is avoidable but tedious.** Infinite pistol prevents a literal no-ammo softlock, but a 12-room extension without guaranteed replenishment risks long pistol cleanup. Preserve the pistol and guarantee a finite-weapon ammo floor at service stops.
9. **Rare mutation exhaustion is not handled at host level.** The draft reducer correctly returns fewer/zero offers, but the host UI interprets zero offers as a resource room; `claimResources()` then returns without progress for an upgrade node. Add an explicit fallback mutation reward receipt (credits plus ammunition, or replacement choice), even if the default eight-mutation route rarely reaches it.
10. **Multiple capacity definitions disagree.** Global EnemySystem/Queen limit is 150; ordinary director cap <=20 includes carrier reservations; queen host drops minion requests once active+pending reaches 20. Pass one encounter capacity policy and include active, pending, carrier reservations, nests and scheduled warnings consistently. Do not mark an unfulfilled boss spawn as consumed and silently discard it.
11. **Local-storage failures are mostly silent.** `save()` only responds to success, and death/victory ignore clear failure. `suppressSave` protects the present instance, but a reload can expose a stale save if removal failed. Preserve storage errors as a user-visible save-status state; never claim the run is saved/deleted when it was not. Do not destroy a legacy checkpoint while migrating before a successful replacement write.
12. **Long fights can exhaust mutation bookkeeping.** Build reducer caps encounter events at 2,048, and MutationRuntime has a 2,048-hit cap. The cap is safe against loops, but a lengthened Queen fight with many minions can silently disable mutations. Keep causal/chain caps; measure legitimate event totals and size the encounter budget to a bounded encounter design, or safely retire finished independent chains after all effects resolve. Do not reset dedupe during live chains.
13. **Existing tests prove orchestration, not enjoyable combat.** DepthGame completion test repeatedly applies 10,000 damage to each enemy / 100,000 to Queen. It cannot reveal ammo pacing, attack fairness, kiting stalls or boss duration. Graph and checkpoint tests embed six rooms; room template tests embed eight layouts and radius 28.

## Proposed expedition: 12 rooms, three acts

Use three four-room acts: arrival encounter, risk branch, recovery stop, act guardian. Every legal route is exactly twelve rooms. Risk branches occur at 2/6/10; recovery choices at 3/7/11. Each choice merges into the next depth, keeping the graph readable (64 route combinations with two-way choices at six depths). Existing `combat`, `elite`, `medical`, `armory`, `boss` kinds can remain for most nodes; add `miniboss` or an explicit encounter archetype for rooms 4 and 8. Rewards should be explicit data, not guessed from ID suffixes.

| Room | Act / purpose | Encounter target (normal / risk) | Live slot cap | Guaranteed result |
|---|---|---:|---:|---|
| 1 | Freight: teach movement, reload, cover | 14: 12 crawlers + 2 brutes, introduced separately | 7 | Starter mutation |
| 2 | Freight: crossing or quarantine breach | 18 / 23, introduce up to 2 spitters | 9 / 11 | Mutation / rare mutation + 60 credits |
| 3 | Freight: infirmary or supply depot | Safe station | 0 | Recovery receipt + optional purchase |
| 4 | Freight: Security Warden | 16 adds + 1 named brute guardian | 10 | Rare mutation + act completion |
| 5 | Biolabs: standoff and flanking | 26, introduce stalkers with one isolated opening spawn | 12 | Mutation |
| 6 | Biolabs: specimen lanes or brood rupture | 30 / 36, introduce carriers | 13 / 15 | Mutation / rare mutation + 90 credits |
| 7 | Biolabs: infirmary or supply depot | Safe station | 0 | Recovery receipt + optional purchase |
| 8 | Biolabs: Brood Matron | 24 adds + 1 named carrier guardian | 15 | Rare mutation + act completion |
| 9 | Reactor: mixed-role pressure | 34, two alternating breach groups | 16 | Mutation |
| 10 | Reactor: coolant circuit or overload | 38 / 46, guarded elite pack + timed lane hazard | 17 / 19 | Mutation / rare mutation + 120 credits |
| 11 | Reactor: final preparation | Safe infirmary / supply depot | 0 | Recovery receipt + optional purchase |
| 12 | Reactor: Queen | 5,000 HP baseline plus capped minions | 18 incl. pending/reserved | Victory |

Counts refer to planned standard-enemy dispatches; carrier children consume reserved capacity and count in threat totals, so use capped carrier quotas. Act guardians are fixed encounters, not a whole new boss engine. Total ordinary/guardian dispatches become approximately 202–221 before carrier children and Queen summons, versus 62–70 now. This is already a substantial increase in run length and difficulty; avoid doubling HP on top of it. Initial full-run target: about 14–20 minutes, subject to real playtests.

Expose act name, room/12, room archetype, risk description and exact reward on route cards. A risk card should say e.g. “Two elite guards; faster reinforcements · rare mutation + 90 credits.” Medical/armory cards should show the actual resource deficits they would fix. Show a compact three-act route overview; completed rooms and upcoming guardian milestones provide visible progress.

## Numerical progression curves

Put all curves in one new pure `progression.ts`, returning an immutable profile per canonical node. Enemy spawn must receive the profile; `setWave()` does not implement difficulty.

For zero-based depth `d` and act index `a=floor(d/4)`:

- Standard HP multiplier: `1 + 0.035*d + 0.08*a`, reaching 1.51 at room 11 (the last service) / 1.475 in room 10. Round max health, and set armor from separately authored armor ratio.
- Standard contact/projectile damage: `1 + 0.015*d + 0.04*a`, reaching 1.215 in room 10. Keep normal enemy attack cooldowns unchanged initially.
- Movement speed: `min(1.13, 1 + 0.007*d + 0.025*a)`. Fastest standard crawler remains ~167 units/s at room 10, below player's 220. Preserve speed scaling when applying/removing chill.
- Normal-room concurrency grows via the table, not the old unbounded `depth*2` expression. Count each carrier as four reserved threat slots if it will produce three children; cap carriers to 0 in act 1, 2 in act 2, 3 in act 3.
- Spawn interval by act: 1,050 / 850 / 720 ms. Risk interval is 0.88 times normal; minimum telegraph remains independent. Groups of 5–7 spawns get a 2,000 ms pause to reload and reposition. First warning begins at 750 ms; enemy becomes active after another 700 ms.
- Elite health 1.65×, elite damage 1.20× (replace current 2× damage in new ruleset), elite speed 1.04×. At room 10, elite brute contact ~51 rather than 85+. Give elite brutes less extra armor rather than doubling both health and armor; e.g. armor 30% HP for an elite, 50% for ordinary legacy brute. Keep v1 rule behavior if strict old-run compatibility is desired.
- Default composition by act, before quotas: act 1 crawler 75%, brute 15%, spitter 10%; act 2 crawler 45%, brute 15%, spitter 20%, stalker 15%, carrier 5%; act 3 crawler 40%, brute 15%, spitter 20%, stalker 15%, carrier 10%. Use exact bounded quotas after the seed shuffle so a bad seed cannot create six early brutes.
- Threat weighting for composition audits: crawler 1, brute 5 (480 base EHP), spitter 2.5, stalker 3, carrier 5 (220 HP + three 42-HP children). Elite weight >=1.65×. Compare total weighted EHP and threat slots, not counts alone.

HP growth is intentionally modest because build damage increases are mostly situational. Breacher/Heavy Pellets is not an unconditional exponential damage upgrade. Eight mutation rewards give strong identity without requiring all twelve mutations. If three universally strong abilities make later combat trivial, tune composition and spacing before increasing body HP.

## Guardians and fair telegraphs

**Room 4 Security Warden:** one distinctive brute, 900 HP + 180 armor, 85 move speed, 25 contact damage. Charged ram does 35 damage. Sequence: acquire target, 900 ms visible ground lane + raised forelimbs, lock direction, 450 ms forward dash capped at 330 units/s, 1,000 ms recovery. Dash stops on cover; no steering during dash, no ordinary contact damage from the same action. Stagger add groups so a charge does not coincide with a new surrounding wave.

**Room 8 Brood Matron:** one carrier variant, 1,350 HP, no bonus armor, 70 speed, 24 contact damage. Every 6 s, 1,000 ms warning spawns two crawlers at reachable sockets, subject to the shared live cap and a total of twelve summoned adds. At half HP, alternate a three-circle acid fan with 1,000 ms warnings and 700 ms recovery; each circle locks to a location when shown. Avoid infinite add farming. Guardian death still requires the finite remaining adds to be defeated before clear.

**Queen:** keep 5,000 HP initially; preserve known 2/1/4 phase timing and 900 ms warning. Later stage challenge comes from 2/4/6 nests, but cap minion slots at 18 and add an encounter-wide minion budget or diminishing non-resource drops to prevent infinite farming. Killing a nest grants a small ammo receipt, once per unique nest, capped per phase/encounter. Avoid endlessly farming a respawned nest for ammunition. Stage 2/3 may change attack pattern, but keep a >=900 ms warning and one safe route out of each marked area. Describe “ARMORED — destroy nests” and “EXPOSED — damage the Queen”; show next exposure countdown. Do not grant queen damage immunity without readable phase feedback.

**All enemy attacks:** spitter windup 450–550 ms and fixed launch direction once it fires; stalker reveal at least 350 ms before a lunge/contact burst; elite attacks have shape and animation cues as well as color. Use separate warning and execution events, then snapshot pending attacks so rendering and pause are reliable. No damage on the same frame a new warning first appears. The queen already satisfies this core property in its reducer; reuse that pattern.

## Supply economy

Keep starting weapons and pistol reserve compatible. A 12-room run needs three reliable preparation stops. Use current inventory limits as format limits, not as balancing goals.

- Medical receipt by act: restore 35/40/45 HP and 15/20/25 armor. If already full, show that before selection; optional alternative one medkit (cap 3) avoids an empty reward, but the exact selection must be saved.
- Armory receipt by act: rifle +60/+75/+90, shotgun +18/+24/+30, plasma +24/+30/+36, rocket +2/+2/+3, grenade +1 capped at 6. Restore a small reserve floor for the selected finite weapon at every service room, including medical (e.g. 30 rifle / 8 shotgun / 12 plasma / 1 rocket), so healing routes remain viable. Floors refill to a threshold, not add repeatedly.
- Each service stop offers one optional purchase, selected among 30 HP for 100 credits, one medkit for 140, 25 armor for 90, or an ammunition pack for 100. Act 2 prices ×1.25, act 3 ×1.5, rounded to 5. Optional purchase count is one per node, and free receipt + purchase should be committed atomically by a single confirm action. One-click “Continue without purchase” must always exist, including at zero credits.
- Ammo pack is weapon-dependent: 45 rifle / 12 shotgun / 18 plasma / 2 rockets; don't let selecting pistol waste a paid pack. Select intended gun explicitly or choose the finite weapon with greatest normalized deficit.
- Existing credit income is generous: normal brute 35, spitter 18, stalker 25, carrier 30, crawler 5. With ~200 planned foes the expedition economy may exceed 3,000 credits. One-purchase caps keep healing bounded. If a persistent credit wallet is later introduced, rebalance then; do not promise persistent currency now.
- Keep credits as run-only. Terminal results can show route taken, kills, elapsed combat time, mutation build and seed, but elapsed/kills must be checkpointed before claiming continuity across restores.
- Single-use receipts must apply base resources, mutation pickup/heal hooks, and checkpoint update once. Current armory applies a `restoreRunResources` snapshot, resetting mutation encounter state; service timing makes this safe, but a new mid-combat supply feature must not reuse that method.

## Layout variety and constraints

Retain existing eight templates and add at least four: `turbine-hall` (two longitudinal lanes linked at three points), `containment-pods` (staggered islands), `coolant-bridge` (wide central connection plus two outer routes), and `nest-gallery` (open guardian circle with peripheral cover). Use act-specific pools and avoid repeating a template along the chosen path until the act pool is exhausted. Map palette, lights, door labels and harmless set dressing to act/archetype, while collision shapes remain source-of-truth.

All templates need a continuous escape loop and reachable spawn/exit/breach sockets. Existing tests check radius 28 but navigation raster uses radius 30 on 32-unit cells; test actual navigation too. Larger elite radius requires corresponding nav clearance or keep collision radius unchanged consistently. FacilityNavigation is fixed to 80×45 cells / 2560×1440; do not author larger rooms without making the navigation dimensions dynamic. Queen/nest immovable circles are host collision obstacles but not navigation blockers, so guardian arenas should not create passages narrower than those circles allow.

Room differences should also change the fight: hold a coolant lane while reinforcements switch sides, eliminate a marked elite first, choose an optional alarm cache after clearing. Do not add mandatory interactable objectives until their reachability, keyboard/touch interaction and checkpoint phases are implemented; a well-authored finite ambush is better than an objective label with no mechanics.

## Save-compatible implementation sequence

1. Copy existing pure graph generation as immutable `generateLegacyRun(seed)` and freeze v1 fixtures (reward and route at every old depth). Add `ruleset: 1 | 2` through versioned run schema, or use `RunStateV1 | RunStateV2` with version discriminant. `getGraphForRun(run)` must replace every `generateRun(run.seed)` in host, expedition, UI, encounter validation and phase reducers. New runs use v2; resumed v1 runs still finish their six-room graph. Keep the old storage key or explicitly attempt it after the v2 key; do not delete the old checkpoint before a replacement successfully saves.
2. Add v2 graph/archetype/profile data and make all UI denominators derive from graph length. Remove hardcoded `/06`, `length:6`, `depth<6`, boss-at-5 and six-line story clamping. Keep legacy denominators at six.
3. Extend spawn state with scaled stats and optional guardian identity; implement attacks with time-based state and snapshots. Add `baseSpeed`, explicit elite radius policy and profile inheritance for carrier children.
4. Add shared occupancy and spawn-warning scheduling; never allow a warning to reserve zero capacity. Improve fallback placement using prevalidated reachable sockets away from player, with a minimum 220-unit safety distance; when none exists, defer and retry rather than spawn on top of player or drop the command.
5. Add resource settlement and service transaction reducer; save receipt choices/purchased state atomically. Empty mutation offer fallback must advance exactly once.
6. Implement act guardians and compose the final Queen under the same pause/death/clear rules. Then create new templates and UI/data-driven route descriptions.
7. Verify meaningful properties and play through with actual fire/reload/aim. Do not consider god-damage clear tests sufficient for tuning.

## Required verification gates

- Enumerate every legal new path for representative seeds: exactly 12 unique depths, three services, two guardians, one final Queen; every branch terminates; seed determinism and no invalid template references.
- Restore frozen v1 reward/route fixtures unchanged, including pending rare offers and ammo; new v2 fixtures reach rooms 7–12; corrupt/unknown versions remain rejected; simulated storage failure leaves the prior checkpoint intact.
- Full host progression with low-level dispatch/kill adapter can still prove no softlocks; add separate actual-weapon combat smoke runs for standard, risk, guardian and Queen encounters. Observe duration, health loss, ammo by weapon, mutation event counts and maximum occupied slots.
- One unavailable spawn socket must fall back, all temporarily unsafe sockets must defer, and no final pending child can cause a false clear or permanent deadlock. Verify pause during a warning, death during hazard execution, simultaneous last enemy/player death, and queen defeat with remaining minions.
- Test guardians with bounded damage cadence: telegraphs always precede damage, fixed targets do not track player after lock, cover stops charge, no duplicate hit per action, minion budget finite, no reward farming from repeats.
- Service receipt/purchase double-click and reload preserve exactly one award/deduction; cannot buy with insufficient credits; can always skip; all finite reserves remain valid; selected pistol cannot waste a purchased ammo pack; full mutation pool has a legal fallback.
- Traverse every template via actual navigation for player/standard/elite radii; test all possible guardian/nest sockets and authored spawn inward offsets, not just abstract breach points.
- Validate depth speed scaling survives chill expiration; difficulty profile modifiers are applied once; legacy profiles preserve expected old values where intended.
- Inspect desktop and mobile readability at room 10/12: route risk/reward, act progress, boss warning rings, service deficits, large build list and save status.
