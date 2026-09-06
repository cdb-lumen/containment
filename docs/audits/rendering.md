# Rendering audit — containment-3d

Read-only source audit. No browser or GPU rendering was run, and the Site checkout was not changed. References below use checkout-relative filenames. Installed Three is 0.185.0; conclusions about its renderer use that exact local dependency, not a different version's documentation.

## 1. Missing enemy HP: a concrete render-order defect

**High confidence root cause:** health bars are opaque meshes with `depthWrite:false`, `depthTest:true`, and default `renderOrder:0` (`src/render/EnemyHealthBars.ts:8–10`). Three's default opaque sort compares material IDs before distance (`node_modules/three/src/renderers/webgl/WebGLRenderLists.js:1–25`). The bar materials are constructed in `DepthRenderer` field initialization (`src/render/DepthRenderer.ts:19`), before the floor material created in the constructor (`:41`) and before runtime enemy material clones. Consequently the bars draw before the floor and enemies. They leave no depth value behind, so the later floor can draw over the bar pixels even though the floor is farther from the camera. This explains absent bars over the most common background, open floor. Larger dimensions or brighter colors alone will not fix this.

**Smallest correction:** assign explicit late render orders to the two bar meshes, background 1000 and fill 1001. Keep `depthWrite:false`; choose `depthTest:false` if these are intended as always-visible combat UI. Merely setting `depthTest:false` without ordering does not prevent later world draws from overwriting the bars. Merely setting `toneMapped:false` does not exclude bars from the composer's final OutputPass.

**Preferred correction:** move `healthBars.root` out of the world scene into a dedicated scene drawn after the world/composer. Its background is null. Bar materials use `fog:false`, `toneMapped:false`, `depthTest:false`, `depthWrite:false`, and explicit background/fill render order. After either world path completes:

```ts
const autoClear = this.renderer.autoClear;
this.renderer.autoClear = false;
this.renderer.clearDepth();
this.renderer.render(this.healthBarScene, this.camera);
this.renderer.autoClear = autoClear;
```

The composer restores its incoming render target; the normal incoming target is the screen. If code starts using offscreen targets later, explicitly restore the screen before this overlay. Keep the world pass's autoClear behavior intact. Drawing after OutputPass also keeps these UI colors and edges outside bloom and filmic tone mapping.

**Readability improvements after fixing order:** increase the current 28×3 CSS-pixel fill to approximately 38×5, elite 44×5, with a 1–2 pixel dark border. Preserve fixed CSS-pixel sizing using `canvas.clientHeight`; device-pixel ratio is already handled by the renderer. Move camera menu zoom changes (`DepthRenderer.ts:155`) before the bar update (`:152`) to avoid one frame using the old zoom. The bar anchor currently uses the model's rest height plus .24 world units, not animated bounds; this is acceptable initially, but an additional camera-up offset of about 6 CSS pixels separates the bar from animated heads.

**Do not incorrectly attribute this to first-frame instance color:** `fill.instanceColor` is currently initialized lazily by `setColorAt`. In this installed Three version, `WebGLRenderer.js:2432–2438` detects both null→non-null and non-null→null instanceColor transitions and requests the appropriate program. MeshBasicMaterial also has a valid uncolored variant. It is still sensible to call `fill.setColorAt(0, WHITE)` in the constructor and set `instanceColor.setUsage(DynamicDrawUsage)`, as AttackEffects already does, to avoid a first-use shader switch. This is defensive initialization, not evidence that the health shader currently fails. The bullet mesh has the same lazy initialization opportunity.

**Other paths checked:** EnemySystem snapshots do contain finite health and maxHealth populated at spawn. Dead fractions are intentionally skipped. Capacity is 128. Plane normals are correctly oriented toward the camera by copying its quaternion. The camera-forward .005 fill offset is toward the viewer. CSS displays `#world` as a fixed, full viewport canvas and does not specifically hide bars. The shade covers the entire scene on menu/pause/reward and is removed for playing. Queen health is a separate DOM HUD; ordinary enemy HP update intentionally excludes queen/nests.

