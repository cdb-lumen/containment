# Bounded material-budget recovery

Base `bcbae8053a68623e4e2f46487582ab1015b6e3c3`, isolated worktree `passenger-story-layout`. Uncommitted, not pushed, not merged. No external writes or runtime changes.

## Delivered outcome

A separate seven-GLB candidate reduces actual exported material definitions from 12 to 8. The audit resolves embedded image bytes and sampler values before comparing definitions, rather than comparing local texture indices or material names. Both all-definition and used-definition counts are 8. This meets the candidate's material-count ceiling only. It does not pass the full materials gate or implement runtime sharing.

The two chamber/carrier wear GLBs are byte-identical to the prior reviewed exports. Distribution north/south, monitoring north/south and the flush finish kit now reuse three neutral ancillary definitions:

- Enclosure/cover marking, gray 0.48.
- Gasket/recess/panel seam, gray 0.16.
- Mechanism, gray 0.32.

All three retain double-sided rendering, zero metallic factor and roughness 0.72. These are explicit neutral ancillary roles, not a claim that neutral mechanisms are finished metal. The existing five chamber/carrier PBR roles remain unchanged. Each original material slot keeps its semantic role and every primitive keeps its slot binding. Unknown ancillary names stop generation rather than silently receiving an arbitrary role.

Tests compare the complete ancillary JSON except `materials`, and the entire binary chunk byte-for-byte against its construction source. Nodes, names, scenes, primitive counts, positions, normals, indices, UVs and all other buffer data remain unchanged. No camera, HUD, global lighting, VFX, layout, gameplay or construction source changed.

Measured from the seven delivered GLBs:

| Measure | Before | Candidate |
|---|---:|---:|
| Unique definitions, including unused slots | 12 | 8 |
| Unique used definitions | 12 | 8 |
| Placed triangles | 76,050 | 76,050 |
| GLB bytes for one complete selected package | 1,658,400 | 1,657,628 |

The bytes column is for the selected seven-file package. Historical files remain on disk and in public assets. It is not total repository/deployment storage or measured network traffic.

## Exact deliverables

- `tools/assets/passenger-vault/material_budget.py`, deterministic stdlib exporter, with `--output-root` support.
- `tools/assets/passenger-vault/test_material_budget.py`, four CPU regressions for the whole exported package, content-aware signatures, preservation/semantic bindings and clean-root reproduction/receipts.
- `tools/assets/passenger-vault/verify_material_budget.py`, read-only audit that prints JSON using the independent test decoder, not generator-declared counts.
- `package.json`, appends the budget regression to the normal `npm test` command.
- `public/assets/passenger-vault/material-budget/`, seven GLBs, source/output manifest and credits.
- `tools/assets/passenger-vault/materials/budget-recovery/`, this report, RED/GREEN, generation, npm test/build logs, `glb-audit.json` and `preservation.json`.

The old material generator, manifest, Blender fixture, GLBs, PNGs, captures and reviews are untouched. The older manifest's count of 12 still describes its old package. The new audit describes the separate `material-budget/` package. Do not replace historical receipts or call the old screenshots evidence of the new ancillary palette.

## Executed commands and results

All commands ran at the worktree root. Logs are retained beside this report.

1. Seeded the separate candidate directory with copies of the prior seven-family selection, without changing old exports. `python3 tools/assets/passenger-vault/test_material_budget.py > tools/assets/passenger-vault/materials/budget-recovery/red.log 2>&1` exited 1, specifically `12 not less than or equal to 8`. An initial test incorrectly rejected unused row-carrier material slots; corrected it before retaining the real 12-versus-8 RED result.
2. `python3 tools/assets/passenger-vault/material_budget.py > tools/assets/passenger-vault/materials/budget-recovery/generate.log 2>&1` exited 0 and exported all seven candidate GLBs.
3. `python3 tools/assets/passenger-vault/test_material_budget.py > tools/assets/passenger-vault/materials/budget-recovery/green.log 2>&1` exited 0, four tests passed. Clean-root generation reproduced all seven GLBs and the manifest byte-for-byte.
4. `python3 tools/assets/passenger-vault/verify_material_budget.py > tools/assets/passenger-vault/materials/budget-recovery/glb-audit.json` exited 0. The receipt contains source/target hashes, per-family slot membership, resolved material definitions and both full-package counts.
5. `npm test > tools/assets/passenger-vault/materials/budget-recovery/npm-test.log 2>&1` exited 0. Vitest reported 515 passed, one skipped, across 60 passed files and one skipped file. Node tests and every chained Python/Blender CPU contract completed; the new four-test budget suite passed at the end.
6. `npm run build > tools/assets/passenger-vault/materials/budget-recovery/npm-build.log 2>&1` exited 0. The existing oversized-JavaScript-chunk warning remains.
7. The preservation check compared changed tracked paths against HEAD, allowing only `package.json`, and separately verified all 381 hashes in the prior preservation receipt. It exited 0 and wrote `preservation.json`.
8. `git diff --check` exited 0 for tracked changes. New-file whitespace scanning passed for all 21 new files, separately from the tracked diff because ordinary git diff omits untracked files. The build log text had trailing whitespace and carriage-return normalization; `npm-build.log.gz` preserves its exact original bytes.

## Visual gate incomplete

The ancillary palette necessarily changes pixels, including distribution gaskets, monitoring mechanisms and the finish kit's contrast/roughness. No new render or browser capture ran in this bounded budget pass. No pixel inspection or visual PASS is claimed for this package. The existing fixture only replaces chamber/carrier rows, so rerunning that unchanged fixture would not validate all five changed ancillary exports.

Required follow-up is a frozen-source fixture containing these actual seven GLBs, with the required serial matched neutral/material/wear family closeups and shipping desktop/portrait evidence, then independent inspection. Keep historical capture destinations untouched. Capture-script hardening was not added here, so its previously documented fresh-explicit-destination requirement still applies.

Causal wear, full PBR-role identification, portrait live-cue readability, finished ancillary materials, actual installed shared resources, the added-main-pass draw ceiling, decoded memory, integration/lifecycle, gameplay video, physical-device performance and release remain unaccepted. No full browser verifier ran, as requested. Parent owns independent review and publication. PR59 stays draft; PR58 remains untouched.
