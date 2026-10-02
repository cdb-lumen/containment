# Room19 stage 3 independent review

## Verdict

FAILED. The materials and broad room composition improve on stage 2, but the observation recess remains visually flattened by its surround. A fresh focused test also fails because the observation hood blocks the tested overview sightline. Do not advance this candidate as a passed stage 3.

This is a shell, materials and major-form review, not a stage 4 detail review or final room acceptance. I read the live `map-model-production.md` policy and Room19 rollout brief. I used the visual-evidence-auditing, unslop and verification-before-completion skills.

## Images inspected

I loaded both original stage 3 PNGs through the vision tool, then both original stage 2 PNGs. I also inspected a native crop of the stage 3 overview's upper shell.

- Current `capture/19-manual-control-chamber-overview.png`.
- Current `capture/19-manual-control-chamber-gameplay.png`.
- Prior worktree `docs/art-evidence/room19-story-flow-v3/stage-2/attempt-1029/19-manual-control-chamber-overview.png`.
- Prior worktree `docs/art-evidence/room19-story-flow-v3/stage-2/attempt-1029/19-manual-control-chamber-gameplay.png`.

Both current originals are 1280 by 900. They show the intended room, not a blank or transitional frame.

## Visual findings

Passed bounded material and composition checks:

- The stage 3 northern wall has a continuous ivory upper course over dark segmented lining. The added apron gives the wall a distinct service zone instead of leaving equipment on one uninterrupted floor field.
- The ivory equipment housings remain clearly separated from their dark control decks. The two switch cabinets and the southern guarded desk retain their stage 2 positions and clear large silhouettes.
- The passenger-status board remains visibly separate from the guarded actuator. Its previous bright amber flare is reduced to a restrained strip, allowing its rows to read without the stage 2 glare. This supports the quieter authorization-room direction.
- Open floor still surrounds the central equipment arrangement. Nothing in these pixels suggests a new raised platform across the fighting space.

Failed major-form check:

- The upper observation assembly is more substantial than stage 2, but its interior reads predominantly as a shallow gray horizontal inset under a broad pale course. The dark slit is not clearly exposed as a deep armored opening. The native crop shows the sill/surround and tiny dark mullion ends rather than a convincing dark viewing cavity. This is a shell-form/readability defect within stage 3, not a request for stage 4 microdetail.
- The current gameplay frame crops out the upper observation assembly. It therefore cannot independently establish that this new shell feature reads from the normal desktop camera. This is an evidence limitation, not permission to change the shipping camera.

The large pale top band also attracts substantial attention in the overview, but the console group remains distinct. I do not treat that balance alone as a blocker. Labels, wear and detailed mechanical refinement are outside this stage verdict.

## Code and fresh tests

Reviewed the full diff against HEAD and the complete `ManualControlBlockout.ts` implementation. The diff contains only that runtime file and `tests/ManualControlBlockout.test.ts` plus `tests/ShipEnvironments.test.ts`.

The runtime changes create room-local owned finishes, replace the northern shell/recess and add a flush service apron. They do not change shared material objects, gameplay, navigation algorithms, camera, HUD or story action handlers. The actuator remains an inert mesh behind its existing guard presentation. I found no code path in this diff that pre-arms or triggers destruction. This source finding does not substitute for an end-to-end explicit-authorization UI test.

I ran independently from the supplied worktree:

```text
./node_modules/.bin/vitest run tests/ManualControlBlockout.test.ts tests/ShipEnvironments.test.ts tests/StoryRoute.test.ts --no-cache
```

Actual result: exit 1. Three test files, one failed and two passed. Forty-four tests, one failed and 43 passed.

Preserved failure:

```text
FAIL tests/ManualControlBlockout.test.ts
Room19 placed rough authorization equipment > keeps the dark slit visible through its hood from the overview viewing angle
AssertionError at tests/ManualControlBlockout.test.ts:53:55
Expected first ray intersection: armored-observation-recess
Received first ray intersection: observation-hood
```

The test uses an overview-direction ray against actual Three meshes. It supports the visible hood/cavity problem at the sampled point. It does not prove every part of the recess is hidden. The remaining focused tests passed, including footprint containment, traversal samples, bounds through batching and the tested material-disposal contract. `git diff --check` also returned exit 0. I did not edit or weaken the failing test.

## Provenance verification

HEAD matches capture-source.json: `6dc9336ff8d47267def1b1646c02df62c8215311`.

I recomputed every entry in `worktree_source_sha256`. Of 336 pins, 335 matched and one failed. All pinned runtime source matched, including `ManualControlBlockout.ts` at `cc9687618aa5e6a3ff136125ccdeedb6b306717196d953e0af24aa89522a4586`.

The mismatch is `tests/ManualControlBlockout.test.ts`:

- Capture pin: `5f7e9fa5eab87b8dcd106d3f1abc8b08d4961fc579ca34508d9bf1aa4b2591c3`.
- Reviewed current file: `45549daa63d06422cdacc5fa62de01bc72a02374666360c2b2fda87ebf0acc89`.

The manifest therefore does not pin the complete current tested source set. Preserve this mismatch rather than describing every source hash as verified. It does not invalidate the matching runtime art source or PNG bytes, but the current failed test result must accompany this capture.

The original capture script and adapted script match their recorded SHA256 values. Reapplying the recorded substitutions reproduces the adapted script exactly. Both PNG hashes match their manifest rows:

- Overview: `2ebaffc626a42bc8d5aed0487358044c96d6854bfa0af12b2b5fda6fb7b6c5cc`.
- Gameplay: `81b3a59ebcd1be519454dbbdf295b2e89ba4a23e0530809af6ba7b88784dc8dc`.

The manifest contains two result rows for the requested room and records empty error arrays for both. Those are retained capture records, not a fresh GPU run by this reviewer.

## Limits and disposition

The supplied evidence is a controlled staged simulation with no DOM HUD, inactive encounter director and no campaign progression or real touch input. The overview is fitted and the gameplay view uses the production desktop camera/composition according to the inspected manifest. Static images do not prove live movement quality, full combat readability, input behavior, frame rate or authorization UI safety. The absent HUD and mobile evidence are not art acceptance blockers under the current policy.

No GPU, browser capture, full-suite run, production build, commit, runtime edit or remote write was performed. Earlier attempt logs and PNGs were left intact, including `red-tests.log`. This report is the only file I created.

Resolve the observation shell sightline within authorized room-local scope, retain this failed candidate, and obtain source-specific pixels and a fresh passing focused check before reassessing stage 3. Do not repair the presentation by changing shared cameras, HUD or gameplay. No stage advancement, release or human acceptance follows from the otherwise improved materials.
