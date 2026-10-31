# Room8 stage 1 independent review

## Verdict

PASS for the stage 1 layout draft only. The final PNG shows the whole room, entry and exit, two connected routes, freight activity areas and a clear central focal point. No blocking stage 1 defect found. Publication and guard advancement remain separate requirements. This review does not accept gameplay, runtime navigation, models, final art or release.

## Visual findings

I inspected the actual layout.png with the vision tool, then inspected its bottom region separately. I read the production contract and the three canonical source files. I did not inherit historical layout acceptance.

The sealed scar reads as a filled obstruction within an intact shell, not an opening to space. Green growth follows its damaged lower-left edge. The routes visibly split around the scar and rejoin at the exit. This supports the canonical objective, "Fight around the sealed breach."

The broad south apron and two separated freight footprints explain interrupted loading without filling the usable floor with crates. F1 is the retained staging footprint. F2 is a proposed outbound pallet, not existing runtime geometry. Reusing the shell and scar is reasonable here because their unequal lobes support circulation and leave the breach as the room's focal point.

The title identifies this as a top-down draft rather than a gameplay screenshot. Entry, exit, route arrows, arrival anchors, scale and explanatory notes are readable. The footer is separated from the diagram and is not clipped.

## Defects and limits

- Minor presentation defect, nonblocking. The brute radius key slightly crosses the lower shell outline. Its label and the footer remain readable, and the key is outside the playable diagram. Leave more space below the shell in future boards.
- No blocking story, layout or legibility defect found in the final PNG.
- I did not inspect layout-footer-rejected.png. It is an earlier rejected candidate and supplies no acceptance evidence for this verdict.
- The diagram and calculations do not establish actual navigation, pursuit, combat, camera presentation or collision integration. HUD overlap and mobile visibility are not acceptance gates under this contract.

## Checks run

I independently recalculated continuous segment clearance from layout.json with Python standard-library geometry. Both routes start at the retained entry and end at the retained exit. Checks covered the shell, solid scar and both freight footprints.

| Route | Minimum centerline clearance | Spare clearance at radius 38 |
| --- | ---: | ---: |
| North | 66.163790 | 28.163790 |
| South | 52.951356 | 14.951356 |

Both routes support the proposed radius 38 capsule in this planar model. The smaller reported radii 16 and 28 follow from that bound. This is not a claim that shipping actors traversed either route.

I checked every retained arrival connection against the same boundaries. A1 through A4 had minimum clearances of 97.618706, 122.601765, 50.190311 and 99.846035 units respectively. All connect to route vertices at radius 38. Solid footprints are inside the shell and pairwise disjoint.

I also executed only the calculation prefix of draw_layout.py in memory, stopping before its first file write. Its assertions passed, including solid scar, freight occupancy, wall margin and crossed-segment controls. Its report matched geometry-checks.json after JSON normalization.

Shapely was unavailable, so the independent calculation used the standard library. An initial direct comparison of the in-memory builder report with the JSON report failed because tuples differ from JSON lists. Normalizing through JSON resolved that comparison. Neither issue changed the geometry result. I did not rerun the image generator or modify its outputs.

## Source provenance

Contract read from map-model-production.md, story-flow-v3. Stage 1 requires purpose, connected usable space and a readable top-down PNG, without detailed mechanical models.

Game source root is /home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3.

- src/game/roguelike/storyRooms.ts, lines 10 through 12, establishes freight hold to breached loading bay to relay racks and the exact objective and story.
- src/game/roguelike/authoredRoomTopologies.ts, lines 49 through 50 and 67 through 75, defines sealed solid silhouettes, the Room8 shell, scar, entry, exit, arrivals and F1.
- src/game/roguelike/storyRoomTemplates.ts, lines 29 through 35, retains the 1200 by 880 envelope and applies the authored topology after fallback footprints. The fallback Room8 rectangles are not the effective authored obstacles.

The geometry report names source commit 7a3f262886104fb024de9684958b3f85a8859f34. Current HEAD was 18df47b957598562b5cb091f59b0cd39337787e8. I compared all three source files byte-for-byte with the report's source commit. All matched. The draft retains the source shell, scar, entry, exit, arrivals and F1. F2 exists only in this proposal. layout.json explicitly sets runtime_applied to false.

Reviewed artifact SHA-256 values:

```text
layout.png
03099902095219bc7d63cb68e6fd994fc6a3209003075edb106f1d729745fa6c
layout.json
6c2ca06159e9617c69fb844181f582b22a6e1f414b6d4967abe5e708ac044f9f
geometry-checks.json
c77f12edea94a67ba64d6a74963cf7311e361d451bd6b3ab251f7ab63eba5bd7
draw_layout.py
a5edeaecc2dc863758ce79ba67dd5f76a4686149841b7906494f01fd4c440803
```

Only independent-review.md was written by this reviewer. Remote publication was not checked.
