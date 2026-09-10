# Passenger Vault independent blockout code review

## Verdict

Layout remains UNVALIDATED. Equipment remains blocked. The inspected geometry and neutral renderer follow the reviewed coordinate proposal, and targeted CPU tests pass. This is not a camera, visual-contact, encounter or layout gate pass.

No new runtime defect requiring a geometry change was established. One existing production pickup limitation contradicts an unqualified reachable-drop claim and needs an explicit acceptance/scope decision. The new tests also leave material behavioral evidence gaps.

## Inspected revision and boundaries

Repository: `/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout`.

HEAD at both revision checks was `f56efed164b1705224bdf27783f27e63e90baf15`. Runtime and tests were uncommitted. I read the story, layout, both independent reviews, full tracked diff, new test, evidence script, and production geometry/navigation/projectile/pickup call paths. The script changed during review; its later actor-visibility probe was reread. Findings apply to these contents, not subsequent writer changes.

SHA-256 at inspection:

| File | Hash |
|---|---|
| `docs/design/passenger-vault-story.md` | `a6dc0152ebd3dfd4cbec581e5a239cbb38d675dfbca72eac616e6e5db08c0d65` |
| `docs/design/passenger-vault-layout.md` | `afbc8cd2be972e423cee477b32dc41f9ddc50a9df843950339debf517f49f72e` |
| `docs/design/passenger-vault-story-review.md` | `93c2b3c2f068390209d86818aea7b6311652ac1d259fa589b041d8a1ff0f7176` |
| `docs/design/passenger-vault-layout-review.md` | `7379eaf428cf8dad055367947be48f72d38e45b232464a9561e5ea45d9914f90` |
| `src/game/roguelike/authoredRoomTopologies.ts` | `2691e93413aff1662545afcfc12b0af6954769966f53f8a19bf01fb7aea23b05` |
| `src/render/AuthoredRooms.ts` | `332112c2aebc6ba872513a3ec5cc9a68a450889b4982518581eabd007da7983f` |
| `tests/unit/passengerBlockout.test.ts` | `4824ed93c78572867e3f2793e5fcd6498ad1acf6157fed69677195172c049523` |
| `scripts/passenger-blockout-evidence.mjs`, later inspection | `073a98b0d65834737c4691059e1a15c591a20e33419aed4349202124136157ae` |
| `src/DepthGame.ts` | `e69f8c96eb415b9e20145ba60d033674ed075be45e89962c9956f37fc13afe6d` |
| `src/game/world/FacilityNavigation.ts` | `4f625bf353690320ca2fd9ad6281cec8199bde430145131a48b2434f41a0c1e4` |
| `src/game/world/expeditionGeometry.ts` | `61592cc4e947e8d6873488407235e1ab117585e59d10141916de3efe00ef316b` |
| `src/game/pickups/PickupSystem.ts` | `3ce90afa72ba4b689db3ac05b590f5e0ef47cf2220e845d8b8996bac24565e76` |

No runtime, repository test or design files were edited. No GPU, build, full verifier or screenshot capture was run. Only this review artifact was written.

## Must resolve before acceptance

### R1. Reachable-drop claim excludes legal crawler deaths near solids

Severity: important acceptance/scope issue, not a newly introduced pickup-system regression.

`passengerBlockout.test.ts:56-59` filters all probes through radius-16 legality, drops only from a brute, and teleports the player onto each successful drop. It cannot establish the layout requirement that actual encounter drops resolve to reachable floor at solid edges.

Production crawlers have radius 14, `src/game/enemies/catalog.ts:23-32`, and are in the room-2 encounter pool, `src/game/waves/EncounterDirector.ts:45-46`. Pickups have radius 16. `PickupSystem.ts:250-260,279-281` rejects an illegal position; it does not relocate a drop to nearby floor. `DepthGame.ts:91` rolls at the enemy death coordinate.

A read-only Node probe loaded the actual TypeScript production classes in memory and returned:

```json
{"point":{"x":305,"y":300},"crawlerLegal":true,"pickupLegal":false,"directDrop":{"spawned":false,"reason":"invalid"}}
{"chance":9155,"invalid-position":845}
```

The second result is 10,000 deterministic crawler drop rolls at that legal radius-14 position beside A. Every roll that passed chance was rejected for position. No pickup was relocated or left stranded. This is inherited rejection behavior exposed by the new solid edges, not evidence that the new geometry broke an existing relocation feature.

Required disposition: cover legal radius-14 edge deaths and explicitly reconcile `layout.md:97,126` with the existing rejection policy. If guaranteed relocation is required, escalate the pickup-system change rather than quietly redesigning it in this room slice. If preserving rejection is intended, record that limitation and do not claim all eligible deaths produce reachable drops. Room-clear sweep cannot award a pickup that was never created.

### R2. Evidence revision check does not reject an untracked capture script

Severity: provenance hardening, not a runtime blocker.

`scripts/passenger-blockout-evidence.mjs:10-11` asserts an empty `git diff HEAD -- src scripts/passenger-blockout-evidence.mjs`. Git diff does not include untracked files. The script was untracked during this review. After committing runtime but leaving the script untracked, the guard can pass while the manifest identifies only HEAD, which does not contain the capture program.

Before treating its manifest as revision-bound evidence, verify the script is tracked and committed, or record and verify its content hash along with dirty/untracked state. The parent can satisfy this by committing and independently checking the final capture revision. The current guard alone does not prove its own instruction, "Commit source and capture script first".

## Missing-evidence gates, not demonstrated runtime failures

