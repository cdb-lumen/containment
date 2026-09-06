# Build-defining boons

## Design

Keep the existing 48 saved boon IDs, combat event ledger, launch solver and elemental runtime. This is a redesign of choices and a few mechanics, not 48 new abilities. Ammo abundance remains unchanged.

- Cryo executioner: stack chill, freeze at three stacks, then shatter with any weapon. Cold Snap also qualifies as a chill source.
- Wildfire: ignite, spread burning deaths through Kindling, detonate existing burns with Combustion. Poison remains an optional branch, not a mandatory ingredient for a fire build.
- Kinetic demolition: the existing shotgun launch, wall slam and body-chain mechanics, without projectile or fire-rate penalties.
- Reactor cycling: reload or fire an ordinary shot and switch weapons to prime a shot, then use the existing empowered-kill discharge. No reload penalties.
- Scavenger becomes Kindling. Magnetic Feed becomes Cycle Capacitor. Blood Price becomes an explicitly labeled risk pick with +35% projectile damage and +20% incoming damage. IDs remain stable; resource grants no longer reference these IDs.
- Opening offers show path starters. Later offers reserve an eligible continuation and a different path starter where available, then weighted variety. Cards explain their path, owned synergy or next unlock. No unusable prerequisites.
- Persistent actor-local flame geometry, a chill ring and a separate frozen cage coexist. They use authoritative status timers and clear on expiry, consumption, death and pool reuse. Rich particles/materials/lighting are follow-up scope.

## Implementation plan

1. Establish baseline tests and raw before gameplay evidence.
2. Write failing tests for new offer guarantees, positive ordinary stats, saved-ID compatibility, fire spread/detonation, cryo sequencing, switch priming and simultaneous status views.
3. Implement the focused changes in catalog, reducer, elemental adapter, combat and offer UI. Reuse existing caps and visibility checks.
4. Run the full verifier and deterministic browser combat/offer evidence, inspect raw pixels and review the cumulative diff. External coding CLIs are not installed; perform an explicit independent-pass review locally.
5. Publish a PR with pinned evidence and a linked visual-polish issue, read checks back, and update the shared vault with verified state.

## Verification and evidence

- `npm run verify`: 179 tests passed, one optional benchmark skipped; TypeScript and production build passed; desktop and touch production browser smoke passed with no page or asset errors. Build retains the existing large-chunk warning.
- `boon-desktop-combat.png` and `boon-touch-combat.png`: actual game renderer and runtime in the opening encounter, with a seeded three-boon build and three runtime hits on a repositioned enemy. Simulation was held for capture. Both report burning, three chill stacks and frozen simultaneously. These are controlled integration captures, not natural-play or dense-horde proof.
- `boon-desktop-offers.png` and `boon-touch-offers.png`: actual reward UI after controlled room completion. Three cards fit without horizontal overflow. Click and touch selection of Glacial Wake both updated the combat build and reached the route screen without page errors.
- `boon-vfx-fixture-before.png` and `boon-vfx-fixture-after.png`: enlarged actor-model fixtures only, reproducible with `node tests/render-afflictions.mjs`. They do not prove gameplay readability or performance.
- Runtime tests cover cryo/shatter with simultaneous burn, Cold Snap, boss root immunity, burn-death spread/cover/expiry, burn-consuming Combustion, empowered on-hit lethal attribution, DOT exclusion, cycle priming and pool/corpse cleanup. Existing checkpoint tests remain in the full suite; all 48 saved IDs remain unchanged.
- Rich environmental effects, sound and dense-horde/real-device performance QA remain in [issue #12](https://github.com/cdb-lumen/containment/issues/12). Software-rendered browser frame times are slow and are not a real-device performance pass.
