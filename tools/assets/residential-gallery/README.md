# Residential Gallery equipment

Original asset-only package for the four accepted room 3 reservations at source `1f7a2a970caef7678bc01ab47e564ca5407bc37d`. Story and whole-room layout are accepted. This package does not claim final shipping-camera acceptance.

## Build and roundtrip checks

Requires Blender 4.0+ with its glTF exporter and matching Python NumPy. Tested with distro Blender 4.0.2. From the repository root:

```sh
blender -b --factory-startup --python-exit-code 1 \
  --python tools/assets/residential-gallery/build_equipment.py -- \
  --output-root "$PWD" --evidence-dir /absolute/path/to/equipment-evidence
```

The command writes the GLB and manifest into `public/assets/residential-gallery/`. It saves an editable, named-part `.blend`, and an assertion-bearing `roundtrip.json` into the evidence directory. It does not render or launch a browser. Run the same absolute script with a different `--output-root` and compare GLB bytes to reproduce the export. Blender `.blend` file bytes are not a deterministic contract.

Every run imports the actual GLB afresh and checks transformed bounds for each root, exact preserved maximum height within float32 tolerance, finite vertices, unit vertex normals, nondegenerate triangles, material factors against `meshParts.ts`, seven or fewer used materials within an eight-definition limit, and a 16,000-triangle ceiling. All primitives have POSITION, NORMAL and TEXCOORD_0 attributes. The package has no textures. Untextured lettering receives an unused UV channel for batching compatibility.

A 20 by 20 upward ray grid per reservation proves sampled floor occupancy by actual imported geometry. Each imported zone is translated outside its reservation and must fail the same bounds predicate. This is a negative control, not a second approved placement. Occupancy rays are sampling evidence, not a replacement for runtime collision and shipping-pixel review.

## Placement contract

Load `public/assets/residential-gallery/residential-gallery-equipment.glb`. Add the complete `gltf.scene` to the room's metre-coordinate parent at position `0,0,0`, rotation `0,0,0`, scale `1,1,1`. Apply the same outer room transform as other equipment. One GLB unit is one renderer metre, or 32 gameplay units.

The four exported root nodes already include their room-local placement. Do not apply footprint translations again. If extracting a root instead of mounting the complete scene, preserve that root's full transform and descendants.

| Root identifier | glTF translation x,y,z | Reservation in gameplay x,y,w,h | Maximum height |
|---|---|---|---|
| `rg_cabin_nw` | `8.75,0,5` | `280,160,240,100` | 1.35 m |
| `rg_bunk_storage` | `8.75,0,16.25` | `280,520,120,200` | 1.10 m |
| `rg_cabin_ne` | `20.3125,0,8.4375` | `650,270,260,100` | 1.35 m |
| `rg_packing` | `24.375,0,17.8125` | `780,570,140,150` | 1.20 m |

Blender authoring coordinates are `x,-gameY,height`, in metres. The standard Y-up glTF exporter performs the axis conversion. Do not rotate the imported scene to compensate for Blender coordinates.

Each root holds one mesh per used material. Mesh identifiers follow `<root>__batch_rg_<material>`. Mesh extras contain `component_ids`, the exact named source components merged into that material batch. `manifest.json` also lists each zone's complete source component inventory. These IDs identify static art, not new interactions. Use the root IDs for all-or-nothing fallback ownership; do not remove fallback before the full package passes the runtime owner's load/fit checks.

## Authored equipment and style

- Two backed, roofless cutaway cabin banks contain six closed split-door thresholds, low lintels, roof/storage cassettes and broad arrival bands. Full-width toe plinths fill threshold intervals instead of implying walkable gaps. The accepted 1.35 m cutaway height is retained rather than inventing full-height doors that would change occlusion.
- The north-facing empty berth has a 1.125 by 2.1875 m mattress, pillow and folded blanket above continuous under-bed storage. Rear lockers and the bedside cabinet occupy the rest of the alcove. No sleeper is exposed and no walk-in opening is implied.
- The packing island has a loaded four-wheel trolley, strapped arrival trunks, a diagonally displaced cushioned bench, end luggage and a small `NEW EARTH` label. All sit over continuous storage rather than scattered props falsely suggesting free floor inside the collision rectangle.

The seven PBR definitions reuse the exact sRGB colors, metalness and roughness of MAT `armor`, `steel`, `edge`, `rubber`, `trim`, `bone` and `red` in `src/render/meshParts.ts`. The script converts sRGB color values to linear glTF factors. No emissive materials, lights, texture allocation, copied equipment meshes or third-party downloaded assets are introduced. Lettering uses Blender's bundled Bfont converted to geometry. Equipment geometry and source are authored for this repository and follow its licensing. Small bevels supply edge highlights without high subdivision or texture memory.

## Verified batch 1

The completed CPU export/import contains 5,978 triangles, 22 material-batched mesh primitives, seven materials, zero textures and 457,332 GLB bytes. All four imported bounds and heights pass; 1,600 floor rays hit; all four translated-root negative controls fail as expected. A clean-root second build produces a byte-identical GLB and identical roundtrip receipt.

GLB SHA-256: `68b55094a5506638590626926bd2fa15a79e12f482a29f61e18acfc0a91c0e93`.

The distro exporter may warn that Draco is unavailable. This package uses ordinary uncompressed GLB and roundtrips without Draco.

The default Vitest suite imports the real package, checks bounds, normal/winding validity and resource ceilings, and rejects translated, zero-normal, reversed-winding, degenerate and double-sided controls for every root. Run `npx vitest run tests/unit/residentialGalleryEquipment.test.js` for this focused check.

Not verified here: production camera appearance, independent pixel review, runtime load/fallback/cancellation/disposal, or gameplay with these final meshes. No runtime files, camera, light, VFX, collision or campaign logic were changed.
