# Converted skeletal assets

All model files are self-contained glTF 2.0 binaries. Source IQEs remain unchanged.

| Asset | Triangles | Joints | Clips | Materials / images | Size MB |
|---|---:|---:|---:|---:|---:|
| dretch | 2384 | 46 | 11 | 1 / 2 | 1.75 |
| basilisk | 9480 | 38 | 9 | 1 / 2 | 1.92 |
| marauder | 10010 | 57 | 11 | 2 / 4 | 2.19 |
| dragoon | 14902 | 73 | 8 | 1 / 2 | 2.00 |
| tyrant | 9738 | 63 | 12 | 2 / 4 | 3.03 |
| human_male | 11836 | 122 | 17 | 4 / 8 | 5.38 |

## Conversion and validation

- Scene is Y-up. Source +X front is preserved; runtime rotation of -90 degrees about Y points alien fronts along +Z.
- Conversion rotation is on the skeleton ancestor; skinned mesh nodes are scene roots. Skinning applies the same -90 degree X world rotation as the original hierarchy.
- All images have maximum 1024px dimensions. Diffuse maps: JPEG quality 88; normalized tangent-space normal maps: JPEG quality 95, no chroma subsampling.
- UV V is retained because IQE already stores top-left UV coordinates. Triangle order is reversed from IQE clockwise to glTF counterclockwise.
- Existing IQE tangents are orthogonalized and handedness inverted for glTF. Tangents are generated when missing. Zero-length source tangents receive a valid perpendicular fallback.
- Animation sampling is at most 30 FPS, preserving original sampled timestamps and final source frame. Constant channels use one key; one constant channel keeps final time when needed to preserve clip duration.
- Human materials share four texture sets. All eleven authored weapon delta clips are retained along with stand, idle, run, run_back, walk, attack.
- Dragoon has seven unweighted source vertices in a tiny cluster. Each now copies influences from its nearest weighted vertex. Other source vertex weights required no repair.
- Maximum rest-skin reconstruction error is below 5e-7 source units; maximum inverse bind matrix identity error below 6e-15.
- Per-model `.report.json` files include mesh bounds, map paths, joint counts, clip names, source FPS, sampled frame counts, and validation values. Khronos reports are adjacent `.validation.json` files.

## Sources and permissions

- All alien source assets: https://github.com/UnvanquishedAssets/res-players_src.dpkdir/tree/master/models/players
- Dretch mesh: Greg “Gregorein” Bak. Dretch textures and Tyrant model/textures: Daniel “DandoomByggy” McCarthy. CC BY-SA 3.0 confirmations: https://forums.unvanquished.net/viewtopic.php?t=2142
- Current Dragoon: Raphaël “RXMT” Moreault-Truchon. CC BY-SA 3.0 confirmation: https://forums.unvanquished.net/viewtopic.php?p=17959
- Basilisk model: Sergio Anes Alcolea, CC BY-SA 3.0. Texture credited to Jan “Stannum” van der Weg, animation to gavlig: https://forums.unvanquished.net/viewtopic.php?p=14205
- Marauder: Osiris, Sewer Hrehorowicz, Russ Briggeman Jr.; CC BY-SA 2.5, confirmed in https://wiki.unvanquished.net/wiki/Credits/Media. Project-wide media statement: CC BY-SA 2.5, https://github.com/Unvanquished/Unvanquished/blob/master/COPYING.txt ; project licensing cleanup: https://unvanquished.net/now-we-are-free/
- Human male / medium armor: Angelo, Stannum, Viech and Unvanquished animation contributors; CC BY-SA 3.0. Tyrant is listed under CC BY-SA 4.0 in the current media credits. Complete runtime attribution is in public/asset-credits.html.
- Conversion modifications: format conversion, texture resizing/compression, animation sampling/trimming, tangent and unweighted-vertex repairs described above. Retain relevant source attribution and CC BY-SA notices when distributing converted assets.

## Reuse

`python iqe_to_glb.py input.iqe output.glb --material-map human-materials.json --keep "(stand|idle|run|run_back|walk|attack|.*_delta)"`

Material-map is optional for source files with material lines. Default maximum texture size is 1024 and sampling is 30 FPS. The converter requires NumPy and Pillow.