**Required verification:** the current `tests/EnemyHealthBars.test.ts` only inspects matrices, counts and visibility; it cannot catch draw order. Add a small structural assertion for the overlay/material order if that architecture is chosen, then visually verify a damaged enemy standing on open floor, beside a tall obstacle, and amid attack effects at desktop and phone sizes, in high and low quality. A first frame with zero enemies followed by a spawn specifically exercises initialization. Use actual rendered pixel evidence before saying the HP fix is complete.

## 2. Lighting blink: distinguish three different causes

1. **Confirmed moving shadow projection:** every frame the sun and its target chase the smoothly lerped camera focus (`DepthRenderer.ts:143–144`). Light direction stays constant, but the shadow sampling grid slides continuously over static geometry. At a 48-unit shadow span and 1536 map resolution, a texel is .03125 world units. This is a strong cause of swimming/shimmering shadow edges while moving, not an intentional light flicker. Prefer anchoring the directional light/target once per room to room center and fitting its shadow camera to room bounds with margin. Standard rooms are 37.5×27.5 world units and boss room 45×33.75, so room-wide static coverage is practical. Derive extents in light space, not just world X/Z. If a chasing shadow camera is retained, snap its target in the light's right/up axes to shadow texel size; naive independent world X/Z rounding is not equivalent.

2. **Confirmed hard quality transition:** `DepthRenderer.ts:175–176` removes the entire composer after accumulated slow frames, dropping bloom and changing render resolution in one frame. It downgrades only once, so this is a plausible single brightness/pop event, not repeated periodic blinking. `setQuality('auto')` on coarse-pointer devices sets high=false but still enables shadows (`:56`), and automatic downgrade never disables shadows. Apply all tier changes through one function so pixel ratio, shadows, and postprocessing agree. Reset slowFrames when quality is set; evaluate a rolling frame-time statistic over several seconds; make changes between rooms or fade bloom strength briefly before changing the pipeline. Retain common exposure and output transfer in both paths. Avoid claiming a double tone mapping bug: Three suppresses per-material tone mapping in the ordinary offscreen target, then OutputPass handles it, while direct rendering applies it in materials.

3. **Confirmed authored pulses:** muzzle point light reaches intensity 32 for about 45–75 ms after every shot (`:126`, `:169`); the player's narrow spotlight follows aim continuously (`:148`); queen warning opacity oscillates at `sin(time*22)` (`:158`). High-contrast local flashes while firing are therefore expected. Reduce the point light peak to a modest value, shorten its range, and give it a smooth attack/decay while keeping muzzle particles bright. For steady navigation lighting, soften and/or reduce the player's spotlight. Slow queen warning pulsing without weakening the warning. No per-frame random flicker was found in architectural materials or the fixed hemisphere/fill light.

Static light anchoring and unified quality control are the first fixes. Do not repeatedly tweak shadow bias to compensate for a moving sampling grid; adjust bias only if stationary acne or detached shadows remains visible.

## 3. Map material/model upgrade

The current map is almost entirely untextured rounded boxes/cylinders using `MAT.dark/steel/edge/black`, with one albedo-only steel floor (`DepthRenderer.ts:40–41`, room builder `:72–122`, `meshParts.ts:5–21`). The floor image is RGB 1254×1254, 2.7 MB. It has no roughness, normal, or occlusion maps. Existing character assets already have authored textured skeletal models; the map is the obvious remaining visual quality gap.

Recommended bounded upgrade:

- Add a small coherent material set: coated wall panels, brushed utility metal, nonslip floor, rubber cable/conduit, and concrete foundation. Use one or two shared atlases or trim sheets for props, and tileable world-scale maps for large surfaces. Base color is sRGB; normal/roughness/AO are data maps and must remain linear/NoColorSpace. Keep emissive strips separately controllable.
- Add authored modules aligned with the existing collision footprints: wall frames/vents, equipment cabinets, sealed tanks, service crates, floor grates, cable trays and a distinct reactor centerpiece. Preserve low foreground walls and read-through sightlines. Concentrate detail at room edges and obstacle tops so traversable floor stays legible.
- Assign per-room palette/details (cold aisle cool panels and condensation, specimen bay glass containment modules, medical clean panels, armory reinforced storage) without adding invisible collision changes.
- Change default environment metalness from the current blanket .55–.78 to physically appropriate values: painted material is mostly nonmetal; exposed metal patches can be metallic. Use roughness variation and restrained normal detail rather than making every object glossy under high-intensity lights.
- Existing `bakeWorld()` merges transformed geometry per material. RoundedBoxGeometry has per-box local UVs, so simply giving all these boxes a tiled texture stretches it differently on every dimension. Author consistent UV density before merging or use a deliberate world/triplanar material. Give floors separate top-plane UV mapping if direction/orientation becomes significant. Batch modules by material, and instance repeated identical props.
- Make floor texture loading part of `preloadAssets`, including its progress and fallback, instead of loading it asynchronously after the loading overlay has gone. Its late arrival currently causes an avoidable material appearance pop. WebP/JPEG can reduce transfer size; KTX2/Basis can also reduce GPU footprint if supported with a checked fallback. A power-of-two size is convenient, but NPOT 1254 is legal in WebGL2 and not itself a Safari defect.

