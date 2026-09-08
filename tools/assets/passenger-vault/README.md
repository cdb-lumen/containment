# Passenger Vault construction source

Original procedural geometry authored by Hermes Agent for the Containment project under Viktor's direction. This package delivers one carrier and four placements of one reusable closed chamber. Independent construction re-review is pending. It is not the complete room.

## Build and check

Run from the repository root. Tested with system Blender 4.0.2 on Linux, its bundled bpy, bmesh, mathutils and glTF importer/exporter, and Python 3 standard library. No pip packages, downloaded models, texture maps or prior assets are required. Blender's optional Draco library is absent on the tested host; these exports are uncompressed and do not require it.

```sh
blender --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/build.py
python tools/assets/passenger-vault/test_artifacts.py
blender --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/test_geometry.py
python tools/assets/passenger-vault/test_reproducibility.py
```

The default output root is the repository root. To generate elsewhere, append `-- --output-root /tmp/passenger-fixture` to the build command. The builder writes two GLBs, the editable blend, six 1200 x 900 diagnostic PNGs and a manifest. `--skip-renders` is a geometry-only shortcut; it does not satisfy the six-image artifact contract. Use an empty output root to avoid including stale PNGs in its manifest. Keep the source directory together because build.py imports geometry_checks.py.

The reproducibility test copies only Python sources and package documentation into a new temporary root, builds all assets and all six renders there, runs both test suites and compares geometry, placements, GLB bytes and decoded PNG pixels. It does not claim identical blend bytes or cross-version render determinism. It prints the retained clean-root path and exact comparison results.

## Construction decisions

The internal bed extends down to the pan at z0.36 without changing its z0.42 top or the scale proxy. A Boolean recess opens the front wall for a backed status plate. Four side clamps embed in the shell and expose outer faces at x +/-0.625. No fittings exceed the 1.25 x 2.75 m chamber footprint. The complete row remains inside 6.25 x 3.75 x 1.25 m.

geometry_checks.py measures bed/pan surface contact with nine opposed rays and outward visibility with nine approach rays per fitting. Both source geometry and imported GLB are checked. Only the intentionally raised working-face relief may cover its backing plate. test_geometry.py moves actual imported meshes to recreate the floating bed, buried plate and each buried clamp, and requires rejection. These are geometry-behavior checks, not source-text assertions.

See [references.md](references.md) for sources and the timing of consultation, [independent-review.md](independent-review.md) for the preceding failed candidate, and [CREDITS.md](../../../public/assets/passenger-vault/CREDITS.md) for provenance. The equipment plan is [here](../../../docs/design/passenger-vault-equipment-plan.md).

## Limits

Grayscale materials and fixed studio lighting are diagnostic only. No PBR, UV, texture, wear, shipping-camera readability, medical/pressure certification, lid opening, loading mechanics, runtime, performance, full-room routes or release acceptance is claimed. The source-only human proxy is absent from shipping GLBs. No PR58 geometry is an input. Story, layout, runtime and global lighting are unchanged.

Remaining inventory is three carriers, twelve chambers, two distribution units, two consoles and one flush kit. Independent review owns the acceptance verdict.
