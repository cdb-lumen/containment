# Room5 independent art review

Reviewed under map-model-v1 at HEAD `a85139151c1cf26ffe1430eab5259742bc3672e6`.

## Separate verdicts

- DM535120 defensive arrangement is fixed within the reviewed map/model evidence. The former freestanding rows now form a wall-connected line, with one visibly broken crossing and a protected crew station on its eastern side. This is a functional layout correction, not another shield finish pass. It does not certify live defensive behavior.
- Whole-room map/model composition is accepted for this source and the static coverage below. This decision covers the arrangement and visible equipment together, not merely the previously reviewed gate models. It is not final integrated room art acceptance.
- Full integrated actor visibility and art acceptance remain blocked by the existing phone HUD dependency. The fresh phone expanded north-join frame hides the actor behind the story panel. Skip exposes that actor but retains the objective banner, ammunition panel and touch overlays. This review does not close HUD, network, gameplay or release failures, and does not authorize merge or deployment.

## Independence and coverage

I first read all of `map-model-production.md`, including the DM535120 correction. I then loaded the actual PNG originals through native image inspection before reading renderer rationale or earlier reviews. I did not read earlier review verdicts or builder reports as proof. After pixels, I inspected manifests, the capture script, canonical story, source and cumulative diff.

All 20 originals in this directory were inspected individually. The matrix is desktop and phone, expanded and Skip, at approach, north-join, south-join, entry and exit. All six retained `../connected-stump-20260916` originals were also inspected individually: desktop and phone Skip at gate, crew-side and operator.

Historical comparison covered ten originals at `../rework-dm535120`: desktop and phone Skip approach and crew-side from `before`, plus desktop and phone Skip gate, north-join and south-join from `before-supplement-retry`. I did not inspect the additional original north/south frames in `before`; the retry originals supply those comparisons. No contact sheet replaced an original.

## What the pixels show

### The defensive correction

The historical desktop approach shows two short parallel shield rows and a counter between their upper ends. Broad floor lanes continue above and below this isolated group. The historical north-join and south-join retry views make those bypasses explicit. A person need not pass the counter to cross the room. Portrait crops reduce context but show the same isolated ends.

The current desktop north-join shows the upper shield run meeting the upper room structure. The south-join shows its lower counterpart meeting the bottom boundary, around x490 to x585 and y840 to y870 in that original. Braces and brown feet sit on the eastern side of both runs. There is no comparable open strip around either end in the visible layout.

The approach frame places the western arrival actor on open floor facing the crossing. In the desktop Skip approach, the upper jamb ends near y390 and the lower jamb starts near y485. The counter sits directly behind the upper segment, around x810 to x910, rather than stranded between two separate rows. The retained operator frames show the actor on the counter's eastern working side, with the shield between that position and the western approach. The retained crew-side frames show usable-looking floor behind the line, not another shield row sealing the operator in.

Access checking reads from the counter, dark terminal and tucked seat beside the passage. The inert weapon is small at these cameras; its retained silhouette and cradle contribute to the station, but I would not claim detailed weapon recognition in every portrait crop.

The pale jagged remnant stays attached to the upper jamb. The broad pale fallen leaf lies beside the lower run on the crew side, with a dark perimeter, triangular missing bites and a lifted diagonal fold. In the retained desktop gate image it occupies roughly x590 to x700 and y490 to y610. Together these shapes explain why the intended control point is now open. They no longer look like an unexplained gap between unrelated shields. The bright leaf is the strongest local contrast, appropriate to the breach, though brighter than the rest of the station.

This is visual evidence of a defensible arrangement and a breached access point. Static pictures cannot prove that a defender survives, that every shot is blocked, or that a moving actor cannot exploit collision edges.

### Whole-room composition

Across the desktop views, the connected partition supplies a clear organizing line. The western approach is uncluttered, the central crossing is readable, and the counter and damaged gate form one activity group. The eastern floor opens toward the cyan exit marker. Repeated muted blue-gray structure and brown supports belong to the same equipment set; yellow floor rectangles remain subordinate. The room is sparse, but its empty approach and crew-side circulation now serve the checkpoint instead of exposing an arbitrary furniture island.

The standing red actor provides scale at the entry, approach, crossing, joins, operator side and exit. The counter, shields and bracing read as human-scale equipment. I see no obvious floating shield feet or detached gate remnant in the inspected originals. The gate leaf's raised fold is connected to its frame, not an isolated hovering slab. These cameras do not expose every underside or contact edge.

Desktop actor silhouettes remain distinguishable in the inspected poses. The exit actor overlaps the cyan marker's dark base in both viewport classes. That is visible overlap with the destination marker, not enough evidence to declare a new collision defect.

Portrait is a sequence of local views, not a simultaneous whole-room overview. Entry and exit frames omit the checkpoint altogether; the approach clips the station at the right edge; the retained crew-side view clips part of the partition at the left. Gate, operator and join views supply the missing relationships. Composition acceptance uses this combined coverage and the desktop context, not a claim that every phone frame explains the whole room.

