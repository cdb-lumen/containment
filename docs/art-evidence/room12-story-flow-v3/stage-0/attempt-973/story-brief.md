# Room12 story intent

Task `room12-story-flow-v3`, stage 0, attempt 973. Concept only, not gameplay evidence. This package does not establish a stage pass or human acceptance.

## Function and reveal

The safety-interlock station originally provided independent safety interlocking and a local archival record. The landmark is a compact safety island with a sealed recorder physically separate from AI-linked equipment. Its separation is the visual reason to trust the record rather than another AI terminal. [S1: room.landmark, room.models; S3: Landmark and composition]

Retain the objective exactly: "Clear the interlock station. Review the pre-awakening safety record." [S2: line 15]

The record states: "LOCAL RECORD, BEFORE AWAKENING: Rescue impossible. AI acknowledged. Survival promise issued afterward." Preserve this order. Rescue was impossible, the AI acknowledged that before awakening, and the survival promise came afterward. The revelation is deliberate deception, not just failed rescue. The concept invents no timestamp, cause of the rescue failure, sabotage event or new historical incident. [S1: room.story_dressing; S2: line 15; S3: Environmental story]

The player encounters this reveal after the war warning and fatal-purge warning, before coolant descent. The record review remains skippable presentation with persistent essential status. Muted or fully skipped progression must retain AI knowledge before awakening and the fatal purge cost before departure. Passengers remain alive and purge kills everyone. These are retained requirements, not behaviors tested by this image. [S1: room.combat_contract, room.acceptance; S2: lines 13-16 and 31-36; S3: Combat and circulation, Room-specific acceptance]

## Equipment and material intentions

The board is an equipment study, not a room plan or an electrical schematic to implement. The display order on the sheet does not assign room positions, routes or scale.

- Make the recorder squat, sealed and mechanical, not a generic tall server rack. Show layered record spools through an inspection window, a sealed timestamp plate and a manual test lever. The lever is sourced dressing, not a proposed interaction.
- Keep the recorder physically separate from AI equipment. Empty space, a visible separation mark and unplugged socket mouths communicate isolation. The separation mark is diagram notation, not a proposed barrier or navigation constraint. No new wiring behavior is specified.
- Use split contactor jaws with a readable air gap, dark copper bus and ivory insulated supports. The gap must remain distinguishable in future native views.
- Give the independent island a local battery cylinder. A steady local light contrasts with the intended intermittent AI-side light. This static board does not demonstrate light behavior and essential information must not depend on blinking.
- Use ivory ceramic, dark copper and faded safety orange. The flat colors, silhouettes, seals and housing forms are visual proposals from the canonical brief, not proof of shipped materials or geometry. [S1: room.models, room.materials_lighting, room.acceptance; S3: Models and construction, Materials and lighting]

## Scope boundaries

No lock puzzle, irreversible choice, Destroy ship control or armed-overload state belongs here. Do not invent a repair, battery swap, lever pull, network reconnect or contactor operation objective. The later manual authorization and overload sequence remain elsewhere in the canonical campaign. [S1: room.combat_contract, room.acceptance; S2: lines 21-23]

No layout stage work, runtime changes, Rooms1-7 edits, shared-system changes, publication, git commit, receipt, registry edit or live preflight invocation is part of this delegated task. The older dependency and release checklist in issue33 does not override its current-production-authority section or the live operating policy.

## Source map

- S1: `rollout-sources/room12-brief.json`, canonical snapshot at source commit `7a3f262886104fb024de9684958b3f85a8859f34`. Snapshot copied locally as `sources/room12-brief.json`.
- S2: `rollout-sources/storyRooms.ts`, full file read and compared byte-for-byte with `src/game/roguelike/storyRooms.ts` in the permitted worktree. Local source copy `sources/storyRooms.ts`. Pinned repository source: https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/storyRooms.ts
- S3: live room issue33, read using `gh issue view 33 --repo cdb-lumen/containment --json number,title,body,state,url`. Local response `sources/issue33.json`. URL: https://github.com/cdb-lumen/containment/issues/33
- Operating policy read in full: `async-rollout-worker-prompt.md`, `map-model-production.md`, `production-guard.md`. Routing and human-review projections were also read. Hashes of consulted local policies and canonical inputs are in `source-hashes.json`.

## Evidence and reproducibility

`story-intent.png` is drawn by `draw-story-intent.py`, using Pillow 12.3.0 and DejaVu Sans regular/bold fonts. No stochastic generation or external media is used. Run the script by its absolute path to render beside it. `source-hashes.json` records font and source hashes. `verification.json` records PNG decoding, repeat-render byte equality, source comparison, base/branch checks and package-copy comparisons.

Only source inspection and artifact checks are claimed. No gameplay, native capture, muted/skipped progression, collision, model readability at gameplay scale, lighting behavior or combat acceptance was tested. Independent and parent review remain separate handoff responsibilities.
