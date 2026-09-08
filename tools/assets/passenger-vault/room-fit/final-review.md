# Final independent room-fit review

## Verdict

PASS for the bounded4row fit. Both must-fixes in `code-pixel-review.md` are closed for this exact repaired source/evidence snapshot. No remaining must-fix was found within the source-only installation of four carriers and sixteen closed chambers.

Reviewed HEAD `3bf42361b9229ccbe6c70ce5dc77696b9db0c2ee` plus the uncommitted files identified below. The historical failed code/pixel review and passed spec review remain unchanged. This follow-up accepts the repaired bounded fit, not the complete equipment inventory, materials, runtime or release. Parent-owned full verification is separate and is not claimed here.

## Closure of the two findings

1. `room_fit.py:120-130` now checks assembled inventory before geometry probes. It requires exactly four row records with unique IDs A/B/C/D4, exactly four chamber groups and named chamber groups per row, nonempty mesh groups with vertices and polygons, unique members within each group, and exact agreement between installed objects and named-group values. Carrier and chamber totals are derived from these groups rather than initialized as claimed constants. Missing or duplicate rows cannot produce a passing empty receipt. The unchanged inter-chamber overlap checks also reject repeated chamber geometry. This remains validation of the immutable approved imports, not a general replacement-asset completeness certifier.
2. `room_fit.py:235-245` removes `--skip-renders`. In the supported Blender invocation, argument parsing rejects it with exit 2 before output-directory creation, assembly, rendering or manifest writes. Every successful manifest-producing path calls `render` first. `test_skip_renders_is_rejected_without_writing` covers both absent and existing manifests and checks exact existing bytes. No validation-only path now binds old pixels to new source hashes.

The new geometry regressions cover empty inventory, missing row, duplicate row, missing chamber, empty carrier/chamber groups, mismatched named groups and the removed flag. The CPU artifact contract independently checks row identity and multiplicity, four chamber records per row, derived totals and positive mesh/triangle counts. These directly address the historical review requirements.

I independently executed the current `validate` AST with only the Blender view-layer update replaced by a no-op. Empty, missing and duplicate row sets all raised the explicit inventory assertion before geometry access. I also executed the current `main` AST with the supported Blender argument layout and the removed flag against the existing output root. Parsing exited 2 before any output action; the manifest SHA-256 stayed `acb9b8ef48e9a9276baefe84d7e21ac9b2aee673b0c62b96cf45b9713b935517`. This is a cheap control-flow check, not a substitute for actual mesh tests.

## Spec continuity and retained execution evidence

- Equipment-plan, layout, topology and both GLB hashes equal the passed spec snapshot. A fresh byte comparison found all 93 tracked files under `src`, `public/assets/passenger-vault` and `tools/assets/passenger-vault`, excluding the authorized README, identical to HEAD. Package changes only append the CPU artifact contract. No runtime or GLB edit is part of this repair.
- Independently parsed inventory is A/B/C/D4 with four chamber records each. The manifest reports 4 carriers, 16 chambers, 512 imported mesh objects and 63,936 placed triangles. A/B face south and C/D4 face north. Row envelopes, height limits, eight solids and radius-28 continuous route/access checks retain the passed spec contract.
- The entire current validation object equals the original `build.log` receipt, the repaired `recovery-build.log` receipt and `clean-0.log`. This includes 64 support contacts, 64 service interfaces, 140 plinth probes, 12 route segments and 34 access segments. Equality establishes continuity of the recorded geometric result; it is not runtime navigation evidence.
- Read `recovery-red.log`, which preserves the earlier six failures and four errors. Both `recovery-tests.log` and `clean-1.log` report 15 passing tests. I programmatically matched all 15 current test method names to both logs. The argparse error text in the passing flag test is expected rejection, not an unresolved failure.
- `recovery-build.log` and `clean-0.log` record both rendered images. `recovery-artifacts.log` and `clean-2.log` record one passing artifact test each. `recovery-reproduction.log` equals the current reproduction receipt, whose three commands each exited 0.
- The clean root `/tmp/passenger-whole-room-w6w0szzp` still exists. All seven copied inputs equal current files. Its manifest inputs, solids and validation equal the retained manifest; both decoded images also match. This reproduces the fixture using copied immutable GLBs, not GLB regeneration or cross-version rendering determinism.
- All five manifest input hashes, both image file hashes and all 32 entries in `SHA256SUMS` independently matched. The hashed checksum list also binds retained older logs. Historical `tests.log`, `build.log`, `reproduction.log` and `npm-test.log` are earlier-candidate receipts, not renewed full-suite verification.
- Reviewer execution of `python3 -B tools/assets/passenger-vault/test_room_fit_artifacts.py` passed one test in 9.288 seconds. `git diff --check` passed. No Blender, GPU, render, full test suite, child agent, source edit, commit or push was run by this reviewer.

