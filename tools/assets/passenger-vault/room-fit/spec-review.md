# Independent four-row fit spec review

## Verdict

PASS for the bounded, source-only installed four-row geometry fit. No must-fix spec finding in this candidate. Separate independent code/pixel review remains required before the owner advances the gate.

Reviewed checkout HEAD `3bf42361b9229ccbe6c70ce5dc77696b9db0c2ee`, with the uncommitted candidate identified by the hashes below. This is incremental acceptance after the prior single-assembly geometry gate. It does not accept the complete equipment inventory, materials, live-state readability, shipping cameras, runtime integration, gameplay behavior, performance or release. Distribution and monitoring remain four neutral reservations. The flush kit and underfloor distribution construction are not delivered here.

## Spec findings

- Requested and delivered installed geometry agree: four carriers and sixteen closed chambers, four per A/B/C/D4. I read the assembly code and manifest and programmatically counted four row records and sixteen chamber records. The fixture imports the prior chamber and carrier GLBs, shares mesh data and uses proper southern half-turns rather than negative-scale mirroring. Both GLBs are byte-identical to HEAD and match the prior assembly manifest hashes.
- A/B work south and C/D4 work north, toward the central crossing. The validator measures the actual working-face status geometry against rear unions rather than trusting rotation labels. Top-view pixels show the opposed shoulder details and rear rails consistently; oblique pixels show the same arrangement.
- All four complete rows fit the approved x/y envelopes and height cap. The validator checks every transformed vertex and each chamber reservation. Manifest row footprints are A `320..520,240..360`, B `680..880,240..360`, C `320..520,520..640`, D4 `680..880,520..640`. SN/SS/MN/MS retain their exact approved bounds and heights. The topology input is byte-identical to HEAD. No additional query solids are authored.
- Support and local manifold continuity are covered by 64 opposed-ray support contacts, 64 service-interface checks and 140 plinth probes in the retained validation receipt. Static review confirms coverage across every installed row, both cradles per chamber and both supply/return fittings. Pairwise disjoint chamber bounds conservatively exclude inter-chamber intersection. Continuous plinth extents and deck-contact probes support the sealed-footprint requirement. The oblique image shows continuous bases beneath all four rows, not floating trays or apparent walk-through slots. Fine fitting contact relies on the retained geometry checks and prior assembly gate, not overview pixels alone.
- R1–R4 match the approved coordinate paths. The radius-28 clearance code conservatively inflates all eight solids and checks complete axis-aligned segments and deck-boundary clearance. The receipt covers 12 route segments and 34 access segments, including all sixteen working positions, sixteen rear approaches and both console approaches. The north/south rear paths also preserve distribution maintenance access. Working centres remain at y400/480; rear approaches remain y180/700. The top image shows the open crossing, centre spine, rear loops and end aprons. This is geometric fit evidence, not a new production navigation or combat pass.
- Diagnostic actors, radius disks, route traces, deck and service boxes are source-only fixture objects. The script writes PNGs and a manifest, not replacement GLBs or runtime source. Existing GLBs retain their prior body-fit/construction acceptance. No exposed passenger or additional equipment family appears in this slice.

## Actual pixel inspection

I loaded and inspected both retained PNGs with vision, not just filenames or the author's descriptions:

- `tools/assets/passenger-vault/room-fit/whole-room-top.png`: four clearly separated four-chamber rows, closed lids, opposed north/south orientation, rear rails on the outside, four service reservation blocks and open marked circulation. No visible row overlap or false walking gap between chambers.
- `tools/assets/passenger-vault/room-fit/whole-room-oblique.png`: all sixteen closed chambers are visible on four continuous supported bases. Upright scale proxies and clearance disks remain outside the equipment. The centre crossing and surrounding routes stay open. The neutral service blocks are visibly unfinished context, not accepted distribution or monitoring assets.

Both images decode as 1600 x 1200 RGBA. These are neutral diagnostic orthographic views, not shipping-camera evidence. They do not establish readability of living-occupant cues, material separation or precision contact at every small fitting.

