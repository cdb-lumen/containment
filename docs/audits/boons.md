# Boon audit and bounded next-pass design

Read-only audit of `containment-3d`; no source files changed. Numbers below are proposed starting balance, not playtested conclusions. No external research is needed for this source-code design task.

## Main recommendation

Keep the pure reducer/host split, deterministic RNG, aggregate shot/target events, bounded secondary chains, and instanced effects. Expand to **24 boons in four six-boon families**, grant **five choices before the boss**, make three-card offers seeded and weighted with one useful follow-up, add one saved reroll, and give every proc a recognizable semantic visual. Do not build a new status simulation or projectile engine for this pass.

The present six-room route grants only **three** boons: depths 0, 2 and 3. Depths 1 and 4 only grant resources. Merely doubling the catalog will make coherent builds harder to assemble. Use all five non-boss reward boundaries for a draft; medical/armory rooms also grant their existing resource receipt atomically when that boon is chosen. Keep the route graph and room count unchanged. Five picks allow a three-family-member synergy plus one rank-up and one wildcard.

## Current evidence and risks

| Finding | Exact location | Action |
|---|---|---|
| Opening offers are always Breacher, Cryogenic, Scavenger; seed rotates order only. | `expedition.ts: expeditionRewardOffers` depth-0 branch | Draw three distinct starter families from four, with a seeded choice of starter in each family. |
| Draft is uniform Fisher–Yates over eligible unowned IDs. Rarity has no weights; an elite simply moves one rare into slot 1. | `builds.ts: draftMutationOffers` | Replace with weighted sampling without replacement and explicit rarity/fit guarantees. |
| Only 12 unique IDs; no ranks, owned upgrades, archetypes, reroll state, or offer provenance. | `types.ts: MutationId/BuildState`; catalog; exact-schema validators | Introduce rank ownership and offer state with an explicit checkpoint v2 conversion. |
| Five current boons are shotgun-specific or depend on shotgun effects. | Breacher, Heavy Pellets, Chain Reaction, Shattershot, Last Shell | Broaden Breacher to all direct weapons at lower non-shotgun impulse; retain optional shotgun specialties. Never offer three weapon-specific cards together. All five weapons start available, so present deadness is primarily ammo/playstyle fit, not weapon unlocks. |
| **Splash-hit integration bug:** rockets and grenades call `blast`, which calls `damage` and `kill` but never `mutations.hit`. Universal “hits add chill” does not apply to rocket hits. | `DepthGame.ts: blast` versus `updateBullets` | Report one aggregate hit per splash shot/target after successful base damage and before direct kill, just as ordinary projectiles do. Preserve original shot cause. Explicitly decide grenade tags; recommend weapon `rocket`, source kind `grenade`, so grenade effects can be eligible independently. |
| **Area collision inconsistency:** normal splash checks cover; mutation explosions damage through walls. | `DepthGame.blast` uses `hasClearExpeditionShot`; `MutationRuntime.#execute(explosion)` only distance-filters | Add `canAffect(from,to)` to MutationHost and use the same geometry visibility function for secondary area effects and arcs. |
| **Medic integration discrepancy:** pure reducer can turn unused bonus into armor, but health pickups at full health dispatch no heal event. | `CombatSystem.restoreHealth` early return; `resolveBuildEvent(heal)` | Clarify intended meaning, then dispatch eligible heal opportunity at full health if armor bonus can apply. Preserve zero-request guard and medkit “cannot consume at full” rule. |
| **Boss status mismatch:** runtime stores chill on Queen/nests, but `setSlow` ignores IDs <=0. | `DepthGame.makeMutations`; `targets` | Expose status resistance/capabilities. Keep Queen chill stacks for shatter, explicitly reduce/disable movement slow, show an appropriate status ring; do not advertise full slow on immovable nests. |
| Hot Reload priming is cleared each room even if no shot consumed it. | `enterRoom -> mutations.reset -> resetMutationEncounter` | Explicit room-local policy or preserve primed weapon flags in run combat state. Recommended this pass: room-local buffs, explain it in tooltip; do not silently promise persistence across rooms. |
| Full-health/bare-pistol ammo boons can be near-useless at a reward. | `draftMutationOffers` has no resource/context input | Context-aware weighting, guaranteed immediately useful card, fallback reward. Do not permanently ban sustain just because resources are momentarily full. |
| Prerequisites are draft-only checks; `addMutation` and build validator permit Shattershot without Cryogenic. | `builds.ts: addMutation/isValidBuildState` | Enforce prerequisites at acquisition; validate persisted ownership closure in v2, with explicit handling for accepted legacy v1 states. |
| Increasing catalog without changing hard-coded max 12 lets `addMutation` create a 13-entry build it would reject next call. | `addMutation` currently validates only input, then appends; `checkpoints.validCheckpoint` repeats 12 | Use one shared ownership/rank limit; validate resulting acquisition before returning. |
| Every root shot is permanently recorded in a 2048-event encounter ledger, even for an empty build; eventually procs stop. | `resolveBuildEvent`; `CombatSystem.fire`; runtime hit ledger | Preserve current safe cap initially, expose rejected-count debug stats, and test longest encounters. Never “fix” by evicting dedupe entries while effects remain alive. Bounded active-chain retirement is a separate optional optimization. |
| VFX loses boon identity entirely. Only explosion commands emit an effect; all become orange normal blasts. | `MutationHost.effect(x,y,radius)`, `DepthGame.makeMutations`, `GameEffect`, `AttackEffects.event` | Add semantic effect payloads and dedicated visual budgets described below. |
| UI maintains second descriptions/tradeoffs and only names in build strip. | `main.ts: friendly`, `tradeoffs`, reward cards, `build-strip` | Render catalog-driven rank-specific text, family icon, rarity, prerequisites, upgrade delta, and 2/3 family progress. Remove duplicate copy maps. |

