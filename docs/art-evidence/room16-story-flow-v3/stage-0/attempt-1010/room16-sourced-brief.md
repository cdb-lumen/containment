# Room16 story intent

Stage 0, attempt 1010. Source-backed concept drawing only. Not gameplay, not layout approval, not production art. No acceptance, publication, runtime change, merge or deployment is claimed.

## Deliverable

Use [room16-story-intent-v2.png](room16-story-intent-v2.png) as the reviewed drawing candidate. It compares a reconstructed human distribution hub with its invaded state using the same illustrative camera and service directions. It is not a capture of an existing room.

The first render and its generator remain intact as `room16-story-intent-original.png` and `generate_board.py`. That render had wall and floor lines outside the drawing panels. `generate_board_v2.py` contains the panel clipping and framing correction. The revised PNG was inspected with the vision tool. This was the author's inspection, not independent approval.

## Canonical objective

> Break the concentrated swarm guarding reactor access.

The exact objective appears in `sources/storyRooms.ts:19`, the room16 brief at `sources/room16-brief.json:12`, and live issue #37 under Combat and circulation. The route places `swarm-junction` after `infested-workshop` and before `shielding-gate`. This is campaign room 16, not a new campaign room. The route provides no extra room16 story text or hive explanation. [S1, S2, S5]

## Original function

This was a human ship distribution junction. Three ordered service trunks meet a low metal distributor. Cable saddles support the runs; bulkhead ribs and a far-wall directional gantry preserve the ship's original purpose. The rectangular distributor casing, service-slot arrangement and exact camera are an illustrative reconstruction. The sources establish a severed distribution hub, not an approved historical model. The gantry text `REACTOR ACCESS >` is proposed dressing, not new canonical dialogue or an interaction prompt. [S1, S5]

## Invaded function

Three long roots reuse the service directions and converge on one low routing organ. A, B and C identify the three roots in the drawing, not doors, enemy spawns or player routes. Each root terminates in a separate cut end. Overlapping charcoal plates sit over bone-grey ribs and tendon-like beds. A dark recessed cavity stays within the low central silhouette. Torn cable saddles and peeled ship ribs connect the growth to recognizable human infrastructure. The damaged gantry stays on the far wall. [S1, S5]

The change from ordered services to converging growth suggests coordinated intent. It does not establish a hive explanation, synchronized AI or a new creature. Radial organization and one routing organ distinguish this room's intent from the preceding workshop without importing that room's art. [S1, S5]

## Boundaries

- Preserve the canonical concentrated-swarm encounter and objective.
- No new boss, spawn emitter, AI behavior, interaction or hive explanation.
- No eye, beam, attack telegraph or decorative pulse is authored here. The recessed cavity is unlit in this still drawing. Source permission for a restrained pulse does not approve animation.
- Keep escape turns between routes and incoming threats readable. No root lobe should hide emergence. These are retained requirements, not verified results.
- The camera, floor perimeter, root lengths, hub footprint and sign placement are concept composition. They are not an approved collision plan, navigation proposal or runtime geometry.
- No unaccepted earlier-room assets, textures, screenshots or models were used. All forms were drawn by this CPU script with bundled fonts.
- Stage 0 does not establish visibility in native gameplay, enemy approach behavior, spawn safety, performance or combat acceptance. [S1, S5]

## Source checks and authority

The rollout manifest declares source commit `7a3f262886104fb024de9684958b3f85a8859f34`. The three requested TypeScript files were read in full and their SHA256 values matched that manifest. The room16 brief was also hashed and preserved. Its `brief_status` is `historical_revalidate_story_and_function_before_use`, so this brief uses it only after comparing the objective and art direction with the canonical route and live issue. [S1, S2, S6]

Live issue #37 was fetched through `gh issue view` on 2026-10-01 UTC. The preserved response is OPEN, reports `updatedAt` of `2026-09-30T11:09:57Z`, and contains zero comments. Its Current production authority section allows independent production without prior-room acceptance and forbids merge or deployment. The older dependency and release checklist lower in the issue are not treated as stage0 authority. No write to the issue was made. [S5]

`storyRoomTemplates.ts:23` defines three base obstacle rectangles for `swarm-junction`. Lines 31 through 34 provide defaults and then spread `AUTHORED_ROOM_TOPOLOGIES[room.templateId]`, which can override them. `roomTemplates.ts:18-22` separates decorative geometry from collision footprints and includes the story templates. The board does not turn these base rectangles into an asserted final layout. The authored topology dependency was not supplied among the pinned sources and was not needed for this story-intent comparison. Effective runtime topology remains unverified. [S3, S4]

The working directory is an artifact workspace, not a git repository. No git state, commit ancestry or current-main parity was established. The commit identity above is the rollout manifest's declared pin, supported here by local hash matches rather than a git checkout inspection.

## Source index

- S1. [Room16 brief snapshot](sources/room16-brief.json), lines 10 through 31. Objective, distribution hub, root construction, materials, story and circulation boundaries.
- S2. [Canonical story route](sources/storyRooms.ts), lines 18 through 20. Exact room16 identity, objective and narrative neighbors.
- S3. [Story room templates](sources/storyRoomTemplates.ts), lines 23 and 29 through 35. Base footprints, defaults and authored-topology override.
- S4. [Room templates](sources/roomTemplates.ts), lines 18 through 22. Collision/decorative separation and story-template inclusion.
- S5. [Live issue #37](https://github.com/cdb-lumen/containment/issues/37), preserved in [issue37-live.json](sources/issue37-live.json). Current production authority, Landmark and composition, Models and construction, Materials and lighting, Environmental story, Combat and circulation, Room-specific acceptance.
- S6. [Rollout manifest snapshot](sources/manifest.json), lines 2 through 9. Declared source commit, dependency policy and canonical file digests.

Full local paths, fetch time and SHA256 values are in [source-manifest.json](source-manifest.json). Artifact and font hashes are in `artifact-sha256.json`.

## Reproduction and inspection

The generator uses Python and Pillow 12.3.0 with bundled DejaVu Sans fonts. It draws at double resolution and downsamples to a 2400 by 1680 RGB PNG. It uses no random input, GPU, image model or game runtime. Each output path is opened exclusively so a rerun cannot overwrite existing evidence.

Run from this directory with a new output filename:

```sh
python generate_board_v2.py --output room16-story-intent-new-replay.png
```

A completed second run produced `room16-story-intent-v2-replay.png` with the same SHA256 as the revised candidate:

```text
fe7e5fef32e9a7c8a4b9ff7c72e623cbbaecd1b3e212f825ef942a5a387df644
```

Vision inspection of v2 found the drawings contained inside their panels, clear before/after contrast, three labeled root directions, a recessed cavity, severed saddles, charcoal plates, exposed ribs and the surviving far-wall gantry. The objective and stage boundaries are readable. The stylized plate bands remain schematic, not sculpted production detail. No live encounter or gameplay validation was attempted.
