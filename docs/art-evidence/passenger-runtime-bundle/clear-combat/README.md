# Passenger Vault controlled combat

This is the corrected six-second clip. The earlier video in the parent directory remains rejected because its staging let the player overlap a stationary brute.

The corrected clip preserves the production desktop camera, renderer, movement, firing and damage. The player moves 48 units, then fires from a clear position. Three stationary, high-health brutes have harmless attacks and the encounter director is inactive. This is not organic enemy AI, campaign progression, DOM HUD, input or physical-device performance evidence. The MP4 is silent.

Runtime source: `12d098122a49ef560ef4c1ec63af0805c822d875`. Runtime source and assets are unchanged at the parent evidence commit `a58af2ae0af359f4b8478edee05ce96377276079`.

Verification decoded 120 frames at 20 fps and 1280 × 900, with no decode errors. It rehashed 250 source files and checked 360 player/enemy radius separations, with a minimum clearance of 68 game units. There were 31 shots and 480 authoritative armor-plus-health damage. Independent review and parent frame inspection accepted the corrected player/enemy separation.

The external capture script differs from committed `scripts/room-demo.mjs` only in source/dependency binding, temporary-file handling, bounded staging and separation assertions. Its SHA-256 is `8a1d742c051ccd3c90c4cdb0ffa04c1c9db785678e643cc9a16db589dba33229`. These files publish the verified recording, not a claim that the committed script reproduces the revised staging.
