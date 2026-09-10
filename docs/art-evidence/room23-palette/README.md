# Room 2 and 3 material pass

- Passenger Vault: slate service cabinets and darker frames replace broad white surfaces. Muted medical lids and status displays remain distinct.
- Residential Gallery: cooler neutral deck, dark structural metal, sage front panels and muted cloth/luggage. Original dark roof finish retained.
- Layout, geometry, lighting, camera and combat are unchanged. Failed-load props use owned room finishes without changing global materials or the four-draw-per-reservation fallback budget.

## Evidence

`before/` was captured from `7b9dc7fcf9bb63eb0eb41dd5b88e17bed30d48eb`. `after/` and both videos use runtime source `c5f4468c4a7d86dd3202acd587aa8293988655d9`.

Each room has matched desktop and phone gameplay/overview images. Gameplay views use the shipping camera; overview images are fitted diagnostics, not a different approved camera.

- [Passenger Vault gameplay](video/passenger-vault-desktop.mp4)
- [Residential Gallery gameplay](video/residential-gallery-desktop.mp4)

Both videos are six-second controlled encounters with actual game updates, firing, movement and damage. Each has 120 decoded H.264 frames, stable source and no capture/decode errors. They use fixed-step software rendering and stationary test enemies, not a full campaign replay or a physical-device FPS measurement. The clips are silent.

Reproduce screenshots with `node scripts/room-evidence.mjs --rooms=passenger-vault,residential-gallery --gameplay-all --verify-all --out=<output>`; add `--viewport=phone` for portrait. Reproduce video with `node scripts/room-demo.mjs --room=<room-id> --source-sha=<current-clean-HEAD> --out=<output>`.
