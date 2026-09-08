# Independent slice 1 construction review

Verdict: MUST-FIX. Cavity and envelope checks pass, but construction acceptance is withheld. Scope is one carrier with four chamber placements, not the full room. Reviewed checkout HEAD `e0ac00ffad50e5ebc1da9851833b18cfe6978212`; candidate files are untracked additions.

Read approved-production-process.md, passenger-vault-equipment-plan.md and passenger-vault-layout.md. No runtime or asset edits, publishing, commit or merge performed.

## Must-fix findings

1. **Unsupported internal bed.** Actual chamber GLB has bed bottom z0.3700000 and pan top z0.3600000, leaving a 0.00999999 m air gap. Independent BVH found no bed contact with any other chamber mesh. The longitudinal section also shows this gap. Add physical support or seat the bed while retaining body clearance. Add a bed-support assertion. The builder's eight plinth rays do not check this support chain.
2. **Buried working-face fittings.** All 384 vertices of the status plate are inside the uncut enclosure, at y-1.3525..-1.3375 versus outer face y-1.37. The closed PNG shows a partly occluded front relief rather than an inset strip. All 384 vertices of each of the four seal clamps are also inside the enclosure. Give these fittings real exposed seating/recess construction within the envelope, or remove buried clamp meshes and document an alternative closure. Brighter materials cannot repair this geometry occlusion. Recheck the closed/front view after correction.
3. **Missing reference/source-package documentation.** README.md, references.md and public CREDITS.md do not exist at review. The plan requires reference-led construction with URLs and decisions, reproduction/dependency notes and provenance. The source rebuilds, but no reference-led design record was delivered. Supply a truthful record, not retroactive claims of consulted sources. No textures exist in this untextured slice; texture acceptance is not claimed.

## Verified checks

- Fresh `python tools/assets/passenger-vault/test_artifacts.py`: exit 0, one test. All manifest-listed binary hashes match. Its assertions do not detect the defects above.
- Fresh Blender 4.0.2 independent import probe: exit 0. Actual GLBs have 27 chamber and 20 carrier mesh objects, 3,604 and 1,504 triangles. After welding export seam vertices for analysis only, every component has manifold edges, consistent adjacent face winding and positive signed volume. No repair was written to assets. Normals are present; no animations, images or exported FIXTURE nodes.
- Assembled row bounds are 6.25 x 3.75 m, z0..1.2380000, below 1.25 m. Chamber bounds are x±0.6200000, y-1.3720000..1.3700000, z0.1800000..1.2380000. Four placements reproduce A's chamber reservations using divisor 32. Continuous plinth and sealed infill explain the row solid without walk-through gaps.
- Actual exported cavity passes 4,329 independently sampled air points in the 0.75 x 2.25 x 0.42 m prism. Nine source proxy parts imported from the blend have no surface intersections or vertices contained in exported shell solids. Source build also checks 1,125 points, prism surfaces and proxy dimensions. The 2.05 m long, 0.62 m wide proxy reaches z0.74; lid underside is z0.94. This establishes geometric fit, not medical certification or loading mechanics.
- Cradles span z0.18..0.29, contacting plinth top z0.18 and pan bottom z0.29. Rear supply/return rods span row-local y1.12..1.385; chamber unions end at y1.12 after placement, and manifold starts y1.375. Rear panels face maintenance access. Front/rear orientation matches row A. The bed exception prevents an overall support pass.
- Fresh clean-root build with `--output-root /tmp/passenger-independent-rebuild --skip-renders`: exit 0. Both geometry digests and both GLB binary hashes exactly match. Builder reads no prior assets; its only GLB imports are its freshly generated exports. This supports original procedural construction without PR58 binary reuse, not an exhaustive historical authorship comparison. Renders were inspected, not rerendered; blend-byte reproducibility is not asserted.

## Actual six PNGs inspected

All are 1200 x 900 diagnostic studio images, not shipping-camera evidence. Paths below are relative to this directory.

| Path | Pixel conclusion |
|---|---|
| evidence/chamber-closed.png | Closed opaque curved lid and gasket seam visible. Front strip obscured; clamps not exposed. |
| evidence/row-closed.png | Four closed chambers on one continuous carrier; four upper relief cue sets visible. |
| evidence/row-top.png | Four positions, north manifold, south-facing upper cues and sealed infill. |
| evidence/carrier-rear.png | Rear panel bank and paired unions present. Dark panels are backed solids, not open windows. |
| evidence/chamber-cutaway.png | Source-only human-shaped proxy inside real cavity, with lateral and overhead space. |
| evidence/chamber-section.png | Proxy below closed lid; cradle arrangement visible. Unsupported bed gap remains. |

Materials/PBR/UV/wear, shipping desktop/portrait readability, full-room fit/routes, batching/draw calls, runtime lifecycle, gameplay and release remain unaccepted. Studio evidence cannot substitute for these gates. Delivered 1 carrier and 4 chamber placements. Remaining 3 carriers, 12 chambers, 2 distribution units, 2 consoles and 1 flush kit.

Independent diagnostics retained at `/tmp/passenger-independent-probe.py`, `/tmp/passenger-independent-probe.json` and `/tmp/passenger-independent-rebuild.log`. These are local diagnostics, not committed deliverables.

## Reviewed SHA-256 hashes

Paths relative to repository root.

```text
90f5f49d5737af93672a07c0e6062356956767647f3f8495cb67af411e225a2e  tools/assets/passenger-vault/build.py
45d4b19657f20dddcdc499a26e5ae0346f6f0365103097ef4115ed29de1ce41a  tools/assets/passenger-vault/test_artifacts.py
a0f05626fa64d9cda782ff19e9c7962e518accacf8543111e9627353b32d0ddd  tools/assets/passenger-vault/manifest.json
ec7352885f511e468ff2dc7568666a28eae0e3e95492f6d1aa1f2ad42660b4e4  tools/assets/passenger-vault/passenger-vault.blend
a57b8b28f592ffecae7efc59a62ef48da18419f3b4652cc10d1095001bebe8e3  public/assets/passenger-vault/chamber.glb
302f423248922939b69aa8848ce52b1d5e4ee8192382dcba9dcc70a4b8861dee  public/assets/passenger-vault/row-carrier.glb
e9786863695ce3f8c0ab2cd19a4f11bf36ebb852b5877f192bd3b59ea1c96b20  tools/assets/passenger-vault/evidence/carrier-rear.png
1551f62bf807aa7ddc15cecc36f12faf016ba542fbca2300253e88b084daf050  tools/assets/passenger-vault/evidence/chamber-closed.png
0ff298c2432e4c987705501ebf3ab909e4649f57fb4ee0332de945303b4b7d96  tools/assets/passenger-vault/evidence/chamber-cutaway.png
798d081e4471cdb18c2df69bedd452d5b68748683732a8e76f54c756e31d17f2  tools/assets/passenger-vault/evidence/chamber-section.png
2fff2310646d4b5369c67ee65aaf765027df6bd94d150fe9e3756d734708243e  tools/assets/passenger-vault/evidence/row-closed.png
b3bc40d0ef03efb046b08bc43ce905a79a6796317e1c5e6fea114ab16ea358df  tools/assets/passenger-vault/evidence/row-top.png
```
