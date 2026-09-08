# Distribution geometry candidate

Original procedural construction by Hermes Agent for Containment under Viktor's direction. Geometry only, pending independent review. No downloaded meshes or textures, PR58 assets, runtime changes, material acceptance or release claim.

## Reproduce

Run at repository root with Blender 4.0.2, system Python 3 and standard libraries. No new dependencies. The renderer uses Cycles CPU with six Blender threads, 16 samples, seed 0 and no denoiser. The optional missing Draco library is not used.

```sh
PYTHONDONTWRITEBYTECODE=1 blender -t 6 --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/distribution.py
PYTHONDONTWRITEBYTECODE=1 blender -t 6 --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/test_distribution_geometry.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_distribution_artifacts.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_distribution_reproducibility.py
PYTHONDONTWRITEBYTECODE=1 npm test
```

All executed commands exited 0, including clean-root build, geometry tests and artifact check. The standalone artifact check was executed inside the clean-root test and canonical npm test. Logs are retained here. npm test reported 59 passed test files and one skipped, 493 passed Vitest cases and one skipped, two passing Node cases, plus all three Python artifact suites. No full verifier, browser, CI diagnosis or runtime capture was run.

The builder accepts `-- --output-root PATH`. For the whole-room render, that root must contain the accepted `chamber.glb`, `row-carrier.glb` and `src/game/roguelike/authoredRoomTopologies.ts`. The reproduction script copies these immutable inputs and only the required source files to a fresh temporary root, then builds both new GLBs and all five PNGs. It does not rebuild the accepted row assets. `room_fit.py` is imported for read-only assembly and validation, never run as an evidence writer. There is no skip-render option that could attach a new manifest to old PNGs.

## Geometry and measured checks

Each bank is 18.75 by 2.5 metres, with six removable front covers, captive-style round latches, shallow handles, continuous deck plinth, solid back, ends and roof. Three horizontal pump/motor assemblies alternate with three plate heat-exchange packs. Twin enclosed rear headers and short branches connect the simplified mechanisms. Interior construction ships inside the closed GLBs; cutaways only hide roof and front covers during diagnostic rendering.

North reaches 1.5 m; south reaches 1 m. Both retain the same 80 mm roof/back gauges, 120 mm plinth, pump diameter, pipe bore and fastener geometry. South's heat exchangers are authored shorter and wider, not transformed copies squashed in Z. All scales are baked and positive.

Each imported GLB contains 145 mesh objects, 4,860 triangles and three neutral grayscale materials. Pair total is 9,720 triangles and 743,868 bytes. Named parts remain unbatched for construction review. These exports do not meet the later 48 added draw-call ceiling without a batching/instancing pass; no draw-call or device-performance acceptance is claimed.

Local origin is deck-centred. X points east, Blender Y toward the back, Z up. Export converts to glTF Y up once. Place north at game `600,80,h0` with no rotation and south at `600,800,h0` with a proper half-turn about glTF Y, scale 1. Actual imported installed bounds match north `300..900,40..120` and south `300..900,760..840` within 0.001 game unit. Back edges meet the wall at y40/840. Front fittings remain inside the reservations.

Per imported bank, validation checks full bounds, finite geometry, baked scale, welded manifold topology and positive signed volume; 24 deck probes, 24 back-contact probes, 54 front-cover silhouette probes, six opposed skid/plinth contacts and 30 first-hit fitting exposure rays. Roundtrip vertices determine results rather than glTF mesh-local accessor bounds. Each variant rejects nine destructive faults, 18 total: floating skid, buried handle, rear slot, inset front, floating deck, missing panel, oversize roof, squashed assembly and an actual deleted roof face.

The full-room diagnostic uses the accepted four carriers and sixteen chambers and retains their twelve conservative route segments. Only SN/SS placeholders are replaced. Monitoring units remain labelled placeholders, and flush feeds are not built. Whole-room images are not new gameplay or shipping-camera evidence.

Clean-root rebuild matched both GLBs byte for byte and all five decoded PNG pixel hashes. The accepted chamber/carrier bytes also matched in the copied root. Blend binary identity is not claimed. `reproducibility.json` records exact hashes, dimensions and retained clean-root path. `manifest.json` records exports, blend files, PNG hashes and measured geometry. `provenance.json` records source hashes and the preservation check against all 53 pre-existing asset-package files.

## Evidence

All five images are 1200 by 800 and labelled SOURCE-ONLY:

- `north-closed.png`
- `south-closed.png`
- `north-cutaway.png`
- `south-cutaway.png`
- `room-placement.png`

Author inspected all five images. Exterior panels and sealed silhouette are visible. Cutaways show separate pump and exchanger bays and rear headers. The room view shows the pair with all four occupied rows, but hides the south working face behind its back wall, so use the south studio image for that face. Render grain and small fitting contrast limit detail inspection. No image clipping of the banks was observed. These observations are not an independent verdict.

## References and limits

Before authoring, consulted Alfa Laval's [T15 plate-and-frame exchanger leaflet](https://alfalaval.co.uk/globalassets/documents/products/heat-transfer/plate-heat-exchangers/gasketed-plate-and-frame-heat-exchangers/industrial/t15_product-leaflet_en.pdf) through indexed manufacturer text. Its plate pack, pressure frame, tightening bolts and flange connections informed the simplified exchanger. After the first build, cross-checked the pump arrangement against the [Grundfos CR-H product guide](https://d1pkofokfruj4.cloudfront.net/media/upload/resource/x/Grundfos-Pumps-CR-H-CRN-H-CRE-H-CRNE-H-Product-Guide.pdf), whose indexed text describes motor, pump unit and baseplate with axial suction and radial discharge. Neither document supplied mesh data, artwork, textures, exact product dimensions or a license for such reuse. The six-cover enclosure is an original design choice, not a copied product.

This is a construction silhouette model, not hydraulic design or pressure/thermal certification. Service removal motion, valves, internal electrics, fluid separation, fabrication tolerances and installation sequencing remain unverified. Headers are closed conceptual circuits; underfloor outlets belong to the deferred flush-service family. Materials, UV/PBR/wear, batching, shipping-camera readability and foreground occlusion, loading lifecycle, real gameplay, finished-room routes/shots/navigation, release verification and hosted gates remain open. Stop here for parent-led independent geometry review before monitoring or flush work.