## Independent inspection of the actual PNGs

I loaded both retained images through vision and inspected them. Both decode as 1600 x 1200 RGBA; the vision display was downscaled to 800 x 600.

The top view shows four separate four-chamber rows with closed lids, working-face details toward the central crossing and rear rails on the outside. The central crossing, spine, rear loops and end approaches remain visibly open. Four neutral reservation blocks are separate from the installed equipment.

The oblique view shows the same sixteen closed chambers on four continuous bases, with upright diagnostic actors outside the equipment. There is no visible row overlap, floating row or implied walking slot through the bases. Small support and service-fitting contacts cannot be accepted from these overview pixels alone; those claims remain tied to the geometry checks and prior immutable-asset gate.

Independent Pillow decoding produced the exact RGBA hashes in both historical reviews and the new reproduction receipt:

```text
b41839f25b7be4e735ba328c8aa4f33d227f61f4f48bdf50950feac10ccf00b4  whole-room-oblique.png decoded RGBA
f7fa8325cad306a30375bb1a43e3010c7b88259f34740e1a59e728b594418caa  whole-room-top.png decoded RGBA
```

The PNG binary hashes changed during rerendering, but the decoded pixels did not. The historical bounded visual acceptance is preserved, supported by fresh inspection. These neutral diagnostic images do not establish material quality, occupant-status readability or shipping-camera acceptance.

## Exact reviewed SHA-256 snapshot

Paths are relative to the repository root. `SHA256SUMS` below identifies the verified 32-entry evidence set, including historical logs. This final review is deliberately not included in its own hash list and does not rewrite that list.

