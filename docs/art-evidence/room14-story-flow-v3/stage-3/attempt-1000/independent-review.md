# Room14 stage3 independent review

## Verdict

PASS for the bounded shell and floor composition visible in the two supplied stage3 images. FAIL for strict shell and floor material-only change scope. The candidate also changes machinery, the fiber model and sign placement. Separate those changes or obtain explicit scope approval before treating this entire patch as an accepted stage3 change.

This is not final room or model acceptance, human acceptance, gameplay acceptance, merge approval or deployment approval. The verdict comes from inspecting the original pixels and the diff, not the author's rationale or passing test count.

## Evidence inspected

Worktree: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3`.

Current evidence directory: `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/service-shaft-landing/story-flow-v3/stage-3/attempt-1000/evidence`.

I loaded both original PNGs through the vision tool. Each is 1280 by 900. Their SHA-256 hashes match their manifest rows:

| File | SHA-256 |
| --- | --- |
| `14-service-shaft-landing-gameplay.png` | `72f6988b992db3a8722f039c62efb65dc3883c84e426f6722f5fad366298a771` |
| `14-service-shaft-landing-overview.png` | `11bdb91970be013be2efa1c072e4af82db67d90679cd2d6c991851f38caa5196` |

I also loaded both published stage2 controls from `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/service-shaft-landing/story-flow-v3/stage-2/attempt-991/final-evidence`:

| File | SHA-256 |
| --- | --- |
| `14-service-shaft-landing-gameplay.png` | `39791d9d10e0b8b9cad454cf68b899269707951b9e29454b529f38c72db4bcc1` |
| `14-service-shaft-landing-overview.png` | `4677c7d1809215b142afdabc09c75fef77579c8829b27df20cb28a36979c56c4` |

Both control hashes match their manifest. For each corresponding view, the recorded camera and player state equal the stage3 values. I did not independently prove all actor, lighting and renderer invariants, so this is a visual comparison, not a complete frozen-state experiment.

## Pixel findings

### Bounded composition passes

- The overview retains the broad upper and lower balcony arms joined on the left. The shaft's rightward extension still separates the exit-side landing from the lower arm. The new panels do not visually bridge the shaft or suggest a new shortcut.
- Stage2's pale, largely blank deck with isolated parallel tread marks becomes a darker steel deck with framed grating panels. In the overview, the panel runs make the connected C easier to trace. The left-hand run and the separate exit-side panels have clear floor underneath and between them.
- The gameplay image keeps a strong value break between the walkable floor and the shaft. Amber dashes along the near and far shaft edges reinforce the opening without flooding the floor with warning color. They remain subordinate to the opening and lift structure.
- The zinc-colored machinery stays distinct from the dark shaft. The floor's thin panel outlines and slots are visible without becoming brighter than the player or sign. I see no blank, transitional or wrong-room frame, and no obvious missing floor patch or panel crossing the void in either original.
- The current gameplay sign reads `LOCAL ACCESS ONLY` in full near the upper-left shaft rim, roughly x380 to x540 and y310 to y330. In the stage2 control, the pulley overlaps the right portion of the text. The improvement is real, although moving this sign is outside a strict material-only floor pass.
- At the left junction, a dark socket and pale cyan dangling cable are visible as separate shapes. This is a better disconnected-cable cue than the thin stage2 treatment. The pixels alone do not establish that it is specifically AI fiber, and I am not granting final model or narrative acceptance.

### Defects and reservations

1. Scope failure, blocking acceptance of the complete patch as shell/floor-only. `src/render/ServiceShaftLanding.ts:63` adds counterweight trim. Lines 79 to 80 thicken cross-braces and add mounting blocks. Lines 89 to 92 enlarge and reshape the fiber assembly. Lines 94 and 100 move the sign from z350 to z300. Shared room-local steel and zinc material edits at lines 12 to 13 also affect machinery, not only the shell. The gameplay pixels visibly show the relocated sign, heavier braces, mounting blocks and larger hanging cable. These are not hidden implementation details. Split or explicitly approve these changes; do not describe the full candidate as floor materials only.
2. Minor visual reservation, not a blocker for this composition stage. Panel edges, slots and amber dashes are highly regular. The broad deck has fine grain, but the panels and pale machinery still read as fairly clean fabricated metal rather than convincingly worn zinc. There is little visible localized scuffing or uneven wear in either original. Do not promote this composition pass into final worn-material acceptance. Further wear work, if requested, should preserve the current floor-to-void contrast and avoid adding more competing lines.
3. Test coverage gap, nonblocking for the visible result. The new test named `owns deterministic worn deck grain and disposes its texture` checks texture type, width and disposal, but not determinism or pixel content. A future regression in the generated grain could pass that test. Add a byte comparison between independently built textures or a pinned content assertion if deterministic output is a maintained contract.

No additional concrete route or shared-system regression was demonstrated by this read-only review.

## Code review and preservation

`git diff` contains only `src/render/ServiceShaftLanding.ts` and `tests/unit/ServiceShaftLanding.test.ts`. No route, collision template, shipping camera, HUD, lighting or shared renderer file is changed relative to the current HEAD.

The floor still derives its outline and void from the room template. New finish geometry is shallow room-local geometry. The added vertex test checks that deck-finish vertices lie on legal floor with height no greater than 0.5 game units, and that wall-rib vertices lie outside walkable space. This is useful geometric coverage, not a visual or live traversal proof. Checking vertices alone would not detect every possible future triangle spanning a concave void.

The existing tests retain canonical shaft points, spawn and exit anchors, C-route sweeps at the listed actor radii, controlled updates with a pursuing brute and pickups, batched bounds and selected downward rays. No existing assertion was removed in this diff. The procedural deck texture is locally generated and attached to the deck material's disposal event. The new disposal assertion exercises that ownership contract.

The sign's canvas branch requires a document and canvas context. Reading these tests does not prove they exercise the rendered sign. Its present readability is supported by the PNGs instead.

## Provenance and commands

Executed read-only commands in the specified worktree:

- `git status --short` and `git diff --stat`: only the two files above were modified. The diff reports 76 insertions and 11 deletions.
- `git diff -- '*ServiceShaftLanding*' '*test*'`: reviewed the full renderer and test changes, then read both files with line numbers.
- `git rev-parse HEAD`: `bc5dc58fec4ca766274c852b22f34e7cb7f19608`.
- Python using `pathlib`, `json`, `hashlib` and `struct`: verified every entry in `source-pins.json` against the worktree. All 265 file pins match, with no missing or mismatched file. The external capture-script hash also matches. Current `git diff` bytes equal `candidate.patch` bytes.
- The same read-only checks verified the current manifest has exactly two unique room/view rows, each with the expected PNG dimensions and hash. Both rows report an empty error list, WebGL error zero and no context loss. These are capture records, not independently rerun browser results.
- Python verified both stage2 control hashes and compared camera/player metadata for corresponding views.
- `git diff --check`: exit 0, no output.

Current renderer SHA-256: `432f15b545e32fa56e550da28eba3807245e5801e17eea00538dc4474a80fa94`.

Current test SHA-256: `403dd4f516d5c1678b7ac4de4261871d41664927111f252ac6c8b8d41678029c`.

I read the existing `focused.log`, which reports three test files and 42 tests passing. That is author-supplied execution evidence, not a test run by this reviewer. I did not run tests, builds, a browser or GPU work. This avoids runtime and cache writes under the read-only instruction. The visual verdict does not depend on those test totals.

## Capture classification and limits

The manifest calls this `controlled-live-simulation`. The reviewed artifacts are static screenshots of a controlled simulation with staged actors. The capture script creates a canvas-only page, disables the ordinary encounter progression by fixture design, uses fixed-step updates and has no DOM HUD. It modifies the fixture's initial movement to northward. The overview explicitly fits a separate camera. The gameplay-named frame retains the production renderer camera/composition, but it is not ordinary gameplay evidence.

The current capture records 25 fixed combat steps, three active enemies and a north-side player position. That does not establish a full live room run, sustained combat readability, integrated HUD visibility, campaign progression, touch behavior, portrait layout or runtime performance. The two stills also cannot exclude temporal aliasing or flicker in the thin floor details.

Source preservation is verified against the pinned uncommitted candidate and its HEAD. It is not a claim about an upstream branch or deployment. I changed no repository file, runtime, image, manifest or source pin. The sole review deliverable is this file outside the repository.
