# Room20 stage5 independent review

Verdict: failed overall validation because required static inspection coverage is incomplete. The supplied composition is readable and the independently run CPU checks pass. I found no demonstrated floating or clipping defect in the two supplied views. This is an evidence failure, not proof that the unseen views contain broken geometry, and not a rejection based on missing release gameplay alone.

## Scope and evidence

I read rollout-sources/room20-brief.json and the current map-model-production.md. I inspected both original PNGs through the vision tool, not a contact sheet or generated substitute:

- 20-overload-floor-gameplay.png, 1280 by 900, SHA256 0ec380068539269c3d0f215e12e8b96265b9f29a0bd3c8bba04a2f081b8113d3.
- 20-overload-floor-overview.png, 1280 by 900, SHA256 3655049957eeac4d5b04ee20b0b62d8edbbdf3e45d63efd87417b0e60bc988d6.

I independently verified those hashes. The worktree HEAD is 4712bd3076a7fe2b8a3542c9cb055549c692d662. Git status was clean before and after my CPU run. I read verification-summary.json, the relevant manifest.json capture metadata, check-routes.mjs, the room builders and the focused test sources. I did not run a GPU job, change runtime source, publish anything, or call a guard or receipt interface.

The capture is controlled live simulation with three staged enemies. The encounter director is inactive. The overview uses a fitted camera. The desktop image uses production camera composition from one player position without the DOM HUD. These images are not a real overload holdout or browser ending. HUD omission is permitted for this bounded art review and is not my failure reason.

## Story, layout and final pixels

The overview preserves the connected three-lobed platform and central void. The north service plates and side grilles distinguish deck areas without placing furniture across retreat space. The exposed central machine is the focal point. The pale segmented apron gives the pit a clear edge, while bronze buswork and ceramic separate the machine from the dark steel deck. No evacuation arrow, survivable pod or exit beacon is visible. The overview sign reads CORE / MANUAL OVERLOAD. Nothing in these static pixels promises escape or adds an apparent damaging floor sector.

In the desktop image, the coolant head reads as paired pipes on the left, the power head as three bronze conductors on the right, and the restraint head as a forward actuator between raised cheeks. The central column and stacked ring assemblies remain visible. Return pipes connect the lateral heads toward the core. Small fasteners are subordinate rather than the only means of recognizing the equipment. The player and three enemies remain distinguishable in this particular exposure. That observation does not establish dense-combat readability.

The floor is quiet enough to show the connected paths. The bright apron attracts more area than the narrow luminous column, but it still frames the correct focal point rather than competing with a false objective. The near edge shows a dark structural skirt and bronze vertical ties. The supplied pixels do not establish the support and ring visibility from the opposite lobe.

The concrete overall-review defect is the missing far-lobe normal-camera inspection. Both originals look toward the same exposed faces, with the gameplay player on the near side of the pit and the overview merely fitting more of that composition. The canonical brief explicitly requires inspection of core rings, clamps and under-deck supports from near and far lobes for burial or occlusion. A fitted overview cannot substitute for a far-lobe production-camera view. This is a static model-readability requirement, so it cannot be dismissed as a release-only combat test. The absent evidence prevents an overall stage5 pass. Preserve these useful images and the passing technical results. Obtain the missing source-specific normal-camera inspection before deciding whether model or shell changes are actually necessary. No speculative remodel is justified by this review.

## Construction, collision and asset safety

OverloadDraft.ts builds the coolant header, power bus, restraint head and induction core as separate assemblies inside the existing void. It constructs nested torus rings, ceramic parts, eighteen segmented coil shoes, flanges, bus saddles, guide rods and a ram with a clevis. Foundations descend to the shaft floor height. AuthoredRooms.ts supplies the shaft floor, liners, pit rail and deck from the topology, then integrates the batched shell and reactor assemblies. This is physical geometry, not a screenshot-only illustration.

OverloadShell.ts keeps the apron and deck grilles flush, places raised perimeter work on the existing boundary, and puts the structural frame below deck. The unchanged empty obstacle list is consistent with keeping machinery inside the nonwalkable void. The tests retain the four breaches, spawn at x140 y440 and compatibility coordinate at x1060 y440. The compatibility coordinate is not evidence of an escape route in the story.

The draft tests check every generated vertex against the void, each main assembly against its reserved footprint, supported bounds, preservation through both batching stages, triangle count and one-time geometry/material disposal. The shell tests check apron containment, deck finish height and lack of topology mutation. AuthoredRooms tests cover deck holes, batching, owned disposal and floor texture ownership. These checks support collision and resource safety. Named groups, bounds and counts do not prove visible attachment or absence of every interior mesh intersection. In particular, the old test named adds bolted reactor clamp housings only checks that the reactor-fasteners material exists. It is not a visual clamp test.

The topology tests include Room20 spawn, exit and breach connectivity for larger actors. Their detailed corpse, bullet, pickup and brute-motion cases use passenger-vault, not Room20. I do not report those as Room20-specific collision recordings. The separately supplied route-results.json and verification-summary.json report 179 successful Room20 geometry checks, including a connected loop and negative shortcut cases. I inspected check-routes.mjs but did not rerun it because it writes route result files outside my sole authorized output. The capture summary also reports actual DepthGame.update traversal and a short staged combat probe. Neither replaces the missing visual viewpoint.

## Independent CPU execution

I ran this exact command in /home/chernodubv/dev/.cron-worktrees/containment-rooms/overload-floor-v3. Cache was disabled and the runner config loader avoided a bundled temporary config.

```text
node node_modules/vitest/vitest.mjs run tests/StoryRoute.test.ts tests/HudReadability.test.ts src/render/OverloadDraft.test.ts src/render/OverloadShell.test.ts src/render/AuthoredRooms.test.ts tests/unit/authoredTopology.test.ts --reporter=verbose --no-cache --configLoader=runner
```

