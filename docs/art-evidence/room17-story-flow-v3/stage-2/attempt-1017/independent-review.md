# Room17 independent stage 2 review

Verdict: PASS for rough main-object placement only. This is not final art, release approval or human acceptance.

## Evidence inspected

I visually inspected both original PNGs in native-pinned, 17-shielding-gate-overview.png and 17-shielding-gate-gameplay.png. I also inspected the preceding stage-1/attempt-1016/layout.png and read its sourced-brief.md and CPU test. I read the complete candidate src/render/ShieldingGateBlockout.ts, its focused test, the current tracked Git diff, capture pinning script and relevant manifest fields. The review was informed by the prior brief, not blind.

The overview shows the full rectangular room, offset west and east shielding masses, a shorter southern backing mass and clear floor around their ends. The gameplay view shows the paired machinery heads and central fighting space at a closer scale. These are actual room images, not blank or loading frames.

## Placement judgment

The main masses have enough scale against the marine and large enemies to read as fixed defensive infrastructure. Their long parallel shielding slabs and matching screw assemblies distinguish the pair from ordinary crates. The machinery occupies the facing ends of the offset masses, consistent with the G1 and G2 reservations. Broad plinths give the assemblies visible floor contact. The shorter southern stack remains a separate backing obstacle rather than another gate head.

The open central gap stays floor. No bridge, new threshold slab or overhead beam competes with it. The overview preserves the stepped approach, northern regrouping space and alternate circulation around both outer ends. The east-side progression marker remains separate from the shielding mass. The arrangement is compatible with clearing the last defensive line before the reactor, not an escape or timed crushing sequence.

The main limitation is identity strength. At overview scale the long shielding slabs dominate the relatively small nested heads, so the room reads first as offset defensive barriers. The closer image makes the matched screw drives and layered heads clearer. That is sufficient for this rough placement stage. It does not establish final gate recognition without the brief. Neither image depicts the reactor itself or independently explains the narrative objective. The objective is supported by the unchanged story source, not inferred from pixels alone.

Neighbor relationships pass at this scope. The two tall assemblies belong to the same construction family, the southern cover remains subordinate, and their bases do not visually merge with perimeter architecture or the exit marker. No foreign room kit is introduced by the candidate.

## Code and source checks

The tracked diff adds only the blockout import and the containment plus shielding-gate dispatch in ShipEnvironments.ts. The new builder and test are untracked candidate files, so Git diff alone does not identify the candidate. I read both separately.

The builder creates static geometry. It adds no update callback, time input, actuator state, collider or progression event. Three leaf meshes remain retracted in each head. Static appearance is supported by code inspection, not proven by two still images. All dimensions are fitted to the owning existing rectangle. The unchanged collision topology remains authoritative.

I independently recomputed every pinned runtime file digest. All 264 files match source-pins.json. The aggregate SHA256 is 3f10920c75423695143e1a86d5f0ec5a6ca6307b7fdb8afa6ac7face896ab873 and matches the recorded tree pin. All three changed-file digests match both the working candidate and source-snapshot copies. The saved tracked-source.patch exactly matches the current binary Git diff.

Current branch is art/shielding-gate-v3. HEAD is 926b20d45c6b4f80b3dfa65a41ff4365b9b151fc. This HEAD is not a complete image source identifier because the candidate is uncommitted.

Both original PNG digests match the manifest and source pins. Overview SHA256 is 0a909b18c15e3ecd019357094f0c729826c538750a66be7ce228005d21573518. Gameplay SHA256 is f231345138e4b7258b74715c4aa81d8314f650482a9bd7aebcb892dae39e044b. The manifest contains exactly two image rows. Both report empty errors, zero WebGL error and no context loss. I verified those recorded values but did not rerun capture. The before-and-after capture equality claim is supported by the saved pinning script and record, not an independent observation of the capture interval.

## Independently executed CPU checks

From the candidate worktree I ran:

```sh
./node_modules/.bin/vitest run tests/ShieldingGateBlockout.test.ts tests/unit/expeditionGeometry.test.ts --no-cache --configLoader runner
node /home/chernodubv/.hermes/workspaces/containment-art-roadmap/shielding-gate/story-flow-v3/stage-1/attempt-1016/test-layout.mjs /home/chernodubv/dev/.cron-worktrees/containment-rooms/shielding-gate-v3
```

Vitest passed both files and all 7 tests. The four candidate tests check assembly identity, geometry bounds before and after batching, machinery bounds inside G1 and G2, and the unchanged containment-annulus model path. The remaining three tests are the production expedition geometry suite.

The prior layout suite passed all 13 checks with zero failures. It independently matched its production source pins and topology, swept the retained routes bidirectionally for standard enemy radii 14, 17, 18, 24 and 28, checked the 100-unit route corridors, activity clearances, threshold traversal and shots, solid blocking and sampled connectivity. All 1915 admitted grid nodes were reached and all 16 checked anchors connected.

The existing occupancy versus conservative self-sweep mismatch remains at eight sampled corners: 280,120; 420,120; 500,760; 700,760; 780,320; 780,720; 920,320; 920,720. The suite excludes those points from its swept graph. This is an unchanged production limitation, not a candidate fix or a continuous-space connectivity proof.

## Exact acceptance limits

The image manifest classifies these captures as controlled-live-simulation. Its staging description specifies legal staged actors, fixed-step production combat and renderer, an inactive encounter director, no boss and no campaign progression. The overview fits the room; the gameplay image retains the production camera composition. I did not independently replay that simulation.

No GPU job, browser capture, runtime source edit, publication or guard change was performed for this review. HUD and mobile criteria are deliberately outside this gate. Final materials, detailed fabrication, full combat readability, live pursuit, performance, touch input and campaign completion remain unverified. Mesh containment does not prove exact projectile-height agreement between the visual mesh and the solid rectangle. The focused tests do not test animation over time or complete mechanical functionality, neither of which is authorized here. I did not rerun the full test suite or build and do not inherit their saved logs as independent results.

The only file created by this review is independent-review.md. The working tree retained its original candidate status after the checks.
