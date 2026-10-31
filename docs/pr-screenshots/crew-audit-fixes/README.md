# Crew checkpoint audit fixes

Before: `31d9c7c228cdaba122975cf6cf183892a18e0ef5`. After: `ea7ff76b45b5eb173affec796726e60756fe6aed`.

- Subdivided gate faces keep the intended corner bend from deforming the flat plate. The raised wreck housing now intersects shots at the renderer's projectile heights without changing the blocker footprint.
- The station has a distinct seat and keyboard. Its monitor tilts upward so the shipping camera sees the screen face.
- The portrait story panel keeps its copy and 44px Skip target but clears the north-side marine. Desktop layout stays unchanged.

Five matched pairs are retained here. `provenance.json` records source hashes, image hashes, cameras, actor state and HUD rectangles. The complete capture run covered twelve pairs: desktop and portrait, gate/operator/north poses, expanded story and actual Skip. Every pair preserved camera, player, enemies, elapsed simulation time, combat state, quality, room and HUD copy.

These are static Chromium art views with legal staged poses, held simulation and production HUD/fonts. They do not prove live Room5 combat, physical-phone behavior or release acceptance.

The final runtime source passed `npm run verify`: 786 tests passed, one skipped; 33 room-evidence checks; production build; desktop and touch browser smoke. Independent source review and bounded visual review passed. Visual review covered every retained original, two additional final originals and the twelve-state contact sheet.
