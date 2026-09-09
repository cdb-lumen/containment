# Flush-kit final independent review

## 1. Spec re-review: PASS

The missing editable source that blocked the original review is repaired. This verdict supersedes the current-state FAIL in `spec-review.md`; that historical file remains unchanged. Spec review passed before I opened the PNGs for the separate quality review.

Reviewed base is `0a56af7711aa92ccea634acbbda7ef84e018bb27`, with the proposed flush-kit files uncommitted. Authority is `docs/design/passenger-vault-equipment-plan.md`, especially lines 32, 36, 42–46 and 56, and `docs/design/passenger-vault-layout.md`, lines 54–87. Scope is this construction-only family, not acceptance of all equipment-plan deliverables.

### Requested and delivered

| Requirement | Requested | Delivered and checked |
|---|---:|---|
| Room-origin flush kit | 1 | 1 package, 13 connected planar kit mesh objects |
| Editable kit source | 1 | 1 reopenable `.blend`, 13 authored quad meshes plus 10 source-only context meshes |
| Shipping GLB | 1 | 1 GLB, 13 kit meshes, no context fixtures |
| Full-room construction views | 2 | 2 actual PNGs, top and oblique, each 1200 × 880 |
| Underfloor row feeds | 4 | 4, at x420/780, north y120..248 and south y632..760 |
| East header branches | 2 | 2, centred at y100 and y780 |
| Console contacts | 2 | 2, centred at y280 and y600 |
| Wall channel | 1 | 1, x1162..1166, inside the east wall rather than floor annotation x1148 |
| Reservation footprints retained | 8 | 8 exact source-only footprints checked against the layout |
| Extra collision solids or raised route obstacles | 0 | 0 introduced; kit vertices are all at h0 and runtime files are unchanged |
| Passenger capacity | 16 unchanged | Preserved by unchanged layout/runtime and passing layout tests; this kit contains no passenger models or live-state cue evidence |

The four neck pieces join feeds to headers. Their subdivision into separate objects is an implementation choice, not four additional equipment assemblies. The imported kit has 1,026 triangles and passes 325 surface probes. Actual triangle area, boundary edges and positive winding support continuous rectangular surfaces without holes. Native GLB bounds are `[13.0625,0,3.0625]` to `[36.4375,0,24.4375]` metres, with no node transforms, negative-scale mirroring or recentering.

### Original blocker closure

`service_finish.py:110–114` now saves the authored quad scene after adding source-only reservations and before render material mutation. Shipping export occurs earlier with only kit parts selected. I reopened the delivered source and retained clean-root source, checked geometry and the eight reservation bounds, and confirmed authored Principled materials remain present. Each root also passed the supplied source-reopen test in its own fresh Blender process.

Both source snapshots have semantic SHA-256 `9f84cc341124d2cadacdfa013c228ee666380a69bfaa62fe43324ce58d49c114`. The snapshot compares named objects, transforms, vertices, faces, material assignments and neutral colors. This is not a claim of identical arbitrary Blender scene state or binary containers. The two `.blend` container hashes differ, as the documentation explicitly allows.

The manifest contains and correctly hashes all four required artifacts. The updated verifier requires that inventory, reopens both sources, compares semantic reports, and checks clean-root GLB bytes and decoded PNG pixels. The default `npm test` command now includes the lean artifact wrapper. The only tracked diff is that package-script addition; no runtime or accepted-family file is changed in the tracked diff.

## 2. Code and actual pixel quality: PASS for construction only

No must-fix code or construction-evidence defect found in this slice.

### Code and geometry

- The tests inspect delivered GLB geometry. They do not invoke `author()` or manufacture passing replacement meshes. Expected route rectangles are separately declared from the authoring code. Mutations operate on imported parts.
- Fresh supplied runs passed all 10 Blender tests in each root. The artifact wrapper passed both tests. Fresh layout verification passed all 18 tests.
- My additional imported-mesh probe rejected nine mutations: omission of each of the four feeds and two contacts, raised geometry, recessed geometry and reversed imported face winding. These are nine controls, not nine new test methods in the supplied suite.
- I audited the actual exported NORMAL accessors independently of the face-winding test. All 1,104 normal entries point upward in glTF coordinates. Imported and reopened source faces also point upward. The supplied suite rejects missing area, an internal deleted triangle, empty meshes, displaced footprints and a channel moved onto the floor.
- The GLB contract passes with 13 mesh nodes, two neutral materials, 42,520 bytes and no embedded textures, animations, cameras or skins. The kit is a zero-thickness marking layer, not a deck replacement or a hidden pipe model.
- No unsupported byte-reproduction claim found. I compared the retained clean root directly: copied author/test sources, GLB bytes and decoded PNG pixels agree with the checkout. All receipt evidence hashes and each root's manifest artifact hashes match. The fresh authoring/rebuild history is supported by the retained verifier log, not by a rebuild I performed during review.

