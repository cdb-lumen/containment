# Coolant plant layout draft

Keep the existing room topology. At the pinned current HEAD, Room13 has a 1200 by 880 rectangular boundary, five rectangular solid obstacles and no polygon voids or Room13 authored topology override. The historical brief's figure-eight shell is not already implemented here.

West installation A uses the northwest exchanger footprint and southwest pump/return footprint. East installation B mirrors those roles. The center 100 by 100 footprint becomes a low service saddle, still collision-solid. Recessed supply and return connections imply working life support without adding floor obstacles. Equipment symbols fit within the existing footprints. This is an allocation diagram, not detailed modeling.

Both outer circuits remain. The continuous figure-eight route combines them through shared north and south saddle bypasses. Do not route through the saddle or treat low height as legal firing space. Entry stays at 100/440 and descent at 1100/440. Open-circle service areas remain ordinary usable floor, with no valve interaction or liquid hazard.

The PNG shows the full canonical room at one map pixel per game unit. Gray outlines mark radius28 exclusion envelopes. Continuous cyan plumbing enters both exchanger/pump pairs and all four saddle ports. Dark-edged lines distinguish it from walking routes. All external runs sit under flush walkable covers, not new blockers. The drawing shows service connections schematically through that cover, not exposed pipes across feet. Colored route lines are diagram annotations, not proposed floor markings.

## Checks

87 of 87 analytic checks passed, 0 failures. Radius16 and radius28 pass continuous segments on both loops in both directions, both central bypasses and entry-to-exit alternatives. The drawn routes have a minimum center clearance of 50 units and a radius28 edge margin of 22 units. The 10-unit grid has one reachable component at each tested radius. All service centers, spawn, exit, breach anchors and their inward offsets connect. Legal central shot segments avoid the saddle. Negative controls reject the straight line through the saddle, a radius51 circle in the 100-unit slot and an outside-room center.

This is analytic geometry validation. It is not evidence of production movement, pursuit, hit feedback, enemy behavior or in-scene visibility. Runtime checks belong to later implementation. No runtime source changes, guard calls, receipts, approval records, commits or remote publication writes were made. Local evidence copies are prepared separately.

## Reproduce

Run `python /home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-1/attempt-982/draw_layout.py` with Python3, Pillow and DejaVuSans. The generator asserts the source HEAD and parses the live room footprint and anchors. It refuses an unexpected Room13 topology override.

## Source pins

Current HEAD: `95133d4a4a80a876042d5d4fcf88c72f610c0211`. The canonical brief remains pinned to its historical source commit, not silently updated.

- `/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3/src/game/roguelike/storyRoomTemplates.ts` SHA256 `d02c5d7c86084f4731c5fed97861e190339664b33fd8863663c1ac7362ba1681`
- `/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3/src/game/roguelike/authoredRoomTopologies.ts` SHA256 `933296fee8d6a456a518f25ca796c759a4ffa09f9386353af7cca961115630ac`
- `/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3/src/game/roguelike/roomTemplates.ts` SHA256 `0e3fc4e407a5072ae3370c12311e4f1357cb98712a154af9f7f1c00fdde25629`
- `/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3/src/game/roguelike/storyRooms.ts` SHA256 `f9f1248316c721c4f5c683eb9661f8ed2f95e34685b931f45b63b508e473c715`
- `/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3/src/game/world/expeditionGeometry.ts` SHA256 `61592cc4e947e8d6873488407235e1ab117585e59d10141916de3efe00ef316b`
- `/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3/src/render/AuthoredRooms.ts` SHA256 `e7dbcaf948fe5ab6d6dd9b5e1e255cf1fd32da2fbc27a108990088fde07e8da4`
- `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/rollout-sources/room13-brief.json` SHA256 `885ad49b154b8c07f5ac133b3c7b6579c92f01d99c8b7f16263a51f477c08383`
- `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-0/attempt-980/brief.md` SHA256 `a573b0a933e29365e9095a95472eee26238e0a0584e3e1b3910e6140a8c91b05`
- `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-0/attempt-980/draw_story.py` SHA256 `3dc5cd103f42318a6e9cbe13c8060051206f51d024d23d272f31dc6c916ccebf`