The current Scavenger/Blood Price implementation credits the **currently selected** weapon when the kill resolves, not necessarily the projectile weapon. This matches the current “current finite reserve” copy; it is a design choice, not automatically a bug. Keep that choice explicit, or carry source weapon in `kill` when changing it.

## Proposed catalog: 24 entries, four families

Preserve all 12 existing IDs. Each boon has one fixed rarity; rank changes magnitude, never rarity. Common max rank 3, rare max rank 2, epic max rank 1. A rank-up uses one normal choice. Values are rank 1 / 2 / 3 where applicable. Direct-hit procs remain once per shot/target. All additional damage remains secondary and cannot generate another direct-hit event.

| Family / ID | Rarity | Rank effect and role | Gate / visible cue |
|---|---|---|---|
| **Kinetic** `breacher` | Common | Direct hits launch: shotgun impulse 180/220/260, other weapons 70/90/110; wall damage cap 36/42/48. Keep shotgun damage −10%. | Starter; directional orange launch streak. |
| `heavy-pellets` | Common | Shotgun damage +35/45/55%, interval +20%; owned Breacher impulse +50%. | Shotgun usable; dense amber muzzle fan. |
| `chain-reaction` | Rare | Launched bodies transfer 55/65% impulse and up to 24/30 collision damage. | Requires Breacher; connecting orange impact slash. |
| `punch-through` | Common | Pistol/rifle/plasma penetration +1/+2/+3, capped at 4 total. | Non-splash weapon; bright thin elongated tracer. |
| `pressure-point` | Rare | Every fifth aggregate direct hit adds 18/28 secondary damage to that target. Per-player counter, not per pellet. | Universal; sharp white diamond burst on fifth hit. |
| `seismic-impact` | Epic | First wall hit of each launch emits a 70-radius, 24-damage shockwave, max 4 targets. | Requires Breacher + one other Kinetic; low amber ground ring. |
| **Cryo** `cryogenic` | Common | Hits add chill, 3-stack cap; slow per stack 15/17.5/20%, 2 seconds. Keep damage −10%. | Starter; blue ankle ring and icy motes. |
| `shattershot` | Rare | Shotgun hit with >=2 chill consumes stacks: 24/34 direct secondary +16/22 area, radius 60. | Requires Cryogenic, shotgun usable; outward ice shard fan. |
| `permafrost` | Common | Chill lasts +0.75/+1.25/+1.75 seconds. | Requires Cryogenic; darker persistent frost ring. |
| `cold-snap` | Common | Nonempty completed reload chills nearest 2/3/4 visible enemies within 125 by one stack. | Starter option, no prerequisite; radial snowflake pulse. |
| `frost-armor` | Rare | Directly killing a chilled target restores 2/3 armor, max 12/18 per room. | Requires Cryogenic or Cold Snap; two blue armor plates flash. |
| `absolute-zero` | Epic | A hit reaching 3 chill stacks deals 20 damage and roots normal enemies for 0.35 seconds; per-target 2-second cooldown; Queen takes damage but no root. | Two Cryo owned, including a chill source; crisp cyan crystalline burst. |
| **Reactor** `hot-reload` | Common | Completed nonempty reload primes next shot for +50/65/80% projectile damage; reload +15%. | Starter; warm weapon coil while primed, brighter muzzle on consume. |
| `last-shell` | Common | Last shotgun shell damage +60/80/100%; shotgun reload +10%. | Shotgun usable; single red-orange muzzle ring. |
| `volatile-remains` | Rare | Kills explode for 22/30 damage, radius 72; incoming damage +10%. | No prerequisite; orange core with magenta outer ring. |
| `arc-filament` | Common | Every fourth direct aggregate hit arcs to nearest different visible enemy within 95 for 12/16/20 secondary damage. One extra target only. | Starter; short violet zigzag connector. |
| `conductive-shell` | Rare | Arc damage +40/60% and arcs may hit one additional different target. | Requires Arc Filament; double violet arc. |
| `reactor-cascade` | Epic | First direct kill from each Hot Reload-primed shot creates a 90-radius 30-damage discharge. Secondary kills do not rearm it. | Hot Reload + one other Reactor; magenta star ring. |
| **Recovery** `scavenger` | Common | Direct kills recover 1/2/3 rounds into selected finite reserve; while pistol is selected feed most depleted finite reserve instead. | Starter; green mote from corpse to player. |
| `blood-price` | Rare | Direct kills buy up to 3/4 reserve rounds for proportional up-to-2 HP; never below 1 HP. Scavenger free rounds applied first. | Finite ammo useful; red-to-green resource ribbon, concise HUD debit. |
| `magnetic-feed` | Common | Ammo pickups feed up to 2/3/4 extra rounds into magazine; pickup magnet radius +15/25/35%. | Any finite weapon usable; cyan-green pickup trail. |
| `field-medic` | Common | Heal opportunity bonus 25/35/45%; overflow bonus converts to armor, cap 10/12/14 per heal. Zero-sized heal never procs. | Starter; green cross pulse/armor plates. |
| `leech-rounds` | Rare | Every fourth direct kill restores 3/5 HP, max 15/25 HP per room. At full HP grant armor instead. | No prerequisite; restrained red-green returning mote. |
| `emergency-plating` | Epic | Once each combat room, crossing below 30% HP grants 20 armor after the hit if alive; never revives. | Two Recovery owned; large green shield ring and distinct HUD icon. |