```text
dccb559a3949c57bce9488a59ad90c80ad2abe2ca8c68cb479af468965d20a6d  docs/design/passenger-vault-equipment-plan.md
d61cb8430e50224f0ecbdd6fe5c01f168289798f989f75ad12fcc3f065e5d954  docs/design/passenger-vault-layout.md
2691e93413aff1662545afcfc12b0af6954769966f53f8a19bf01fb7aea23b05  src/game/roguelike/authoredRoomTopologies.ts
029a456996061b42355bff6f15a8ce274b9dbbeced00ea76f41fc972b7e8d840  public/assets/passenger-vault/chamber.glb
9e8610aa0de331ad527c26a09752b439bf34935e4c9bb448e3de09138416c11b  public/assets/passenger-vault/row-carrier.glb
c0d36f3463493439834a12605a92c395372cdceafb4200a03b21bfc4b6ea642e  package.json
3f1e49a07cd72b0f706873a59cea0377c82c2412f6b48c093918f73d1a5cff56  tools/assets/passenger-vault/README.md
ed323437df0522d45ca7953190e76332bcdd3213eb3068bc0e2fea4d623c4efb  tools/assets/passenger-vault/room_fit.py
6a8c1b60d9b547a930baa99f91bda4dddbb19715713ec3ca3f3f8cc671eea86a  tools/assets/passenger-vault/test_room_fit.py
8c89808fbd483d4a7e7baff09ddd101027dbe7b73d7e7c52abaf29810a49fccf  tools/assets/passenger-vault/test_room_fit_artifacts.py
224ea0314b3c5c09dbbc695d58a75632f8381527bd66be8b100b9bd33bdca147  tools/assets/passenger-vault/test_room_fit_reproducibility.py
ffdc418eeb9d1074ff48f874b46ac5dc81f7f12e38c2ce8559a9de9e74a8edfa  tools/assets/passenger-vault/test_reproducibility.py
acb9b8ef48e9a9276baefe84d7e21ac9b2aee673b0c62b96cf45b9713b935517  tools/assets/passenger-vault/room-fit/manifest.json
664f0112a279318f046758275a1b9b41f0426490afabc6e9e725fd650ec5be0e  tools/assets/passenger-vault/room-fit/reproducibility.json
c28b44c95bff25d5fdb192cc7033dd76f0dd926362a368589e4e82b0536c7ec9  tools/assets/passenger-vault/room-fit/report.md
c1d4ca962bf33b29de9cbc8da9bc5c48136abd7ad1b79d9d52a7f5ade5b2cdac  tools/assets/passenger-vault/room-fit/SHA256SUMS
d023fc3858d309d8104debd8a78813e938e9f6bd279a5386ca2afc7aabce864e  tools/assets/passenger-vault/room-fit/code-pixel-review.md
54efba6e6cf60e5f3d3c63967bd8be49151b96ac4cdf7a9319f038a6414680bb  tools/assets/passenger-vault/room-fit/spec-review.md
24035b58353fe45130f1e8f1a2cc368624147b5f4404cb3ff690f794ae57b3de  tools/assets/passenger-vault/room-fit/whole-room-oblique.png
ba8832976f1c5169a3e239e05220490c087845ddbaf07c8669211f3fdff12b53  tools/assets/passenger-vault/room-fit/whole-room-top.png
bd71d98853864a04ea6a7dbaaeeacdd08f261b50f7046b0095064d53a6c2fab8  tools/assets/passenger-vault/room-fit/recovery-red.log
f702843e756398b002291d2c1e45023ad3301b3b4766cad909678a19af81f68c  tools/assets/passenger-vault/room-fit/recovery-tests.log
0e3c913d744806f394e4d1412cfb742ad4e375b50b213d89ade74f8fbabe3b06  tools/assets/passenger-vault/room-fit/recovery-build.log
867d2368dd6af276b7855b905169dcad37814d8b9d3a406338e80c9b3410555c  tools/assets/passenger-vault/room-fit/recovery-artifacts.log
664f0112a279318f046758275a1b9b41f0426490afabc6e9e725fd650ec5be0e  tools/assets/passenger-vault/room-fit/recovery-reproduction.log
25663ffe987b0219abd3c4d86b304a2e52b6dc49df770501e19017c08bc95d81  tools/assets/passenger-vault/room-fit/recovery-preservation.log
5f98a498c3c1602d6497911cc9830453a7b87fc26d34730895d5b288276e17c4  tools/assets/passenger-vault/room-fit/clean-0.log
11ddb8a14647d3f7bf79c61702cb3847ef445a83c0c8025636ad0d6c7709ffd8  tools/assets/passenger-vault/room-fit/clean-1.log
3fe834724e583d253e90474244ea85c348b673a6e17a2d8340e95e026f7a7830  tools/assets/passenger-vault/room-fit/clean-2.log
```

## Boundaries and handoff

Only `tools/assets/passenger-vault/room-fit/final-review.md` was written. The unavailable programmatic tool was replaced with ordinary read tools and permitted inexpensive terminal checks; no verification blocker remained for this bounded review.

Distribution, monitoring, flush kit, underfloor construction, materials, loading/animation, shipping-camera and runtime integration, performance, full verification and video remain outside this acceptance. Story/layout acceptance is preserved, not expanded. This review does not mark the complete equipment gate done, approve PR58/PR48/PR59 merging, or change the draft/no-landing state. Parent-owned full-verifier output must be consumed separately before any broader claim.