Exit code: 0. Exact output:

```text
RUN  v4.1.10 /home/chernodubv/dev/.cron-worktrees/containment-rooms/overload-floor-v3

 ✓ src/render/OverloadShell.test.ts > builds Room20 thermal apron, service grates and backed wall cassettes without changing topology 33ms
 ✓ src/render/OverloadShell.test.ts > keeps every apron vertex outside the central void and inside the room boundary 64ms
 ✓ tests/HudReadability.test.ts > bright cryo floor HUD readability > backs each floating readout locally, never the full playfield 4ms
 ✓ tests/HudReadability.test.ts > bright cryo floor HUD readability > meets normal-text contrast even when the floor behind the plate is white 1ms
 ✓ tests/HudReadability.test.ts > short non-blocking story HUD > separates essential status, immediate objective, and optional AI instruction 6ms
 ✓ tests/HudReadability.test.ts > short non-blocking story HUD > keeps warning, fatal cost and proof of the lie at their existing reveal stages 0ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > paces ordinary assaults differently from the two extended holdouts 3ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > shows concise essential status and removes the facility escape story from the active UI 1ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > keeps modern enemy behavior and bounded encounter sizes throughout v3 2ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > dismisses only optional presentation and restores it for the next authored beat 71ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > places the warden and carrier matron at the authored elite rooms 152ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > uses authoritative polygon and holes in domain coordinates 6ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > batches awakening-bay and releases every owned GPU resource once 463ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > visits exactly twenty rooms in fixed milestone order, across seeds 5ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > publishes immutable room names, ten environments and objectives without dialogue requirements 2ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > plays every room, requires a separate fatal authorization, and ends without escape 127ms
 ✓ tests/StoryRoute.test.ts > authored story campaign > rejects skipping a milestone in persisted paths and retains old graph lengths 2ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > batches passenger-vault and releases every owned GPU resource once 42ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > batches breached-loading-bay and releases every owned GPU resource once 137ms
 ✓ src/render/OverloadDraft.test.ts > places distinct Room20 service heads instead of repeating radial clamps 225ms
 ✓ src/render/OverloadDraft.test.ts > fits every real head vertex in its layout reservation and supports it from the shaft floor 25ms
 ✓ src/render/OverloadDraft.test.ts > preserves actual bounds and triangle count through both batching stages and retires owned resources once 39ms
 ✓ src/render/OverloadDraft.test.ts > constructs segmented coil shoes, flanged coolant, guarded buswork and an attached restraint ram 10ms
 ✓ src/render/OverloadDraft.test.ts > retains canonical empty collision and all four breaches 1ms
 ✓ tests/unit/authoredTopology.test.ts > authored walkable topologies > replaces exactly four rectangular footprints with polygon boundaries and real voids 7ms
 ✓ tests/unit/authoredTopology.test.ts > authored walkable topologies > connects spawn, exit and inward-offset breaches for larger actors 50ms
 ✓ tests/unit/authoredTopology.test.ts > authored walkable topologies > blocks sightlines and player/corpse movement into cryo void but keeps cross-aisle open 12ms
 ✓ tests/unit/authoredTopology.test.ts > authored walkable topologies > routes real brutes around voids including a clear ray with insufficient body clearance 449ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > batches overload-floor and releases every owned GPU resource once 121ms
 ✓ tests/unit/authoredTopology.test.ts > authored walkable topologies > stops actual player and hazard bullets at cryo void edges 19ms
 ✓ tests/unit/authoredTopology.test.ts > authored walkable topologies > never magnets pickups through the corner of a void 12ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > packs exactly four closed chambers into each of four single-tier rows 39ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > exposes raised boarding ribs above the carapace instead of embedding slits 110ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > gives passenger-vault quiet world-scaled steel textures with owned disposal 30ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > gives breached-loading-bay quiet world-scaled steel textures with owned disposal 87ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > gives overload-floor quiet world-scaled steel textures with owned disposal 90ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > adds bolted reactor clamp housings 83ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > builds shared story footprints with sealed banks and no exposed bodies 269ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > freezes functional annotations without adding interaction collision 1ms
 ✓ src/render/AuthoredRooms.test.ts > authored architecture > does not replace other rooms 0ms

 Test Files  6 passed (6)
      Tests  40 passed (40)
   Start at  07:12:18
   Duration  1.84s (transform 1.59s, setup 0ms, import 2.30s, tests 2.81s, environment 1ms)
```

The supplied verification-summary.json separately reports npm-test.log, build.log, room-evidence-tests.log, routes.log, focused.log and capture.log with successful exits. Those are prior technical-worker results, not my independent rerun of the full suite or build.

## Remaining acceptance and release boundaries

StoryRoute.test.ts independently passed the CPU fatal-authorization and ending checks. Its helper clears enemies with accelerated damage. It confirms player death, completed campaign state, explosion, ALL ABOARD LOST, NEW EARTH WARNED and no later escape-state mutation. Skip tests preserve essential status and do not authorize destruction. This is not human play, real browser button coverage or a recorded post-authorization ending. The final on-screen SHIP DESTROYED presentation remains outside these original room images.

OverloadDraft.ts explicitly uses a quiet static column with constant emissive intensity. These captures do not verify sequence-dependent emission. Dense combat under actual overload lighting, enemy readability throughout the holdout, the real browser fatal ending and the complete no-skip-gameplay-change acceptance remain unverified. They are not waived, passed or invented failures of this bounded static capture. Human room acceptance and release remain separate decisions even after a future stage5 pass.

The failed verdict here rests on the narrower missing static near/far inspection required for the models, not on imposing full release validation on this art stage. Parent alone finalizes stage routing and any publication.
