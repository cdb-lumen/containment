# Room11 room visuals, attempt993

Passed bounded stage3 review. Parent directly inspected the original desktop-in-scene.png and overview.png. Independent reviewer also inspected both originals and passed this stage. This is not final room acceptance.

The teal semicircle brings both console banks into one working area facing the ship cutaway. The darker outer deck keeps the ivory consoles and amber purge routing distinct. Rear ribs and instrument bands give the shell a consistent engineering finish. Layout, occupied berths and collision remain unchanged.

Fine transverse floor seams remain busy in places. Flush service runs can look like thin rods. Neither blocks this room-composition stage; inspect them alongside console construction during model iteration. Console details are still simple. No visible floating or broken shell join appears in these two views.

## Verification

Parent reran `npx vitest run tests/DiagnosticGallery.test.ts`: eight tests passed. Independent reviewer reran DiagnosticGallery and ShipEnvironments: 33 tests passed. Author focused suite passed 42 tests. Author's recorded `npm test`, `npm run build` and `npm run test:room-evidence` each exited zero. Full tests report 767 Vitest passes and one skip, followed by passing chained checks. Build retains the existing bundle-size warning. Initial missing-shell and emissive-default assertion failures remain in local logs; final checks pass.

The capture command selected only diagnostic-gallery with desktop, gameplay-all and verify-all. Original source hashes include the new architecture file, not only HEAD. Independent verification matched all source pins and both image hashes. The parent checked fresh main ancestry and clean cumulative whitespace. The only production edits are Room11 architecture and its exact-template registration. No other room, camera, HUD, shared gameplay, lighting or collision edits.

## Evidence limits and next step

Controlled staged simulation uses production rendering and desktop camera composition, with fixed-step combat and staged actors. No DOM HUD, ordinary campaign play, touch or complete browser-smoke verification. The overview uses a fitted camera. These PNGs do not prove sustained combat or release readiness. Room11 post-bake disposal has code-path review, not a fresh event-counting lifetime test.

Next: stage4 model iteration only under a new scheduler permit. Preserve the accepted layout and historical failures. No human acceptance, merge or deployment.
