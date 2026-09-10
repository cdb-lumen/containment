# Whole-room installed geometry recovery result

Author verification passed for the two tooling fixes requested in `code-pixel-review.md`. Follow-up independent code acceptance remains pending. This is the same source-only four-row fit gate, not a new design or runtime release acceptance. The historical must-fix review and spec review are unchanged.

## Fixes and measured result

- Inventory validation now requires exactly four unique row IDs A/B/C/D4, four chamber groups per row, nonempty mesh geometry in carrier and chamber groups, and named-group membership matching the installed object lists. It derives carrier and chamber totals from those groups and asserts four carriers and sixteen chambers before geometric probes run.
- The CPU artifact contract independently checks row IDs, per-row chamber record counts, their agreement with summary counts, and positive mesh/triangle totals.
- Removed the unused room-fit `--skip-renders` flag. Argument parsing rejects it before assembly or output writes. Tests cover both absent and pre-existing manifests, including exact preservation of an existing manifest. Every successful room-fit manifest run renders both images. The separate geometry test command remains available without rendering. The historical one-row builder is outside this recovery and unchanged.
- Actual current inventory remains 4 carriers, 16 chambers, 512 imported mesh objects and 63,936 placed triangles. Diagnostic actors, deck, traces and neutral service reservations are excluded. A/B face south and C/D4 face north. Placement and rendering code are unchanged.
- Retained geometric checks still report 64 support contacts, 64 service interfaces, 140 paired top/bottom plinth probes, eight existing solids, 12 continuous route segments and 34 access segments with radius-28 clearance. These are geometric checks, not production navigation, structural or medical certification.

## Fresh verification

Commands ran from the repository root, serially for Blender work:

```sh
blender --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/test_room_fit.py
blender --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/room_fit.py
python3 tools/assets/passenger-vault/test_room_fit_artifacts.py
python3 tools/assets/passenger-vault/test_room_fit_reproducibility.py
```

- `recovery-red.log`: exit 1 before implementation. New tests exposed empty/missing inventory acceptance, non-inventory failures for duplicate rows, missing chambers and empty groups, accepted mismatched names, and skip-render manifest writes. Missing chamber/group cases raised old KeyError/IndexError paths instead of the required inventory assertions. The seven existing geometry fault tests remained passing.
- `recovery-tests.log`: exit 0, 15 tests passed. New regressions reject empty inventory, missing row, duplicate row, missing chamber, empty carrier/chamber groups, mismatched named groups and the removed flag. Expected argparse rejection diagnostics are present in the passing flag test.
- `recovery-build.log`: exit 0, both 1600 x 1200 Cycles CPU PNGs freshly rendered and the manifest rewritten with final fixture/test hashes.
- `recovery-artifacts.log`: exit 0, one CPU artifact test passed.
- `recovery-reproduction.log` and `reproducibility.json`: exit 0. Clean root `/tmp/passenger-whole-room-w6w0szzp` used absolute script paths and explicit output root. Render, 15-test geometry suite and CPU artifact test each exited 0. `clean-0.log`, `clean-1.log`, `clean-2.log` contain the fresh child outputs.
- Clean-root validation, solids and input hashes match the retained candidate. Copied approved GLBs are byte-identical. Both rendered images have identical decoded RGBA pixels between roots. This is fixture reproduction using immutable GLBs, not regeneration of those GLBs or a cross-version determinism claim.

## Pixel and preservation proof

Both fresh images also decode identically to the exact reviewed pixel snapshot in `code-pixel-review.md`. `recovery-preservation.log` records current decoded hashes and the fresh reproduction receipt. No new visual interpretation is claimed by this recovery; the parent owns follow-up inspection and acceptance.

```text
b41839f25b7be4e735ba328c8aa4f33d227f61f4f48bdf50950feac10ccf00b4  whole-room-oblique.png decoded RGBA
f7fa8325cad306a30375bb1a43e3010c7b88259f34740e1a59e728b594418caa  whole-room-top.png decoded RGBA
029a456996061b42355bff6f15a8ce274b9dbbeced00ea76f41fc972b7e8d840  public/assets/passenger-vault/chamber.glb
9e8610aa0de331ad527c26a09752b439bf34935e4c9bb448e3de09138416c11b  public/assets/passenger-vault/row-carrier.glb
```

A fresh byte comparison of all 93 tracked files under `src`, `public/assets/passenger-vault` and `tools/assets/passenger-vault`, excluding the authorized README, found zero differences from HEAD. Historical source, GLBs, blend, PNGs and rejected reviews remain intact. The untracked room-fit code/pixel review and spec review hashes also match their pre-recovery values. `SHA256SUMS` covers the current room-fit source/evidence and retained earlier logs; prior `tests.log`, `build.log`, `reproduction.log` and `npm-test.log` describe the preceding candidate, not this recovery.

## Remaining scope

No npm suite/full verifier, runtime edits, new equipment family, GitHub actions, vault/checkpoint changes, commits or pushes occurred in this recovery. Historical npm results have not been renewed. Distribution, monitoring, flush kit, underfloor construction, materials, loading/animation, shipping-camera and runtime integration, full verification and video remain open. This does not authorize merging PR58, PR48 or PR59. Parent review and publication remain outstanding.