This catalog needs only three new combat concepts beyond current commands: bounded nearest-target arc selection, brief root status, and hurt/room-entry events. Other effects fit existing shot bonuses, damage, chill, impulse and resource commands. `pressure-point` and `arc-filament` counters live in the reducer; reset per room. All constants belong in catalog effect/rank data rather than prose alone.

### Small family synergies

At **three distinct owned boons** of one family, automatically activate a single passive bonus; ranks do not count as extra family members. UI shows `Cryo 2/3`, then a one-time “Cryo active” toast. These are computed from ownership; never additional saved flags.

* Kinetic: launch decay coefficient 4 -> 3.5 and wall damage cap +8 (not extra recursive impacts).
* Cryo: maximum chill slow +10 percentage points, capped at 65%; Queen keeps its resistance.
* Reactor: reload duration ×0.9; initial priming still requires a completed reload.
* Recovery: pickup attraction range ×1.2 and room-entry +6 armor.

Do not add pairwise duo boons this pass. Four family thresholds already make builds legible. Epic prerequisites are at most two family members; avoid three-stage dependency chains in a five-choice run.

## Deterministic offer and reroll rules

`DraftContext = {seed,nodeId,depth,rewardKind,resources,ownedRanks,rerollIndex,previousOfferIds}`. Use a local Mulberry32 stream seeded by a hash of run seed, node ID, draft version, and reroll index. Iterate catalog IDs in a fixed explicit order or lexical sort. Never call `Math.random` for gameplay. Ownership insertion order must not alter weights or offers.

