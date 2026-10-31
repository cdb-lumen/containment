# Room19 stage2 independent final supplement

## Verdict

PASS for bounded stage2 rough equipment purpose, placement, scale, neighbors and route preservation on the refreshed evidence. The guarded desk and neighboring status panel remain visibly distinct. The earlier source/capture mismatch is resolved for this reviewed revision. This is an independent model review, not human approval, finished-art acceptance, campaign acceptance or permission to publish.

The failed `independent-review.md` remains historical and unchanged. Its SHA256 is `69444c649422dd7de3a25ac2b85277a8b2286be0efc99a15792f88d829c908c6`. This supplement does not retroactively pass the old evidence or interrupted capture.

## Evidence and provenance

I read the prior review, stage1 layout, current rough-equipment builder and focused test file, capture provenance, refreshed manifest and verification logs. I opened both NEW original PNGs with vision:

- `final-capture/19-manual-control-chamber-overview.png`, SHA256 `e20684d662c833493dad61b4c25d13e4cf26e4c32ab04ccd1250def5c73a117c`.
- `final-capture/19-manual-control-chamber-gameplay.png`, SHA256 `23b11607381a42933b23451b3da0a79dfd69c435f3ce461cdc84e419ec391330`.

Programmatic checks confirm two unique Room19 mode rows, both original images at 1280 by 900, matching manifest image hashes, empty capture error arrays, zero recorded WebGL errors and no recorded context loss. `parent-capture.log` records both captures and two images. Both originals show the intended room and equipment, not loading or transitional screens.

All nine `capture-source.json` worktree source pins match the actual files, checked before and after my CPU test. In particular:

- `src/render/ManualControlBlockout.ts`: `bb880a41b21b97ab18914321372b21f496c92802a713fc144f180411ad71e116`.
- `tests/ManualControlBlockout.test.ts`: `7ea215e630892fec7f3b8868cf4a05a43ebbaeecaeb48f091fbb9e15ae92d537`.

The manifest identifies base commit `8969a2811eff313fa945b62f7ccdea4a6fe86439`. Individual source hashes identify the uncommitted revision actually reviewed. The current builder places the service rows at `.21+n*.045`, matching the corrected revision rather than the earlier failed attachment state.

## Bounded visual assessment

- Purpose and distinction pass at rough-model level. The pale southern desk has nested dark guards, a light crossbar and one recessed red actuator. The narrower neighboring board has status rows and an amber header. It does not read as a duplicate actuator. Passenger identity and fatal-warning wording are not legible, so those semantics still depend on the brief and source.
- Placement and neighbors pass. Two northern switch cabinets flank the open middle; the desk and board share the southern reservation without merging into one object. Copper leads visibly connect the pair across their gap. The refreshed views establish the connection's rough visual role, while the CPU test supplies the bounded feedthrough intersection check.
- Scale passes for this stage. The equipment reads as substantial fixed controls relative to the visible player and enemies, not loose props. Repeated recessed switch rows distinguish the cabinets from cargo boxes. Their low height and the desk's slope are clearer in source than in these high camera views, so this is not all-angle silhouette acceptance.
- Routes remain readable. The overview leaves broad floor around the three reservations and a clear middle crossing. The southern pair does not add clutter to the outer loops. The staged enemies overlap part of the right cabinet and occupy the central approach, but neither southern control is hidden. These pixels support placement, not unrestricted combat or movement claims.
- The north-wall observation recess is locatable in the overview, but horizontal wall rails weaken its recessed-window read. The gameplay frame excludes that wall. Retain this as a later art-readability issue, not a stage2 placement blocker. The existing symmetric reservations remain the accepted baseline, not a completed asymmetric bunker composition.

## Verification

I independently ran `npx vitest run tests/ManualControlBlockout.test.ts` in the specified worktree. At 03:16:14, it returned exit code 0 with six tests passed in one file. The test covers existing-footprint bounds, low cabinets, desk/panel separation and relative height, ceramic feedthrough intersection with the panel foot, outboard wall recess, batching/disposal, another room's fallback and sampled route segments at radii 16 and 28. These checks do not establish functional safety guards or explicit player consent.

The supplied `green-final.log` reports 40 focused tests passed across three files. `npm-test-final.log` reports 765 Vitest tests passed and one skipped, zero Node test failures and successful Python checks. `build-final.log` records successful TypeScript and Vite build completion, with a non-blocking large-chunk warning. These are inspected parent/writer results, not full-suite reruns by me.

The refreshed manifest records a staged route reaching the exit and a short fixed-step combat sample. I did not rerun that fixture. It uses controlled legal actors, an inactive encounter director, no boss, no campaign progression and no DOM HUD or touch input. This is controlled browser simulation evidence, not a live campaign session.

## Limits and remaining work

No blocking issue remains for this bounded stage2 verdict. Final materials, detailed guard construction, warning typography, observation-window readability, all-angle collision/render agreement, continuous combat, explicit Destroy ship confirmation safety and final art acceptance remain outside this result. Mobile and HUD integration are not gates for this stage and were not reviewed.

I created only this supplement. I did not edit runtime source, tests, prior reviews, captures or provenance, start a GPU job, commit or publish.
