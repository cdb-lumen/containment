# VFX audit and approval queue

**No VFX changes from this pass may merge before Viktor approves their demos.**

## Scope

Baseline: `73a055adf03d33d87641b81593cc03e863e9c7af`.

The source catalog contains 74 active VFX families/components and one inactive export. It maps every GameEffect type, BoonEffect type and all 48 mutations. Source hashes for 60 production files were checked against that commit. These are component counts, not 74 independently recorded gameplay clips.

[Full machine-readable catalog](catalog.json) includes triggers, variants, source references, current rendering methods, recommendations and sprite/particle decisions for every entry. Recommendations are source-level judgments, not claims that every effect has failed visual QA.

## First review batch

- `acid-contact`: untargeted spitter impact becomes falling liquid droplets instead of additive sparks.
- `queen-acid-blast`: queen area attack becomes radial liquid spray instead of an explosion ring.
- `queen-acid-pool`: lingering hazard gains restrained wet mottling and ripples. Its radius, coverage, damage and lifetime stay unchanged.

These three catalog components appear in two demos: spitter impact and queen splash/lingering pool. Targeted weapon damage also uses the `acid` event name; the approved small target-contact effect stays unchanged.

## Next candidates, one at a time

1. Ricochet and Ice Lance currently enter the same electric-link renderer. Give each its own shape and a separate trigger-verified clip.
2. Ball Lightning detonation falls through to a generic ring; reload priming reuses an explosion. Separate priming from damaging discharge.
3. Fragmentation and shatter need material-specific fragments. The shatter fixture currently shows rectangular strips.
4. Check persistent poison against green floors and improve contrast only if native-room video confirms poor visibility.
5. Check exact-radius frost fields, projectile silhouettes, pickup identity and overlapping status readability.

Breacher/Seismic wall-slam work remains separate. It is not ordinary pellet-to-wall impact and is not part of this branch.

## Retain

- Existing CC0 Flame02, WispySmoke02 and Explosion01 atlases have useful silhouettes. No replacement download is needed for the acid slice.
- Subtle fire, expressive chill/frozen crystals, thin open-center hit X and dim actor flashes.
- Geometry for variable-endpoint electric links and exact danger boundaries. Sprite particles for smoke/fire and irregular liquid silhouettes; solid geometry where fragments need rotation/depth.
- Neutral explosions with local elemental cues. Do not infer blast color from the player's global build.

## Evidence limits

`npm run test:vfx` passed with zero browser errors and five shared status draws. Its real-actor/concrete fixture was visually inspected: restrained fire, distinct frozen crystals, faint poison vapor, readable thin branching electricity and rectangular shatter strips. This is not a shipping-room or dense-horde audit.

The acid videos must be pinned to a clean runtime revision and use genuine spitter/queen gameplay events, the native camera and retained HUD. Their manifests must validate events, decoded motion, frame counts, browser errors and source stability. A clean source audit does not replace per-effect video review.

