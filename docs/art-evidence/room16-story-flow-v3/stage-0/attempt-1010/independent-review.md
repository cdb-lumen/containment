# Room16 independent stage 0 review

Result: PASSED for stage 0 story intent only.

I inspected `room16-story-intent-v2.png` with the vision tool and read `room16-sourced-brief.md`, the source snapshots, source pins and `verification.json`. This is a diagram concept review, not gameplay evidence, layout acceptance, finished-art approval or final room acceptance.

## Story and visual findings

- The before panel shows a rectangular ship distributor fed by ordered cable runs from three directions. Repeated cable saddles, wall ribs and the far-wall reactor-access gantry establish a human service junction rather than an unexplained alien chamber.
- The invaded panel keeps those service directions but replaces the distributor with one low radial mass. Roots A, B and C extend left, right and toward the foreground. Their separated ends and shared center make the three-root convergence clear. The labels explicitly identify root directions, not doors or spawns.
- Pale ribs cross dark layered plates. Bent supports and severed ends connect the growth to damaged ship infrastructure. The retained wall and damaged gantry make the before/after relationship legible. Tendon construction and peeled bulkhead attachments remain schematic.
- A dark oval cavity sits inside the central silhouette. It has no visible beam, glow or attack cue. The concentric outline could become eye-like in a later treatment, but this still does not establish a boss or emitter.
- The board states the exact objective, "Break the concentrated swarm guarding reactor access." The gantry supports the reactor-access context. No enemies are drawn, so the concentrated swarm is communicated by the sourced objective, not demonstrated visually as an encounter. That is sufficient for this stage.
- The radial transformation supports the brief's suggestion of coordinated intent without explaining a hive or adding synchronized AI. The prose explicitly rejects new bosses, emitters, AI behavior and interactions. No conflicting story claim appears in the drawing.

## Source and evidence checks

`rollout-sources/room16-brief.json` identifies campaign room 16 as `swarm-junction` and marks the historical brief for revalidation. Its combat contract, landmark, model direction and story dressing agree with the submitted concept. `storyRooms.ts:18-20` places the room between `infested-workshop` and `shielding-gate`. Line 19 supplies the exact objective and no additional room story text. The rectangular original distributor and sign wording are properly disclosed as proposed reconstruction and dressing, not canonical historical facts.

I recomputed SHA256 values. All six snapshots match `source-manifest.json`. All five local originals match their snapshot pins, including the actual rollout brief and story route. The three TypeScript originals also match the rollout manifest. Its declared commit is `7a3f262886104fb024de9684958b3f85a8859f34`. These are local file-pin checks, not an independent Git ancestry or current-main check.

I read the preserved issue #37 body. Its retained objective and art direction agree with the concept. Its current authority separates independent production from final acceptance and prohibits merge or deployment. I checked the snapshot hash but did not refetch the issue, so this review makes no new live-issue freshness claim.

`verification.json` reports a 2400 by 1680 RGB candidate, matching replay and no gameplay verification. I independently validated the PNG dimensions and mode, its hash against that record, and its byte-hash equality with the existing replay. The candidate SHA256 is `fe7e5fef32e9a7c8a4b9ff7c72e623cbbaecd1b3e212f825ef942a5a387df644`. I did not rerun the generator. The record's CPU-only, asset-provenance and no-runtime-edit assertions were read, not independently audited from execution history.

The template sources confirm that authored topology can override base rectangles and that decorative geometry is separate from collision. No effective runtime topology is established by this board.

## Remaining later-stage risks

- Preserve the low radial silhouette at the shipping camera and phone scale. The plate outlines currently read as diagram geometry, not finished chitin or tendon construction.
- Make the torn human attachments and separate root cut ends readable without annotation. Keep the central cavity from reading as an eye, boss target or spawn source. Any future pulse needs a separate telegraph-readability check.
- Verify actual routes, escape turns, collision and enemy emergence against effective authored topology. A, B and C do not prove navigable routes or safe spawning.
- Test the existing concentrated-swarm encounter with enemies approaching each arm. The still proves neither threat visibility nor reactor-access progression.

No stage 0 story blocker found. Runtime tests and finished models are not required for this bounded pass. This review changes only `independent-review.md`; it does not authorize later-stage acceptance, publication, merge or deployment.
