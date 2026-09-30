# Stage1 layout review

PASS for the top-down layout draft only. Guard confirmation remains pending. Parent and independent reviewer inspected the final PNG. No runtime source, model or gameplay acceptance is claimed.

The central solid scar divides two usable loops. Its closed silhouette and growth-bearing edge communicate the canonical objective, "Fight around the sealed breach.", and story, "Alien growth follows the boarding scar. Hull seal intact." The south freight apron supports the room's loading purpose without filling the route with crates. Entry from the freight hold and exit toward relay racks remain at their source coordinates.

The shell, scar, F1, entry, exit and four arrival anchors deliberately reuse current main geometry after fresh review, not inherited acceptance. F2 at x640, y740, width120, height50 is a proposed outbound pallet. No proposal has been applied to runtime. The 1200 by 880 template envelope remains unchanged.

## Actual verification

`python draw_layout.py` passed continuous planar route clearance, anchor access, disjoint solid footprints, negative controls and PNG decoding. North and south centerlines have minimum solid/boundary clearance of 66.163790 and 52.951356 world units. Both support radius38, and therefore radius16 and radius28, in this diagram. These are geometry checks, not shipping navigation, AI pursuit or combat tests. Independent recalculation and source-byte checks are in `independent-review.md`.

The final 1680 by 1270 PNG is labeled as a draft. Its footer is clear and all room extents are visible. The brute scale key slightly touches the shell outline, a nonblocking presentation defect outside the playable diagram. Preserve that limitation. The earlier `layout-footer-rejected.png` has a footer/scale overlap and is retained as a rejected presentation revision. It does not provide acceptance evidence.

This stage uses CPU drawing only. No GPU job, server or runtime writer was started. Before work, the designated branch was clean at 18df47b957598562b5cb091f59b0cd39337787e8 and freshly fetched main was 7a3f262886104fb024de9684958b3f85a8859f34, an ancestor. No competing writer or capture process targeted this worktree. Shared systems, other rooms, camera, HUD, CI and deployment remain untouched.

Next: publish exact image bytes and save receipt903. Only the guard may accept stage1 and permit stage2 rough models placed on the layout. Later stages must verify actual rendering and affected runtime movement. No phone/HUD art gate is introduced.
