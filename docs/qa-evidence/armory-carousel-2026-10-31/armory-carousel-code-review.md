# Armory carousel prototype — independent code review

Reviewed the uncommitted prototype in `/workspace/containment-armory-carousel`, without edits or renderer launch. Independently ran the three Armory suites: **19 tests pass**. The new topology/model is a substantive implementation of the original brief, not a renamed four-island rack layout. One mechanical blocker remains before visual qualification.

## P2: armor shoulder assembly is detached from its hinge

`src/render/ArmoryCarousel.ts:54–59`: in each hanger's local frame, the hinge spans z[-0.47,-0.23], while the shoulder bar spans z[-0.18,-0.06]. The support post ends at z=-0.32. Thus a 0.05 render-unit gap separates shoulder/armor from hinge/post. The armor connects to the shoulder, but neither connects back to the support. Common station rotation preserves this gap. Extend a pivot/link or shoulder support into the hinge and test local component contact/clearance, rather than relying on the assembly's overall AABB or part names.

## Non-blocking ownership/test gap

The extracted rifle helper's `profile()` creates fresh ExtrudeGeometry without `userData.environmentUV`. `DepthRenderer.bakeWorld` explicitly disposes original geometry only with that ownership flag before removing source meshes. The carousel adds seven rifles with five such profile geometries apiece. This repeats the legacy helper pattern; it is not evidence of an accumulating GPU leak, since the geometries normally have not been uploaded and may become GC-eligible. Nevertheless, mark owned profiles consistently for retirement and test append→bake→dispose events. Current tests invoke disposal but do not assert newly owned material/geometry disposal or shared MAT survival.

## Contracts that look sound

The layout module defines one 240-degree annular counter (radii210/300, center600/450, angles150..390) and a separate 48-sided radius80 carousel. The south mouth is open; the inner ring is ordinary floor. Existing solid-polygon topology semantics block only those sealed shapes. The 1200×880 bounds, spawn/exit and four breach anchors are retained. Direct inspection shows no shared movement/projectile/encounter/reward changes and no other-room topology entry changes.

Production traversal tests exercise mouth, a complete inner loop and outer retreat for radii16/28/38, with negative counter/spindle crossings and positive/negative shot controls. Their intended 145-radius inner path has margin between carousel and counter; segment checks are stronger than endpoint occupancy alone. This does not yet prove navigation decisions during a live elite encounter.

The model's counter slab and carousel foot use the exact collision polygons. Existing vertex checks pass before and after actual material batching. The spindle meets the deck, spokes connect spindle/collars to clamps, and the actual worktop cutout exposes a recessed vise well. The carousel has angularly distinct fixed-scale rifles and an open south sector, with a ray test exposing the spindle. The legacy rifle extraction preserves part geometry, materials and legacy placement transforms by inspection; legacy rifle readability/assembly tests still pass.

Four new materials are explicitly actor-owned and therefore handled by disposeModel; rifle MAT materials remain shared. No global lighting mutation occurs. The model bakes within the asserted twelve meshes. The taller central spindle is an intentional new silhouette, so old low-rack visual evidence cannot qualify its framing or occlusion.

## Before qualifying this candidate

Resolve the hanger gap; retain a regression that would fail on this prototype. Complete whole-suite topology snapshot updates only for the deliberately changed Armory entry, with an independent nineteen-other-template fidelity check. Add explicit ownership/disposal checks and useful mechanical join checks. Vertex containment is useful but is not a blanket proof that all triangle interiors agree with a concave collision reservation; the exact slab construction supports the main solids, while future spanning parts need surface/edge checks.

Obtain native same-camera baseline/candidate views including the mouth, carousel front and inner aisle, plus labelled overview. Judge whether spindle/gears/radial clamps and counter read coherently as the required carousel/horseshoe; passing names/ray tests cannot establish that. Then verify real elite combat, mouth/outer-route use, reward selection/onward, actor movement legality, source provenance and desktop controls/visibility. Existing four-island encounter evidence remains historical, and the new layout cannot inherit its gameplay qualification automatically.

This report grants no human art approval, full encounter acceptance or release readiness. Parent is running broader verification; no successful result is inferred before it finishes.

## Corrected prototype re-review

The original P2 is resolved. A new `hanger-pivot-link` spans local z[-0.395,-0.045] and overlaps both hinge and shoulders, completing the supported chain. The added local-frame test checks post→hinge→link→shoulders→armor, avoiding misleading rotated world-AABB overlap. Original finding remains above as history.

Owned rifle profile geometry now sets `environmentUV=true`; bake retires those fresh profiles. The added lifecycle test observes source geometry, baked geometry and material disposal, while cached boxes/shared materials survive. One optional test-strengthening point remains: expected source disposal is currently conditional on the same flag, so removing the profile ownership flag would not fail that lifecycle assertion. Explicitly assert ownership and retirement of named stock/receiver/handguard/magazine/grip profiles to prevent recurrence. The code correction itself is present and sound.

Independently ran the four combined Armory/topology suites: **27 tests pass**. Loaded actual ROOM_TEMPLATES via CPU-only Vite SSR from main57 baseline and corrected prototype: the only differing template is `armory`; all nineteen others are identical. Parsed both regenerated snapshot exports and compared their serialized values: only array item4 (`id: armory`) changes. The large snapshot diff comes from the two new polygon arrays, not changes to unrelated rooms.

The authoredTopology update retains all original five room probes and boundary checks, adds Armory's center-solid probe, and checks x=-1 outside its intentionally rectangular boundary. This is a legitimate distinct boundary condition, not a weakened old-room assertion. No remaining blocking code finding in this corrected prototype. Full verification and native visual/gameplay qualification remain pending and are not inferred from the focused result.

Final ownership assertion inspected at committed candidate `493640dded2d1fb3b48af7df035c9434179f1db9`: the test identifies exactly35 named rifle profiles and requires each geometry's `environmentUV` flag before checking retirement. This closes the optional regression-strength gap above. Parent reports full1107 tests plus one skip/assets/evidence/build passing; no native art or encounter acceptance is implied.
