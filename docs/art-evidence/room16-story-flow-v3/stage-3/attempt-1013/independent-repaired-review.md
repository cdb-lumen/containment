# Room16 stage3 repaired independent review

## Verdict

The prior skirt-winding defect is repaired. Stage3 art still fails the major-form and material gate. The room's central object reads as a manufactured three-way conveyor assembly more strongly than a charcoal biological manifold seizing a human hub. Correct shell orientation does not settle that visual requirement.

This is a bounded stage3 judgment, not a demand for next-stage model details. Missing HUD and mobile evidence are not rejection reasons.

## Evidence and scope

I read `independent-review.md`, inspected the repaired source and regression, and viewed both original repaired PNGs directly:

- `repaired/capture/16-swarm-junction-gameplay.png`
- `repaired/capture/16-swarm-junction-overview.png`

Both are 1280 by 900, show the intended room and staged actors, and are neither blank nor transitional. Their computed SHA256 hashes appear in the repaired capture manifest. All 92 entries in `repaired/capture-source-pins.json` match the current checkout. The source is the manifest's HEAD `8185b11b0a11e1d7916c5ea4e371edc5fec6bea3` plus dirty `src/render/SwarmJunction.ts` and `src/render/SwarmJunction.test.ts`, not that commit alone.

The manifest identifies controlled simulation with staged legal actors, an inactive encounter director and no DOM HUD. The gameplay view retains production camera/composition; the overview fits the room. These images are not ordinary campaign gameplay or live encounter acceptance. I read the previous rejection and the parent's concern before reviewing, so this was not a blind review. The verdict below follows the visible repaired images rather than inheriting either conclusion.

## Technical repair accepted

`src/render/SwarmJunction.ts:52` now emits the skirt triangles as `tri(q,r,q+side);tri(r,r+side,q+side);`. The top and bottom construction remains separate, followed by the existing global orientation correction. The material still uses default front-side rendering. There is no double-sided workaround.

I copied the supplied CPU checker into the new `independent-repaired-checks/` directory and ran that copy against the pinned checkout. It exited 0. Across all 12 crowned plates, the results contain zero inward side faces, incorrectly oriented top or bottom faces, degenerate triangles, non-manifold edges or inconsistent directed edges. The lowest interior top vertex-normal Y is 0.7038071155548096. The builder contains 81 source meshes and 6 materials.

The new regression checks opposite directed incidence on every plate, rejects a deliberately inverted triangle, checks nondegenerate faces and checks top-face orientation. This directly addresses the earlier gap in the top-only and undirected-edge checks. Independently rerunning `./node_modules/.bin/vitest run src/render/SwarmJunction.test.ts` exited 0 with all 12 tests passing.

The standalone checker does not include `inwardSides` in its exit-code condition. I inspected the actual reported inward-side counts as well as the exit code; all are zero. This does not block acceptance of the repair.

## Art findings

The directional structure is clear. Two long branches converge on the dark central recess, and the short southern branch stops above the player. Both views preserve a large open southern floor. The overview shows space behind the object and the retained broken directional gantry. The central hub remains dark rather than becoming a luminous boss-like focal point.

The charcoal plates have visible curved highlights. Pale cross-bands, muted pink-brown backing and blue-grey hub metal are distinguishable. The rear wall's framed dark bays also read as human construction. Those strengths should survive the next revision.

The blocking issue is the construction of the main mass. In the gameplay image, the long branches have straight, continuous pink-brown sidewalls and repeated pale transverse bands. The dark crowns sit inside that regular strip pattern, so their curvature reads more like padded conveyor sections than layered growth. The short southern branch reads as a small stair or belt. In the overview, the same repeated construction and paired diagonal arms dominate the silhouette.

The broad exposed pink-brown triangular bed joins these arms into a clean platform. The blue-grey hub sits neatly on that platform, with dark shoulder pieces arranged alongside it. I can see a hub and three attached branches, but not a convincing major-form transition in which biological mass wraps, presses into or captures retained machinery. Small visible conduit ends inside the recess do not change that reading. The charcoal material is present, but the regular pale striping and planar backing govern the object's identity.

This failure belongs to the current shell stage. It needs broad changes in overlap, taper and the transition into the hub, within the sealed collision footprint and height contract. Break the continuous planar sidewall/platform reading and the uniform belt segmentation while keeping the three directions legible. Do not substitute tiny scratches, nodules or additional conduit detail for that work. No camera or HUD change is needed to explain this rejection.

## Retained verification and limits

New review-only files are in `independent-repaired-checks/`: the copied geometry checker, its JSON result, `geometry.log`, `focused.log`, `pin-verification.json` and `image-verification.json`. The original checks, results and PNGs remain untouched.

I made no runtime changes, launched no GPU or capture process, and made no commit or publication. Git status before and after retained only the two existing SwarmJunction modifications. The parent's full test, build, room-evidence and capture results were not rerun here and are not represented as independent checks. No execution blocker occurred.

Disposition: close the winding defect, retain the art rejection, and review a revised major-form candidate before advancing on the strength of this stage3 shell.
