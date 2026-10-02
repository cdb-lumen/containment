# Room19 stage2 independent review

## Verdict

FAILED for stage2 acceptance of the current source and supplied evidence together. The rough visual arrangement passes a bounded stage2 composition review, but source changed during this review and no longer matches the capture pins. The first independent targeted run also exposed a feedthrough attachment failure. A later source revision passes the targeted test, but the original images do not verify that revision. This is not a final-art rejection or final acceptance.

## Evidence inspected

I opened both original PNGs with vision, not a contact sheet or regenerated image. Both are 1280 by 900. The manifest contains two unique capture rows.

- `19-manual-control-chamber-overview.png`, SHA256 `2749b15c15deab688894e47d5bbf4254e4f408f19ff2dec3f329fab9ac741998`.
- `19-manual-control-chamber-gameplay.png`, SHA256 `bdbcd7fd57a35b71863b4ec1164a47b0b0c8402466d5c4de7373da9a211a5a0e`.

I read the stage1 `layout.md`, the complete rough-equipment builder and targeted test file, the `ShipEnvironments.ts` diff, package scripts, capture provenance, and the manifest's staging declaration. The existing `green.log` reports 40 tests passed across three files. That historical result is not my independent test result.

## Visual findings

The overview retains the accepted three-reservation arrangement. Two northern cabinets flank an open middle crossing. The southern desk and adjacent display form a separate destination. No new floor clutter visibly occupies the surrounding loops. This agrees with stage1's retained symmetric collision baseline rather than claiming the eventual asymmetric bunker composition.

The guarded desk is distinct from its passenger-status board in both originals. Nested dark guard frames and a pale crossbar surround one recessed red actuator. The neighboring board has rows and an amber header rather than another large actuator. The desk's pale body and the panel's narrower dark support keep the objects separable even in the gameplay-camera frame. The desk reads as a protected control surface. Its exact slope is less obvious from these high views than it is in the mesh construction.

Both side cabinets read as repeated switch equipment rather than plain cargo boxes. Their recessed rows, paddles and protective rails are visible. Their broad top faces dominate the northern equipment group, while the southern pair has the more distinctive control silhouette. Source and bounds tests establish their low height; the screenshots alone do not make height as clear as the top-face pattern.

Thin copper lines visibly bridge the southern pair. These support the rough hardwired-service idea, but the original pixels cannot establish every feedthrough contact. The independent test failure makes that distinction material.

The observation recess is visible only in the overview as a narrow framed strip on the north wall, right of center. Existing horizontal wall rails cross its presentation and weaken the recess read. The gameplay view crops that wall out. This is enough to locate the rough architecture, not enough to accept final observation-window readability.

The staged enemies partially overlap the right cabinet's lower edge, while the southern control pair remains exposed. This is one useful actor-loaded composition, not proof of combat readability across approaches. Passenger identity and the fatal authorization warning are not readable text on the rough panel. Its row pattern reads as a status display, with passenger semantics supplied by the brief and source. Final typography and warning communication remain unverified, not a new stage2 text-art gate.

## Code and independent execution

The worktree diff contains a renderer import and two Room19-specific dispatch branches in `ShipEnvironments.ts`. The new builder constructs inert meshes. I found no action handler or progression mutation in it. The observed Git status contains that modified registration file and the untracked builder and test file. It does not show game geometry or input changes.

The builder uses existing obstacle footprints, a containment fit, low side cabinets, a custom sloped desk, separate raised panel, and outboard north-wall architecture. The tests cover placement bounds, desk/panel separation, another reactor room's obstacle fallback, named guards and services, feedthrough intersection, batching/disposal, and sampled routes for radii 16 and 28. Presence checks alone do not establish usable guards or player consent behavior.

I independently ran this CPU-only command from `/home/chernodubv/dev/.cron-worktrees/containment-rooms/manual-control-chamber-v3`:

```sh
npx vitest run tests/ManualControlBlockout.test.ts
```

At 03:11:44, Vitest reported 5 passed and 1 failed, exit code 1. The failure was line 28, requiring each ceramic feedthrough's bounds to intersect the passenger-panel foot. The builder I initially read placed loom rows at `.12+n*.045` times depth.

A subsequent read showed another worker had changed that expression to `.21+n*.045`. I made no source edits. I reran the same command at 03:12:27. It reported 6 passed across one file, exit code 0. That verifies the later targeted test state, not the initial state or all 40 historical focused tests. I did not rerun `npm test`, the build, browser smoke, or GPU capture.

## Blocking provenance finding

The final independently checked current hashes differ from the supplied capture pins:

| File | Capture SHA256 | Current SHA256 |
| --- | --- | --- |
| `src/render/ManualControlBlockout.ts` | `348c3b8f565370d90280b4aa29c6b34dd963373057684adba2914ad20a6b3d50` | `bb880a41b21b97ab18914321372b21f496c92802a713fc144f180411ad71e116` |
| `tests/ManualControlBlockout.test.ts` | `5253cd636bdd115acd350149b879c97d1704d37096f593390598b45c2d705fb5` | `7ea215e630892fec7f3b8868cf4a05a43ebbaeecaeb48f091fbb9e15ae92d537` |

All seven other source entries in the capture pin map matched when checked, including `ShipEnvironments.ts`, story room templates, game, renderer, main entry, and both named evidence support scripts. The changed builder prevents treating the original images as visual verification of the now-passing source. Preserve the failed run and refresh evidence against a stable revision before asking for a replacement acceptance verdict. Do not just replace the recorded hashes on the old screenshots.

## Limits and scope

These are controlled staged simulation captures without the DOM HUD. The overview fits the room; the gameplay frame uses the declared production camera/composition. I did not independently execute the capture fixture. These images do not prove live campaign gameplay, explicit Destroy ship confirmation safety, continuous movement, all-angle collision/render agreement, touch behavior, mobile readability, HUD integration, or finished art quality. Mobile and HUD art are not gates for this bounded stage2 review.

The only file I authored is this review. I did not edit runtime, tests, captures, or provenance, start a GPU job, publish, commit, or change the room layout. The moving worktree and capture/source mismatch are the unresolved review issues.