1. Filter max-rank cards, unsatisfied prerequisite cards, duplicate IDs, and cards genuinely unsupported by the run. Classify finite weapons as usable if magazine or reserve >0; remember every weapon already exists in this game. A temporarily empty weapon may have a card offered as the wildcard if an ammo grant accompanies it, otherwise suppress its exclusive card.
2. At depth 0, sample three **different** families, each presenting one eligible common starter. Candidate starters are Breacher; Cryogenic or Cold Snap; Hot Reload or Arc Filament; Scavenger or Field Medic. Vary both family presence and starter identity. No rare tradeoff starter.
3. After depth 0, sample slot A from useful same-family support or a rank-up if any eligible; otherwise from whole pool. Prefer the most represented family but cap affinity. Slot B is a new boon from a different family if possible. Slot C is the wildcard. Randomize final display order with the same stream.
4. Base weights: common 10, rare 4, epic 1; at depths 3–4, common 7, rare 5, epic 2. Multiply same-family fit by 1.6, prerequisite-completing support by 1.3, currently useful low-resource sustain by 1.4, and rank-ups by 0.7. Clamp resulting affinity product to <=2.2 so the run is not predetermined after first choice.
5. At most one rank-up across three slots. At least one immediately useful card. Elite guarantees an eligible rare or epic; its guaranteed sample happens before remaining slots to avoid overwriting a unique draw. Non-elite has no artificial rare guarantee.
6. Sample weighted candidates without replacement by cumulative weights with a local RNG roll. Select from a stable sorted candidate list. Use full floating weights or scaled integer weights consistently, not unstable sort comparisons with random calls.
7. One **free reroll per run**, saved in draft state. It changes all three cards, excludes previous three where >=3 eligible alternatives exist, otherwise minimizes overlap. Deterministic stream uses reroll index. Claim/reroll recomputes against saved context and validates IDs. Reroll atomically consumes the token and saves the replacement state; reopening must not refund it. No credit economy required.
8. If fewer than three eligible cards remain, fill with explicit one-time “Supply infusion” (+ammo) or “Repair” (health/armor) offers; never strand a reward boundary. Fallback offers have a separate discriminated type, not fake MutationIds. With five picks and 24 boons this is mostly a correctness guard.

Do not derive eligibility from mutable live `combat` state at render time. Snapshot resources at room clear; apply the node's automatic resource receipt together with boon claim. `offerId = nodeId + ':' + rerollIndex + ':' + boonId + ':' + nextRank` makes stale UI actions reject cleanly.

## State and exact code changes

### `src/game/roguelike/types.ts`

Extend `MutationId` with the 12 proposed IDs. Define `BoonFamily`, `BoonRarity`, `OwnedMutation`, and `MutationOffer`. Prefer `BuildState {mutations: readonly MutationId[], ranks: Readonly<Partial<Record<MutationId,1|2|3>>>}` to minimize existing ID iteration churn; validator requires each owned ID has one rank and no unowned rank keys. Define immutable `DraftState {rerollsRemaining:0|1, rerollIndex:number, previousOfferIds:readonly string[]}` as expedition/checkpoint state. Alternatively replace mutations with `{id,rank}[]` atomically everywhere; do not mix representations.

### `mutationCatalog.ts`

Catalog owns family, rarity, maxRank, prerequisite/all-of-or-family-count gate, weapon eligibility, starter flag, effect parameters, icon and `describe(rank)` / `describeUpgrade(rank)` output. Keep color palette in renderer, keyed by family. Avoid arbitrary functions in serialized data.

### `builds.ts`

