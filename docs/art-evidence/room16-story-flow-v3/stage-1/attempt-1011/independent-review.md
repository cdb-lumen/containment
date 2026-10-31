# Independent review of Room16 stage1 attempt1011

Verdict: PASS for the stage1 layout proposal only.

I inspected room16-layout-original.png through the vision tool and read README.md, layout.json, generate_layout.py, validate-layout.mjs, ts-loader.mjs and the relevant archived production geometry and template sources. The vision tool displayed the complete original at reduced resolution. This review does not accept finished models, runtime integration or gameplay.

## Visual judgment

The proposal has a clear single three-root footprint rather than scattered cover. Its northwest and northeast branches meet at a visible dark focal cavity. The shorter southern branch stops above the preserved central movement line. Exposed parallel service channels continue beyond the roots, which gives the organic shape a plausible relationship to ship infrastructure at schematic level.

The west and east arms share the entry-to-exit line. The southern arm joins a broad open floor below the organ, with escape turns shown on both sides. The outer north bypass remains legible and distinct from the main combat space. Entry, exit and all four breach markers occupy matching positions in the baseline and proposal panels. The diagram clearly distinguishes the three physical roots from the three walking arms. Convergence happens in the open floor south of the organ, not inside its blocked cavity. That is an acceptable stage1 interpretation of the junction objective.

I found no blocking stage1 layout defect. The organ is intentionally north of the encounter center, leaving the compatibility anchor open rather than hiding it inside scenery.

## Independent technical check

I reran the README's Node validator command from the specified repository root, changing only the output destination to the independent workspace. It exited with code 0 and returned pass=true. The fresh parsed JSON equals the archived cpu-validation.json in full. The replay is preserved as independent-cpu-replay.json beside this review.

At each radius, 16 and 28, all 19 proposed anchors passed occupancy and stationary traversal. All 16 routes passed their 34 swept segments. The 20-unit sampled grid had one connected component, with 2300 nodes at radius16 and 2168 at radius28. Both occupancy-only diagnostic lists were empty.

The validator checks source digests before importing production geometry helpers. It retains the production boundary walls and anchors, removes the baseline interior rectangles in memory and supplies the proposed polygon as a sealed void. These are real production occupancy and traversal calls, not a separate approximation of collision. The diagram generator reads the same layout and asserts agreement with the archived validation proposal.

The replay confirms a 1200 by 880 boundary, entry at 100/440, exit at 1100/440, center at 600/440 and breaches at 100/100, 1100/100, 100/780 and 1100/780. It includes the 56-unit inward emergence paths.

The baseline remains connected at both radii but fails some proposed anchors and routes around its southern rectangle. This demonstrates that the proposed layout needs its replacement collision geometry. It is not evidence of a broken existing encounter.

## Concrete limits and follow-up risks

The three walking arms are annotations in a largely open rectangle, not physically confined corridors. The CPU check proves their prescribed paths are clear. It does not prove enemies choose those paths or concentrate near the organ. Stage1 passes as a spatial plan, not as demonstrated swarm routing.

The severed ship distribution hub is only partly communicated by geometry. The exposed channels help, but the far-wall gantry is a plain rectangular bar. Its damaged state and directional function depend on the label. This is a later visual-development obligation, not a reason to reject this schematic.

The dark cavity is a visual mark inside a sealed collision polygon. It must not be read as a traversable opening. Likewise, the long southern service channel is explicitly flush and walkable, not an extension of the solid root. Later modeling needs to preserve these distinctions.

Low carapace height is a requirement in text, not something this top-down drawing verifies. The unchanged rectangular envelope is evidenced, but actual composition through the unchanged shipping camera, HUD occlusion, emergence visibility, attack readability and projectile behavior are untested here. No live encounter, browser run or full test suite is implied by this verdict.

The grid is sampled and the swept routes are finite selections. Neither establishes continuous-space navigation everywhere or crowd clearance under combat pressure. The validator's overall pass expression also does not require empty occupancy-only diagnostics, though those lists are empty in this replay.

## Scope and execution issues

No source files, repository evidence, git state or published artifacts were changed by this review. I created only this review and the independent CPU replay in the requested workspace. Node emitted an experimental-loader warning, but it did not prevent the validator from completing.
