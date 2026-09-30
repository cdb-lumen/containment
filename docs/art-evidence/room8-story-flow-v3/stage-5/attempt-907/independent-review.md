# Room8 stage 5 independent review

Verdict: failed. Return the central boarding-scar assembly to stage 4 for model repair. Preserve the layout, hull seal, freight, room shell and route evidence. This is an art finding, not a gameplay failure or publication decision.

## Evidence

I inspected both original PNGs with vision_analyze: overview.png and desktop-in-scene.png. Both show the intended room and a loaded static scene. Their SHA-256 hashes match capture-result.json. The manifest identifies source 98ee1f9f88041beba6c92428b996ce9e315b701d. Its renderer and topology hashes match the current files. I read capture.mjs, the production contract, canonical story, Room8 builder, topology and three focused test files. I did not use earlier review verdicts.

The capture is a simulation-paused checkpoint with a legally staged player. The desktop uses the shipping camera; the overview uses a capture-only fitted camera. Neither proves live combat or traversal. HUD and mobile are outside this gate.

## Findings

1. The central silhouette still reads primarily as a regular ribbed pod on a metal mounting plate. In both images, the smooth tapered green body and repeated pale transverse bands dominate. Small differences in band length do not break that overall manufactured rhythm at the retained desktop scale. The low colonies along the near seam are visible, but secondary. The image communicates a large alien object more clearly than growth following a damaged boarding scar. Repair the dominant body and rib rhythm within the current footprint. Make the growth's attachment to the scar readable without relying on the objective or wall sign.

2. The damage border reads as repeated triangular teeth. The near and right edges in desktop-in-scene.png show bright, thin peaks at similar intervals; the far edge becomes a row of small rust-colored marks. They outline the whole plate like decorative edging rather than a few displaced sections of ship metal. This is a visible silhouette problem, not a claim of broken triangulation. Replace the repeated teeth with fewer unequal torn sections, readable thickness, attachment roots and varied folded profiles. Keep the continuous sealed backing visible and intact.

The canonical text in src/game/roguelike/storyRooms.ts:11 is "Fight around the sealed breach." and "Alien growth follows the boarding scar. Hull seal intact." The closed metal backing satisfies the intact-hull constraint. No opening to space appears. The two findings concern how the scar and growth read, not a demand to expose the breach.

## Preserved strengths and bounded checks

The overview has a clear diagonal focal obstacle, open routes around both ends, freight staging areas and sparse cargo. The steel, muted green, pale ribs and amber fixtures fit the room's low-poly industrial style. Cargo skids and the seal's floor contact read as grounded. I see no obvious floating object or unintended clipping in these two views. Hidden contacts and other viewpoints remain unverified.

CPU-only verification passed: `./node_modules/.bin/vitest run src/render/Room8Models.test.ts src/render/Room8Placement.test.ts src/render/Room8Visuals.test.ts`, 3 files and 11 tests. The checks cover sampled raised-seal ray hits, growth and torn-edge containment inside the collision scar, grounded freight supports inside obstacle footprints, east-fixture clearance, flush apron relief, finite geometry and local material disposal/isolation. Placement tests check both route loops at radii 16, 28 and 38, navigation reachability for spawn, exit and breaches, and movement-query segments through DepthGame.moveCorpse.

These checks support preserving the layout. They do not prove full render/collision equivalence, projectile-height agreement or live actor behavior. No separate collision defect is established by the current evidence. Passing tests do not resolve the visible model defects.

## Repair acceptance

Return only the central body/ribs and torn-metal border to stage 4. Keep their current collision footprint and intact backing. Then repeat the overview and normal desktop review at stage 5 and rerun the focused checks if geometry changes. Runtime, guard and publication were not changed by this review. No GPU work was run.
