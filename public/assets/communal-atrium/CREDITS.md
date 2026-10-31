# Original Room 4 signature garden

`signature-garden.glb` is original procedural Blender geometry authored by Hermes for Containment on 2026-09-12 and revised on 2026-09-13, under the parent project's license. No models, images or textures were downloaded. The design reference is the accepted south32 rough at commit `cf943b4137c7131e49480672ae7ecb19afe9dc5c`, specifically `src/render/CommunalAtrium.ts`. This is not hand sculpting or independent pixel acceptance.

Reproducible source is in `tools/assets/communal-atrium/build_garden.py` and `baseline-ico.json`. Blender 4.0.2 produced the delivered GLB. From the repository root:

```sh
blender --background --factory-startup --python-exit-code 1 --python "$PWD/tools/assets/communal-atrium/build_garden.py" -- --output-root "$PWD/garden-reproduction"
cmp public/assets/communal-atrium/signature-garden.glb garden-reproduction/signature-garden.glb
```

The script also writes an editable `.blend` and actual reimport validation JSON. The baseline position array comes from Three.js 0.185.0 `IcosahedronGeometry`, MIT license, copyright Three.js authors, https://github.com/mrdoob/three.js/blob/r185/LICENSE. The second cosmetic attempt restores all twenty-one rough lobe centers. Each donor vertex is radially contracted to 94–98.5 percent with deterministic unequal factors, preserving the donor convex envelope while filling the previously sparse crowns. Existing trunks and branches are unchanged. The rough's horizontal irrigation pipe remains omitted.

The factor-only GLB contains 44 named meshes, five retained materials, 1,224 triangles and no textures. No UVs are invented for this texture-free asset. Native placement remains `[584/32, 0, 336/32]`, no rotation or scaling. The bed and horizontal reservation remain x -72..72 and gameY -32..32 locally, or x512..656 and gameY304..368 in the room. Maximum height is 93.730476 game units, contained within the accepted rough crown envelope. The previous sparse candidate's 89-unit ceiling is not the rough's ceiling.

SHA-256 is `25ed91dbe92aa9db3f1f9d69ab0ac72494ec0c7a9010ab72218cbc991aad5e04`. Two independent output-root Blender exports reproduced these exact bytes.

This asset-only change does not update runtime contracts. The current integration owner still expects 35 parts, four crowns per tree and height below 89. Those stale candidate-specific guards and test expectations need parent-owned reconciliation before native review. No runtime, camera, light, furniture or layout source was edited here.

Evidence and preserved rejected source/assets are external to the repository at `/home/chernodubv/.hermes/workspaces/containment-art-roadmap/communal-atrium/garden-mass-20260913`. CPU geometry and reproduction checks do not establish native appearance, actor readability, shadows, performance or room acceptance. This remains cosmetic attempt two; an unsuccessful native review requires simplification or replacement, not a third cosmetic attempt.
