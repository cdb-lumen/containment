# Room17 layout draft

Stage 1, attempt1016, task `room17-story-flow-v3`. This is a source-pinned top-down diagram. It is not gameplay evidence, final art or human acceptance. No runtime files change.

## Purpose and retained topology

The objective remains "Clear the last defensive line before the reactor." The canonical brief calls for a stepped radiation barrier, nested static shield leaves, paired screw drives and broad alternate lanes. It does not authorize timed closure, crushing, an overload event or an escape route. The previous stage0 assembly established this intent but did not establish placement or scale.

The actual production template is a 1200 by 880 rectangle with three existing solid rectangles. Room17 has no authored polygon override. S1 is at 300,140 with size100 by310. S2 is at520,590 with size160 by150. S3 is at800,340 with size100 by360. Entry100,440, exit1100,440 and all four breach anchors remain unchanged. The baseline already supports a stepped main approach and north/south alternate routes, so this draft retains it.

The focal gate uses the 400-unit gap between S1 and S3 at y350 to440. G1 and G2 reserve an80 by90 footprint inside each existing solid for nested leaves and paired screw machinery. They are proposed visual reservations, not additional colliders. The colored open-threshold area is ordinary existing floor, not a platform, hazard, paint proposal or overhead bridge. Later modelling must remain inside the owning solids, including guide shoes, housings and locking wedges. These reservations establish location only, not detailed mechanical fit or final visual scale.

Route A approaches south of S1, turns north through the opening, then east around S3. B and C preserve alternate circulation around the north and south ends. Each drawn band represents a100-unit-wide CPU-tested corridor. These are editorial route choices, not new navigation rules. Activity circles identify usable maneuvering, defensive encounter, regrouping and progression spaces. They add no spawn positions or encounter scripting. The rectangular room outline is the real bounds. Entry and exit marks are progression anchors, not new perimeter door cuts.

## Sources

Game files pin commit `7a3f262886104fb024de9684958b3f85a8859f34`. Their full SHA256 values live in `layout-data.json` and are checked against current production files. The initial extraction also compared their exact bytes to this commit.

- [storyRooms.ts, line20](https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/storyRooms.ts#L20) establishes identity and objective.
- [storyRoomTemplates.ts, lines24 and29-35](https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/storyRoomTemplates.ts#L24-L35) supplies solids, dimensions and anchors. The test imports the resolved production template rather than trusting this table alone.
- [authoredRoomTopologies.ts](https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/authoredRoomTopologies.ts) confirms there is no Room17 override.
- [expeditionGeometry.ts](https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/world/expeditionGeometry.ts) supplies actual occupancy, swept traversal, shot checks, perimeter solids and breach facing.
- [catalog.ts](https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/enemies/catalog.ts) supplies standard enemy radii14,17,18,24,28. The queen is not included in the standard-enemy claim.
- Workspace `rollout-sources/room17-brief.json`, SHA256 `a8ef7779e1105b64b39253dd4a4ec23b3b32c96f9e10fc3b9bc5cad31a94a3d7`, supplies the static gate and story constraints. Its source commit agrees with the pin above.
- Workspace `shielding-gate/story-flow-v3/stage-0/attempt-1015/sourced-brief.md` and `generate-board.py` supply the preceding conceptual intent. No asset from another unaccepted room is imported.
- Live issue39 and draft PR82 were read before authoring. Issue39 retains the same story and circulation contract. PR82 is open, draft and uses `art/shielding-gate-v3`. Live issue text is contextual, not an immutable source pin.

## Reproduction

From this artifact directory, with Python3, Pillow12.3.0 and Debian DejaVu Sans fonts:

```sh
python generate-layout.py layout.png
python verify-artifacts.py /absolute/path/to/containment
node test-layout.mjs /absolute/path/to/containment
```

The Node test requires Node22.15 or newer and the repository's installed TypeScript dependency. Run `npm ci` in the worktree first if dependencies are absent. It imports production TypeScript through Node module hooks. It does not copy occupancy or sweep algorithms into the test. Both the generator and focused CPU test read the same `layout-data.json`.

The existing production geometry suite was also run from the worktree:

```sh
npx vitest run tests/unit/expeditionGeometry.test.ts
```

## Results and limits

The focused CPU suite passed13 checks. It compares shared diagram geometry with the production template, verifies contained reservations, tests all routes bidirectionally for every standard enemy radius, and tests100-unit route corridors. Activity discs reserve their stated radius plus a radius28 actor. Separate checks cover gate crossing, gate shots, negative through-solid shots and anchor connectivity.

The20-unit grid contains1915 traversable nodes and reaches all1915. All16 checked anchors connect, including four authored breach points, four runtime inward-offset positions, entry, exit, four activity centers and two threshold endpoints. This is sampled static connectivity, not a continuous-space proof or an AI pursuit simulation.

Eight sampled corner points pass production circular occupancy but fail production's conservative expanded-rectangle self-sweep:280,120;420,120;500,760;700,760;780,320;780,720;920,320;920,720. The graph uses swept admission for nodes and edges and reports those excluded points. This does not fix or conceal the production mismatch. None is a designated route waypoint or activity anchor.

The existing production geometry suite passed3 tests. The first focused execution failed before assertions because dependencies were absent and the initial loader expected esbuild. `cpu-first.log` retains that failure outside the repository. After `npm ci`, the loader was changed to the repository's TypeScript dependency. Later results are retained separately, not overwritten onto the failure log.

No live combat, mobile or desktop camera capture, detailed model fit, mesh overhang, final visual readability or runtime performance was tested. Parent and independent visual review remain required. There is no publication, receipt, commit, push, merge or deployment in this handoff.
