# Infested workshop, story intent

A human machine shop has become an alien construction station. Keep the lathe and manipulator recognizable under selective conversion. The player clears the converted workshop and its converging attackers. No repair interaction or new combat behavior is proposed.

## Sources and interpretation

- Canonical `rollout-sources/storyRooms.ts`, line18, fixes the room identity, infested environment and exact objective, "Clear the converted workshop and its converging attackers." It supplies no additional room story text.
- The source-pinned `rollout-sources/room15-brief.json` and live [issue36](https://github.com/cdb-lumen/containment/issues/36) specify the lathe, altered manipulator, broken guard, directional resin on fixed base and chuck housing, tendon braces, cut insulation and workpiece inside the machine footprint. These details are a visual interpretation of conversion, not a new canonical event or named culprit.
- [Campaign issue21](https://github.com/cdb-lumen/containment/issues/21) requires readable original function, quiet combat floors and machinery that explains its construction. Its current asynchronous workflow supersedes the historical predecessor-release dependency.

## What the player should understand

This was useful human equipment. The invaders have retained its working parts and adapted its supports. Exposed chuck, parallel ways and carriage carry the original function. Tendons follow the articulated arm; directional resin grips fixed housings. Peeled insulation supports deliberate intervention rather than indiscriminate overgrowth.

The board proposes a lathe-centered assembly with a manipulator handling the same workpiece. It is a side-view story diagram, not a room layout, engineered machine, authored 3D model or gameplay screenshot. The drawn resin strips communicate direction only, not finished fibrous material quality. Exact arm reach, tooling, support and scale remain for model stages.

## Next-stage constraints

Draft room layout only under the next valid permit. Preserve entry, exit, converging-attacker lanes and existing authoritative geometry until a room-local tested change is authorized by its stage. Growth must remain within matching machinery collision and must not silently occupy corners, conceal small enemies, resemble pickups or imply poison hazards. Keep oil-dark steel and chipped workshop yellow distinct from matte resin, with sparse wet edges and low local work lamps.

No assets from pending earlier rooms are used. No source, model, camera, HUD, engine, lighting or gameplay changed in this stage. Rooms1-7 and all earlier failures remain untouched. This is a machine-reviewed story candidate, not human room acceptance or release.

## Evidence and verification boundary

`story-intent.png` is an original deterministic Pillow illustration. `render_story.py` is its editable source. Base source is `7a3f262886104fb024de9684958b3f85a8859f34`. Exact input hashes are in `source-pins.json`.

Story-stage checks cover the emitted permit, canonical hashes, unchanged runtime, PNG decode and bounded publication, deterministic regeneration and Git whitespace. Gameplay, route, model, browser and full verifier tests are not claimed at this concept-only stage.