## 4. Performance / Safari hazards

**Concrete shader portability bug:** `AttackEffects.ts:14` calls `smoothstep(1.0,.15,d/n)`. Its reversed edges have undefined results under GLSL. Replace with `1.0 - smoothstep(.15,1.0,d/n)`. This affects smoke/decal falloff and can differ by GPU/compiler; it is not a demonstrated HP cause. Source: [Khronos smoothstep reference](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml).

**High path has no effective MSAA on its scene target:** constructor `antialias:true` affects the default framebuffer, but EffectComposer creates its own target and no sample count is configured. Low direct rendering can therefore look smoother than high around thin bright geometry. Evaluate small MSAA samples on the composer target or a suitable lightweight antialias pass against mobile memory costs. Bloom will not remove specular/shadow aliasing.

**Avoid unnecessary back/front transparent passes:** all seven particle pools are `DoubleSide` transparent materials (`AttackEffects.ts:21`), causing the renderer's normal double-sided transparent two-pass path unless forceSinglePass is enabled. Camera-facing glow/smoke and ground decal planes do not need that extra pass; use FrontSide where orientation is known or set `forceSinglePass=true` for the relevant flat materials. Alpha smoke instances are in one mesh and are not sorted individually, so overlaps can pop as the camera changes; sorting smoke instances back-to-front or using less dense/translucent smoke addresses this specifically.

**Quality is still expensive on phones:** coarse-pointer auto currently keeps the 1536 shadow map, all skinned actor updates, all effects, and every shadow caster, despite bypassing bloom. `assets.ts:7` disables frustum culling for every loaded mesh. Do not blindly enable it on skinned meshes without animated bounds; instead cull/pause distant root actors using a generous world-space bounding sphere and keep correct shadow coverage. Cache each enemy snapshot once per frame; the renderer currently asks for it twice and allocates health-entry arrays/vectors/colors every frame. Reuse scratch vectors and cached color constants for bars and bullets. Two bar draw calls are already appropriate.

**Resource lifecycle:** `DepthRenderer.dispose()` does not dispose composer passes; local EffectComposer.dispose only releases its two targets and copy pass. Call bloom.dispose and OutputPass.dispose explicitly. Retain the PMREM render target from fromScene and dispose that target during renderer teardown. Dispose actor/corpse/pickup/nest/pool/world objects and bullet resources at teardown; scene traversal must respect shared asset materials/geometries. HealthBars shares one plane geometry correctly and only disposes it once, but should also call both InstancedMesh.dispose() to release per-instance GPU buffers. The same mesh-disposal issue applies to AttackEffects pools. These matter on restarts/remounts and mobile context limits, not necessarily during one fresh run.

**Context loss handling is absent:** main.ts catches only construction failure. Add webglcontextlost/restored listeners on the canvas to pause simulation and provide a recoverable state, avoiding continued gameplay behind a blank canvas. Rebuild resources only where restoration requires it and remove listeners on teardown.

## Implementation order

1. Fix HP draw ordering / separate final overlay; make bars larger and verify in actual rendered combat.
2. Anchor room shadows; unify quality tier state; correct reversed smoothstep; reduce harsh muzzle illumination.
3. Add map material set and modular environment details while preserving collision and sightlines.
4. Verify combat/paused/resumed behavior, a large enemy encounter, room transitions, and context/resize on desktop and mobile. Audit first-use shaders and visual output; current Node tests intentionally strip textures and cannot establish their GPU appearance.
