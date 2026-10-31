# Room15 independent stage3 review

Verdict: PASS for stage3 room materials, shell and major composition. No blocking defect found within that scope. This is not finished-model acceptance, live-gameplay acceptance, user acceptance, merge approval or publication authority.

## Original evidence

I inspected these original PNGs directly with vision_analyze:

- `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/infested-workshop/story-flow-v3/stage-3/attempt-1007/15-infested-workshop-gameplay.png`
- `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/infested-workshop/story-flow-v3/stage-3/attempt-1007/15-infested-workshop-overview.png`

The requested literal `overview.png` does not exist. The second path above is the retained overview named in verification.json. I discovered that file after the literal lookup failed, then loaded it directly. Both originals match their retained SHA-256 values.

Evidence directory: `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/infested-workshop/story-flow-v3/stage-3/attempt-1007/`.

Worktree: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/infested-workshop-v3/`.

I read the complete current Git diff, both new architecture/material modules, the workshop model and its tests, relevant shared dispatcher/renderer/helper code, source pins, verification metadata and retained test/build log summaries. I also read the stage2 independent review at `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/infested-workshop/story-flow-v3/stage-2/attempt-1006/independent-review.md`. I did not fetch issue36 anew.

## Visual findings

The yellow painted housings, dark steel castings and brighter bare-metal ways remain distinct at the gameplay view. The workshop reads as installed machinery, with a lathe and arm at northwest, tall gantry at northeast, southern fixture bench and separate stock cabinet. The paint has visible wear without turning the whole room into mottled noise. The machinery stays legible against the dark deck.

The overview shows a coherent rear service wall with repeated metal cassettes, a yellow lower strip and horizontal service runs. The sparse deck markings leave the central cross-aisle and outer returns visually open. There are no free-standing growth puddles that suggest extra obstacles or poison zones. The new growth is concentrated on equipment and a short wall attachment. It does not swallow the machinery silhouettes.

The gameplay image crops the rear wall, so it cannot establish that wall's complete composition by itself. The overview supplies that coverage. Neither original has the DOM HUD. These are controlled staged-simulation art frames, not a full integrated gameplay or mobile review.

## Architecture placement and shared paths

`src/render/ShipEnvironments.ts:169` dispatches the new architecture only when both `env === 'infested'` and `templateId === 'infested-workshop'`. Other environments and Swarm junction retain their existing branch. The only shared runtime-file change in this candidate is that import and guarded dispatch. The existing production call in `DepthRenderer.ts:192` already supplies the template ID.

`InfestedWorkshopArchitecture.ts` places the deck planes at y=0.003. Raised cassettes, paint strips, service pipe and wall fibers stay outboard at negative z. I independently instantiated the real builder in a CPU-only Node process and checked actual mesh bounds. It returned 65 meshes, 20 deck planes, no outboard/flush violations, a raised-geometry maximum z of -0.0899999964237213 and a deck maximum y of 0.0030000000000029864. The neighboring Swarm junction builder had no workshop cassette. This was a read-only bounds check, not a browser or GPU run.

The material module creates room-local shared material instances and deterministic data textures. It does not mutate the global MAT palette. Resin is non-emissive with roughness 0.96; the isolated low-roughness seam does not make the whole infestation look wet. Existing disposal only retires materials marked actorMaterial, so these reusable room materials follow the existing shared-material lifetime. The test change includes them in the shared-material disposal checks rather than deleting those checks.

Collision and navigation source have no candidate diff. I checked an empty HEAD diff for `src/game`, `DepthRenderer.ts`, `meshParts.ts`, `src/main.ts`, `src/style.css` and `scripts`. The model retains its inner-reservation fitting. Stage2 and stage3 template, activities, equipment and routes compare equal, and the complete retained route-results objects compare equal. This supports unchanged collision and routing, not a claim that every actor size can traverse every point.

## Remaining defects and limits

- Minor visual issue: the long parallel resin strips on the lathe still resemble hanging cables more than fused biological tissue. Their attachment and directional repetition are clearer than the short protrusions described by the stage2 reviewer, but the biological read is not finished. This does not block the stage3 material/shell gate.
- Minor shell finish issue: in the overview, the rear cassette strip ends before the right corner while the service runs continue farther right. The ending looks abrupt. It does not put geometry into the aisle or break the room's main composition; reconcile that termination during shell finishing.
- The broken guard, cut insulation and workpiece contact still do not tell their full story at this scale. Those are deferred model-detail questions, not reasons to claim final object acceptance now.
- Unchanged route evidence retains incomplete sampled connectivity at radii 28 and 38, plus the prior radius48 occupancy and segment failures. This review does not clear those inherited gameplay limits.

## Verification and scope

Independent read-only checks found all 164 source pins matching the worktree and all six retained source/test snapshots matching byte-for-byte. HEAD is `20aa2a8208d82ee1b912909e82111e02c1930572`. The source pins identify the uncommitted candidate; HEAD alone does not.

Retained scoped output reports 39 tests passed across three files. Retained evidence-test output reports 22 passed, zero failed and a further CPU-check result with passed=true. The retained build completed with a large-chunk warning. Verification metadata records zero exits for scoped tests, npm test, build and evidence tests. These are inspected parent results, not independent reruns. I did not run a build, test suite, capture or GPU process.

Only this independent-review.md was written. No runtime source, capture evidence, collision data or shared paths were modified. Publication and acceptance remain outside this reviewer's authority.
