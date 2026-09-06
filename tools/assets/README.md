# Authored model pipeline

Production files are self-contained GLBs in `public/assets/models/`; runtime never depends on external asset hosts. NumPy and Pillow are the only conversion dependencies. Attribution and adaptation licenses are in `public/asset-credits.html`.

Pinned source repositories:
- https://github.com/UnvanquishedAssets/res-players_src.dpkdir/tree/bbf9e8f276b3cf3f4b3fab217f2c947d2dd25515
- https://github.com/UnvanquishedAssets/res-weapons_src.dpkdir/tree/5af7744d4d295ef71ea30b5b4e29d166555b152a

Download each source IQE and the neighboring diffuse/normal images. The IQE material paths identify the textures; human material names use the explicit JSON mapping here. From the player repository use models/players/level0 through level4 and models/players/human_male. Output mapping: level0=dretch, level1=basilisk, level2=marauder, level3=dragoon, level4=tyrant, human_male=marine.

```sh
python tools/assets/iqe_to_glb.py INPUT.iqe OUTPUT.glb --keep '(stand|idle|run|walk|attack.*|die.*|pain.*|pounce|charge)'
python tools/assets/iqe_to_glb.py HUMAN.iqe public/assets/models/marine.glb --material-map tools/assets/human-materials.json --keep '(stand|idle|run|run_back|walk|attack|.*_delta)'
python tools/assets/convert_weapons.py SOURCE_WEAPONS_DIRECTORY public/assets/models
```

The weapon converter lists exact MD3 and texture filenames. Preserve the source directory layout under models/weapons. It normalizes each gun to meters with +Z forward, preserves the authored tag_flash as a muzzle socket, and embeds resized maps.

Characters retain +X forward in Y-up glTF; runtime rotates -90 degrees around Y. Their skeletons, skin weights and authored clips are cloned independently, while GPU geometry and textures are shared. Upper-body weapon poses layer over locomotion. Corpse baking deforms every vertex with the impact-time skin pose before detaching the skeleton.

Validation: all six characters pass Khronos glTF Validator without errors or warnings; all five weapons without errors. Production GLB geometry and animations are parsed by the model tests. Asset silhouettes and grip were additionally inspected using offline textured geometry renders; this is not an iPhone/Safari device test.
