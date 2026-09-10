# Final independent monitoring construction review

## Verdict

FAIL for construction-only acceptance of this snapshot. R1 and R2 are resolved by changed geometry and effective imported tests. R3's display reach and scale evidence are resolved, but actual access through the closed service faces remains unproven. One bounded must-fix remains below.

This is not a material, runtime, shipping-camera or release review. Story and layout approvals remain unchanged. No touch mechanic is requested. No render, GPU job, export, source edit, commit or push was performed. Only this report was written.

## Independent verification

I read the initial FAIL, current monitoring.py, monitor_contract.py, all four monitor test scripts, manifest, reproduction receipt, and both the initial and updated README during this review. I inspected each of the five actual final PNGs individually at 1200 by 800. There are exactly five top-level monitoring PNGs. No additional monitoring service-reach PNG was found; the service references are in the two cutaways.

Executed from the stated passenger-story-layout worktree with PYTHONDONTWRITEBYTECODE=1:

- CPU test_monitor_artifacts.py passed its one test, including artifact byte hashes and decoded GLB vertex bounds.
- Blender 4.0.2, factory startup, two CPU threads, python-exit-code 1, ran test_monitor_geometry.py successfully. Both positive imports passed. All 30 supplied destructive cases were rejected.
- A separate read-only Blender import probe confirmed 22 distinct mesh datablocks per export, actual display/pack/panel/bulkhead bounds, and independently mutated the opposite-side lower and upper joints by 20 mm. All four additional mutations were rejected on joint overlap.

The test uses world-space imported vertices and BVHs. Names select parts; the important new contact assertions measure actual surfaces. Geometry helper imports are ordinary aliases to distribution.vertices, bounds, tree and load, not stand-ins for expected values. The mesh-datablock probe found no shared-data alias concealing the faults. The package test alias appends the CPU artifact suite only; npm test does not imply execution of Blender contact tests. I ran those separately.

## R1 resolved

The lower side ends now meet the back wall rather than sharing an exposed rectangular patch. The upper cheeks similarly meet the relocated rear cover. monitor_contract.py checks four butt joints with opposed end rays and single exterior ownership on both sides. The 80 mm overlaps and 10 mm separations fail on measured joint differences in both variants. My opposite-side overlap probes also fail.

Both closed PNGs have clean rear side joints without the original vertical black strips. The cutaways corroborate the changed joints. This is a geometry repair, not a lighting or material concealment.

## R2 resolved

The display bottom now contacts the bezel top, and the bezel bottom contacts the instrument bed. Eighteen opposed-ray contact samples per variant cover those two interfaces. Four pack/tray samples cover the support omission identified in the initial review.

The actual rerun rejects the visible-but-raised display on a 0.001000 m support gap and the raised pack on an approximately 0.100000 m support gap in both variants. These failures do not rely on inventory or display burial. The cutaways show seated packs. Closed views show the installed display rather than a hovering sheet.

## R3 partially resolved; remaining must-fix

The working assembly really moved west. Imported display x bounds are -1.75 to approximately -1.15 m, and pack x bounds are approximately -1.65 to -1.15 m. The far edge is 0.725 m behind the west cabinet boundary, not the original multi-metre reach across the deep worktop. The shallow display remains broad across the face. Both cutaways contain an actual 2.05 m proxy and a dimension line, with the omitted display shown separately in the closed views. This satisfies the scale-view and display-position portions of R3. It does not imply touching the operating display during gameplay.

The remaining problem is access to the packs through the closed panels. monitor_contract.py lines 44-53 describes a service panel lifted inward, but the test simply excludes that panel, latch and seam from its ray hits. It tests access after disappearance, not a reachable maintenance arrangement with the delivered closure.

The actual imported north service_panel_0 occupies x approximately -1.85..-1.77, y -1.21..0 and z .12...93 m. The central bulkhead occupies x -1.80..1.80, y -.04...04 and the same height. These are closed box volumes, overlapping by 30 mm in x and 40 mm in y at the panel's inner edge. South repeats the joint at its lower height. The corresponding panel also meets the side enclosure. A straight inward lift/translation is therefore not established by the delivered geometry; the starting panel already intersects the bulkhead. The source-only cutaways hide additional top and side parts and cannot prove such a path.

Must-fix: provide a credible service-face opening/removal arrangement for the relocated packs, with mating panel clearances and a bounded collision/access check on the actual imported geometry. A simple removable or inward-stowed construction arrangement is enough. Do not add gameplay controls, change the accepted footprints or fixed operator centres, or swing a door into the aisle. No manufacturing-detail model or animated interaction is required. Preserve the successfully repaired display reach and support. Show that the intended opening state can actually be reached, rather than only omitting blockers from the test.

The updated README correctly says the diagnostic does not simulate a panel-removal sequence. That makes its evidence limitation clear, but wording alone cannot complete this remaining construction requirement. The 0.75 m depth threshold is a bounded design check, not an anthropometric certification.

## Footprints, lower south variant and room view

