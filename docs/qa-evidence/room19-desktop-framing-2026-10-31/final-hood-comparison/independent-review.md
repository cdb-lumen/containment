# Independent Room19 hood review

No blocking findings for the bounded hood/cavity visibility repair at `34be8dc06b27343765e1321dcce946187ae736dc`.

Compared `/workspace/room19-final-original-hood` (source `5a240d3efe11556a608dc5fe881aba07615d65cc`) with `/workspace/room19-final-repaired-hood` (source `34be8dc06b27343765e1321dcce946187ae736dc`). Both captures are terminal passed with no recorded errors.

- Git comparison confirms the only difference is `src/render/ManualControlBlockout.ts`: hood depth changes from .86 to .22 and its z position from -.46 to -.84, plus explanatory comments. Camera, HUD, projection, gameplay and other geometry are identical between these sources.
- Independently checked all 283 recorded source-file hashes per capture against their committed Git blobs: no mismatches. Before/after source records are identical and clean for both captures. Both harness hashes match `/workspace/room19-desktop-inspect-final.mjs`; all six PNG hashes match their manifests.
- Inspected actual full-resolution center-native, north-native and explicit fitted-overview pixels for both sources. Center-native is pixel-identical. Native north shows the repaired dark slit clearly between the lintel, projecting sill and jambs; the original hood obscures it. The overview confirms the same improvement while preserving visible framing/depth. Neither inspected north view places critical HUD over the cavity; the marine remains visible.
- Native center and north metrics match exactly between sources, including player state, camera position, projection and zoom 1. Pixel differences are confined to the hood region: native north bounding rectangle (744,18)–(1023,51), overview (717,39)–(925,64). No unrelated visual differences were detected.
- Reviewed the preserved red log: original hood fails both the original cavity ray test and the 45-ray native/overview matrix, while nine other tests pass. The same tests retain solid lintel and projecting-sill depth checks; this does not make the cavity visible by flattening the frame or weakening acceptance.

Scope and limits: these are staged legal center/north positions with settled production rendering and HUD, not live traversal or combat. The cavity is outside the center-native framing; visibility is substantiated at the inspected north position and explicit overview only. The overview deliberately changes camera framing and is not the shipping gameplay projection. External font CSS is suppressed. No full-room traversal, animated approach, fatal-choice flow, performance or human art approval is established. The prior camera-only pair (3d6cc5e → 8ed266e) is separate evidence; this pair isolates hood geometry with the same camera/HUD code.

Review used existing artifacts and CPU checks only. No renderer was launched and no shipping source was changed.