## Evidence integrity and review limits

I independently recomputed every manifest input and PNG binary hash, plus decoded RGBA hashes using Pillow. All match. I verified all 20 existing `SHA256SUMS` entries with zero mismatches before adding this review. The clean reproduction directory still exists; its input, solids and validation records equal the retained manifest. All three receipt log paths exist. Retained `clean-1.log` records eight passing geometry tests and `clean-2.log` records one passing artifact test. These are inspected author results, not tests rerun by this reviewer.

I read `room_fit.py`, all three `test_room_fit*.py` files, the equipment plan, layout, manifest, reproduction receipt and supporting report/decoder source. No GPU work, build, render or tests were executed. Review actions were read-only inspection, hashing and image decoding until writing this file. No source edit, commit, push, child agent, runtime change or PR58/PR48 action was made.

The equipment plan's full construction gate remains broader than this pass. Do not mark every equipment-family gate complete or use these views in place of subsequent material, integration, shipping-camera or release evidence. Relevant source or evidence changes invalidate this exact candidate verdict. Later administrative receipt changes require hash reconciliation, not automatic geometry recapture.

## Exact SHA-256 snapshot

Paths are relative to the repository root.

```text
dccb559a3949c57bce9488a59ad90c80ad2abe2ca8c68cb479af468965d20a6d  docs/design/passenger-vault-equipment-plan.md
d61cb8430e50224f0ecbdd6fe5c01f168289798f989f75ad12fcc3f065e5d954  docs/design/passenger-vault-layout.md
2691e93413aff1662545afcfc12b0af6954769966f53f8a19bf01fb7aea23b05  src/game/roguelike/authoredRoomTopologies.ts
029a456996061b42355bff6f15a8ce274b9dbbeced00ea76f41fc972b7e8d840  public/assets/passenger-vault/chamber.glb
9e8610aa0de331ad527c26a09752b439bf34935e4c9bb448e3de09138416c11b  public/assets/passenger-vault/row-carrier.glb
0343f70275beb9eeaafc04dcea3ece23a2acf469670d313e9e5b81609cff03b5  tools/assets/passenger-vault/room_fit.py
ab12fd9a58830896f3146e1487b9997779931abc21020df1a5a7b63f7ef59edd  tools/assets/passenger-vault/test_room_fit.py
c0c7cb25ad8f2df52869fdf724c8473d15ba95efc1bf8523de4473a89911a994  tools/assets/passenger-vault/test_room_fit_artifacts.py
224ea0314b3c5c09dbbc695d58a75632f8381527bd66be8b100b9bd33bdca147  tools/assets/passenger-vault/test_room_fit_reproducibility.py
ffdc418eeb9d1074ff48f874b46ac5dc81f7f12e38c2ce8559a9de9e74a8edfa  tools/assets/passenger-vault/test_reproducibility.py
c84119cf9db6d0bf7ea58f460471aa558d38bed720d0b5f26c10783c6fe1ad7b  tools/assets/passenger-vault/room-fit/manifest.json
139bd263e4ccda4ed9fd9f504d23f26505761bf8883b1ab42c808c90514c3c55  tools/assets/passenger-vault/room-fit/reproducibility.json
11c92fde93f88d322c1f5b86a16508dd370be2d3970a2fce5ab2760bb298c6c4  tools/assets/passenger-vault/room-fit/whole-room-top.png
5ec36d9f32a18af759e07f41bc7565acb3003da13785a0cac67e7fb5e3a85eb6  tools/assets/passenger-vault/room-fit/whole-room-oblique.png
```

Decoded RGBA SHA-256:

```text
f7fa8325cad306a30375bb1a43e3010c7b88259f34740e1a59e728b594418caa  whole-room-top.png
b41839f25b7be4e735ba328c8aa4f33d227f61f4f48bdf50950feac10ccf00b4  whole-room-oblique.png
```
