# Independent distribution geometry review

## Verdict

PASS for the north/south distribution pair's source-only construction and fit gate. No concrete must-fix found in the reviewed candidate. This does not accept materials, runtime attachment, shipping-camera readability, performance, finished-room behavior or release. Monitoring and flush-service assets remain outside this review.

Reviewed working-tree candidate over `196c140ea947f71bda0fa2813c7468980e39aded`. Builder SHA-256 is `0e1272f77dd6a32efa6489c50751bed5582dc1f839eddc92099ce057ff5bd721`. The verdict applies to the exact sources and artifacts below, not subsequent edits. The author was finishing documentation during review.

Only this review file was authored by the reviewer. No Blender, GPU, browser, runtime writer, commit, push or external update was used.

## Spec review, before code and pixels

Read `docs/design/passenger-vault-story.md`, `passenger-vault-layout.md` and `passenger-vault-equipment-plan.md` first. Required scope is two original enclosed distribution banks serving living-passenger infrastructure, not a new interaction or damage narrative. Preserve nominal 32 game units per metre, north `x300..900,y40..120,h≤48`, south `x300..900,y760..840,h≤32`, wall-contact backs, sealed collision silhouettes and room-facing maintenance access. South must be authored at 1 m, not squashed from north's 1.5 m. Preserve the accepted four carriers and sixteen chambers.

The candidate meets that construction contract. It adds no bodies, rescue/power puzzle, failure story, raised aisle pipes or new collision reservation. Later equipment-plan gates remain open.

## Code and actual geometry

Read all of `distribution.py`, `test_distribution_geometry.py`, `test_distribution_artifacts.py`, `test_distribution_reproducibility.py`, the manifest, reproduction receipt, provenance and distribution README. Also inspected retained build and fault-test log endings.

- Both actual GLBs were independently loaded with Three.js `GLTFLoader.parseAsync` in CPU-only Node. Updated world transforms and actual mesh bounds give nominal `18.75 × 2.5 × 1.5 m` north and `18.75 × 2.5 × 1 m` south, within float tolerance. Each contains 145 meshes. Every loaded mesh has unit scale. Author's post-import installed-bounds checks place them in the exact required reservations within 0.001 game unit. South uses a proper half-turn, not negative mirroring.
- Distinct low construction is real. Independently measured exchanger plates are 1 m wide and 0.88 m high north, 1.5 m wide and 0.48 m high south. Both retain 0.035 m plate thickness, 0.08 m roof thickness, 0.12 m plinth and the same approximately `0.65 × 0.32 × 0.32 m` motor. Source lines 93–104 author these separately. This is not runtime squash.
- Continuous plinth, back, end plates and overlapping roof/front plates explain the solid rectangle. Front covers are recessed 0.02 m from the outer fitting line, not walk-through openings. Source construction joins the covers edge-to-edge and seats them on the plinth. There is no open rear slot. The validation checks actual imported vertices and world-space BVHs, not just names or accessor metadata.
- Deck-to-skid contact is explicitly checked by opposed rays. Independent loaded-GLB bounds also show plinth top/skid bottom at 0.12 m, skid top/pump-foot bottom at 0.20 m, and foot top/motor bottom at 0.30 m. Pump bodies connect to the supported motors; exchanger plates reach skid height. No floating mechanism was demonstrated.
- Independently raycast all loaded mesh surfaces from the service side. All 30 handle/latch centres per bank hit their intended fitting first. This corroborates the author's first-hit exposure test rather than trusting its reported count.
- Alternating horizontal pumps and plate packs, rear twin headers and connecting branches are plausible simplified enclosure innards. They are not a complete hydraulic or fabrication design. Valves, second-fluid circuits, electrics, detailed pipe clamps and installation sequencing are not established here. The README correctly disclaims those claims. Nothing in these neutral cutaways requires hydraulic certification to pass this silhouette gate.

## Pixel review

Loaded and inspected all five original PNGs through vision, not thumbnails inferred from filenames. All are 1200 × 800, orthographic neutral source evidence. All bank outlines are within frame.

- North closed shows six separate service covers, handles, fasteners, continuous top, visible end closure and a continuous base strip. Grain reduces small-fitting clarity, but panels are legible.
- South closed visibly has a lower front face while retaining hardware size. Service fittings are faint but visible, not hidden behind the covers.
- North cutaway shows three motor/pump bays alternating with taller plate packs, seated bases and continuous rear piping.
- South cutaway shows wider, shorter plate packs and unchanged pump scale. It visually corroborates distinct authorship rather than a scaled screenshot.
- Room placement shows the two perimeter banks and four closed four-chamber rows, with open central and rear circulation. The foreground wall hides the south maintenance face. This image does not prove that face's shipping visibility; the south studio image is the construction evidence for it. The two east consoles remain placeholders. There is no scale actor or shipping camera in this set, and none is claimed.

### Exact image inventory

Paths are repository-relative. Hashes are SHA-256 of the actual PNG file bytes, checked against `manifest.json`. Decoded RGBA dimensions and pixel hashes were also independently compared with `reproducibility.json` and the retained clean root.