* Update `createBuild`, `isValidBuildState`, `addMutation` (rename acquisition function if it also ranks up). Acquisition validates prerequisites, rank ceiling, ownership limit, and resultant state.
* Extend `deriveBuildStats` with penetrationBonus, magnetRangeMultiplier and applicable family stats. Hard-cap incoming reduction, total slow and penetration centrally.
* Refactor `draftMutationOffers` to accept context and return acquisition offers, keeping an adapter only if migration needs it.
* Add `room-enter` and `hurt` events with stable IDs; hurt carries before/after health and post-base resources. Lethal damage produces no emergency recovery. Add `killedWasChilled` and source shot metadata to kill; runtime currently deletes chill before reducer sees it.
* Add bounded counter/once-per-room state for pressure-point, arc, leech, frost armor cap, emergency plating. Include deterministic sequence/cause for primed-shot kills. Current `hotWeapons` is sufficient for priming, but projectile request needs a `primed` tag for cascade.
* Extend commands with `arc` and `root`, and `effect` or an `effects` result array. Simulation IDs and effect IDs share provenance but cosmetic consumption cannot feed events back.
* Keep `maxDepth=3`, `maxEventsPerChain=32`, `maxAreaTargets=6`, `maxEncounterEvents=2048` until measured evidence justifies changes. Cap arc targets at 2 and root duration at 350 ms. Limits are mechanics protection, not frame-time VFX limits.

### `MutationRuntime.ts`

Add `canAffect` host visibility, semantic `effect`, optional root control, and a read-only `statusSnapshot()` (id/chill stacks/expiry/root), so renderer does not reach into private maps. Resolve arcs by squared distance then numeric ID; exclude origin and previously visited IDs. Read chill status before kill deletion. Preserve source weapon/shot primed metadata. Restore speed on expiry/reset; combine root/chill in one effective movement multiplier. Route generic area effects through one bounded visible-target selector. Emit chill changed/cleared, launch, wall impact, shatter and arc effects once per command. Proc counter/hash randomness must not depend on visual randomness.

### `CombatSystem.ts`

Deep-copy ranks in set/get build. Apply stat penetration bonus in `fire`; attach `primed`/family shot tags to requests. Notify a typed effect listener or let DepthGame drain terminal effects after `fire`/reload/heal/pickup/hurt. This is necessary because terminal resource and reload events do not pass through MutationRuntime. Fix healing opportunity semantics without consuming a medkit at full HP. Add hurt/room-entry dispatch after authoritative base resource application, preserving death. Emit actual resource deltas, not requested over-cap deltas, for visual HUD feedback.

### `expedition.ts`, `checkpoints.ts`, `DepthGame.ts`

Add new state to snapshots and validation. Make all non-boss rooms draft, with room resource receipts committed atomically with chosen boon. Add `rerollExpeditionOffers` plus `DepthGame.reroll`; save after reroll. Make `claimExpeditionMutation` validate offer identity and rank, grant resources, consume reward, and return one immutable snapshot. Avoid applying the resource receipt before claim and then again on restore. DepthGame may preview deterministic receipts but only write authoritative CombatSystem state after successful expedition transition. Preserve two supported saved phases.

Checkpoint must move to **version 2** because both shape and reward semantics change. Keep strict legacy v1 parsing; convert valid old IDs to rank 1, grant one reroll, preserve phase/resources, and use an explicit legacy reward policy for a pending medical/armory reward or convert it once with a saved migration marker. Never silently discard an existing valid checkpoint merely because ranks were added. Update all exact key and length checks together. If migration is intentionally out of scope, document and visibly handle incompatibility rather than catching it as “no save.”

`DepthGame.makeMutations` forwards semantic events, visibility and status capability. `blast` reports aggregate hits. `update` dispatches room entry once, passes status snapshot, applies magnet multiplier and respects root immunity. Avoid gameplay mutation after `clearRoom` has already frozen reward resources: any terminal kill proc must finish before committing room-clear snapshot.

### `main.ts`, `src/style.css`, `DepthRenderer.ts`, `AttackEffects.ts`

Reward card: family glyph/color, rarity, name, rank, exact benefit, one concise drawback, `Upgrade II: +10%` if owned, and prerequisite/synergy cue. One reroll button with visible remaining count. Build strip shows grouped family icons/counts and rank pips; selection details should be inspectable while paused. Palette: Kinetic amber, Cryo cyan, Reactor violet/magenta, Recovery mint. Existing enemy acid remains yellow-green; use mint shape language to distinguish friendly recovery.

## Bounded boon VFX contract

