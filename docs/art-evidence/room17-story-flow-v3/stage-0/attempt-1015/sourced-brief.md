# Room17 shielding gate story intent

Stage 0, attempt1015, task `room17-story-flow-v3`. This is a proposed story-intent assembly, not gameplay evidence, a room layout, a collision design or accepted art. The parent owns independent review and publication. No runtime files change.

## Function and player goal

The canonical objective is "Clear the last defensive line before the reactor." The environment is containment, not the reactor itself. The room protects reactor access through a stepped radiation barrier. The player should recognize nested shielding and its drive machinery, clear the defensive encounter and continue through a visibly open passage. [S20, B12, B17, B29]

The sources establish the defensive encounter but do not state who opened the gate or why. This concept therefore depicts the leaves static and open without inventing sabotage, a failed closure, damage history or a new gate interaction. "Sliding" describes the construction, not an animation or new mechanic. [B12, B17]

## Proposed visual interpretation

The original PNG uses an annotated, shallow-perspective assembly diagram. Nested grey leaves sit in stepped backing frames. Steel contact edges distinguish the layers. Paired exposed screw shafts run from gear housings into drive nuts beside the aperture. Guide shoes support the leaves, and locking wedges remain outside the opening. Recessed dosimeter plates read as containment instruments. Their neutral marks do not assert a radiation reading or an active hazard. [B17, B21-B22]

Dull lead-grey shielding, brushed steel contact edges and faded ochre service paint follow the brief. Ochre marks stay on solid machinery. No warning paint or hardware crosses the clear opening. The diagram's teal arrow is an editorial direction marker, not a proposed in-game sign or an escape indicator. No new light behavior is proposed. [B18, B29]

The open passage is the main negative space. The board states that the stepped approach and broad alternate lanes must remain. It deliberately does not place the assembly on a room plan, specify dimensions, move obstacles or claim that the pictured proportions fit the game. A later permitted layout stage must reconcile the assembly with actual topology, required anchors, matching collision and large-actor clearance. [B12, B31, T24-T34]

## Story boundaries

- Preserve the final defensive encounter and existing objective. Do not replace combat with opening a door. [S20, B12]
- Keep leaves static unless an existing runtime state supports motion. No timed closure, crushing hazard or invisible blockage. [B12]
- No armed overload, countdown, escape cue or premature manual-authorization event. The following canonical story entry still says overload is not armed and passengers are alive. Room17 art cannot move that decision earlier. [S21-S23, B29]
- Do not inherit assets from unaccepted preceding rooms. This board is drawn from primitives and fonts only.

## Sources

All game source links below pin commit `7a3f262886104fb024de9684958b3f85a8859f34`.

- S20-S23: [storyRooms.ts, lines 20-23](https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/storyRooms.ts#L20-L23). Room17 objective, environment and later story boundaries.
- B12-B31: workspace `rollout-sources/room17-brief.json`, lines 12-31. Pinned source commit above. Combat contract, landmark, mechanism, materials, story dressing and topology brief. The snapshot labels the inherited brief historical and requires revalidation. Its Room17 identity and objective agree with S20. The parent supplied a live [issue39](https://github.com/cdb-lumen/containment/issues/39) read confirming nested leaves, screw drives, the last defensive line, a static clear opening, broad alternate lanes and no armed-overload or escape cues. This subagent did not independently fetch the issue and does not treat the issue URL as immutable evidence.
- T24-T34: [storyRoomTemplates.ts, lines 24-34](https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/storyRoomTemplates.ts#L24-L34). The Room17 base footprint table, common room anchors and authored topology override. The table alone is not final topology or a clearance proof.
- R18-R22: [roomTemplates.ts, lines 18-22](https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/roomTemplates.ts#L18-L22). Solid footprint versus decorative geometry contract and inclusion of story templates. Source comments about radius clearance are not test results for this concept.

## Pinned SHA256

| Workspace source | SHA256 |
| --- | --- |
| `rollout-sources/room17-brief.json` | `a8ef7779e1105b64b39253dd4a4ec23b3b32c96f9e10fc3b9bc5cad31a94a3d7` |
| `rollout-sources/storyRooms.ts` | `f9f1248316c721c4f5c683eb9661f8ed2f95e34685b931f45b63b508e473c715` |
| `rollout-sources/storyRoomTemplates.ts` | `d02c5d7c86084f4731c5fed97861e190339664b33fd8863663c1ac7362ba1681` |
| `rollout-sources/roomTemplates.ts` | `0e3fc4e407a5072ae3370c12311e4f1357cb98712a154af9f7f1c00fdde25629` |

## Reproduction and limits

Run `python generate-board.py story-intent.png` with Python 3, Pillow 12.3.0 and Debian DejaVu Sans fonts in `/usr/share/fonts/truetype/dejavu`. The generator uses no random input, network, timestamps or runtime assets. It renders at double resolution and exports an RGB PNG at 2400 by 1700 pixels. Exact-byte reproducibility is checked in the same installed environment. Other font or Pillow versions may rasterize differently.

Local verification covers pinned hashes, source-to-commit equality, PNG decoding, deterministic regeneration, copy equality and repository write scope. Author visual inspection covers legibility and the illustrated static opening, not independent acceptance. Layout, navigation, collision, actor clearance, live combat and gameplay-camera readability are untested. Independent visual review, parent review and publication remain outside this handoff.
