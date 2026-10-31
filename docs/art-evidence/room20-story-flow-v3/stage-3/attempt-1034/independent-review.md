# Room20 stage3 independent review

## Verdict

PASS for stage3 shell, floor, walls and material composition at attempt1034. No blocking defect is visible in the reviewed originals or exposed by the focused CPU tests. This is a bounded independent review, not stage4 model acceptance, stage5 overall validation, human acceptance or permission to publish, merge or deploy.

I read the current production contract, approved process, map-model-production.md and live routing. Stage3 calls for room visuals in an overview and normal desktop view. HUD/mobile visibility is not an art gate. I read the implementer's brief before viewing the images, so this review is independent but not blind.

## Original pixel evidence

I inspected both unedited attempt1034 PNGs through vision, each at its original 1280 by 900 dimensions, plus the original stage2 attempt1033 overview as a baseline.

- `20-overload-floor-overview.png` shows the complete platform. The pale segmented apron makes the central reactor opening the first read. Its hexagonal outline follows the pit rather than introducing a separate floor ornament. The copper edge ties it to the center coil and bus without competing with their silhouettes.
- `20-overload-floor-gameplay.png` retains that hierarchy at the closer desktop framing. The apron joints, dark inner edge and pit wall remain distinguishable. Broad dark floor areas leave visual space around the staged actors. The red player is visible between the larger enemies. This does not establish live crowd readability.
- The lateral grilles read as inset industrial floor panels, not raised lane blockers. Their repeated dark slats remain subordinate to the bright pit border. The three north plates establish a quieter service area, although they are still plain rectangles with little construction detail.
- Back wall cassettes repeat the existing perimeter rhythm. Copper seams and the lower edge frame make the platform read as a constructed deck instead of a thin outline. The overview shows continuous outer framing without an obvious floating or detached segment.
- Compared with stage2, the brighter pit apron and grilles supply the main improvement. The equipment silhouettes and the east compatibility port are inherited, not new stage3 accomplishments.

The material separation is sufficient for this stage. Pale matte apron, cooler steel decks, dark recesses and restrained copper accents produce readable broad areas. The image does not establish a realistic refractory surface or convincing heat damage. The dark band reads primarily as trim, so I would not claim visible scorching from the pixels alone. The clean repeated panels are acceptable shell development, not finished wear or mechanical storytelling.

## Source and scope

The working HEAD is `84ec5e959183207c0d2d7300d6e34fb64c2e1872`. It is the parent commit, not a committed version of this candidate.

I inspected the tracked diff and both new files. Git status contains only modified `src/render/AuthoredRooms.ts` and new `src/render/OverloadShell.ts` and `src/render/OverloadShell.test.ts`. The AuthoredRooms change imports the shell and attaches its batched children inside `reactorFloor`. The shell creates room-local materials and geometry. No topology, gameplay, shared camera, HUD, global lighting or other-room source change appears in this candidate diff.

The shell keeps deck additions near the floor plane and puts its structural frame below the deck. Raised cassettes follow the rear boundary. The apron is generated from the existing first void. Its center and deck placements are Room20-specific constants, appropriate to this local builder but not a general shell API. Four material instances are reused across shell parts.

I independently recalculated the complete pinned source inventory. All 269 files match both source-before.json and source-after.json, including exact inventory membership. The aggregate hash recomputes correctly. HEAD matches both pins and the capture manifest.

- Source aggregate SHA-256: `fe141df45df0df03ad967a59508d44845d3eddc7cc90350e7755071cc8028699`
- AuthoredRooms.ts SHA-256: `6cc085ce626fc2ecd04cecf50d8c1c160c7b4df4b9960457351337a7216b7a2d`
- OverloadShell.ts SHA-256: `3d3a173890d537dbb5f2cf60ab4553ec2881d52b1624bec3ff437ac31490ab7f`
- OverloadShell.test.ts SHA-256: `2564637ccf127858842696d2c755fdd91c959c3e23faa8edb065499493091271`
- Overview SHA-256: `38a6efced576d16eebab877c8aecdbf2a3fd1a3f88ee66cc4ccbcd71a0bf9453`
- Gameplay SHA-256: `3ce581b27c98d5842eabbbabe0e657aa7d31f0f40315b6a5bb712b5f7edc1d60`

Both image hashes match the manifest. Both decode at the required dimensions and differ from their same-name stage2 originals. Both manifest rows report no capture errors, no WebGL error and no lost context. I did not reproduce the captures or independently exercise the GPU.

## Fresh focused verification

I ran this command in the supplied worktree:

```sh
npx vitest run src/render/OverloadShell.test.ts src/render/OverloadDraft.test.ts src/render/AuthoredRooms.test.ts --reporter=verbose
```

Result: 3 test files passed, 20 tests passed, exit 0. The shell tests cover role construction, unchanged input topology, near-flush finishes and every apron vertex remaining inside the room and outside the pit. The other tests cover rough-head reservations, canonical empty collision and four breaches, batching, disposal and authored-room behavior. `git diff --check` also passed.

The saved route report records 179 checks passed, zero failures and zero errors. I inspected that summary but did not rerun the route suite. I did not rerun the full project suite or production build. Those are implementer evidence, not fresh independent verification. Apron vertex containment is not a general collision or triangle-intersection proof, and these tests do not prove all shell surfaces free from clipping under every camera angle.

## Limitations and next-stage concerns

The capture manifest calls the fixture controlled-live-simulation. It explicitly uses staged legal actors and fixed-step production combat, an inactive encounter director, no boss, no campaign progression, no DOM HUD and no real touch input. For this verdict these are static controlled-simulation art frames, not a live encounter or campaign playthrough. The overview uses a room fit; the desktop uses production camera/composition according to the manifest.

The rough reactor heads, restraint connection and assembly construction remain stage4 work. Their unresolved detail is not a reason to reject this shell pass. The inherited east compatibility port remains visible; fatal-state behavior and escape semantics are unverified. No ending, sequence-driven lighting, full traversal, motion, performance or final collision acceptance follows from this review.

Only this report was written. I made no runtime/source edits, started no GPU job, and performed no commit, publication, guard update or deployment.
