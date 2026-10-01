# Diagnostic gallery layout proposal

Stage1, attempt971. Refs #32. Proposal only, not integrated gameplay.

## Layout

Keep the canonical 1200 x 880 rectangular shell, entry at 100,440, exit at 1100,440 and all four breach anchors. The semicircular theatre is an interior furniture arrangement, not a shell change.

Replace the four generic interior rectangles with a north ship-cutaway footprint at x400..800, y90..210 and two interrupted curved console banks. The banks use inner radius300 and outer radius350 about 600,220, with angle spans25..68 and112..155 degrees in the downward-positive coordinate system. Near-side backs stay low in later modelling. All three footprints are sealed solids, not pits.

The physical cutaway faces south into an open reading apron. Its amber bus connects every simplified deck, including distinct occupied cryo symbols. The intended message is explicit: purge destroys every deck, including occupied cryopods. It is consequence evidence, not a purge control. Passengers remain alive. This room does not reveal Room12's pre-awakening proof or add a mandatory stop, log or interaction.

North and south routes at y280 and y690 join open flanks at x180 and x1020. An open central route connects the rear combat space to the reading apron. The PNG uses the same polygon vertices and route points as the executable geometric proposal. Green bands are route reservations, not proposed floor markings. No Room9/10 assets were copied.

## Focused validation

Ten CPU checks passed with zero failures or errors. Tests import the unchanged production `createExpeditionGeometry`, `canOccupyExpedition` and `canTraverseExpedition` helpers. They substitute only the proposed interior solids in memory.

At actor radii 16 and 28, every drawn route segment passes continuous swept-disc traversal. Entry, exit, activity points, breach anchors and the existing 56-unit inward breach offsets remain occupiable. Solid interiors, crossing shortcuts and out-of-shell points are rejected. All legal samples on a 20-unit grid connect to entry and exit: 2059 of 2059 at radius 16 and 1993 of 1993 at radius 28.

Grid connectivity samples the floor. It does not prove every possible floor point, combat, crowding, AI, camera visibility or gameplay readability. The full release verifier did not run. No runtime source changed. Independent visual review, later blockout and in-game checks remain pending.

## Source pins and reproduction

Runtime source commit: `cc488f2a626c1616a220fd9e436fce624190973f`.
Fresh-main ancestor: `7a3f262886104fb024de9684958b3f85a8859f34`.
Live issue32 and issue21 were read. Canonical SHA256 values match stage0:

- `rollout-sources/room11-brief.json`: `18408273d31fb837033914136724db82213b21b78b434118d214e0b3dbcf4b67`
- `rollout-sources/storyRooms.ts`: `f9f1248316c721c4f5c683eb9661f8ed2f95e34685b931f45b63b508e473c715`
- `rollout-sources/storyRoomTemplates.ts`: `d02c5d7c86084f4731c5fed97861e190339664b33fd8863663c1ac7362ba1681`
- `rollout-sources/roomTemplates.ts`: `0e3fc4e407a5072ae3370c12311e4f1357cb98712a154af9f7f1c00fdde25629`

Original authoring script, JSON proposal, source hashes and CPU tests are retained in workspace `diagnostic-gallery/story-flow-v3/stage-1/attempt-971/`. From that directory:

```sh
python3 author_layout.py
node --experimental-loader ./ts-loader.mjs validate-layout.mjs
```

Node22.22.3 runs the source through its built-in TypeScript stripping loader. Pillow12.3.0 renders the1800 x1280 PNG. No package install or GPU job was needed. No commit, push, publication, receipt or acceptance action was performed by the artifact author.
