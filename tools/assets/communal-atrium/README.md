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

Independent review accepted representative tree construction at desktop and portrait shipping-camera scale. This is a bounded model stage, not complete Room4 art acceptance. Portrait spawn crops the right garden. The fallback-only irrigation strip is removed; independent desktop and portrait review accepted this narrow appearance correction. Review all placements with the real HUD before final garden acceptance. The representative seating finish is accepted in bounded loaded garden/dining views. Complete-room furniture coverage remains pending. Existing release failures remain open.

Current images are under `docs/pr-screenshots/communal-garden/`. They show a standalone room preview with a legal stationary spawn pose, shipping renderer/camera and no DOM gameplay HUD. Loaded cases recorded no errors. Deliberate missing-asset fallback cases retain their 404/abort errors; no network acceptance is claimed. The earlier canonical room-evidence attempt failed its strict module-abort assertion.

## Compact corridor planting

`CommunalAtrium.ts` also authors two low seven-leaf rosettes for `corridor-garden`, inside its unchanged 20x16 reservation. This replaces the compressed full-height trees only at that placement. Main trees and their export remain unchanged. The compact model uses the same geometry in loaded and fallback modes and existing room materials. No new loader or asset export is needed.

Independent native desktop/portrait review accepted the compact silhouette. Four paired static views are under `docs/pr-screenshots/communal-planting/`. These have staged actors, no enemies and no DOM HUD. Complete-room actual-HUD review remains pending. `tests/CommunalPlanting.test.ts` checks exact bounds, soil contact, low foliage and loaded/fallback vertex equality. The existing material and draw budgets remain unchanged.

## Furniture source

`src/render/CommunalAtrium.ts` deterministically builds the table and six seats in both garden loading modes. It uses rounded ceramic edges, inset cushions, warm reverse-back panels and a thinner steel frame within the unchanged footprints and heights. No separate furniture export or downloaded asset is required. `tests/CommunalFurniture.test.ts` checks physical bounds, floor datum, rounded normals and exposed upholstery. The outer-back regression rejects the first dark-backed attempt. Existing map and asset-owner tests cover loaded/fallback geometry and disposal.

Paired native-sized originals are under `docs/pr-screenshots/communal-furniture/`, with explicit `before-` and `after-` names. These are static legal garden and dining poses with settled production camera follow, not gameplay or DOM-HUD evidence. Enemies hide portions of the near dining seats. Independent review accepted the visible seat finish, not hidden surfaces or full-room art. The tabletop edge change is subtle at native scale.