- **Projectile contact accuracy.** New test lines 47-54 exercise the production bullet update path, but assert only eventual disappearance, legal surviving positions and existence of any `hit` or `explosion`. They do not assert first-contact coordinates, shotgun wall normals, grenade stopping position, splash occlusion, contact with the intended face, or along-face/corner grazing. L1/L2 and the oblique case at line 46 are geometric queries, not real projectile traces. In production, `DepthGame.ts:100-108` stops a grenade and leaves it until fuse expiry, projects shotgun contact with `wallContact`, and emits other wall hits at the previous projectile centre. These are distinct semantics. Preserve them and prove intended contacts against visible solids. Event existence cannot certify matching impact pixels.
- **Encounter integration and navigation.** Lines 39-44 successfully exercise live brute steering from each nominal offset to five targets, plus fallback from each solid centre. They call private `spawn` directly. They do not exercise the real encounter-request safety relocation, 650 ms warning/pending pipeline, retry exhaustion or mixed-enemy crowd behavior at `DepthGame.ts:87-89,118`. Test setup replaces node/geometry/navigation but leaves the constructor's expedition and director in place. This is a useful isolated harness, not room-2 encounter completion. `FacilityNavigation.reachable` uses a radius-12 connector to a radius-30 BFS grid, lines 22-36,50; combining it with radius-28 endpoint occupancy does not prove a radius-28 swept route to every service position. Actual player routes and brute loop tests are stronger evidence but do not fill every one of these gaps.
- **Pickup coverage.** Beyond R1, corner/face probes filter away illegal positions and omit the east face midpoint of islands. Collection at the probe is mostly teleport-plus-update. The separate A-corner attraction test is useful but is one corner, not every service edge. The private `collectLoot(true)` test correctly preserves off-player sweeping, but does not execute `clearRoom` and downstream rewards/progression. Those paths are unchanged, which limits regression risk, not the proof required for an unqualified gate pass.
- **Rendered geometry and living occupancy.** Lines 66-70 inspect metadata, maximum heights and absence of the old skin material. The four-row render test counts occupied pitch buckets. These support closed single-tier construction, but metadata does not prove visible occupancy, internal human fit or a continuous deck under every solid. A downward ray at a row centre lands in inter-chamber infill rather than counting chambers. Mesh colour checks do not independently establish recognizable living passengers. Desktop and portrait opening/F1/loops/transfer/exit pixels, foreground occlusion and readable live bands remain required.
- **Capture limitations.** The evidence script explicitly disables the encounter and labels the fitted full-room view as overview-only. This is appropriate for staged camera evidence, not enemy/combat proof. The later three-height ray probe reports sampled actor occlusion but does not assert it and cannot replace pixel review. No output from this script was inspected or certified here.

## Spec/code comparison

| Change | Finding |
|---|---|
| Hall boundary and anchors | Exact proposed `40..1160` by `40..840` interior, retained `1200x880` envelope, spawn and exit. Four proposed breach anchors resolve to production east/west offsets. Old crescent and west obstacles removed. |
| Eight interior reservations | A/B/C/D4, SN/SS, MN/MS exactly match the plan. Service backs meet the boundary. Shared frozen footprints drive collision and rendered base bounds. No extra interior query blockers were added. |
| Floor and old wells | Passenger-only deck construction clears render holes while keeping sealed query footprints. Passenger branch skips old edge/well architecture and generic deck services. No exposed bodies or inherited lower tiers remain in that branch. |
| Rows and chambers | Full-footprint bases occupy h0..24. Four closed 40x88 chamber boxes per row occupy h24..40 at the specified pitch and north/south coordinates. Manifolds remain inside the specified rear strips. This is a neutral reservation, not equipment production. |
| Service and perimeter heights | SN48, SS32, MN40, MS32 meet proposed maxima. Perimeter inner faces meet the gameplay boundary; thickness is outside it. Camera readability at those upper bounds remains unproved. |
| Live cues and routes | Restrained broad emissive bands sit at working faces. Four floor-level route annotations follow the planned row-feed branches and are not query blockers. East return distribution and monitoring internals are not modeled; acceptable as deferred service detail, not proof of an operating-system asset. |
| Story and gameplay scope | Canonical objective remains exactly "Clear the occupied pod rows." `storyRooms.ts:5` and the later disclosure sequence are unchanged. No rescue interaction, destructible passengers, timer, new dialogue or early betrayal text was added. Wave/progression/global VFX/global-lighting source is unchanged. Removing old room-local emitters and adding bands still requires visual lighting inspection. |
| Existing tests and snapshots | Existing topology probes were moved onto the new solids rather than retaining invalid old coordinates. The depth-liner assertion moved to the reactor, preserving that feature's test without requiring Passenger Vault wells. Awakening's other-room snapshot change is Passenger Vault's deliberate change. Fresh Passenger snapshots alone are not a baseline comparison, so I checked templates independently. |

## Executed checks

Targeted command:

```text
./node_modules/.bin/vitest run tests/unit/passengerBlockout.test.ts tests/unit/authoredTopology.test.ts src/render/AuthoredRooms.test.ts tests/DepthTreatment.test.ts tests/unit/awakeningTopology.test.ts
```

Actual result: 5 test files passed, 46 tests passed, duration 2.32 seconds. This uses CPU-side Three geometry, not GPU rendering. `git diff --check` returned no errors.

An independent in-memory comparison loaded current `ROOM_TEMPLATES`, then reloaded with the HEAD version of authored topology. Actual output:

```json
{"templates":36,"changed":["passenger-vault"],"unchanged":35}
```

This covers the nineteen other campaign templates plus legacy templates. The only runtime diff files were authored topology and the passenger-specific renderer branches. No other room template change was found. It does not certify unchanged pixels in every other room.

## Handoff

Resolve R1's acceptance policy and capture provenance, obtain the missing production behavioral and shipping-camera evidence, then independently review the final committed revision. No equipment start, release readiness, performance claim or layout PASS follows from this review.
