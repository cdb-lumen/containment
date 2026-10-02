# Room20 overall technical verification

Attempt1036, stage5. Local verification and fresh original capture only. No runtime edits, commit, push, receipt, guard call, acceptance, merge or deployment.

## Source

- Worktree `/home/chernodubv/dev/.cron-worktrees/containment-rooms/overload-floor-v3`
- Branch `art/overload-floor-v3`
- HEAD `4712bd3076a7fe2b8a3542c9cb055549c692d662`
- Source aggregate before and after `892f4d053b5eb4906f43e123135a8264518d259105c5a60c16b1e2ef20590a89`
- Git status clean before and after. Per-file runtime, asset, script and configuration hashes are in `source-before.json` and `source-after.json`.

## Actual results

All executed commands exited zero. Exact commands, timestamps and logs are retained in `command-results.json` and `verification-summary.json`.

- `npm test`: 766 Vitest tests passed, one optional performance-profile test skipped. Node tests and all chained Python checks passed. These repository-wide checks include existing other-room fixtures because the requested npm command includes them. No other-room work was performed.
- `npm run build`: passed. Vite reported its chunk-size warning.
- `npm run test:room-evidence`: 22 Node tests passed and 33 ragdoll CPU checks passed.
- Existing Room20 route script: 179 checks passed, zero failures or errors. Checks include radius16/28 occupancy, ring connectivity, spawn to compatibility exit and breach connections, void/notch rejection and negative obstruction controls.
- Focused existing tests: 26 passed. They cover Room20 shell and real head vertices, reservation containment, batching bounds and triangle preservation, owned-resource disposal, canonical collision, authored topology, story and HUD contracts.
- Existing StoryRoute integration tests exercised actual DepthGame ending and Skip behavior. Skip dismisses optional presentation without granting progression. Separate fatal authorization is required before Room20. Completion kills the player, emits an explosion, records twenty completed rooms, retains ALL ABOARD LOST and NEW EARTH WARNED, disables continuation and rejects escape or further expedition mutation. The test clears enemies using accelerated damage. This is CPU integration coverage, not manual play or a browser ending capture.

## Fresh originals

- `20-overload-floor-overview.png`, 1280x900, SHA256 `3655049957eeac4d5b04ee20b0b62d8edbbdf3e45d63efd87417b0e60bc988d6`
- `20-overload-floor-gameplay.png`, 1280x900, SHA256 `0ec380068539269c3d0f215e12e8b96265b9f29a0bd3c8bba04a2f081b8113d3`

Both images were captured anew with the unchanged existing room-evidence tooling and decoded successfully. The overview is byte-identical to attempt1035. The desktop image differs. No image bytes were changed to manufacture novelty.

The fitted overview shows the complete outer shell, the central core and the service heads. The desktop view shows the same assembly at production framing, with staged actors along its southern edge. No blank frame or obvious rendering corruption was observed. Desktop framing crops outer room edges and the upper sign. This inspection is not independent art review or comprehensive floating/clipping certification.

The capture manifest reports no browser errors, WebGL error zero and no context loss. It records 347 legal traversal steps reaching the compatibility exit, plus 25 controlled combat steps with four shots, 48 damage and three active enemies. The compatibility exit is a geometric route target, not a canonical escape ending. Duplicate aborted module preloads were accepted by the existing harness only when those exact URLs also completed.

## Limits and cleanup

The existing capture CLI offers overview and one desktop gameplay position, not near/far placement controls. No camera, staging logic or runtime was changed to add coverage. Overview uses the harness's fitted camera. Desktop uses the production camera and composer, but no DOM HUD. The encounter director is inactive and actors are staged. These images do not prove the full final holdout, natural survival, canonical ending UI, touch behavior or full campaign browser progression.

The capture command closed its browser and Vite server and removed its temporary entry. `processes-after.log` and the summary record no remaining capture processes or `.room-evidence-*` directories. Build output is local and ignored; tracked worktree status remains clean.

Artifacts created only under this attempt directory include originals, manifests, source pins, copied existing route and source-pin helpers, local verification scripts, raw command logs, route results, process snapshot and summary. Independent overall visual review, publication and any stage disposition remain with the parent worker.
