# Armory detail correction — independent code review

No blocking code finding at `07d04f3f8edb09eb5f358f545d0df67e2080fd6f` for the reviewed model/test delta fromfc97. Independently ran Armory layout/model/legacy suites: **22 tests pass**.

The broad worktop now uses graphite while existing pale serial accents remain separate. This is scoped material assignment, without global lighting changes or new materials.

Gear teeth move from the buried band to y1.02..1.20, exactly supported on the foot top at1.02. Their radial/tangential corners remain within the48-gon reservation; existing pre/post-bake vertex containment tests pass. Teeth now stand outside the bearing/deck radii rather than being hidden inside the solid foot. The new24-tooth vertical first-hit regression tests actual occlusion and would fail the previous buried geometry; parent preserved red proof in `/workspace/armory-gear-red.log`. This establishes exposure from above, not adequate native pixel prominence by itself.

Both hanger groups now face world south. Their internal post→hinge→link→shoulders→armor connections remain unchanged, and the existing local chain test remains. An added elevated-front ray reaches each chest, and containment still passes after the rotation. The actual silhouette/recognition improvement needs new native images; geometric exposure alone cannot prove armor readability.

Fixed-scale rifles, topology, mouth/inner/outer clearance, material ownership and retirement tests are retained. The original pale-worktop/unreadable-payload/buried-gear visual findings remain documented in `/workspace/armory-carousel-independent-visual-review.md`; this code review confirms plausible corrections but does not close their visual qualification. The source also integrates the separate HUD stack; no new native or full encounter result is inferred here.

No renderer or shipping-source changes performed. Full suite and matched corrected native/full elite encounter remain separate gates.
