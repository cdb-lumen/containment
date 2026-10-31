# Independent Room20 stage0 review

Verdict: PASSED stage0 story intent.

This verdict covers the local story-intent PNG and sourced brief only. It is not layout approval, runtime verification, final room acceptance, publication completion or permission to advance the guard. No blocking stage0 defect found.

## Evidence inspected

- Read map-model-production.md, especially stage0 scope and the distinction between concept and gameplay evidence.
- Read the live OPEN issue42 with `gh issue view 42 --repo cdb-lumen/containment --json number,title,state,body,url`. Its current asynchronous authority supersedes the older preceding-room release dependency.
- Read storyRooms.ts, authoredRoomTopologies.ts, storyRoomTemplates.ts and the story registration in roomTemplates.ts. Independently compared their bytes to Git blobs at 7a3f262886104fb024de9684958b3f85a8859f34.
- Read brief.md, generate.py and source-manifest.json. Did not rely on the builder's checks.md verdict.
- Inspected the actual story-intent.png using vision_analyze, first as the whole board and then a native-resolution machinery/platform crop. The whole-board tool view was downscaled to 1200 by 800. The original is 2400 by 1600.

## Visual and story findings

The board explains the original function, deliberate change and player goal. Regulated ship power is explicitly labeled design inference rather than new canon. Room19 already authorized Destroy ship while passengers were alive. Room20 asks the player to remain and defend the sequence, with no new switch or second authorization.

Machinery roles have visible support beyond labels. The left head has paired bent returns and a broad manifold. The right head has parallel bronze conductors and pale collars. The front restraint has a raised fork and central piston. Nested rings and the blue-white axial column give the installation an exposed central focus. Pale insulators, bronze conductors and dark deck steel follow the issue's material direction. Attached edge braces suggest support beneath the deck.

The projected three-lobed deck and dark central opening establish the room's identity. The exaggerated core partly covers the opening and crowds the service heads. This is acceptable for this labeled assembly concept, but it cannot establish fit inside the void, head separation at shipping zoom or unobstructed circulation. The brief explicitly leaves scale, placement and occlusion unapproved.

The fatal consequence is prominent and exact: SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED. The broken-ship pictogram supports that reading. No pod, evacuation arrow, exit beacon or colored floor hazard appears. The before-state power arrow belongs to an explanatory icon, not a floor route. The compatibility exit is correctly described as data, not escape. Spawn and breach coordinates are retained in the brief rather than plotted as a layout proposal.

## Focused checks executed

All checks below passed in the reviewer's ordinary terminal command. These are static source and PNG checks, not runtime tests.

- HEAD and local origin/main both resolved to 7a3f262886104fb024de9684958b3f85a8859f34. The runtime worktree was clean before and after checking. No remote fetch was performed, so this does not assert current remote-main freshness.
- All four manifest source hashes matched both worktree files and pinned Git blobs. Both font hashes matched installed font bytes.
- Parsed the canonical boundary and central void and matched them to the manifest. Checked spawn 140,440, compatibility exit 1060,440, four breaches at 240,320; 960,320; 240,680; 960,680, and empty obstacles.
- Read the authored-topology spread after fallback template fields and the story-template registration. Historical fallback obstacle footprints are not the effective Room20 obstacle contract.
- Checked the exact ending in canonical source, brief, generator and manifest. Confirmed its visible wording in the PNG separately.
- Pillow verified PNG integrity, fully decoded it and confirmed RGB, 2400 by 1600 and nonblank pixel variation.
- Executed the unchanged generator text with its output directory redirected by a temporary __file__ location. Temporary PNG and manifest bytes exactly matched the candidate. Temporary files were removed automatically. Did not rerun the generator against the candidate directory.
- Hashed all existing attempt files before and after the checks. Their bytes were unchanged. Runtime Git status remained clean.

## Reviewed artifact pins

- story-intent.png SHA256: 3ab7aaf75c2b02792517614bccc72b9c4171eea0785575c16631f3df0db04815
- brief.md SHA256: ee71b67d6b52d4817de5cd9a5d647b1026feac810b0d61290acba254bf963a06
- generate.py SHA256: 284a8a7de8e3dcf03b26954120957db49ce1148a767b1b54d3f59aca571160e4
- source-manifest.json SHA256: 2c75df19d2d0fa97ce9e1eeb88241c4fc5769a16f5ea5790fe468574783e96be

## Limits and handoff

No game, browser, combat sequence or behavioral test ran. This review does not verify fatal-ending execution, authorization timing, Skip behavior, collision, connected traversable routes, dense-combat visibility, actual overload lighting, near/far burial or occlusion, desktop/phone runtime views, or detailed final construction. Those remain later-stage obligations from issue42. Segmented coil shoes, fasteners and finished materials are not accepted by this concept review.

Only independent-review.md was created by this review. Candidate files and runtime source were not modified. No publication, guard or registry edit, merge, deployment or human acceptance was performed.
