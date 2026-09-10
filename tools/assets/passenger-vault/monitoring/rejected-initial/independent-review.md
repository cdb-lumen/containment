# Independent monitoring construction review

## Verdict

FAIL for construction-only acceptance of MN/MS at the snapshot below. Footprints, counts, basic enclosure and independently authored lower south variant pass. Three bounded construction must-fixes remain: resolve coincident exterior faces producing black rear-edge strips, seat the display on actual support, and demonstrate west-side service reach. Do not start materials on the assumption that this report accepts geometry.

No material, operating graphics, runtime, shipping-camera, performance, release or merge acceptance is granted. Blank neutral displays are appropriate for this gate. No touch interaction is requested.

## Scope and execution

Read the equipment plan, accepted story review, layout specification and final independent layout PASS, monitoring builder, all four available test_monitor scripts, distribution helper implementation, manifest, README, reproduction receipt and relevant build/test/failure log records. The story and layout approvals are authority for this bounded review, not newly revalidated gates.

I independently ran the CPU artifact test and Blender 4.0.2 imported-geometry test with PYTHONDONTWRITEBYTECODE=1, factory startup and python-exit-code 1. Both exited zero. The artifact suite ran one test. Both imported variants passed the author's validator and all sixteen supplied destructive mutations were rejected. I also ran read-only imported-BVH probes and an additional in-memory mutation. No renderer, GPU job, export, commit or remote write was run. Only this review file was written.

## Must-fixes

### R1. Remove coincident exterior faces at rear joints

The black vertical strips are visible in both closed PNGs and at the upper rear joint in both cutaways. They are not demonstrated holes. Actual imported rays hit two surfaces at the same exterior position:

- North lower stripe: ray origin `1.83,-2,0.5`, direction `0,1,0`, hits both side_south and back_wall at `1.830000043,-1.25,0.5`.
- North upper stripe: origin `1.66,-2,1.10`, direction `0,1,0`, hits instrument_cheek_south at y `-1.129999876` and rear_service_cover at y `-1.129999995`.

The source explains these overlaps. monitoring.py:32-33 extends the side and back boxes through one another, including their coplanar outer faces. Lines 38 and 42-43 repeat this at the cover/cheek joint. The lower overlap occupies x approximately `1.795..1.875`; the upper occupies x approximately `1.62..1.70`. These intervals coincide with the visible strips.

This is geometry-induced rendering ambiguity, not evidence of an open rear passage and not a missing final material. A separate render isolation was not run, so the precise renderer mechanism is not claimed as experimentally isolated. Nevertheless, duplicate exposed faces are directly proven. Form closed mating joints without duplicate exterior patches, then regenerate the same neutral evidence. Add imported joint/contact checks that reject a separation fault as well as accidental overlapping outer patches. Do not hide the problem with a dark material or lighting change.

### R2. Support the display and cover the missing contact test

monitoring.py:44-45 puts bezel top at slope z + .012 and display bottom at slope z + .013. The display therefore floats 1 mm above the bezel across its footprint. Imported opposed rays at x .4, y 0 measured bezel top `1.133489370` and display underside `1.134489298`. No support, gasket or adhesive layer fills that gap in the delivered geometry.

Seat the display directly or model a credible supporting layer. This is a small geometric correction, not a demand for fabricated electronics detail. The existing first-hit display tests prove exposure, not contact. Add an opposed-ray support check and a displaced-display fault that remains visible but loses contact.

The same coverage issue affects internal packs. Moving north electronics_pack_0 upward by .1 m in memory still returned success from validate. This was my independent fault injection, not an author's logged result. The unmodified packs visibly sit on their trays; I am not reporting an existing 100 mm pack gap. Add pack/tray contact coverage so that this destructive fault fails. Inventory-only rejection of a removed bulkhead does not substitute for support geometry testing.

### R3. Close the construction-stage west service-reach gap

The west panels, exposed latches and clear approach are correctly oriented. The display has only about 3.895 degrees of west-facing tilt and occupies local x `-.46..1.30`, while the west worktop edge is x `-1.875`. Its near edge is 1.415 m behind that edge and its far edge is 3.175 m behind it. From the fixed operator centre at game x1000, its nearest point is 2.665 m eastward. These are computed dimensions, not a human-reach standard.

The spec explicitly requires service reach at the construction gate, equipment-plan lines 36 and 56. The README line 68 instead defers service ergonomics at actor scale. No scale proxy, service position proof or credible retract/remove-within-solid access sequence establishes how this broad display and deep instrument bed can be maintained from the west. A display can be read without touching it, and the plan explicitly disallows touch interaction. That does not establish maintenance access.

Provide a dimensioned source-only west service view against the 2.05 m reference and demonstrate an actual reachable service arrangement or inward retraction/removal path. Move/reconfigure the working assembly if necessary while keeping both accepted footprints and operator centres unchanged. Do not invent a control interaction, swing a panel into the aisle, or defer this fit requirement to shipping-camera review.

## What passes

