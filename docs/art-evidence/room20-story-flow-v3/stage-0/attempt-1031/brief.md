# Room20 story intent

Local stage0 concept for room20-story-flow-v3, attempt1031. This is not layout acceptance, a gameplay capture, a runtime implementation or human acceptance. Publication, independent review and the guard receipt belong to the parent.

## Story

The overload crucible is the ship's final occupied workplace. The illustration reads its original function as regulated ship power, with heat removal, electrical distribution and structural restraint. That engineering reading is a design inference from the reactor setting and the service assemblies requested in issue42, not a newly established mechanic or a claim about the ship's propulsion.

The player has already chosen Destroy ship in Room19. Passengers were alive at authorization. Room20 asks the player to defend that deliberate fatal sequence, not find another switch or escape route. The ship and everyone aboard are lost. New Earth has been warned. The exact ending is SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED. [1]

## What the board shows

An exposed axial column and nested induction rings sit in the central void. Pale insulators interrupt bronze conductors. The coolant head uses a broad manifold with paired return pipes. The power head uses parallel buswork with ceramic collars. The restraint head uses a raised fork and piston. These silhouettes explain different service roles without turning the heads into new player objectives. Attached under-deck braces suggest the installation's weight. Their forms and placements remain proposals. [2]

The cutaway uses the canonical boundary and void coordinates, projected for illustration. The core is exaggerated for readability. The resulting silhouette is not a camera match, a collision plan or evidence that the proposed details fit the runtime footprint. The diagram has no colored hazard sectors and no evacuation affordance.

## Constraints carried forward

Preserve the connected three-lobed boundary and central void. Keep spawn at 140,440; the compatibility exit at 1060,440; and four breach anchors at 240,320, 960,320, 240,680 and 960,680. Keep obstacles empty. The compatibility exit must never become an escape sign, pod or beacon. Sector hazards are unimplemented and must not be implied by art. [2][3]

The historical footprints in storyRoomTemplates.ts do not determine the final Room20 geometry. Its authored topology spread overrides the fallback spawn, exit, obstacles and breaches. roomTemplates.ts imports that final story template set. [4][5]

Later stages must check physical fit, connected circulation, silhouette readability under actual overload lighting, combat visibility, burial and occlusion. Real post-authorization gameplay must verify the fatal ending and no skip-triggered behavior change. None of those checks ran for this concept. [2]

## Sources

Canonical base is 7a3f262886104fb024de9684958b3f85a8859f34. HEAD and local origin/main both resolved to it. The initial worktree was clean on art/overload-floor-v3. No unaccepted branch assets were used.

1. src/game/roguelike/storyRooms.ts, lines21-29. Room18 remains unarmed, Room19 requires explicit destruction authorization, Room20 defends the fatal overload, and line29 defines the exact ending. https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/storyRooms.ts#L21-L29
2. Live issue42, read through gh issue view. OPEN at readback. Its current authority supersedes the historical preceding-room release dependency. The landmark, assembly roles, materials, no-escape contract and deferred gameplay checks are explicit. https://github.com/cdb-lumen/containment/issues/42 . Local rollout-sources/room20-brief.json corroborates these requirements and identifies the canonical base; its historical_revalidate_story_and_function_before_use status was respected.
3. src/game/roguelike/authoredRoomTopologies.ts, lines76-82. Exact boundary, void, anchors and empty obstacles. https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/authoredRoomTopologies.ts#L76-L82
4. src/game/roguelike/storyRoomTemplates.ts, lines27-35. Fallback footprints and authored overrides. https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/storyRoomTemplates.ts#L27-L35
5. src/game/roguelike/roomTemplates.ts, lines1-22. Story-template registration. https://github.com/cdb-lumen/containment/blob/7a3f262886104fb024de9684958b3f85a8859f34/src/game/roguelike/roomTemplates.ts#L1-L22

Policy read before creation: async-rollout-worker-prompt.md, map-model-production.md and production-guard.md. Routing was checked against map-model-state.json. The human review queue was read for context. This subagent used only the delegated Room20 stage0 scope and did not invoke preflight or modify guard state.

## Reproduction

Run `python generate.py` from this directory. Requires Pillow and the two DejaVu fonts named in source-manifest.json. The generator reads only the pinned canonical files, draws original geometry with Pillow and writes story-intent.png and source-manifest.json beside itself. Font and source hashes are recorded. There is no randomness, timestamp or network-dependent rendering.
