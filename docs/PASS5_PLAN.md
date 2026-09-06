# Containment / Depth — arsenal and stability pass

## Goal
Readable industrial rooms, convincing weapon attachment, expressive elemental builds, and longer fights without reserve-ammo starvation. Preserve the existing twelve-room, three-act expedition and mobile controls.

## Audit and decomposition
Four independent read-only subagents audited rendering/performance, authored weapon geometry, boon interactions, and ammunition/pacing. The integration agent implemented the changes in the shared Site checkout. Their original findings and proposals are in `docs/audits/pass5-*.md`; proposals are not claims of implementation or device measurements.

| Workstream | Evidence | Implemented response | Verification |
|---|---|---|---|
| Maps and lighting | Eight collapsed UV triangles per rounded wall/cover in the old projection; very dark floor albedo and metallic tints | Preserve face UV charts, physically scale texture repeats, use brighter steel floor, reduce metalness and normal strength, rebalance neutral fill and flashlight | Every triangle in representative production wall and cover geometries has nonzero UV area |
| Weapon fit | Each gun was independently normalized; authored stock/grip relationships changed; whole-gun recoil detached it from the hands | Fit original geometry to marine scale, preserve authored attachment origins, correct each pose's yaw, animate upper rig for shared hand/gun recoil and reload | All five guns stay on the hand socket through directional gait, recoil and reload; barrel forward aligns with aim |
| Shot presentation | Guessed muzzle distances and fixed projectile heights disagreed with fitted models | Sample the actual animated muzzle for flashes, first tracer segment, reveal distance and projectile height | Type checking and existing presentation/model tests; no browser screenshot claim |
| Boons | Twenty-four options left limited elemental combinations | Forty-eight total boons, prerequisite-aware offers, poison and propagation, cold/fire reactions, lightning charges, fragmentation, delayed blasts and recovery triggers | Event deduplication, prerequisites, status consumption, cover checks, delayed damage, healing, proc and encounter limits |
| Ammo | Rare current-weapon pickups could not sustain long fights; medical routes had no baseline resupply | All-weapon ammo packs, passive reserve generation, entry minimums, empty-magazine auto-reload even after releasing Fire | Real combat simulation for three minutes per weapon, with and without Rapid Cycle, without ammo drops |
| Round length | More duration requested, without adding an overwhelming first wave | Increase v2 combat/elite spawn totals by 25%, rounded; preserve concurrency caps, dispatch intervals and enemy HP | Existing director, room geometry, progression and carrier-reservation tests |
| Frame spikes | Eager binding of all animation clips, repeated precise skinned bounds, CPU corpse baking, repeated projectile target allocation | Lazy animation actions; cache rig metrics and immutable snapshots; freeze existing death poses; corpse caps of six on touch devices and twelve elsewhere | Corpse test rejects CPU vertex skinning and geometry replacement; snapshot cache invalidation tests |
| Graphics memory/recovery | Unused full-resolution postprocessing targets in low mode; high DPR costs; no lost-context state | Shrink unused targets to 1×1; cap high DPR at 1.5, automatic low at 1.25, explicit performance at 1; pause on WebGL context loss and restore at low quality; manual reload fallback | Production build and control-flow audit; physical Safari verification remains outstanding |

## Elemental design
The four families now have twelve options each. Common boons establish an effect; rare boons reward combinations. Dependent offers require their ingredients. Secondary damage cannot recursively act as a new weapon hit. Area effects require a clear path, delayed charges are bounded to six, frost fields to four, secondary chains to depth three and 32 damage applications per originating chain. Cosmetic bursts and connectors have independent per-frame limits so dense combinations do not create unlimited particles.

New Kinetic options: Ricochet Rounds, Concussion Rounds, Executioner, First Impact, Crossfire, Fragmentation.

New Cryo options: Absolute Zero, Ice Lance, Frostbite, Thermal Shock, Glacial Wake, Cryo Conductor.

New Reactor options: Caustic Rounds, Toxic Bloom, Combustion, Ball Lightning, Aftershock, Reactor Cascade.

New Recovery options: Siphon Shells, Combat Medic, Reactive Barrier, Salvage Engine, Blood Capacitor, Shock Absorber.

Poison is teal, frozen effects cyan, heat blasts orange, and delayed charges violet. Frost patches hold their footprint during their lifetime. Enemy affliction materials reflect poison, chill and burning; enemy health bars retain their separate final HUD render pass.

## Supply tuning

| Weapon | Room-entry reserve minimum / passive ceiling | Regenerated per active second | Standard pickup |
|---|---:|---:|---:|
| Rifle | 240 | 6 | 60 |
| Shotgun | 64 | 1 | 12 |
| Plasma | 140 | 3 | 30 |
| Rocket | 12 | 0.5 | 2 |

The pistol retains renewable reserves. Earned surplus is preserved above the passive ceiling. Regeneration never fills magazines, cancels reloads, or triggers ammo-pickup boons. Each pickup grants a fixed proportional bundle to all finite weapons and triggers Magnetic Feed once for the selected weapon. No regeneration while paused, choosing rewards/routes, at the title, dead, or complete. Existing service-room packs remain extra supplies. Entry grants do not repeat when restoring a cleared-room checkpoint.

## Release gates and limits
- TypeScript must pass and the full unit/integration suite must pass.
- Build the exact committed source, push it to the Site repository, package validated output, save a version and publish to the existing audience.
- Geometry and gameplay checks are automated Node tests. This pass does not claim screenshots, GPU frame-time measurements, or testing on a physical iPhone/Safari browser.
- The fixes address identified CPU allocation and geometry defects; they cannot establish that every intermittent device-specific freeze is eliminated. First-use shader compilation may still cause a short stall. Automatic quality reduction and context recovery provide fallbacks.
- Longer rounds means more scheduled opponents, not a guaranteed 25% increase in elapsed play time. Killing speed, occupancy, route and build still determine duration.