### Pixels actually inspected

I opened `top.png` and `oblique.png` themselves after the spec gate passed. Both show the entire room envelope without clipping, four row reservation rectangles, north/south distribution reservations, two east console reservations and the perimeter service path. The four feed lines are visible in both views. The centre crossing and spine remain visually empty. Neither view depicts pipes, grated pits or raised route volumes.

The top view gives the clearest routing overview. The oblique view stays recognizably flat and retains all room corners. Lines are thin and slightly grainy at these overview scales. Individual cover joints and the very short console contact pieces are not independently legible enough in these pixels to prove their detailed construction; imported geometry supplies that evidence. These are adequate routing diagrams, not closeup finish evidence.

Visibility is deliberately diagrammatic. `add_context()` places the floor below h0 and reservations below the kit, and rendering changes materials to neutral emission after export. This makes routes visible even where real cabinets would cover them. It does not demonstrate visibility over a coplanar production deck or through installed equipment. The README and manifest disclose that distinction rather than presenting these pixels as runtime evidence.

## Must-fix limitations and later gates

There are no remaining must-fixes for this construction-family gate. The following remain mandatory before broader acceptance:

1. Resolve the coplanar production-floor case with an explicit decal or floor-merge strategy and test it in the real renderer. These h0 meshes must not simply be attached over an h0 floor and assumed free of z-fighting. The diagram's lowered context floor is not an integration solution.
2. Do not use these images to claim installed-equipment visibility, 16 readable live-state cues, physical service-panel depth, material separation, gameplay readability, performance or finished-room acceptance. Real equipment occlusion and shipping-scale views belong to later gates.
3. Reproduction checked here is comparison with the retained clean-root artifacts and fresh source reopening. I did not rerun the authoring/rendering verifier, GPU work, production build, full `npm test`, browser smoke or CI. Their earlier recorded outcomes are not fresh reviewer execution. The retained `/tmp/passenger-service-finish-clean-q6awl8iu` directory is evidence, not a durable distribution dependency.

## Source and artifact identity

All values below were computed from the reviewed files, not copied without checking. Paths in this table are relative to `tools/assets/passenger-vault/`, except the public GLB.

| File | SHA-256 |
|---|---|
| `service_finish.py` | `5a691d565816815aa7b028743214ff6586cf39f4036a9b0ce4583c1731c3e5c2` |
| `test_service_finish.py` | `4674925abc43b3fbc7ed4d65a2b1b98424794dd52b4cb1ffc950649a24f8ba50` |
| `verify_service_finish.py` | `45920967762a6f369acbb32cbd060a8f874a451e98a45de98b96ab417a333872` |
| `test_service_finish_artifacts.py` | `abea873f170ab40344341f2051363660db002aabf52d12a8c437cb36c868c9e4` |
| `service-finish/service-finish.blend` | `70d6502d46db0e48e015fec959d1e212b86d90e1539e9919030bce54be41048e` |
| `public/assets/passenger-vault/service-finish.glb` | `85517cc282d247b4a09d0daf3c56405b80f2417a5da1675e3186080ceb1337b6` |
| `service-finish/top.png` | `d59cbfef01dc66c12bad438b1a62a2a332e426063f8213970a0ce2d356bf0dc1` |
| `service-finish/oblique.png` | `b642e00a990ffab07b32917c58ab3f9deea877d6a6d685528a71b72408a610fc` |

Decoded RGBA hashes are `d2acb0d3ff80fe04311370257a4ac5bc0b8fe6ca130afbee8012b97033e9a182` for top and `600669adbbe42bae8cad8c24d703fa540f28827630529f97ca462ed4d1032169` for oblique. `independent-hashes.json` also records the authoritative plan/layout, original FAIL, package script, manifest and verifier receipt/log hashes.

## Retained reviewer evidence

- `independent-regressions.log`: fresh wrapper, both roots' Blender test results and focused layout results, each command exited 0.
- `independent-review-probe.py`, `independent-geometry.log`, `independent-geometry.json`: reviewer-owned import mutations, exported normal audit, source reopen and footprint checks. Run the probe with Blender background mode and `--python-exit-code 1`; it uses the reviewed absolute checkout and retained clean-root paths.
- `independent-hashes.json`: checked file identities, decoded pixels, GLB contract and retained clean-root comparison.

Only this report and reviewer evidence were added. No implementation edits, source or image regeneration, commit or push.
