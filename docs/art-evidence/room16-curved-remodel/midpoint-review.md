# Organic shell midpoint refinement independent review

No blocking code finding in the uncommitted helper/test delta inspected in `/workspace/containment-room16-remodel`, 2026-10-31. This addresses a demonstrable heightfield sampling defect, not Room16 art acceptance.

The old centroid-only refinement left every original triangulation edge unsplit. An interior diagonal whose endpoints both had boundary height could therefore remain low along its entire length even where the requested height function was high. The new square/domed-height ray regression directly tests this behavior at the center and quarter-diagonal points, rather than checking implementation vertex counts. Its expected surface heights derive from the specified height function. It is a meaningful regression, not relaxation of acceptance.

The new refinement creates one midpoint per unordered edge per level, reuses it in both adjacent triangles, and replaces each triangle with four contained triangles. It also refines the boundary with those same midpoint IDs before constructing walls. Thus top/bottom and side edges conform, without introducing the boundary T-junction that an interior-only fix would create. Final winding is still established separately for upper/lower faces; contour orientation still controls outward side winding. Refinement preserves the original planar footprint and positive height validation. It does not introduce radial contraction across concave bays.

Existing clockwise/counterclockwise concave-U, notch ray, positive volume and directed-edge manifold tests remain. The actual 132-point contour with varying heights is still checked for nondegenerate faces, exactly two opposite uses per indexed edge and positive volume. Current dedicated model tests retain containment, exposure, shot-plane and resource controls. Independent command:

```sh
npx vitest run src/render/organicShell.test.ts src/render/SwarmJunction.test.ts
```

Result: **23 tests passed in two files**, exit0; `/workspace/organic-shell-midpoint-independent-tests.log`.

Limits: three uniform subdivisions remain a finite piecewise-linear approximation, not exact arbitrary height reconstruction. Original skinny triangle aspect ratios can remain skinny under midpoint refinement. The helper still relies on its documented simple-contour precondition. Upper/lower face count grows from 27 to64 subdivisions per original face, plus boundary walls growing eightfold: actual 132-point body has 18,752 triangles (130×64×2 +132×8×2), versus prior7,284. This is bounded but should be included in native/static geometry/performance accounting; tests do not prove frame-time impact. Owned geometry/disposal flags and material usage are unchanged.

Fresh native pixels must determine whether triangular streaks are eliminated; the repaired sampler does not resolve by inference the separate molded-Y, cut-end and human-cabinet findings. Source5f13eac visual rejection, published evidence1d603b7 and `/workspace/room16-curved-visual-review.md` remain unchanged and failed. No GPU renderer or runtime edits by reviewer.