Both exact public GLBs pass independent binary position checks and imported envelope checks. Each contains 22 named closed meshes and 264 triangles, without a scale proxy, textures or animation. Local footprint is 3.75 by 2.5 m. At the builder's reviewed placements and 32 units per metre, MN fits x1040..1160,y240..320 and MS fits x1040..1160,y560..640. Imported heights are 1.210000038 m and 0.959999979 m, below the respective 1.25 m and 1.00 m caps.

South uses shorter walls, bulkhead and a .22 m pack rather than north's .36 m pack. Imported scales are unit scales. Plate gauges and plinth remain unchanged. It is not a runtime vertical squash.

The room PNG shows exactly the two consoles at the east side, four accepted carrier rows and north/south distribution. No extra loose console blocker or new service route is visible. The builder confines the exports to existing solids and does not write runtime topology. Its pre-console route receipt is not represented here as a new runtime route test.

## Fault coverage limits

The useful repair mutations fail for the intended reasons: joint separation/overlap, display support, pack support and excessive pack reach. Missing bulkhead and duplicate-list mutations still fail inventory; floating base and scale mismatch fail envelope. Those results are not described as hole or contact tests. The supplied inaccessible-pack mutation remains supported but exceeds the reach threshold, which is a real improvement. There is no corresponding regression proving panel opening clearance or rejecting an obstructed opening sequence. That missing coverage matches the remaining R3 finding.

## Reproduction and concurrent changes

I read the explicit-dependency clean-root script and the receipt for /tmp/passenger-monitor-clean-m_ygzp4e. The receipt's two monitor hashes match the reviewed exports. The script copies monitor_contract.py and the relevant tests, uses the copied builder's absolute path and an explicit output root, and compares GLB bytes and decoded PNG pixels. I did not run reproduction or render jobs; parent owns the separate clean-root reproduction. Existing receipts are not a claim of my independent rerender.

The author changed README.md during review, from SHA-256 27f91ecc161791d0ab34c6393bde052beb8b9d2aa3001d375c830ebc6c48cb56 to f9585661553e54daa7ba38ecba33d12520290c8b0c28100d42cfabff89d44733. I reread all of the replacement README. It corrects stale initial-package sizes, counts and reproduction references. Builder, contract, four test scripts, manifest, reproduction/provenance receipts, both GLBs and all five PNGs matched their opening hashes at the closing snapshot call. Parent must reconcile any subsequent author changes; this verdict applies to these exact bytes.

## SHA-256 snapshot

Paths below are relative to tools/assets/passenger-vault unless explicitly prefixed public/.

| File | SHA-256 |
|---|---|
| monitoring.py | 4f557f999125a28e946215ab03e54ba841438b06d09edae69ab2d3f2c94f11bc |
| monitor_contract.py | ae8057c0cff621ca86f3f3c748e608223c87ad04345763be21184d20ed314e0b |
| test_monitor_geometry.py | 63094b999747613869dd25f7e0eca5a17709605a87c5c541599181ef631acf80 |
| test_monitor_artifacts.py | f9c5f32cb428d575a3c1ec54d2580c7703bf5db238c7924ebbf72f8f4a3555a5 |
| test_monitor_reproducibility.py | 37fd378e0ab45b90bb62aed78195d29e65212a0de847c1d5b4bb9bb3690659a8 |
| test_monitor_provenance.py | c967a96d35f3da6bb18b4227051202ea228340ee6194dffd159aa1228990d920 |
| monitoring/README.md | f9585661553e54daa7ba38ecba33d12520290c8b0c28100d42cfabff89d44733 |
| monitoring/manifest.json | a4b61b1c2f396695417a2fda16431cb6c8eaa638e4a0cf1c09edac200049c664 |
| monitoring/reproducibility.json | 22c626cfbb47ebc679ec8ddb1a5209acaa7ea1b61a0de22f6f3728d9d67d85f4 |
| monitoring/provenance.json | a27b43f86f44968e1e9085124ab490227c293cce44e416cdaf5892e334d1da48 |
| public/assets/passenger-vault/monitor-north.glb | fd190e6b37bb85fd93430fbe467bab0b87666891a136bd362bcc54fb75a97c2a |
| public/assets/passenger-vault/monitor-south.glb | 825d7808c751c29a5891707e25b250b34856f8adfe8f169217eb026e88259b83 |

## Actual images inspected

All paths below are repository-relative. Each original image was loaded individually, not inferred from a filename or manifest.

| Image | SHA-256 |
|---|---|
| tools/assets/passenger-vault/monitoring/north-closed.png | dae48315e04e246f5bb9c2343232045efdbf5598f0d8b57600b06a7790becc69 |
| tools/assets/passenger-vault/monitoring/north-cutaway.png | 6848adf1970c76b69f1df2f0ff85d11ed37659b013f7ed6bbc5e73b33fb47c07 |
| tools/assets/passenger-vault/monitoring/south-closed.png | ddd5714a009fc70659cc1904502f71a288fe9545e8ba97845f6675e9decc9065 |
| tools/assets/passenger-vault/monitoring/south-cutaway.png | 23d87f136adece245cf35f76166a55eff2338911260a336663f2c772af0c06f3 |
| tools/assets/passenger-vault/monitoring/room-placement.png | 2f48a4a8b6cc96101186f671cb25e5b50b58e7a8df123b655e62f2d1b0cea537 |