### The HUD limit remains real

In `phone-expanded-north-join.png`, the story panel spans approximately x18 to x372 and y127 to y235. The actor is not readable there. In `phone-skip-north-join.png`, the reduced panel ends around y183 and the red actor becomes visible below it, around x180 to x215 and y190 to y230. The room geometry is unchanged between those story states.

The phone ammunition panel remains around x235 to x372 and y484 to y582 in both states. It covers floor and portions of the lower checkpoint context in the approach view. Touch controls occupy the lower play area. The south-join actor is visible just below the ammunition panel, while the retained gate and operator actors are clear in their sampled positions. Those local successes do not cancel the expanded north-join failure or establish all-position actor visibility. No enemies are present to test crowded readability.

## Evidence integrity and source identity

Independent SHA-256 checks found no image mismatches in the 20 fresh or six retained rows. All paths existed. Fresh dimensions are ten 1280 by 900 images and ten 390 by 844 images. Retained dimensions are three of each. Row filenames are unique within each manifest, and the requested matrix has no missing row.

- Fresh `result.json` SHA-256: `57aa2d9a86c536f6a5b63129352a1a769bf04a920e721cb01d37e77d19659078`.
- Retained `result.json` SHA-256: `e2193520f42f0d254dc26296f01dd66b2c226ee5e95bc94a2c4a13ea001e0074`.

Both manifests contain 219 source/package/public-asset pins. Every pin matches the current worktree, and every fresh pin also matches the corresponding HEAD blob. The two pin dictionaries have no differences. The retained manifest labels its capture HEAD `afe0457c8c479e844f87a9f3b5030d0263b73fe7` and records a nonempty candidate diff. It must not be relabeled as a clean capture of that older commit. Its effective pinned files match the current candidate, which supports reuse of these six views. Their committed copies in `docs/pr-screenshots/crew-checkpoint-connected-stump` also match the manifest hashes.

The ten selected historical images match their manifests. Both historical manifests label HEAD `fa414c712c9987288c3f5c910d374970fac447e9`. This review uses them as historical arrangement evidence, not as a claim that their entire runtime equals today's candidate.

All 26 current/retained rows have equal full before and after snapshots, legal staged player positions and empty enemy arrays. The manifests report complete capture, unchanged source, no recorded capture errors and strictPassed true. Those are capture results, not release qualification.

The inspected fresh capture script freezes RAF externally, exposes existing main references through CDP, stages player coordinates, settles the unchanged renderer, and invokes the real Skip handler. It uses Chromium software WebGL and cached fonts. This is static staged integrated-app art with the production DOM HUD. It is not movement, combat, survival, touch-operation or physical-phone evidence. The HUD's remaining-enemy text does not override the empty enemy snapshots. Expanded gate, crew-side and operator views are not in this combined set.

## Cumulative scope review

I inspected the complete source and test diff from local `origin/main` at `7a3f262886104fb024de9684958b3f85a8859f34` to the requested HEAD. I did not fetch or alter refs. Git status was clean.

Runtime changes are limited to:

- `src/game/roguelike/storyRoomTemplates.ts`: only the Crew checkpoint obstacle footprints change. The two partition footprints reach opposite boundaries, the station moves behind the upper run, and the fallen leaf gets its own footprint. Other templates and canonical objective text are unchanged.
- `src/render/CrewCheckpointBlockout.ts`: new reproducible procedural Room5 equipment, including shields, station, attached remnant and fallen leaf. It uses existing mesh/material helpers and stays within room-specific model ownership.
- `src/render/ShipEnvironments.ts`: one import and a security plus crew-checkpoint registration guard. No other room renderer branch changes.

There are no cumulative runtime edits to HUD, camera, input, AI, combat, progression, network handling, shared loading or other rooms. The procedural source is the model artifact; this diff does not add a Room5 external asset transport path.

The new Room5 test file retains explicit route, shot obstruction, boundary connection, legal spawn/exit, geometry bounds, grounded construction and cached-resource assertions. The two existing snapshot files change only Crew checkpoint obstacle entries. I found no removed behavioral assertion or generic infrastructure change. Remaining diff files are Room5 evidence documents and images.

The saved `focused.log` reports one test file and 17 tests passed. I read that existing result only. I did not run tests or independently exercise routes. Source inspection and those saved assertions support the intended collision arrangement, but this review does not substitute for missing live movement or full integrated art verification.

## Disposition

Accept the corrected defensive arrangement and the source-pinned whole-room map/model composition. Keep full integrated actor visibility/art acceptance provisional behind the phone HUD dependency. Keep existing network/gameplay/release failures open with their existing ownership. Previously accepted model gates remain source-specific; none is promoted into a release pass here.

Only this review file was written. No source, counters, routing, GitHub, vault or runtime state was changed. No browser/GPU job, worker, test, deployment or production process was started.
