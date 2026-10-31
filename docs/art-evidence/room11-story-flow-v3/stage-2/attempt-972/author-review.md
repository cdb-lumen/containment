# Room11 rough placement, attempt972

Author handoff. Parent independent visual review and publication are pending. This is stage2 only, not finished room art or human acceptance.

## Result

The accepted three solid footprints now drive Room11 collision. Two low curved console banks face a shallow physical ship cutaway at the north of the room. Three stepped deck plates share an amber hardwired bus. Four occupied cryopod miniatures sit on the rear plate. Their heads and bodies are separate geometry. The model is original procedural Three.js geometry, not a diagram or inherited Room9/10 asset.

The room shell, width, height, spawn, exit, four breach anchors, story text and objective remain unchanged. Two narrow registration additions select the Room11 topology and append its models. No shared engine, camera, HUD, gameplay logic or Rooms1-7 source changed.

Source commit: `18c16502102755c91220bf8d533c6198ee83e8dc`.
Prior stage HEAD: `3f6cca6f620a553fedb0878997211a171927d3b7`.
Base: `7a3f262886104fb024de9684958b3f85a8859f34`.

## Images inspected by the author

- `overview.png`, 1280 x 900. All room edges and both open flanks are visible. The two console banks form the interrupted semicircle without closing the central route. The north ship display has a visible pedestal and three connected deck plates.
- `desktop-in-scene.png`, 1280 x 900. Normal production camera and high-quality composer. Both console banks, player, three enemies and the complete cutaway are visible. Amber routing reaches the occupied miniatures. No raised models project into the route reservations in this view.

Both are original browser captures, not composites. Copies under `capture/` retain the original workflow filenames. The overview uses the existing capture-only fitted camera. The desktop uses controlled fixed-step live simulation through DepthGame and DepthRenderer, not an organic campaign encounter. The existing fixture has an inactive director and no DOM HUD. Neither image establishes dialogue-skip behavior, persistent fatal-consequence status, full encounter balance or campaign completion.

The forms intentionally remain rough. Console maintenance panels, room-local material development, finished hull articulation and detailed cryopod shapes belong to later stages. At this stage the cutaway reads as three trays inside a pointed hull. The tiny occupants are symbolic, not finished passenger models. No optional log, control, pre-awakening evidence or new interaction was added.

## Verification

- `npx vitest run tests/DiagnosticGallery.test.ts tests/ShipEnvironments.test.ts tests/StoryRoute.test.ts`: 39 passed in three files, zero failures.
- New tests cover exact accepted footprint equality, canonical anchors, radius16/28 swept routes, solid rejection, every transformed model vertex inside its owner footprint, model height bounds and Room12 registration isolation.
- `npx tsc --noEmit`: exit0.
- `npm run build`: exit0. Vite reports its large-chunk warning. No code-splitting changes made.
- `validate-production.mjs` through the retained stage1 TypeScript loader: exit0. Production geometry has no in-memory substitution. At radius16, 2059/2059 legal grid nodes connect to spawn and exit. At radius28, 1993/1993 connect. All named routes and the four existing inward breach offsets pass. Grid spacing is20 units, not a continuous proof of every floor point.
- Existing `scripts/room-evidence.mjs --rooms=diagnostic-gallery --gameplay-all --verify-all`: exit0. Production movement reaches the exit in356 updates. Controlled fighting ran25 updates, four shots,48 damage,100 actor-legality checks. Both frames report WebGL error0, no lost context and no browser errors. Overview67 draw calls, desktop70.
- Source pins verify canonical hashes against stage1. Protected renderer, story, shared topology and geometry hashes match prior HEAD. Git change allowlist contains only six focused source/test files before evidence packaging.
- Owned capture browser, Vite and temporary entry cleaned by the existing workflow's finally block. Final process scan found no capture Chromium or owned Vite. Preexisting unrelated containment-boons Vite PID1074861 at port5193 was left untouched.

## Preserved failures and limits

`tests-red.log` records an initial fixture-path ENOENT. The stage1 JSON existed in workspace but was not committed beside its PNG, so an exact fixture copy was added under tests/fixtures. `tests-red-valid.log` then records the intended four red assertions before implementation. Both logs remain unchanged. No visual capture failed. The optional execute_code tool was blocked for unattended execution; ordinary tools completed the task. npm ci reported two moderate dependency vulnerabilities. No dependency upgrades were attempted.

No full release verifier, mobile test, natural encounter, dialogue test, merge, deploy, push, publication, receipt or acceptance action was performed. Parent must independently inspect both PNGs and decide the stage verdict.

## Reproduce

From the worktree:

```sh
npx vitest run tests/DiagnosticGallery.test.ts tests/ShipEnvironments.test.ts tests/StoryRoute.test.ts
npm run build
node scripts/room-evidence.mjs --rooms=diagnostic-gallery --gameplay-all --verify-all --out=NEW_EMPTY_OUTPUT_DIRECTORY
```

The workspace retains capture manifest, source hashes, command logs, validation script and packaging script under `diagnostic-gallery/story-flow-v3/stage-2/attempt-972/`.