| Path | Dimensions | File SHA-256 |
|---|---|---|
| `tools/assets/passenger-vault/distribution/north-closed.png` | 1200 × 800 | `a8839de2c7ee499eadbcefeed33268329acc70e52ec49a2cbb5d25e269bd3634` |
| `tools/assets/passenger-vault/distribution/north-cutaway.png` | 1200 × 800 | `1e3d0cab25aa34f95b882927b8749ce18c445fc1eae573e9c51c4d07ea310718` |
| `tools/assets/passenger-vault/distribution/south-closed.png` | 1200 × 800 | `9db2faf4a7f71a6c20c83646b680cf7defb34eb26224c74ee60357e49cdf70f3` |
| `tools/assets/passenger-vault/distribution/south-cutaway.png` | 1200 × 800 | `39183c917aa653ada2991ee192321f120fb0ce0545848fe9c880ab0e4e0b1a7e` |
| `tools/assets/passenger-vault/distribution/room-placement.png` | 1200 × 800 | `2165c9fe637244f152f69dc593ea23d2cf395655c7e3ae5d38fd7aea5e6e9555` |

## Tests, reproducibility and preservation

Fresh reviewer executions:

1. `PYTHONDONTWRITEBYTECODE=1 python3 tools/assets/passenger-vault/test_distribution_artifacts.py`: exit 0, one test passed. All nine manifest artifacts verified: two GLBs, two blends, five PNGs.
2. `PYTHONDONTWRITEBYTECODE=1 npm test`: exit 0. Vitest reported 59 files passed and one skipped, 493 cases passed and one skipped. Both Node cases and all three Python artifact suites passed. This is not `npm run verify`.
3. Independent CPU GLB loading, actual bounds, unit scales and first-hit fitting checks described above: exit 0 for both variants.
4. Independent hash/preservation/clean-root comparison: exit 0. Verified all seven source hashes in `provenance.json`. Compared all 53 preserved package files against both their recorded hashes and `git show 196c140ea947f71bda0fa2813c7468980e39aded:<path>`.
5. Verified the retained `/tmp/passenger-distribution-clean-tjr2rj7x` against current inputs. Builder, room-fit helper, geometry/artifact tests and topology input match. Both new GLBs and both accepted input GLBs match byte-for-byte. All five decoded PNG results match current images and the receipt.

The reviewer did not rerun Blender or the clean-root builder because the author owns that slot. Instead, reviewed their real execution logic and retained logs, then independently checked retained outputs and source identity. `test_distribution_geometry.py` freshly imports a GLB for each destructive mutation, rejects nine faults per variant, including deleting an actual roof face, and fails if any fault escapes. Both canonical and clean-root logs contain all 18 rejections. Positive validation runs after export/import in the builder. These are meaningful geometry regressions, not fabricated manifest-only assertions.

The tests are bounded: manifold checks apply per welded object, not a Boolean union of the bank. Sampled deck/back/front rays are not exhaustive collision proofs. Skid contact and external fitting exposure are tested, but every internal pipe connection and fitting attachment is not. Current source construction and pixels supply the complementary inspection. The CPU artifact test is integrity coverage, not an independent geometry oracle, and its literal pending-review gate string must not be mistaken for review authority.

The clean-root script copies only required sources and accepted assets into a fresh directory, runs the actual builder, geometry tests and artifact test, then compares generated outputs. Accepted rows are read-only inputs. Blend binary repeatability is explicitly not claimed.

### Output and input identities

- `public/assets/passenger-vault/distribution-north.glb`: `7630daa1470f7890ef010ddd2da5ad03a6ec79e268a1576d529faf8b2c860602`.
- `public/assets/passenger-vault/distribution-south.glb`: `fdc1fe47c2362a6d88730fbc82f3a8ddf34e74882a7a78efc9f0d30835d2df2a`.
- Preserved `public/assets/passenger-vault/chamber.glb`: `029a456996061b42355bff6f15a8ce274b9dbbeced00ea76f41fc972b7e8d840`.
- Preserved `public/assets/passenger-vault/row-carrier.glb`: `9e8610aa0de331ad527c26a09752b439bf34935e4c9bb448e3de09138416c11b`.
- Source/helper/test hashes and the full preserved-input enumeration are in `provenance.json`; artifact binary hashes are in `manifest.json`; decoded pixel hashes are in `reproducibility.json`. All were checked against local bytes.

Original procedural boxes/cylinders and authored arrangement are visible in source. README attributes manufacturer references as construction guidance, not licensed mesh or texture inputs. No downloaded asset input or historical PR58 writer is used by this builder. Source reference browsing was not repeated by this reviewer.

## Must-fixes and later gates

No must-fix for this construction candidate.

Before material/runtime acceptance, retain separate checks for batching and complete placed budgets, PBR/UV/wear, finished service/status readability, shipping desktop/portrait south-bank occlusion, loader lifecycle and complete-room route/projectile/navigation/pickup behavior. The current 145 unbatched meshes per bank do not satisfy the later draw-call ceiling as delivered. Interior hydraulic detail and service-removal motion remain unverified and must not acquire unsupported claims. Finished-room capture and full release verification remain required. None of the source-only PNGs substitutes for those gates.
