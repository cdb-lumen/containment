# Room20 stage1 independent review

Verdict: PASSED for stage1 layout only.

I inspected the original layout.png through vision, read the generator, route checker, loader, brief and manifest, inspected the production topology and story contracts, and independently reran the CPU checks. I found no blocking stage1 defect. This verdict does not accept detailed art, runtime integration or gameplay.

## Visual findings

The complete platform boundary and central void are visible. The pale outer contour, dark void and green circulation loop are distinct. Spawn and all four breach symbols are readable, with inward-facing dots separated from their breach diamonds. The closed loop and its connections are legible without hiding the platform's lower notch.

Coolant C, power P and restraint R have distinct labels, colors and positions. All three allocation rectangles are visibly inside the void, separated from the core reservation. The sidebar identifies their functions and exact bounds. These are adequate differentiated footprint allocations for stage1, not proof of recognizable mechanical silhouettes.

The diagram has no escape marker or outward escape arrow. The compatibility anchor is explained in the legend but deliberately not marked. The text says to defend the authorized overload and explicitly says there is no escape. The brief retains SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED. Production storyRooms.ts still specifies "Defend the overload sequence. No escape. Everyone aboard will die." No new switch or second authorization is proposed.

The original image is 2400 by 1600. Vision displayed its complete composition downscaled to 1200 by 800. I could read the principal labels and legend at that presentation. This is not a shipping-camera or phone-scale inspection.

## Source and geometry parity

HEAD matched 43278df972ed306d623c61c51f596a5ca3357314. All eight manifest source hashes matched both current files and their committed HEAD blobs. All three generator/helper hashes, both font hashes, the original PNG hash and route-results hash matched the manifest.

I traced the final template through storyRoomTemplates.ts and roomTemplates.ts. The authored topology overrides the fallback obstacle rectangles. The exported geometry matched every canonical boundary and void vertex, spawn 140,440, all four breach coordinates and compatibility anchor 1060,440. Its blockers were only the existing perimeter walls, with no added internal obstacle. Independent rectangle comparisons also found no overlap between any service allocation and the core or another allocation.

The repository was clean before and after verification. Its diff from local origin/main contained only earlier stage0 evidence. I did not fetch, modify refs or change repository files.

## Fresh CPU execution

Verification ran in the separate sibling directory `../attempt-1032-independent-cpu/`. The checker, loader and generator were copied there without modification. Their outputs remained there, not in the sealed attempt.

Commands executed:

```sh
# Working directory: /home/chernodubv
python3 /home/chernodubv/.hermes/workspaces/containment-art-roadmap/overload-floor/story-flow-v3/stage-1/attempt-1032-independent-cpu/review-check.py

# The review script ran these in attempt-1032-independent-cpu:
node --experimental-strip-types --experimental-loader ./ts-loader.mjs ./check-routes.mjs
python3 generate.py

# Read-only repository checks:
git rev-parse HEAD
git --no-optional-locks status --porcelain
git diff --stat origin/main...HEAD
```

The review script also used `git show HEAD_SHA:SOURCE_PATH` for each pinned source file.

Results:

- Production-helper route assertions: 179 passed, zero failures, zero reported errors. Exit 0.
- Additional independent integrity, parity, rectangle-separation and execution checks: 52 passed. Exit 0.
- Coverage included 17 anchors, eight closed-loop segments and 12 diagram connectors at radii 16 and 28. Stored paths were rechecked. Negative controls rejected void and outside occupancy, invalid shortcuts and a protruding reservation. An injected full-height blocker correctly broke connectivity.
- Regenerated route-results.json and layout.png matched the sealed originals byte for byte.
- Original PNG SHA-256: `112d27a25e30b441057573b51968705074718b2df6da918260a748aaf52f6ed2`.
- Route-results SHA-256: `b09b3659db1ce141adbdf1fc59a823725bb2ac299169a26a1af267ec3cd67e2f`.

The sibling directory retains review-check.py, review-results.json, command-1.log, command-2.log, copied helpers and independently generated outputs. A before/after hash inventory confirmed every pre-existing file in the attempt folder remained unchanged. This review document is the only addition to that folder.

## Limitations and issues

Node emitted its experimental-loader warning. Both commands completed successfully. No other execution issue occurred.

Connected usable routes here means the named swept-disc routes pass unchanged production CPU geometry. It does not establish enemy AI, crowd behavior, combat, weapon sightlines, random spawn spread or every possible route. Service positions are allocations, not usable controls. Detailed models, supports, height clearance, lighting, live fatal sequence and shipping-view readability remain unverified and are not stage1 acceptance requirements. No GPU, browser, gameplay session or full runtime verifier was used. Remote branch freshness was not checked.
