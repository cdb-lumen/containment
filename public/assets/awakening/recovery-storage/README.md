# Recovery storage kit

Original asset-only continuation of approved console/seat commit c67bc9f. No production changes. Parent must review before integration.

- `locker.glb` and packed editable `locker.blend`: east-facing twin-track sliding leaves, recessed pulls, hollow supported shelving and east-readable KIT atlas.
- `satellite-cabinet.glb` and `.blend`: west-facing four folding leaves parked in paired stacks, shelves clear of doors, shelf channels connected to cheeks/back, one sealed dressing pack.
- `trolley.glb` and `.blend`: original offset parking center1079/728, four deck-contact wheels with hubs/forks, supported trays, clean upper surface at18, raised push grip and local rim wear.

All three use the same native32 authoring transform as the unchanged console/seat. Mount each at Three.js `[6.375,0,21.875]`, identity rotation, scale1. Coordinates are intentionally room-relative to that common mount, not centered separately. Do not fit or recenter them. Exact frozen per-triangle bounds and four access rectangles pass after GLB import.

Separate exports allow reservation-level fallback/replacement without hiding approved equipment. This adds 14 material batches across three assets; chamber textures repeat across files and are not automatically GPU-deduplicated. Parent may pool matching materials while retaining independent disposal ownership. No runtime material budget is claimed verified.

| Asset | Triangles | Batches | GLB bytes |
|---|---:|---:|---:|
| Locker | 4690 | 5 | 316508 |
| Satellite cabinet | 4940 | 5 | 333288 |
| Trolley | 5448 | 4 | 349192 |
| New assets | 15078 | 14 | 998988 |

Approved console/seat remains byte-for-byte unchanged at14226 triangles,7 batches,666592 bytes. Combined kit is29304 triangles,21 batches,1665580 bytes before runtime pooling.

## Reproduce

```sh
python3 scripts/create-storage-label.py
blender -b --factory-startup --python-exit-code 1 -P scripts/build-recovery-storage.py
blender -b --factory-startup --python-exit-code 1 -P scripts/verify-recovery-storage.py
blender -b --factory-startup --python-exit-code 1 -P scripts/verify-recovery-kit.py
```

Builder reuses the approved script's construction/material helper prefix. Keep that source dependency. Original generated geometry and label; surface atlas provenance is the repository's approved sealed-cryo.blend, no downloaded imagery. DejaVu Sans Mono label font uses the system DejaVu license. Shared enamel, powdercoat, steel and gasket textures use selected clean atlas regions. Roughness/metallic textures are embedded; these are not normal maps.

Evidence under `docs/art-evidence/recovery-storage/`: asset-stats.json, independent-verification.json and six real GLB-roundtrip studio PNGs. Whole-kit is exact-placement overhead, not a room render. Three detail views and two360px local kit views show maintained material matching. Cycles20 has visible sampling grain. Initial review caught a cropped overview and wrong label aspect ratio; final renders correct both. Independent validation checks packed used images, finite exported attributes/unit normals, embedded PNG dimensions and separate sliding/folding leaf clearance from shelves. Build checks deck contact and trolley uprights/tray18 after import.

Static parked doors are authored, not animated. No production camera, room collision, owner lifecycle, loading fix or performance verification is included. Keep procedural fallback until each requested asset validates, and do not hide the entire existing batched kit. No room-complete claim, push or merge.
