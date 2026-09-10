# Passenger Vault gameplay acceptance

PASS for the room's bounded built-app gameplay check on `05c33044f3107e18f7ef58c7f02baa07c4877a28`. Production runtime and assets are unchanged from verified source `12d098122a49ef560ef4c1ec63af0805c822d875`.

Real keyboard input defeated all 13 organically spawned enemies: five crawlers, six brutes and two spitters. The recording contains 47 shot events, 43 enemy attacks, health loss and movement by every observed enemy. One organic pickup was collected during combat, before room completion. The player survived, reached zero remaining enemies, selected a boon and entered Residential Gallery through real route UI clicks.

The shipping objective completes automatically when the encounter clears. `DepthGame.clearRoom` opens the reward screen; walking through the decorative exit portal is not a progression requirement. No direct damage, teleport, forced completion, synthetic enemy spawn or balance change was used.

## Method and limits

A validated prior-room checkpoint skipped Awakening Bay. The served production build added observation-only game/renderer references and effect logging. The automation used production keyboard auto-aim. The 1280×900 CSS viewport and camera were unchanged, but device scale was 0.25 to bound software-WebGL cost. This check proves gameplay and UI transitions, not native visual quality, manual mouse aim, physical-device performance or every possible route. Native desktop/portrait appearance and the six-second gameplay video have separate evidence in this directory.

The browser reported no errors. Browser, HTTP server and SSR helper closed. The source checkout stayed clean. The run covered 65.37 simulation seconds and 152 observations. Its raw observation record SHA-256 is `076e81772294cc19539fccd268d956b359ea39ca406db5b6a9dfb0fb2acdacda`.

Independent final-owner review found no remaining concrete must-fix. Six bundle CPU tests and 69 focused Vitest tests passed. Full local verification on the unchanged runtime and CI Verify run `34480858823` passed desktop/touch smoke. This evidence does not claim deployment; merge and hosted-artifact verification remain separate.