Use `BoonEffect {id, kind, family, boonId, x,y,targetId?,toX?,toY?,radius?,stacks?,durationMs?,rank?}`. Kinds: `chill-on`, `chill-off`, `launch`, `wall-impact`, `shatter`, `arc`, `prime`, `empowered-shot`, `restore`, `shield`, `synergy`. All dimensions remain game units until renderer conversion by UNIT.

* Retain the existing instance pools (glow 360, smoke 80, debris 80, pulses 24, decals 64, beams 320). Add no per-proc point lights or per-particle meshes.
* Reserve **6 of 24 pulse slots** for boons and **48 glow slots** for boon particles, or implement priority admission with equivalent caps. At most 6 new boon bursts/frame, 2 arcs/frame, and 1 resource popup per 150 ms per resource. Coalesce repeated chill on the same target within 100 ms. Cosmetic omission never skips gameplay commands.
* At most 32 attached status rings (current enemies cap is small), sharing one instanced ring mesh; update transforms from status snapshots and remove on expiry/death/reset. Use rings instead of cloning/recoloring actor materials every hit. No stateful trail objects per pellet.
* Launch: 3–5 orange fragments and a 120-ms short streak. Chill: 2 motes plus persistent ring scaled with stacks. Shatter: one 200-ms cyan ring + 8 shards, **not** the existing explosion recipe's 26 glow + 8 smoke. Arc: one/two 90-ms tapered violet segments using a bounded beam pool. Prime: small muzzle halo; consume makes a single brighter flash. Restore/shield: one upward mote / ground shield ring, at most 4 particles.
* Major procs receive priority over ambient particles; never overwrite enemy telegraph ring slots. On low quality, halve burst particles and omit secondary ribbons; status rings and the first arc remain. Pause freezes effects, room transition clears them.
* The deterministic cosmetic seed may hash effect ID for reproducible screenshots; gameplay RNG must remain separate. Existing AttackEffects `Math.random` is cosmetic and is not a gameplay determinism bug.

## Verification that covers actual risks

Existing `roguelikeBuilds.test.ts` thoroughly exercises reducer dedupe, caps, resource floors and prerequisite **drafts**; preserve these. `DepthGame.test.ts` progression helper kills via `game.damage`, bypassing actual bullets and boon-hit integration. No dedicated MutationRuntime tests were found. The current full-run test is not evidence that procs work in 3D.

1. Draft tests across 256 fixed seeds: stable offers and order-independent ownership; at least several distinct opening combinations; no duplicate IDs/max-rank/unsatisfied gate; bounded rank-ups; rare guarantee; fallback; immediate-use guarantee. Test distribution ranges broadly rather than exact random snapshots.
2. Reroll/restore test: clear -> draft -> reroll -> save -> reload yields exact replacement offers and consumed token; stale card/reroll rejected; resource receipt cannot be claimed twice. Include v1 -> v2 pending resource reward conversion.
3. Runtime host test with deterministic fake targets: aggregate shotgun hit triggers once, splash chills, arc/explosion cannot pass cover, nearest tie breaks by ID, shatter kills have proper secondary cause, freeze expires and restores chill multiplier, immovable boss is never moved/rooted.
4. Combat resource test: full-health heal opportunity converts bounded bonus to armor; zero reward does not; emergency plating does not revive; field/leech room caps; pellet kills do not increment counters eight times; damage modifiers do not apply twice to secondary damage.
5. One real DepthGame bullet integration test each for cryo/shatter and launch/wall; one mixed build boss completion using actual firing rather than direct damage helpers. Test room-clear snapshot includes final-kill resource proc.
6. Extend `PresentationUpgrade.test.ts` to flood semantic effects and assert pool limits, reset and finite matrices. Manually view one Cryo, one Kinetic and one Reactor encounter at low/high quality; ensure friendly effects remain visible without covering enemy attacks.

## Implementation order

1. Fix splash-hit/visibility/health integration and introduce semantic effects; this makes existing 12 boons feel different immediately.
2. Add family metadata, additional 12 boons, ranked acquisition and checkpoint conversion together.
3. Add five drafts, weighted offer rules, one reroll and catalog-driven card/build UI.
4. Add family thresholds and restrained persistent status VFX; tune only after real combat playthrough.

If time is limited, ship phases 1–3 with common/rare ranks only and defer the four epic effects. Do not add 24 cards whose advertised behavior is only a stat multiplier or missing from the host integration.
