# Sealed cryochamber provenance and license

The original sealed cryochamber geometry, material definitions and authored texture artwork listed below are covered by the repository's [MIT license](../../../LICENSE), copyright 2026 Lumen. Include that copyright and permission notice when redistributing these assets or substantial portions. This is not a CC0 declaration.

## Scope

- `sealed-cryo.blend`, the editable Blender source.
- `sealed-cryo.glb`, the exported model and its embedded textures.
- `cryo-graphics-atlas.png` and `cryo-enamel-roughness.png`.
- `cryo-surface-01-color.png`, `cryo-surface-01-metallic.png`, `cryo-surface-01-roughness.png`.
- `cryo-surface-02-color.png`, `cryo-surface-02-metallic.png`, `cryo-surface-02-roughness.png`.
- `cryo-surface-03-color.png`, `cryo-surface-03-metallic.png`, `cryo-surface-03-roughness.png`.
- `cryo-surface-04-color.png`.

The repository scripts `scripts/build-sealed-cryo.py`, `scripts/create-cryo-textures.py`, `scripts/cryo-surface-textures.py` and `scripts/cryo-causal-wear.py` create the geometry, atlas, material maps and wear. These scripts are also under the repository MIT license. The build script identifies the geometry and textures as original, with no imported third-party geometry or texture images. The atlas script rasterizes labels using the system DejaVu Sans font. This scope covers the authored artwork, not the font software, Blender, Pillow or other build tools. No font file is included in these asset files.

## Other repository assets

This notice applies only to the files listed above. It does not change the licenses of adapted Unvanquished models or their embedded textures, Poly Haven environment maps, Unity VFX, audio, music, fonts, or other third-party assets. Preserve their existing notices in `public/asset-credits.html`, `public/audio-credits.html`, `public/assets/environment/CREDITS.md`, `public/assets/vfx/`, audio manifests and `THIRD_PARTY/`. Do not apply this asset's MIT scope to those files or infer this asset is CC0 from neighbouring environment credits.