- Exactly two exports, MN and MS. The manifest's imported placements match MN `1040..1160,240..320` and MS `1040..1160,560..640`. Each has 22 named meshes and 264 triangles. Artifact validation independently decodes GLB binary positions, indices and translations rather than trusting accessor min/max values.
- North height is approximately 1.21 m and south .96 m, below their 1.25/1 m caps. Source builds shorter walls, bulkhead and electronics packs for south. Plate gauges, plinth thickness and display dimensions remain unchanged; imported node scales are unit scales. This is not a runtime vertical squash.
- Closed views show enclosed bases and full deck plinths. Cutaways show supported trays and internal partitions. The missing worktop and near panels are explicitly hidden for diagnosis, not missing shipping parts. Imported manifold/volume and sampled plinth, wall, worktop and front-panel checks pass. Apart from the measured display gap above, I found no demonstrated unsupported fitting in the unmodified pair.
- Room pixels show the four accepted rows, north/south distribution and precisely two east consoles without added loose blockers, raised service pipes or extra routes. Both console envelopes are contained within existing solids. The builder does not edit runtime topology or collision. Its route receipt comes from the accepted room-fit validator before consoles are added; that receipt alone is not a new production route test. Footprint containment and the unchanged layout provide the bounded construction justification here.
- No original-geometry provenance problem was found in monitoring.py. Console geometry is generated directly using generic accepted helpers, not imported historical console assets. Neutral materials contain no external textures or animations.

## Reproducibility and evidence integrity

The clean-root script copies explicit dependencies and invokes the copied builder with an absolute script path and explicit output-root. It does not rerun earlier family writers. The author logs record all three clean-root commands exiting zero. I did not rerun image generation.

I independently read the existing `/tmp/passenger-monitor-clean-jhrfe9xw` results. Both generated monitor GLBs and all four accepted input GLBs match current bytes. All five decoded PNGs match both the clean-root images and receipt hashes. The copied monitoring.py, distribution.py, room_fit.py, geometry test and artifact test match current sources. Thus the existing reproduction is corroborated beyond the author's logs. Blend byte identity is correctly not claimed.

The initial missing-pair red log and inventory rejection in enclosure-red.log do not establish geometric hole-detection coverage. The useful fault checks are the actual imported mutations rerun above. The additional escaped support fault limits their completeness.

## Snapshot and concurrent author changes

The builder, three initially available monitor tests, README, manifest and all five PNG hashes were unchanged between my initial and final hash calls. test_monitor_provenance.py appeared during review. I read it but did not execute it because it writes provenance.json. That receipt was still absent when read; README references to it were ahead of the available artifact at that point. This is a concurrent packaging addition, not evidence of geometry drift. Parent must reconcile final packaging and rerun changed tests after construction fixes.

SHA-256 snapshot:

| File | SHA-256 |
|---|---|
| monitoring.py | 5b49327c46b159881537789b79c9f590ca1c44f9551d0676c7be4109e797f991 |
| test_monitor_geometry.py | 508a8d85068022e3c5c743d1a4dc9485d0e9e95508c28ba2a8cdedb797887f31 |
| test_monitor_artifacts.py | f9c5f32cb428d575a3c1ec54d2580c7703bf5db238c7924ebbf72f8f4a3555a5 |
| test_monitor_reproducibility.py | 16abb0f152a65d045589a7c6be450ded9c046a6ff46b1da4ce41ed5493aa12f7 |
| test_monitor_provenance.py, added during review | 6644a04bceb3a7526ef6225444b991ec7b7f588becf79c48d28bcd3cf5ee9742 |
| monitoring/README.md | 27f91ecc161791d0ab34c6393bde052beb8b9d2aa3001d375c830ebc6c48cb56 |
| monitoring/manifest.json | 47443248fef97072e231a0efea04750144463b2a7ce5977d6a6bf106a6631be7 |
| public/assets/passenger-vault/monitor-north.glb | 3a08688f5746411456c49c9d47ed608ae8bf83727c3955bc8f686073d3f2c76e |
| public/assets/passenger-vault/monitor-south.glb | 6eac89315d97639087d0fcf6cbe21a5c596ac35eb7ecfd84fb4ba3e0d04bb546 |

## All images reviewed

Each original below was loaded and inspected individually with vision at 1200 by 800. Paths are repository-relative to `/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout`.

| Image path | SHA-256 |
|---|---|
| tools/assets/passenger-vault/monitoring/north-closed.png | b90fd4aac385b0255af4763bcabc07d3e0a40d6edf52f82a421eb0198059c95c |
| tools/assets/passenger-vault/monitoring/north-cutaway.png | 4d2a05e3d280489f5da3d4dc39eaa53e59fa5523825febafec3ba7307e7a0001 |
| tools/assets/passenger-vault/monitoring/south-closed.png | c99385684e7f5afb4aff306bd7a05e8e5f4b970efa04aeadb1d5a3c9cdaada56 |
| tools/assets/passenger-vault/monitoring/south-cutaway.png | e61dba1119fb7114e6c0fe22832bd14974aa93d302df344a706c3ebc75b3c43e |
| tools/assets/passenger-vault/monitoring/room-placement.png | dfbc5407af03f56c1b865f2876e7b2bb5fd38c80187ff0f0a46576cc39324394 |

These are source-only orthographic construction images. Their review does not accept finished materials, live-state legibility, shipping desktop/portrait camera evidence or runtime behavior.
