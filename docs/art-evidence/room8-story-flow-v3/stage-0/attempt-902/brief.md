# Stage 0 story intent

The loading bay must read as a cargo space wounded by boarding, with a sealed hull and alien growth following the damage. The player fights around that scar and continues toward the relay racks.

Canonical source: `src/game/roguelike/storyRooms.ts:10-12` at `7a3f262886104fb024de9684958b3f85a8859f34`.

- Objective, exact: "Fight around the sealed breach."
- Story, exact: "Alien growth follows the boarding scar. Hull seal intact."
- Campaign context: freight hold, breached loading bay, relay racks.

Proposed art interpretation: subordinate ochre freight establishes cargo handling; a closed rear hull panel and a diagonal damaged strip establish the boarding aftermath; irregular muted green growth follows that strip. These are proposals, not canonical construction details or inherited Room8 acceptance.

`story.png` is a new labeled concept illustration, not gameplay or an approved layout. The cyan line is illustrative and crosses a freight silhouette; stage 1 must replace it with connected, clear routes at actual actor scale. The growth dots communicate placement but do not pass model/material quality. No runtime, route, combat or clearance test is claimed.

Parent pixel review agrees with the independent stage0 pass. Text is readable and uncropped. The solid closure and cargo shapes support the stated story. Stage1 must establish real entry/exit connections and usable circulation without freezing this drawing's geometry. No repair objective, decompression or new gameplay is introduced.

Preflight permit: task room8-story-flow-v3, stage0, completed_start902, attempt1 of4. Fresh branch and origin/main both started at the source commit above, with a clean worktree. Process inspection found no competing writer or GPU capture in this worktree. This run uses CPU Pillow rendering only. Guard stage/counters remain untouched.
