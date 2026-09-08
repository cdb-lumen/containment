# Released player berth

Original asset-only refinement based on `ce03fb6`, approved `awakeningRelease` construction and `AWAKENING_FUNCTIONAL_ENVELOPES`. No runtime, bank, topology, spawn, camera or lighting changes.

## Integration contract

- GLB native scale 1. One render unit is 32 game units. Never apply 50/32.
- Local origin mounts at game XY `135,440`, deck height 0. glTF X is east and Z is game south. Translate to Three.js `(135/32, 0, 440/32)` without rotation.
- Whole assembly includes berth AND flush landing. Replace the original `awakeningRelease` output only after successful validated loading. Do not overlay it on the old geometry. Parent owns loader/fallback/disposal integration.
- World game bounds X `91..238`, Y `380..500`, height `0..36.400002`. Solid berth stays inside `90..180,380..500`. Access landing is `180..238,380..500`, maximum relief 0.5, below the frozen 0.6 limit.
- Preserve spawn `230,440`. No topology changes are needed or permitted by this asset.
- Three nested north lid sections remain parked within Y `383..405`. Two slide channels and original actuator lengths remain. West rail is supported on three bolted deck-contact feet; no east handrail.
- Empty usable liner envelope is 44 by 76 game units, or 1.375 by 2.375 render units. Segmented upholstery, low head cushion, released buckle levers and rolled webbing contain no human geometry. A 2.05-unit actor-height comparison leaves longitudinal room; this is dimensional analysis, not an anatomy fit simulation.
- The central east guide reaches height 17.5. Original north actuator sleeve reaches 21.1 at Y410. Neither is a new obstruction; both preserve the source mechanism. The adjacent landing remains flush.

## Source and reproduction

`released-berth.blend` retains named editable parts, explicit UVs and packed images. `released-berth.glb` batches compatible materials into eight meshes. Approved enamel, graphite, satin stainless and gasket materials come directly from repository `public/assets/benchmark/sealed-cryo.blend` at the source revision. They retain their image-based PBR response rather than reverting to the earlier flat benchmark palette. Original localized handling rub geometry appears on the transfer sill. Added display and tread share one 512-square color atlas and one roughness atlas. No normal-map bake is claimed. All model additions and atlas graphics are original project work; no purchased or third-party geometry/textures. The atlas generator uses the locally installed DejaVu Sans Mono font.

From repository root:

```sh
python3 scripts/create-released-berth-atlas.py
blender -b --factory-startup --python-exit-code 1 -P scripts/build-released-berth.py
blender -b --factory-startup --python-exit-code 1 -P scripts/verify-released-berth.py
```

Python requires Pillow; Blender requires its glTF exporter and NumPy. Set `BERTH_EVIDENCE` to override the default evidence directory. Generation uses the approved source blend, not the historical baseline generator with obsolete scale comments.

## Measured verification

GLB export and Blender reimport passed. Asset is 636,980 bytes, 13,316 triangles, eight mesh/material batches, nine embedded images, six textured materials. Every exported primitive has NORMAL and TEXCOORD_0. PBR metallic/roughness references are verified. Editable blend is separate from export batching.

Real imported-mesh downward rays passed: 21 interior samples, 35 landing samples, 15 east-exit samples and nine parked-lid samples. Bed maximum sampled height is 13.500003. Landing maximum is 0.500003. Initial clearance test caught the original north actuator at 21.1 rather than the central guide at 17.5; the test now distinguishes them and preserves the approved geometry.

Evidence directory: `/home/chernodubv/.hermes/workspaces/containment-awakening-completion/released-berth/`

- `studio-roundtrip.png`, 1000x800, neutral studio view of actual exported/reimported GLB.
- `studio-top-clearance.png`, 1000x800, top clearance view.
- `studio-scale.png`, 400x320, small-object readability render, NOT production camera evidence.
- `asset-stats.json` and `clearance-verification.json`, measured checks.

All three PNGs were visually inspected. The empty mattress, nested parked lid, west-only rail, low east guide and separate flush landing read at small scale. The recessed display reads RELEASE COMPLETE in the close view and remains a quiet amber patch at small scale. Neutral studio rendering has visible sampling grain. Actual production camera, shadows, actor clearance, material ownership/disposal and room-level budgets remain parent integration gates. No browser smoke was run by this asset worker.
