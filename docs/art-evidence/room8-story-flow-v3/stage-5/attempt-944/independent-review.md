# Room8 stage5 attempt944 independent review

## Verdict

PASS for bounded overall art handoff at `2502fe91f79f3a8635bca08a09be2a4309f32055`. No new blocking art defect or demonstrated technical failure found. This is not release approval, live-gameplay validation, publication verification or guard advancement.

Viktor's human acceptance of the attempt909 scar at this exact commit stands. I have not reopened its cosmetic judgment. The floor staging-pad question remains open and nonblocking. No floor or scar edits are requested or authorized.

## Evidence reviewed

Read `map-model-production.md`, `story-flow-v3/brief.md`, this attempt's `technical-report.md`, `capture-result.json`, `verification.json` and `focused-tests.log`. Checked the canonical Room8 story, the three Room8 test files and relevant authored-room test assertions in the specified worktree.

Visually inspected all four original PNGs through the vision tool, not a contact sheet:

| Original | Independent pixel judgment |
| --- | --- |
| `overview-static.png` | Full room perimeter, central sealed assembly, freight areas and open space around both sides are visible. The east fixture remains separate from the scar. |
| `desktop-entry-static.png` | Western staging area and freight establish a loading-bay setting. The central seal is the main object, with the upper approach visibly open. |
| `desktop-north-static.png` | Northern circulation space is clear. The seal, organic strip and torn metal remain distinct from the surrounding deck. |
| `desktop-south-static.png` | Southern apron, supported freight and space between freight and scar are readable at ordinary desktop framing. |

All images show a rendered Room8 state, not loading or blank output. Independently verified exactly four unique originals, each 1280 x 900, with SHA256 hashes matching the capture manifest. Git HEAD matches the accepted commit and worktree status is clean. Current `AuthoredRooms.ts` and `authoredRoomTopologies.ts` hashes match the manifest.

## Art coverage

- Story: The canonical objective remains 'Fight around the sealed breach.' The visible metal backing closes the scar rather than showing a hole into space. Growth follows that sealed assembly. Freight, staging markings and the emergency hull-seal sign support the cargo-room context. No new objective or decompression story is implied.
- Layout: The overview makes the central obstacle and the surrounding northern and southern routes understandable. Freight sits outside the central focal area. The east fixture does not visually close the approach. Route usability is supported by focused geometry checks, not inferred solely from empty floor pixels.
- Models: The crate and paired outbound cargo read as freight with bases or skids. Rails and posts establish staging positions. The east fixture has visible floor contact. The accepted scar remains the central assembly, with its surrounding repair hardware and torn metal intact.
- Style: Restrained blue-gray steel, rust-brown wall panels, pale cargo and yellow markings form a consistent industrial room. Green growth separates the story focal point from that palette. The repeated floor outlines remain visually prominent, but their interpretation is the existing nonblocking human question, not a new rejection.
- Floating and clipping: No obvious new floating prop, detached freight support or route-spanning mesh intersection is visible in these four views. Intended growth contact and embedded torn-metal roots are not clipping defects. This is a bounded image inspection, not an exhaustive hidden-surface audit.

HUD overlap, mobile visibility and ordinary viewport cropping are not art gates. The overview's capture-only camera fit is supplementary composition evidence, not the shipping camera.

## Technical coverage and limits

The retained run reports 26 passing tests across four files. I read the passing log and inspected the relevant assertions rather than rerunning tests or launching a renderer. The typecheck log is empty, consistent with the recorded exit 0, but the log alone does not independently establish that exit status.

The focused checks cover both route polylines sampled at intervals no greater than four world units for radii 16, 28 and 38. They also check navigation reachability of spawn, exit and breach points. Movement sweeps call `DepthGame.moveCorpse` with those radii and assert unblocked endpoints. These are real code-level collision checks, not player-input traversal or enemy AI demonstrations.

Collision/render agreement has useful but partial coverage. Tests check the outbound pallet's blocked footprint, freight support containment, grounded skids, east opening clearance, growth and torn-metal containment inside the scar, and sampled mesh rays through the seal. Connectivity and flank rays support growth contact. They do not establish exhaustive visual/collision correspondence at every edge or projectile height. No new mismatch is demonstrated by this evidence.

Asset checks cover finite model vertices, shallow finite floor relief, material isolation, batching and owned-resource disposal. Capture rows report legal staged positions, loaded Room8, nonzero draw calls, no WebGL errors or context loss, and no browser/request errors. The broader unchanged-source and cleanup claims are retained verification results, not independently repeated lifecycle checks in this review.

These are static staged Chromium software-WebGL frames. Simulation was paused and positions were staged. They do not prove live traversal, combat, projectile behavior, crowd readability, frame timing, native-device behavior or full-campaign survival. The manifest's `playing` state does not change that classification. Historical HUD/mobile issues are neither gates nor claimed fixed.

## Disposition

No return to stages0-4 is justified by the reviewed evidence. Preserve the accepted scar and unchanged floor art. Carry the floor-pad question and the technical evidence limits into handoff without treating them as new failures.

This review created only `independent-review.md` in attempt944. No runtime edits, GPU work, receipt, guard change or publication was performed.
