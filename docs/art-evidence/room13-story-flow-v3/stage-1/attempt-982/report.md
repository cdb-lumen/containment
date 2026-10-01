# Room13 layout attempt982

The new diagram joins each exchanger/pump pair to the central low service saddle with a continuous cyan service network. Four explicit junctions meet the vertical installation runs, and four ports touch the saddle edges. The connections no longer stop in open floor or share the entry route's horizontal line. Cyan lines use a dark border and remain visible where circulation crosses them. The legend states that external service runs pass below flush walkable covers. This is a schematic connection proposal, not exposed pipes or added floor solids.

The five canonical collision footprints, room boundary, entry, descent and breach anchors remain unchanged. Both circulation loops and both saddle bypasses remain available. The bypass arrows now show both directions. Cooling still supports life, and the player descends knowing the fatal cost. No purge, liquid hazard, valve interaction or new mechanic is proposed.

## Evidence and checks

Source HEAD is `95133d4a4a80a876042d5d4fcf88c72f610c0211` on `art/coolant-plant-v3`. The source worktree was clean before generation. The canonical brief retains its historical source pin. The generator records nine source hashes and checks them again after rendering.

Executed with Python and Pillow:

- `python draw_layout.py` produced the actual 1800 by 1320 RGB PNG, manifest and brief. All 87 analytic and artifact checks passed, with zero failures.
- `python verify_layout.py` independently read the saved PNG and checked 1,146 cyan centerline samples across all six service runs. All remained visible in the final saved image. It also verified nine source pins, all 87 recorded results, the generator hash and the PNG hash.
- Named routes retain 50 units of minimum center clearance. Radius28 leaves 22 units of edge margin. Radius16 and radius28 pass both loops, reverse loops, both central bypasses and entry-to-descent alternatives. These named segments also pass conservative expanded-rectangle checks.
- The ten-unit circular-clearance search finds one connected component at each tested radius. This grid uses Euclidean circular clearance, not the production square-expanded blocker model. It is not proof of production actor traversal.
- Negative controls reject a route through the saddle, an oversized actor in the narrow slot, an outside-room position and a service branch detached from its installation.

PNG SHA256 is `dfba6366d15ab08e5c25866eed90a67f79d0a2937310dd3a73cf19ec1ca76791`.

## Author visual review

I inspected the rendered PNG through the image tool. Both cyan installation trunks visibly connect their exchanger and pump footprints. Upper and lower branches meet the saddle ports without gaps. The central square now reads as part of the paired installation rather than a floating block. Circulation remains readable, with distinct colors and separate north and south bypasses. The sidebar explains the below-deck crossings. Labels fit within the image.

This author review is not the required independent or parent review. Those remain pending. No runtime movement, pursuit, combat, 3D mesh matching, GPU rendering or gameplay visibility was tested. There is no stage acceptance or release claim.

## Files and scope

Workspace originals are in `coolant-plant/story-flow-v3/stage-1/attempt-982`. Publication-ready local copies are in the authorized worktree at `docs/art-evidence/room13-story-flow-v3/stage-1/attempt-982`.

The evidence package contains `layout-draft.png`, `layout-manifest.json`, `checks.json`, `brief.md`, `draw_layout.py`, `verify_layout.py` and this report. `prepare.py` is a workspace-only derivation script that reads attempt981 without changing it. Operational verification output remains outside the repository.

No runtime or shared files changed. Old attempts remain intact. No commits, pushes, remote publication, guard mutations, preflight calls, receipt writes, approval actions, merges or deployment occurred.