All other live-room coverage remains pending. Real-device performance, thermal behavior, dense-combat readability and audio remain open in [#12](https://github.com/cdb-lumen/containment/issues/12).

## Complete baseline register

Decision counts: 30 keep, 36 refine, 9 replace, including the inactive entry. Refinement is a review candidate, not automatic permission to increase brightness or particle counts.

| Component | State | Decision | Current method | Sprite/particle judgment |
|---|---|---|---|---|
| weapon-muzzle | active | refine | Directional additive glow lobes, hot core and velocity sparks. Plasma adds ring; ballistic weapons add smoke. | Hybrid: bounded glow particles and smoke flipbook; do not replace every gun with one fire sprite. |
| weapon-casings | active | keep | Instanced box casing with gravity, spin, bounce and finite five-second life. | 3D mesh particles, not sprites. |
| weapon-muzzle-light | active | keep | One weapon-colored point light, short decay. | Light, neither sprite nor particle. |
| weapon-recoil-reload | active | keep | Marine ribs/spine quaternion motion, weapon pose and barrel-following model. | Skeletal/procedural model animation, neither. |
| projectile-bodies | active | refine | Up to 320 elongated low-poly sphere instances; hazard green, plasma cyan, others amber. | Keep mesh bodies; sprite glow only secondary. |
| projectile-tracers | active | keep | Velocity-aligned cylinder beams, weapon-colored with thicker plasma/hazard. | Beam geometry rather than sprite or free particles. |
| projectile-energy-trails | active | refine | Small additive glow cards; rocket additionally emits smoke atlas wisps. | Hybrid glow particles plus smoke flipbook. |
| grenade-flight | active | refine | Generic projectile body follows sine-height arc; no tracer or dedicated grenade trail. | Distinct 3D grenade model and tiny optional particle cue, no large sprite. |
| contact-sparks | active | keep | Brief small core plus three back-scattered sparks; armor and blocked share cool palette. | Bounded procedural particles, not impact flipbook. |
| actor-hit-flash | active | keep | Actor material emissive overlay capped at 0.1; frozen/exposed baseline retained. | Material response, neither sprite nor particles. |
| wall-impact-generic | active | refine | Back-scattered glows, small box debris, smoke puff. | Mesh/spark particles and smoke sprite, not explosion atlas. |
| wall-impact-shotgun-metal | active | keep | Tiny sparks/chips, supported surface-normal decal, clustered same-shot smoke. | Hybrid physical sparks/chips with small smoke/decal cards. |
| acid-contact | active | refine | Green radial splashes, core, dark floor stain and heavier debris. | Droplet mesh particles plus irregular decal sprite. |
| enemy-melee-slash | active | refine | Short floor-plane ring-sector slash aligned by attack angle. | Procedural arc mesh; sparse motion particles optional. |
| enemy-attack-animation | active | keep | Imported attack clip with short crossfade and one-shot latch. | Skeletal animation, neither. |
| spitter-launch | active | refine | Seven green forward glows with vertical motion. | Liquid mesh particles, no fire sprite. |
| enemy-spawn-warning | active | refine | Expanding amber floor ring for configured spawn delay. | Procedural ring, not particles as primary warning. |
| enemy-aim-warning | active | refine | Source ring, target ring and twelve dotted glow points along attack line. | Explicit geometry for warning, sparse particles only decorative. |
| queen-area-warning | active | keep | Fixed red-orange thin outer ring and low-opacity filled disk at target radius. | Geometry, neither sprite nor random particles. |
| queen-acid-blast | active | refine | Green ring/flash/sparks, smoke and dark acid decal. | Liquid particles plus vapor sprite and irregular decal. |
| queen-acid-pool | active | replace | Flat green circle at floor, opacity decays with remaining life. | Retain exact geometry boundary; add contained liquid shader/decal and sparse droplets. |
| blast-neutral | active | keep | Pale ring and flash, flying sparks, neutral chips and short smoke, no fire atlas. | Hybrid particles plus smoke sprite; fire flipbook only for actual fire flavor. |
| blast-ice | active | refine | Neutral blast with shatter crystals/vapor; general smoke omitted if icy. | Mesh crystals plus short vapor sprite. |
| blast-poison | active | refine | Green flavor, extra droplets and vapor alongside neutral blast. | Spherical droplets preferable to zero-stretch box debris; smoke sprite secondary. |
| blast-fire | active | keep | Explosion01 5x5 flipbook lifted above floor, warm sparks/chips/smoke/scorch. | Authored fire/smoke sprite plus physical particles. |
| blast-mixed-elements | active | refine | Composes shatter, poison and fire cues; base ring hue uses poison then fire then ice. | Hybrid, retain each local elemental component. |
| blast-light | active | refine | One warm shared point light, 0.18-second quadratic decay, latest location wins. | One bounded light, neither. |
| boon-impact | active | refine | Warm expanding ground ring and five radial glows. | Directional impact particles, not explosion sprite. |
| body-launch | active | keep | Live actor positions change; dead launch uses sync-corpse routing. No dedicated launch trail. | Actor motion primary; optional tiny dust particles, no sprite blast. |
| breacher-wall-slam | active | replace | Generic boon impact ring at live target. Ghost-only damage branch requires live target. | Directional chips/dust particles and contact-local marks; no combustion sprite. |
| seismic-wall-slam | active | replace | Same neutral radial explosion as ordnance, centered on remembered actor. | Mesh fracture/chip particles, dust sprite and restrained shock geometry. |
| chain-body-impact | active | refine | Generic impact pulse plus transferred actor movement. | Directional particles with body motion, no blast sprite. |
| boon-fragmentation | active | replace | Large generic impact ring and five glows; no authored fragment trajectories. | Directional mesh fragment particles. |
| boon-frost-onset | active | refine | Blue ground pulse and seven radial glows. | Small mesh ice particles with subtle vapor sprite. |
| boon-burn-onset | active | refine | Orange ground pulse and five glows. | Small ignition particles or brief flame sprite, not large ring. |
| boon-poison-onset-spread | active | refine | Teal-green ring and five glows; persistent green vapor on affected targets. | Droplets and short vapor sprite; larger contained spread for bloom. |
| boon-electric-link | active | keep | Seeded forked cylinder arc, violet corona and blue-white core, restrikes and endpoint sparks. | Beam mesh plus spark particles, no lightning sprite. |
| boon-ricochet-link | active | replace | Same violet forked electric arc as Arc Filament; boon type not used by link branch. | Thin ballistic beam/streak plus metal-like endpoint particles. |
| boon-ice-lance-link | active | replace | Same violet forked electric arc as electricity, despite frost boon type. | Tapered ice mesh/beam and short crystal particle trail. |
| boon-shatter | active | refine | Blue-white flash, eighteen elongated box crystals, extra streaks and three vapor wisps. | Mesh crystal debris plus vapor flipbook, no fire sprite. |
| boon-frost-field | active | replace | Stable-size fading blue thin floor ring for two seconds. | Frost decal/shader inside truthful boundary plus sparse ice meshes. |
| boon-charge | active | refine | Single purple glow dot until configured delay. | Procedural charge core with restrained orbit/streak particles. |
| boon-aftershock-detonation | active | refine | Boon blast recursively uses neutral explosion. | Shockwave geometry and dust particles, not fire sprite. |
| boon-ball-lightning-detonation | active | replace | Generic purple ring and five glows, not forked arc and not sphere discharge. | Small procedural electrical corona with bounded local forks/particles. |
| boon-overload | active | refine | Neutral explosion and shared warm blast light; Hot Reload defaults radius 48. | Priming should be weapon-local glow; damaging cascade can use neutral particles. |
| boon-combustion | active | keep | Recursive fire-flavored explosion atlas/smoke/debris/scorch, without renderer blast-light callback. | Fire sprite plus physical particles. |
| boon-shield | active | refine | Cyan ground ring and rising glows; radius conveys barrier area but resources use same cue. | Small geometric shield/buff cue; particles only secondary. |
| boon-leech | active | refine | Muted red ring with rising glows at trigger position. | Tiny sprite/particle transfer for healing, separate kinetic hit cue for capacitor. |
| status-fire | active | keep | Six small Flame02 atlas tongues per actor and six procedural ember cards; buoyant cycles. | Hybrid authored flame sprite particles and tiny ember particles. |
| status-poison | active | refine | Four green smoke cards plus four falling low-poly spherical droplets. | Vapor sprite particles plus 3D droplets. |
| status-chill | active | keep | Blue albedo-preserving glaze and sparse fracture shader, two crystals per stack with mild motion. | Material glaze plus physical crystal instances; not frost billboard. |
| status-frozen | active | keep | Full-strength glaze, ten larger crystals, cyan baseline emissive and stopped mixer. | Mesh/material effect, not enclosing opaque ice sprite. |
| status-combinations | active | refine | Independent status batches render together; frost/frozen material baseline participates in hit flash. | Hybrid per-status methods, not a monolithic combined sprite. |
| status-queen-exposed | active | keep | Green actor emissive baseline and boss HUD color/state change. | Material and UI state, neither. |
| enemy-death-burst | active | refine | Green sparks/core, small fading box gore and dark floor stain. | Mesh fragments and irregular decal sprite; avoid glowing confetti. |
| enemy-corpse | active | keep | Frozen GPU-skinned death pose tumbles/bounces/slides; cap 12 desktop/6 coarse pointer. | Real actor mesh, not sprite. |
| corpse-sync | active | keep | Position correction of existing corpse; no new particles. | Mesh movement only. |
| legacy-collapse-corpse | inactive-export | replace | CPU bakes skinned geometry, removes old children and replaces body. | Inactive alternative mesh path; do not introduce sprite. |
| nest-life-death | active | refine | Procedural flesh/chitin nest breathes via vertical scale, disappears with neutral radius-64 explosion. | Organic mesh collapse plus tissue particles instead of generic ordnance. |
| queen-death | active | refine | Radius-240 neutral explosion; queen model tilts and sinks. | Boss mesh collapse plus restrained organic particles. |
| player-death | active | refine | Player root tilts; hurt vignette and modal result shade. | Model collapse and UI, not sprite explosion. |
| story-destruction | active | refine | Radius-900 neutral explosion at player, forced death/resources, result modal. | Staged geometry/light/particle event; no mandatory fire atlas. |
| pickup-idle | active | refine | Rotating/bobbing dark box with green health or cyan other top. | Small 3D pickup/icon, no particle cloud. |
| pickup-collect | active | refine | One turquoise rising glow at original pickup position. | Tiny sprite particle, not explosion. |
| environment-fog | active | keep | Static exponential blue-green distance fog. | Scene fog, neither sprite nor particles. |
| environment-fixtures | active | keep | Emissive architecture/accent meshes, material-batched captured light positions; static lights. | Mesh/material/light, neither particle nor sprite. |
| environment-signage | active | keep | CanvasTexture text plane and weak emissive map. | Static texture plane, not particles. |
| environment-contact-shadows | active | keep | Bounded soft shader contact cards for actors; feathered DataTexture ground contacts for props. | Procedural decal planes, no particles. |
| environment-infestation-stains | active | keep | Static flattened dark shell-colored ellipsoids distributed over floor. | Static mesh/decal treatment, no emitter. |
| player-flashlight | active | keep | One cool spotlight following aim direction. | Light, neither. |
| screen-hit-x | active | keep | 10px thin open-center X, 100ms fade at max opacity 0.65 with contact colors. | CSS UI, not sprite or particles. |
| screen-hurt-vignette | active | refine | Red inset shadow fading over 0.4 seconds; reduced-motion duration 0.1 seconds. | CSS overlay, not sprite/particle. |
| screen-bloom-tonemap | active | keep | ACES exposure 1.22; high-only bloom strength .38 radius .45 threshold 1.12. | Postprocess, neither. |
| screen-state-shade | active | keep | DOM gradient or dark blur shade; HUD dimming and modal content. | CSS UI, neither. |
| screen-health-resource-feedback | active | keep | Health/armor/reload width changes, boss state colors; two instanced world-healthbar draws in HUD scene. | UI and billboard bar geometry, not particle effects. |
