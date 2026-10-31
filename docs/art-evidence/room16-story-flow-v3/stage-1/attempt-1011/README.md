# Room16 layout proposal

Stage1, attempt1011. Documents only. The original diagram is [room16-layout-original.png](room16-layout-original.png). It is a 2800 by 1780 top-down drawing, not gameplay. Parent review and independent review remain outstanding.

## Layout decision

The left panel shows effective source collision geometry, not a reconstruction of pre-invasion art. There is no swarm-junction override in authoredRoomTopologies.ts. The three rectangles in storyRoomTemplates.ts therefore remain the baseline.

The right panel replaces those three rectangles with one proposed sealed three-root organ polygon. Its focal cavity is at 600/260. Two cut roots face northwest and northeast. The short southern root ends at y370 so the center compatibility anchor at 600/440 stays usable. This is a layout envelope, not a detailed model. No source obstacle or topology was edited.

Ordered metal service runs protrude beyond the root ends. The southern service channel continues across the walkable combat floor. These runs are flush floor marks, not extra collision. A damaged directional gantry remains on the far wall, also without new floor collision. The proposed growth follows existing ship-service directions, rather than becoming scattered cover. This interpretation follows issue37 and the stage0 brief. It is not additional canonical history.

The west, east and south activity arms connect through a broad open combat area south of the organ. An outer north bypass preserves service access and a second circulation option. Root directions and walking arms are different things, both shown in the drawing. The organ is deliberately offset north of the central encounter anchor rather than covering it.

## Preserved contract

- Rectangular boundary and camera envelope remain 1200 by 880. No camera code changed.
- Entry remains 100/440 and exit remains 1100/440.
- Breaches remain 100/100, 1100/100, 100/780 and 1100/780.
- Production inward emergence offset remains 56 units. The compatibility center remains 600/440.
- Objective remains "Break the concentrated swarm guarding reactor access."
- No boss, emitter, enemy behavior, gameplay interaction or pulse is introduced.

## Actual CPU checks

`validate-layout.mjs` imports `createExpeditionGeometry`, `canOccupyExpedition` and `canTraverseExpedition` directly from the production checkout. It does not reimplement collision. The proposed geometry retains the production boundary walls and anchors, removes the three baseline obstacle rectangles only in memory, and adds the proposed polygon as a sealed topology void. The renderer reads the same layout JSON and the resulting source baseline JSON.

For each radius, 16 and 28:

- All 19 proposed anchors pass production occupancy and stationary traversal.
- All 16 route checks pass, containing 34 swept segments per radius. These include west to south, south to east, east to west, entry to exit, every breach offset and approach, north access, and combat/south activity access.
- The 20-unit sampled grid has one connected component. It contains 2300 nodes at radius16 and 2168 at radius28.
- No sampled occupancy-only versus stationary-traversal mismatch was found. Both graph nodes and edges use production traversal.

The baseline is retained as a control, not labeled failed gameplay. The proposed south-turn anchor overlaps its existing southern rectangle at both radii. At radius28 the proposed south-arm anchor is too close to that rectangle. Several proposed southern route segments also fail against baseline collision. Baseline sampled space still has one component at each radius, with 2075 and 1916 nodes. These results show why the new route plan requires its proposed collision change; they do not identify a pre-existing navigation defect.

All detailed points, segment results and source digests are in [cpu-validation.json](cpu-validation.json). This is finite CPU route validation and sampled connectivity, not continuous-space proof, live pursuit, a legal encounter stress test or visibility acceptance. Later stages must verify low carapace height, visible emergence from all arms, readable attacks and native gameplay composition. No build, browser smoke or full test suite was run for this documentary-only change.

## Provenance and replay

The baseline is pinned to checkout commit `04aab8d63ab3e37de9bdc9c808496de0fb263432`. Canonical route, templates, effective topology and production helper dependencies are hashed in `source-manifest.json` and copied under `sources/`. The live issue37 response is preserved there too. Stage0's current sourced brief and six-stage production contract were read before drafting. No AGENTS.md was found in the repository or checked parent directories.

The generator uses Python and Pillow 12.3.0 with bundled DejaVu fonts. No random input, image model, GPU or game camera is used. Its first output was visually inspected. Labels and routes fit inside their panels; the three-root solid, ship-service stubs, gantry and open combat floor are visible. This is author inspection, not independent review.

A separate replay produced byte-identical PNG output. Both generator and validator create outputs exclusively to preserve earlier evidence.

From the repository root, with fresh output paths:

```sh
node --experimental-strip-types --loader ./docs/art-evidence/room16-story-flow-v3/stage-1/attempt-1011/ts-loader.mjs ./docs/art-evidence/room16-story-flow-v3/stage-1/attempt-1011/validate-layout.mjs . /absolute/local/path/check-replay.json
python3 docs/art-evidence/room16-story-flow-v3/stage-1/attempt-1011/generate_layout.py --output /absolute/local/path/layout-replay.png
```

Node 22.22.3 ran the checks without installed npm dependencies. Node emitted its experimental-loader deprecation warning, but execution passed. Operational logs and the earlier narrower check output stay in the local attempt workspace, not repository evidence. No commit, remote write, publication, merge or deployment was performed.
