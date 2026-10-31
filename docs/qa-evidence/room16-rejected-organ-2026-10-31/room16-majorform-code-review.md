# Room16 revised major form — independent code review

No blocking collision/resource finding in the reviewed uncommitted delta against91f60c in `/workspace/containment-room16-review`. Independently ran the dedicated SwarmJunction suite:14 tests pass. Visual acceptance remains unresolved; this review cannot establish that the manufactured-Y reading or indistinct human hub has been corrected.

## Geometry and ownership

The only changed files are SwarmJunction.ts and its material expectation test. No layout, sealed polygon, route, actor collision, projectile, camera or other-room changes occur. The full reservation at30.4(.95m) and31, closed underbody rings, caps and winding are unchanged. Broadened crown interpolation remains within its supplied safe quad: along remains between.006 and.996, and across remains between.006 and.994 for the sampled domain. The increased lip warp and enlarged cabinet pass existing all-solid-vertex containment and sampled occupancy checks before/after production bake. Existing shot-plane, route, maximum height44.8 and bake≤7-material checks remain.

The bed now uses the existing dark recess material; the one changed test intentionally follows that material assignment and does not remove geometry assertions. All newly added cabinet parts pass through the owned-geometry add helper; their materials are existing room-owned instances. Existing repeated-visit disposal tests still verify source/baked geometry and owned material retirement with shared material survival.

The enlarged main housing x615..640,y229..271 joins the front component x611..640,y269..276. Terminal sockets start at the front face y276, and their cores overlap them. Vents start on the housing's x640 side face. The torn lid overlaps the housing near its rear/top region. Parts remain supported rather than floating outside the organ reservation.

## Meaningful remaining test/detail gaps

- Add explicit cabinet mechanical contact tests in the part coordinate system: housing→front component, front→each socket→core, side→vents and housing→lid. Existing containment alone would allow disconnected parts inside the large organ.
- The parts named `distributor-lid-fastener` are positioned at y233..235, whereas the torn lid polygon ends at y231. They rest on the housing top at42.5, not on that lid. This is not a floating-geometry defect, but their name/comment overstates a bolted-lid relationship. If they are meant to secure the torn lid, move them to actual lid material with a surface/contact regression; otherwise identify them honestly as housing fasteners.
- Add native-direction first-hit rays to exposed cabinet faces/terminal bank and lid, so broadened shells cannot entirely hide the identifying human features while containment tests still pass. This checks exposure, not recognition; actual native images still decide whether it reads as a distinct human distributor being consumed.

The candidate only broadens existing crown patches, darkens the bed and enlarges cabinet detail; it still retains the same exact Y reservation. Such a bounded approach may preserve gameplay correctly while still failing the original major-form requirement. Do not accept it from tests or renamed materials. Preserve the prior rejected91f60c comparison and obtain new source-stable matched native/overview pixels before qualifying the visual revision.

No runtime edits or renderer launch performed. No full encounter, human art approval or release acceptance inferred.

Follow-up at `d5ad5fd3de9ecea45251b9f569bcd6f8b3ffbdbe`: inspected the new cabinet chain regression and native-direction first-hit rays. The test asserts housing/front/lid, all three socket/core pairs, vents and housing fasteners remain connected, and reaches exposed housing/lid through the full model. Housing fasteners are honestly renamed and the comment no longer claims a bolted lid. This closes the identified mechanical naming and useful exposure/contact coverage gaps. The polygonal lid contact is checked by AABB, so that assertion alone is not a general exact polygon-contact proof, but the current lid/housing geometry genuinely overlaps as reviewed. Parent reports15 focused tests passing. Visual identity remains unqualified until new pixels are inspected; no renderer launched here.
