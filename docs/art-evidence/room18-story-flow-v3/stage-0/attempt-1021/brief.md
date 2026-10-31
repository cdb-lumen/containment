# Room18 story intent

A continuous service ring surrounds a shielded reactor jacket. Reaching the manual-control chamber is not consent to destroy the ship. Passengers are alive and overload remains unarmed.

This board is a story concept, not gameplay evidence, a measured layout, a model approval or human room acceptance. Runtime source is unchanged.

## Canonical story

Pinned `storyRooms.ts`, line21, gives the objective exactly:

> Circle the shielding. Reach manual controls. Overload is NOT armed.

Its story is:

> PASSENGERS ALIVE. Manual authorization still required.

Room17 is the last defensive line before reactor access. Room19 contains the explicit destruction choice. Room18 does not add another choice, an automatic trigger or a countdown. No specific reactor damage, sabotage or newly failed safety system is established here. The ship's invasion is prior campaign context, not permission to invent a fresh incident.

## Original function and proposed visual language

The reactor jacket contains the core. Its outer service ring lets personnel circulate and inspect the shielding. The illustration proposes overlapping ceramic-grey courses, mounting bands and recessed inspection plugs. Radial supports sit below the circulation edge. Services belong under the deck or inside equipment footprints, never across the walking ring.

A separate passenger-vitals rail and authorization indicator distinguish living passengers from permission to arm. The board expands these two indicators for legibility, not as a proposed HUD change. Sparse amber marks service points. Shielding conceals the core emission. No red alarm wash, exposed glowing bomb or armed-overload animation.

The intended sequence is to recognize the shielded center, circle it in either direction, read the living/unarmed status, and continue to manual controls. The center remains solid and inaccessible. The layout stage must resolve broad connected circulation, entry/exit anchors, low camera-facing shielding and actor clearance against actual production geometry. This illustration does not prove those properties.

## Sources and limits

- [Room40 brief and criteria](https://github.com/cdb-lumen/containment/issues/40), read live for this attempt.
- [Campaign issue21](https://github.com/cdb-lumen/containment/issues/21), current asynchronous workflow governs over historical release prerequisites.
- Canonical source commit `7a3f262886104fb024de9684958b3f85a8859f34`. Hashes of the four guard-pinned inputs are in `source-pins.json`.
- `rollout-sources/storyRooms.ts` lines20-23 establish adjacent story states. `storyRoomTemplates.ts` retains the current solid-center footprint. Current main topology is not claimed to implement this concept.

No preceding-room unaccepted assets were used. No gameplay, camera, HUD, engine, collision or other room files changed. Source/pin equality, PNG decoding and reproducibility are the checks for this concept-only stage. Gameplay tests, browser capture, live combat and the full verifier are not claimed or required to validate a diagram.

Reproduce with `python render_story.py` using Pillow and DejaVu Sans. The PNG is a deterministic authored diagram, not an AI-generated gameplay screenshot.
