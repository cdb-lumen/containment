# Pass 5 performance and lighting audit

Read-only audit of `containment-3d`; no browser/Safari measurement was performed. Findings below separate reproduced geometry defects from likely frame-time causes. Locations refer to pre-fix source.

## Priority fixes

1. **Spawn-time animation work:** `src/render/models.ts:16–28` calls `mixer.clipAction` for every clip on every new rig, then `Box3.setFromObject(root,true)`. Source GLBs contain 666–1483 animation channels per alien asset, and 3690 for the marine. Precise bounds traverses and CPU-skins every vertex (confirmed in installed Three `Box3.expandByObject` / `SkinnedMesh.getVertexPosition`). Dragoon has 8999 vertices, tyrant 6103. Lazily create only requested actions; cache scale/center/height once per initialized asset pose. First-use materials also need GPU preparation; load GLB and environment textures, then `compileAsync` with final scene lighting configured. The Three renderer documentation recommends this method to reduce shader compilation stalls: https://threejs.org/docs/pages/WebGLRenderer.html#compileAsync

2. **Death-time synchronous baking:** `src/render/models.ts:64–71`, invoked directly from `DepthRenderer.effect:138–139`, clones all mesh geometry, CPU-skins each vertex, recomputes normals and creates new GPU geometries on each death. Multiple enemies dying in one explosion bunches the work into one frame. Prefer retaining a stopped rig in its current pose and throwing its parent group; reduce corpse count from 24 to a small device-sensitive cap. Stop the mixer without resetting its pose; retain skeleton buffers until actual corpse disposal. CPU bake can be a separately budgeted optional quality feature.

3. **Projectile allocation multiplication:** `src/DepthGame.ts:77–81` calls `targets()` inside each bullet substep; `targets():63` constructs an entire enemy system snapshot and then another target array. `EnemySystem.getSystemSnapshot():244–253` clones/freezes every enemy. Cache snapshots until mutation; cache targets until enemy/boss position, health, spawn, death or displacement changes. Collision logic must not keep hitting dead targets when mutations chain inside the same frame. Navigation also creates arrays/objects in `FacilityNavigation:7,19–26,32–43`, but the above costs are stronger initial priorities.

4. **Reproduced broken UVs:** `src/render/EnvironmentMaterials.ts:19–23` selects a projection axis independently for each rounded-box vertex using its smooth normal. A Node diagnostic using the exact installed Three geometry found 8 zero-area UV triangles out of 108 for both `(2,2.6,.32,1,.045)` wall and `(5,1.05,3,1,.055)` cover; original UVs have 0. Plain BoxGeometry floor has 0. Preserve RoundedBox UVs and scale each face's existing U/V using physical dimensions. Groups 0/1 map Z/Y; 2/3 map X/Z; 4/5 map X/Y. Indexed BoxGeometry group start/count are index offsets: scale each referenced vertex once, or use nonindexed geometry. The installed derivative normal shader guards zero determinant, so this diagnostic proves collapsed texture mapping, not a Safari NaN.

5. **Dark floor is partly authored albedo:** `metal_plate_diff.jpg` mean encoded RGB is `(61.4,49.9,28.0)`; cover is `(84.4,72.5,61.9)` and concrete `(113.8,105.3,90.3)`. `EnvironmentMaterials.theme()` multiplies the albedo by additional subwhite tints. Use a lighter/readable floor albedo or modest material compensation, balanced with white/neutral fill and environment intensity. Avoid solving every dark surface by greatly raising all light intensities. Existing diffuse `SRGBColorSpace`, noncolor default maps, output `SRGBColorSpace`, and OutputPass are consistent with Three's documented color workflow; no evidence here of globally missing gamma correction: https://threejs.org/manual/en/color-management.html

6. **High-quality render budget:** `DepthRenderer:31–55,59–65,180–182` starts desktop coarse-pointer=false at DPR up to 1.7, a 1536 shadow map, full-screen half-float composer targets and multipass bloom. At 1920×1080 CSS and DPR 1.7, two RGBA16F composer color buffers alone occupy about 96 MB, before depths, bloom and textures. Limit DPR nearer 1.25–1.5, use smaller bloom targets or disable bloom on conservative auto quality, and make performance downgrade respond to sustained measured frame time. Low mode still constructs and resizes the complete composer even though it is never rendered; lazy-allocate it only for enabled postprocessing. Shadows add scene rendering work, per the primary manual: https://threejs.org/manual/en/shadows.html

## Additional observations

- `assets.ts:9` turns `frustumCulled=false` on every mesh, so offscreen actors still submit geometry and shadows. Restore culling only with safe precomputed animated bounding volumes; enabling it blindly can clip skinned limbs.
- `DepthRenderer:184` does not fully release world/actors/menu/player/bloom passes/PMREM target. Less likely the immediate freeze because the app creates one renderer, but important if reconstruction or context recovery is added.
- The room environment PMREM target reference is discarded at construction, preventing explicit disposal.
- `PCFSoftShadowMap` is deprecated in installed Three r185 and internally falls back to `PCFShadowMap`; use the latter directly to remove warning noise.
- No source evidence proves a Safari-specific driver defect. Add lightweight frame-gap counters and context-lost/restored reporting to distinguish CPU stalls, GPU exhaustion, and WebGL context loss. Avoid advertising Safari verified until tested on that browser.

## Focused validation

- Assert finite, nonzero UV area for textured rounded-box triangles.
- Verify stopped corpses retain the impact pose and clean up skeleton buffers only on removal.
- Exercise shotgun/grenade multikills and repeated carrier spawns; compare worst frame gaps and actor creation/bake durations.
- Capture identical rooms in low/high quality after textures load; check floor/cover readability and normal-mapped bevels.
- Record all render passes with `renderer.info.autoReset=false` and reset once per displayed frame; the default reset would otherwise leave only health HUD statistics after the second render call.
