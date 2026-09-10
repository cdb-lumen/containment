# Passenger Vault material-budget candidate

Original Containment Passenger Vault geometry and procedural material maps, MIT licensed under the repository [LICENSE](../../../../LICENSE). No third-party images or textures were added.

Geometry provenance remains in the preserved [construction credits](../CREDITS.md). Chamber/carrier procedural maps and their source remain in the preserved [material credits](../materials/CREDITS.md).

`chamber.glb` and `row-carrier.glb` are exact copies of the prior wear-stage exports. The five ancillary GLBs preserve their original geometry, UVs, node names, hierarchy and primitive material slots. Only their material definitions change to three shared neutral ancillary roles. These are not accepted finished PBR materials.

Generate all seven candidate files with:

```sh
python3 tools/assets/passenger-vault/material_budget.py
```

The generator takes `--output-root PATH` for clean-root reproduction. `manifest.json` records exact source and output hashes. The prior `materials/manifest.json` and its twelve-signature report remain valid historical receipts for that different package; they are deliberately not rewritten.

NOT INTEGRATED RUNTIME. Ancillary pixels change. This package has no current matched-light or gameplay-scale pixel acceptance. Full materials, wear, occupancy readability, actual runtime resource sharing and release remain incomplete. See `tools/assets/passenger-vault/materials/budget-recovery/REPORT.md` for the exported-GLB audit and commands.
