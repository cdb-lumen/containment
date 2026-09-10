# PR59 CI diagnosis, 2026-09-08

## Proven failure

Source: [run34254255774, job102155950536](https://github.com/cdb-lumen/containment/actions/runs/34254255774/job/102155950536), retrieved with `gh run view --log-failed` and structured job readback. Tested head and local HEAD are `e0ac00ffad50e5ebc1da9851833b18cfe6978212`.

- Job ran 16:58:10 to 17:14:36 UTC. It failed with exit code 1, not a timeout.
- Unit tests reported 493 passed, 1 skipped; separate preview tests reported 2 passed; room-evidence tests reported 7 passed. Typecheck/build completed before smoke.
- Desktop graphics checks passed at 17:02:04, menu sound at 17:09:24, paused sound at 17:13:00. At 17:14:33, `scripts/smoke.mjs:136` rejected its accumulated error list:
  - `THREE.GLTFLoader: Couldn't load texture blob:http://127.0.0.1:43403/63139c65-1026-4f15-beb1-fef1cb112120`
  - `THREE.GLTFLoader: Couldn't load texture blob:http://127.0.0.1:43403/0905ad2d-0ce5-495c-923a-57c947833f6d`
- Desktop did not reach its final success JSON. Touch did not start.
- Crucial limitation: errors accumulate from initial navigation across every reload, with only message text retained, `smoke.mjs:29-37`. Their appearance in the assertion after sound/pause does **not** establish when either error happened or that sound/pause caused it.

## Load and disposal trace

All paths below are repository-relative at the tested head. Installed and lockfile Three.js versions both read `0.185.0`.

1. `src/main.ts:33-44` preloads eleven actor/weapon GLBs, then prepares the renderer. `src/render/assets.ts:11-14` uses four concurrent loader workers. Any of these embedded images can also produce the same blob error during any page boot.
2. `DepthRenderer.ts:74-91` calls `loadRoom`, waits for environment surfaces, and performs shader/texture warm-up. It does not explicitly await the three optional room owners before warm-up.
3. `DepthRenderer.ts:127-138` disposes previous bank/kit/berth owners before disposing the old world. Each Awakening load starts three independent optional owners. `main.ts:81-95` synchronizes room revision before simulation and skips normal rendering while an owner is loading. That guard does not govern the earlier `prepare` warm-up.
4. `SealedChamberBank.ts:55-77`, `ReleasedBerth.ts:19-39`, and `RecoveryKit.ts:27-52` fetch GLB bytes with an owner AbortSignal, then call a fresh `GLTFLoader.parseAsync` without that signal. Owners race loading against an eight-second timeout and explicit cancellation. Disposal aborts transport, settles the owner, and retires completed resources. A late parse can continue; its returned scene is retired instead of mounted. No inspected owner calls `URL.revokeObjectURL`.
5. Three's `examples/jsm/loaders/GLTFLoader.js:3287-3372` creates a blob URL for an embedded image, loads it, and revokes it after success. Its catch logs the URL but omits the underlying exception. `loadTextureImage:3275-3279` converts that rejection into a null texture. `src/loaders/ImageBitmapLoader.js:168-200` can fail during blob fetch, response-to-blob, or `createImageBitmap`. Its signal comes from the loader/manager, not the application's GLB-fetch controller.
6. RecoveryKit explicitly rejects missing required PBR maps after parse, `RecoveryKit.ts:31-35`. Bank and berth validators do not perform equivalent missing-map checks. A console error therefore need not become a thrown app error or prevent gameplay.

## Smoke choreography and causal candidates

`smoke.mjs:55` reloads for graphics persistence. `sound-controls-check.mjs:64,72,78` adds three reloads, including one after starting a muted run and observing reward state. The main smoke starts another run, chooses a boon, fires, pauses/resumes, then returns to title and starts/chooses again before the error assertion. `DepthGame.ts:44-51` increments room revision both on new run and starting-boon selection. Pause and menu alone do not increment it.

Ranked investigation candidates, not established causes:

- **An embedded image fetch/decode failed during one of the page boots or room replacements.** This is closest to the logged failure. Blob URLs do not identify a GLB. All eleven preload models and all three optional assets contain images; two errors do not mean two specific owners failed.
- **Navigation interrupted pending image work.** Four reloads and reward-to-playing room replacement provide opportunities. The test waits for DOM/game/audio conditions, not owner terminal states. Owner cancellation does not stop `parseAsync`. Correlating error time, document identity, owner generation and pending image work is necessary before blaming disposal.
- **Software-WebGL scheduling or resource pressure contributed.** Long observed interactions and the existing decode-scheduling guard make this worth measuring, particularly boot warm-up and successive owner generations. Prior loading pitfalls explain why slow completion is plausible, but an eight-second owner timeout alone does not prove why an image load rejected.

A premature application blob revocation or cross-owner ImageBitmap close is not supported by the inspected paths. URLs are generated per embedded load and revoked after success; retirement closes resolved images. No source evidence connects audio gain changes directly to GLTF loading.

The branch diff against `f3796e5` changes Passenger Vault layout/topology and evidence, not these owners, smoke, main loop, dependency lockfile, or existing GLBs. Shared rendering edits branch specifically on Passenger Vault. This is not proof the failure predates PR59, but there is no demonstrated causal link to its layout changes.

## Bounded next reproduction, not executed here

Parent-owned, serial, after the concurrent asset job no longer competes for resources:

1. Freeze the exact tested head in an isolated build. Run only the desktop production-subpath choreography once, with the original quality/deadlines/error assertion intact and a 20-minute outer limit. Exclude touch for this diagnostic attempt. Preserve a timeout as a timeout, never a pass.
2. Add test-only event recording before navigation. Record immediate console timestamps and locations, document/navigation IDs and workflow stage; GLB fetch/body completion; blob creation/revocation and image identity; `createImageBitmap` start/resolve/reject including exception name/message. Record owner generation, asset URL, state, timeout/dispose, and parse settlement using isolated diagnostic instrumentation. Capture failed blob requests too: the current `requestfailed` origin-prefix filter misses `blob:http...` URLs.
3. Stop after the first affected stage has completed enough to capture settlement, or at the outer bound. Save raw events outside production source. Do not suppress the console error, extend owner deadlines, or call fallback authored-asset success.
4. Only after attribution, repeat the single affected transition once. For a navigation hypothesis, compare unchanged choreography against waiting for current owners to settle before that one reload. For decode failure without navigation, try the identified embedded image alone in a quiet browser decode control. These are diagnostic controls, not proposed remedies. Use one variable per comparison.

If the attempt is clean, report non-reproduction and retain timings. No unbounded rerun loop. A same-choreography base comparison is still required before labeling this pre-existing.

## Scope and limitations

Read-only GitHub/log/source/dependency inspection plus GLB JSON image inventories only. No browser/GPU jobs, builds, tests, source edits, commits, merges, or publication were run. Repository tracked/index diffs remained empty. Existing untracked `public/assets/passenger-vault/` and `tools/assets/passenger-vault/` belonged to concurrent work and were not modified. Only this diagnostic document was written. Root cause remains unproven because CI did not preserve error timing, originating asset, or the underlying loader exception.
