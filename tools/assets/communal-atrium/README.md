# Communal garden model

Original procedural asset, no external models or textures. Blender 4.0.2 exports the GLB in metres, with 32 game units per metre. The source retains the supporting bed, rim and three tree anchors from PR63. Seven unequal foliage pads replace its repeated ico crowns.

Reproduce from the repository root:

```sh
blender --background --factory-startup --python-exit-code 1 \
  --python "$PWD/tools/assets/communal-atrium/build_garden.py" \
  -- --output-root /tmp/containment-garden-export
cmp public/assets/communal-atrium/signature-garden.glb /tmp/containment-garden-export/signature-garden.glb
cmp src/render/garden-trees.json /tmp/containment-garden-export/garden-trees.json
```

The export has 1,396 triangles, five material definitions, no textures and 86,560 bytes. Existing limits remain 1,500 triangles and 128 KiB. The fallback uses exported tree positions, split normals and indices directly. Blender's imported `vertex.normal` does not preserve split normals.

Independent review accepted representative tree construction at desktop and portrait shipping-camera scale. This is a bounded model stage, not complete Room4 art acceptance. Portrait spawn crops the right garden. The inherited fallback irrigation strip differs from the loaded bed. Reconcile that difference and review all placements with the real HUD before final garden acceptance. Furniture remains unfinished. Existing release failures remain open.

Current images are under `docs/pr-screenshots/communal-garden/`. They show a standalone room preview with a legal stationary spawn pose, shipping renderer/camera and no DOM gameplay HUD. Loaded cases recorded no errors. Deliberate missing-asset fallback cases retain their 404/abort errors; no network acceptance is claimed. The earlier canonical room-evidence attempt failed its strict module-abort assertion.
