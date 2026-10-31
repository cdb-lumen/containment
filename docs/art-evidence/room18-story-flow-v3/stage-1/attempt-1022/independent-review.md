# Independent review of Room18 attempt1022

Verdict: PASS for the stage1 authored layout draft only.

This is not human acceptance, runtime acceptance, camera acceptance, combat acceptance or permission to publish. No runtime or repository files were edited by this reviewer. No guard was touched.

## Reviewed artifact

I loaded the original `layout-draft.png` through vision and read `layout-data.json`, `brief.md`, `check_layout.cjs` and `checks.json`. I also read the renderer and package verification source and report. The vision tool displayed the complete original at reduced size, not a gameplay capture.

The reviewed final PNG has SHA-256:

`f3e916debf476c8914027760ef639a6f525ec7ee9aa49823cb9f7279bd649904`

The hash matched at initial inspection, after independent CPU replay and after deterministic regeneration in a separate directory. This verdict applies only to that image and its matching layout data. A later image change requires another review.

## Findings

- The whole room reads as one continuous floor ring around a solid shielded center. Entry and exit are labeled with source coordinates. The upper clockwise and lower counterclockwise branches share the same entry and exit. Their side connections remain open. Neither branch crosses the center.
- The final clockwise caption is separate from the route. Center labels are readable without baseline geometry crossing them. The separate baseline inset makes the five original rectangular solids distinguishable from the proposed chamfered core and inset boundary. I found no blocking label overlap in this image.
- The proposal explicitly removes four detached blocks and expands the old center footprint into a 480 by 400 solid reservation. It preserves the source envelope and canonical anchor coordinates, not the original rectangular walkable boundary. The brief correctly identifies the new dimensions as design decisions. The north and south 200-unit labels describe cardinal floor bands, not a universal minimum-clearance proof.
- The story remains consistent with `storyRooms.ts`. The objective is `Circle the shielding. Reach manual controls. Overload is NOT armed.` The separate story is `PASSENGERS ALIVE. Manual authorization still required.` The image keeps passenger vitals and authorization separate, explicitly says overload is not armed, and says manual consent is still needed. The activity circles are read positions, not newly invented arming interactions. The brief identifies the exit as leading to Room19.

## Independent checks

I copied only the checker and renderer into `/home/chernodubv/room18-independent-nnuotdv5` and ran them against the read-only source at `/home/chernodubv/dev/.cron-worktrees/containment-rooms/containment-annulus-v3`. I did not execute `verify_package.py`, because it copies files into the repository.

- The CPU replay exited successfully with 224 assertions and 0 failures. I counted the assertion records and failures programmatically. Generated `checks.json` and `layout-data.json` exactly matched the submitted versions.
- Both complete ring directions, both entry-to-exit branches, activity approaches and anchors passed the production swept predicates at radii 16, 28 and 30. Center occupancy, center-crossing movement and center-crossing sight were rejected as checked.
- At 20-unit sampling, each radius produced one connected floor component. Node counts were 1620, 1380 and 1360 respectively. No occupancy/self-sweep disagreement was reported. Checked anchors joined the sampled floor and the exit-targeted production navigation field reported them reachable.
- The renderer regenerated a byte-identical PNG from the independently regenerated layout data.
- All recorded runtime source hashes and canonical input hashes matched the files read. The three canonical template/story snapshots matched the worktree. HEAD was `bb42726d736a15f3ff16d69c297804f43508535c`; the tracked diff against HEAD was empty. Source inspection confirmed the radius16 player, radius28 lane contract, radius30 navigation clearance and inward breach offset of56.

## Limits

These are focused CPU assertions on in-memory proposed geometry, not a full test suite. Sampled connectivity is not continuous-space coverage. The small-radius swept probes do not simulate bullet lifecycles or pickup collection. No live movement, enemy pursuit, avoidance, combat, interaction sequence, browser capture, camera visibility, shielding height or far-arc actor readability was tested. The top-down diagram cannot establish those results.

I verified local source and test claims. I did not independently refresh the historical GitHub issue or PR status. There are no blocking findings for this stage1 draft scope. Human review and later in-scene validation remain pending.
