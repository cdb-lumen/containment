# Service shaft landing layout draft

Stage 1 proposal, attempt 990. The PNG is a top-down diagram, not gameplay or an installed room. No runtime source changed.

## Purpose and circulation

The connected balcony carries the player from the west entry toward the lower decks. The west junction gives room to turn, inspect the severed local connection and take either arm of the C. The north arm reaches the northeast exit landing. The south arm provides service access and a pursuit return, not another objective. All floor is ordinary connected floor. There is no jump, fall, lift-use, reconnect or overload mechanic.

The main shaft is an impassable polygon. Its schematic guide rails, roller shoes and counterweight sit inside that footprint. The local junction pedestal occupies the shaft side of the west rim. Its floor-side approach remains clear. Later rails and curbs must stay on the solid side, with no railing across a legal route.

The story boundary is exact: "LOCAL ACCESS ONLY. AI connection lost below this landing." This concerns the lower decks beyond the landing. It is not a planar AI cutoff across the floor, a ship-wide AI shutdown or a new interaction.

## Baseline and explicit proposal

Production currently has a 1200 by 880 rectangular envelope with three rectangular machine solids. It has no authored C-shaped polygon override for Room14. The inset shows those actual solids.

The draft retains the envelope, entry at 100/440, exit at 1100/440, and all four breach anchors at 100/100, 1100/100, 100/780 and 1100/780. It proposes replacing the three solids with one east-open shaft polygon:

`340/240, 900/240, 900/540, 1200/540, 1200/640, 340/640`.

The resulting north and south arms are 240 units deep, the west spine is 340 units wide and the east exit landing is 300 units wide. These are unobstructed plan dimensions, not a promise of shipping-camera visibility. The east mouth prevents a shortcut between the exit landing and south arm. The cyan line follows the full C; the amber line shows the entry-to-exit route. The 60-unit shaded route band illustrates the tested radius-30 envelope, not additional floor collision.

This is an explicit room-local topology proposal, not a claim that baseline geometry was already C-shaped. It uses no unaccepted preceding-room assets.

## Checks

`validate-layout.ts` imports the current production occupancy, swept-traversal and FacilityNavigation helpers. The final run passed 123 assertions with zero failures. It checks canonical anchors, inward breach offsets, the exact story line, connected sampled floor at radii 16, 28 and 30, route segments, solid-void rejection and contained fixture reservations. Forty-five radius-28 navigation trips reached their targets with each CPU step checked against production swept traversal.

The proposal has one connected component at every tested radius on a 20-unit lattice. These are diagram and CPU checks, not runtime integration, enemy crowding, pickup behavior, camera acceptance or live combat.

## Reproduce and inspect

- `layout-draft.png`: original 1900 by 1360 plan.
- `layout.json`: coordinates and proposal intent.
- `make_layout.py`: deterministic Pillow renderer. Requires Pillow and DejaVu fonts.
- `validate-layout.ts`: CPU checks against the pinned worktree. Requires `tsx`; imports use the local worktree path.
- `validation.json` and `validation.log`: actual check results and baseline geometry.
- `source-pins.json`: source revisions and hashes.

Run `tsx validate-layout.ts`, then `python make_layout.py` from this artifact directory. The source pins identify the production helper revisions used for this run.

Next stage must install only reviewed room-local geometry, derive visible floor and collision from the same footprint, and test actual gameplay and shipping-camera visibility. Generic boss-center metadata remains at 600/440 inside the proposed shaft; this is not a boss-room placement proof. Audit room-specific consumers during integration rather than changing shared gameplay here.

Independent and parent review, publication and receipt remain with the parent. No human room acceptance, merge or deployment is claimed.
