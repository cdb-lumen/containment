# Passenger Vault final independent layout review

## Verdict

PASS for the neutral whole-room layout gate at source `e3226a06328ca3cf442b361a0c60ba98bc63d69b`, with the separately hashed follow-up test file below. No remaining demonstrated layout must-fix was found. This verdict accepts the proposed spatial reservations and their gameplay coherence, not finished equipment, combat presentation, performance or release readiness. It does not authorize a merge.

The earlier UNVALIDATED reviews correctly described missing evidence at their inspection times. The current capture set and expanded behavioral tests address those layout-level gaps. Their warnings must not be silently rewritten as previous passes.

Read-only review of repository and evidence. I wrote only this report. No GPU job, capture, build, test execution, source edit, commit or external update was performed. Test execution results below are attributed to the supplied follow-up record, not represented as my own rerun.

## Authority and provenance

I read the approved production process, previous independent blockout review, follow-up test report, repository story, layout proposal, layout review, complete current blockout test and capture script. The process reset requires a neutral blockout before equipment, not finished chamber assets at this gate.

Fresh read-only checks returned HEAD `e3226a06328ca3cf442b361a0c60ba98bc63d69b`. Git status contained only `tests/unit/passengerBlockout.test.ts` modified. The current runtime and capture script therefore remain the captured revision. A byte comparison with `git show HEAD:scripts/passenger-blockout-evidence.mjs` passed. The script now explicitly checks tracking and committed content, resolving earlier provenance finding R2.

SHA-256 source and review inputs:

| File | SHA-256 |
|---|---|
| `approved-production-process.md` | `217d6bbbdd94bf10a71cc01c5575930738ea7e48519f48feb93725113b1dfd96` |
| `passenger-vault/blockout-independent-review.md` | `5c8d094881a90ef183e0f77e16762233979c403c5b7f1487541eac128d15e68c` |
| `passenger-vault/blockout-followup-tests.md` | `0ce03a90557ff0adde08af4677d5c1332de12ee9132c0b1980c00d564e6a3a65` |
| `docs/design/passenger-vault-story.md` | `a6dc0152ebd3dfd4cbec581e5a239cbb38d675dfbca72eac616e6e5db08c0d65` |
| `docs/design/passenger-vault-layout.md` | `afbc8cd2be972e423cee477b32dc41f9ddc50a9df843950339debf517f49f72e` |
| `docs/design/passenger-vault-layout-review.md` | `7379eaf428cf8dad055367947be48f72d38e45b232464a9561e5ea45d9914f90` |
| `src/game/roguelike/authoredRoomTopologies.ts` | `2691e93413aff1662545afcfc12b0af6954769966f53f8a19bf01fb7aea23b05` |
| `src/render/AuthoredRooms.ts` | `332112c2aebc6ba872513a3ec5cc9a68a450889b4982518581eabd007da7983f` |
| `scripts/passenger-blockout-evidence.mjs` | `40af7a477e54092317507a45f77f57d73f639255ddd72d6b189c59a0798cd110` |
| `tests/unit/passengerBlockout.test.ts` | `3b1280c45abf91ed9fb16e1e9add6f81070fec5bdc3b3839fb78e464ede38db9` |

The manifest SHA-256 is `03e58af78d00b4ba408abe97dd7d21fc65c98e9f1ce21d771376e2c0e12c21ad`. Manifest `pixelReview: pending` fields remain untouched. This report is the independent review result, not a claim that those fields were updated.

## Evidence integrity and inspected images

I independently parsed the manifest and verified exactly 14 unique expected names, each PNG's SHA-256 and encoded dimensions. Desktop is 1280 by 900 and portrait is 390 by 844. Every record reports high quality, zoom 1, 16 passengers, no recorded page/GL errors and no context loss. All 12 gameplay records satisfy the full camera position-minus-focus offset `0,26,19`. The two full-room views are fitted overviews and are not gameplay-framing evidence.

The inspected capture script retains production renderer, HUD, composer and follow behavior. It stages room 2 locally, suppresses autonomous RAF, disables the active encounter and traverses with `DepthGame.update`. These are staged Chromium layout pixels, not live combat, native-phone proof or an unmodified campaign playthrough. Software rendering statistics are not performance evidence.

I visually inspected these actual contact sheets:

- `review-desktop-0.jpg`
- `review-desktop-1.jpg`
- `review-portrait-0.jpg`
- `review-portrait-1.jpg`

I additionally loaded every desktop PNG individually at native dimensions, plus `portrait-F1.png`. Thus no desktop detail conclusion depends on the downscaled contact sheets. The remaining portrait views were inspected in the portrait sheets at their readable per-view scale.

All paths below are relative to `passenger-vault/blockout-evidence`. Each original is represented in the inspected sheets; the native column identifies additional individual-image inspection.

| Image | Native individual inspection | Verified SHA-256 |
|---|---|---|
| `desktop-opening.png` | yes | `3210c8233e224680f12c18b248d26ee60d1bf0733553d0d553f47f82a8bb15b9` |
| `desktop-F1.png` | yes | `332ea41e95e9d0113e6882b726915dc07e93cff7a9874a1c9504034d2607fc6b` |
| `desktop-north-loop.png` | yes | `7a567b35c5d8d5ddc141a79a2687778e65a84d07454ac9c7149121eab10ac9b1` |
| `desktop-central-transfer.png` | yes | `0c7d9517fc9f84129b5827e061e77cf41af3025375a5c2ca48098e123675dd08` |
| `desktop-south-loop.png` | yes | `89a03de55a655c79e9e51ecdd8ac525f08ed9540abc646e6c7e5a2358485534e` |
| `desktop-exit.png` | yes | `9d799768c9b9580e271ad3c7a6159b11baeb9ad7e287a7e0deb613dd35bdc057` |
| `desktop-full-room.png` | yes | `00ef6bfcf00b59098cba60745924a54cfb7e6270f33c91ae2a8784933e27e3e1` |
| `portrait-opening.png` | no | `6c430a70130d42181978a9c87a0238d4e0e4170f0ac17a713dcc9aad084e555d` |
| `portrait-F1.png` | yes | `9530499c5f2aca06414f52d6a1afbd76b02c62a23e9dbb9c8d4638c9dc14a27f` |
| `portrait-north-loop.png` | no | `a331baffcc65926328e0c04eebd14da01e2f2ff459732f9d2f0fa9b929e7c668` |
| `portrait-central-transfer.png` | no | `b33d963584a4c5b271f81bc65986ff4c56efb9112370b94c4b785fc4ea3ad3fa` |
| `portrait-south-loop.png` | no | `8785ef8629acf87acf0583e31a68d9e98737eb68377d9634c60a15a6fe771a1a` |
| `portrait-exit.png` | no | `1b5f5119fdbc4f92c672c9c4f0d2b158db8ad1380fc128c8762ae066d0e0d6c0` |
| `portrait-full-room.png` | no | `3959f15d3c9329e75cf4887da1d1ba68dd36f28b3acfa03748a92a815e7f3d3b` |

## Layout findings

### Scale, capacity and story

The native desktop views visibly contain four distinct rows, each with four closed lids on a common low base. No exposed body, lower tier, pit or floating tray is visible. The chamber reservations are plausibly human-length against the marine, consistent with the documented 32-unit renderer scale, 40 by 88 chamber envelope and 24 by 72 internal body reservation. This accepts spatial fit, not an internal anatomical or finished lid-mechanism inspection.

Northern working-face bands are clearly cyan in north-loop and central-transfer views. Their contrast is weaker in opening/F1, and southern bands are not equally legible from this fixed oblique direction. Closed repeated human-scale envelopes, operating cues and the unchanged living-passenger status support the neutral occupied-row reading. These pixels do not prove independent medical life-status communication for every chamber. Finished equipment will need stronger, consistently readable cues; demanding that asset solution before accepting its spatial reservation would reverse the approved workflow.

The objective remains exactly `Clear the occupied pod rows.` The proposal does not introduce rescue interactions, destructible passengers, a timer, early betrayal evidence or a different progression objective.

### Floor, services and circulation

The full-room desktop image shows the rectangular same-deck hall, four islands, north/south service bars and two east service reservations. Visible walking floor is continuous between them. The geometry review and tests corroborate the eight shared reservations and removal of old wells. Pixels alone cannot inspect floor hidden beneath opaque bases.

The crossing, central transfer and both rear loops remain distinct routes. Rear access and working aprons are broad rather than sliver gaps. Services meet the perimeter instead of inviting inaccessible rear passages. Protected underfloor routing is a stated construction assumption, not a rendered finished utility system. No extra decorative blocker or mandatory single choke is apparent.

### Actor visibility and inherited overlaps

The player remains readable in opening, F1, both loops and central transfer at both viewports. In particular, SS does not hide the player on the south loop. Portrait framing shows only part of a row at entry; it still shows closed chambers, the actor and open approach. The camera follows horizontally rather than fitting the room into the narrow viewport.

The portrait ammunition panel obscures portions of the southern rows. This is real inherited HUD overlap, not evidence of an impassable aisle or a newly raised row hiding the actor. Other viewpoints expose the room arrangement. I do not certify every working-face cue as unobstructed in every portrait frame, nor require a HUD redesign in this layout slice.

Exit records flag the lower two actor samples as occluded. Native exit pixels show the overlap at the existing glowing exit marker beneath the player, with head and upper silhouette still readable. MN/MS remain separately above and below the exit apron. Production `DepthRenderer.ts:179` contains the existing exit construction. This is not MS blocking the exit route and does not justify moving the new monitoring reservation. Overview records inherit the same staged exit position and flags.

## Behavioral evidence and previous findings

The follow-up report records 18 targeted tests, 493 passing Vitest tests with one skip, two passing Node tests, successful TypeScript checking and clean diff checking. I read the current assertions and hashed their exact file; I did not rerun them under this read-only assignment.

- Routes cover actual player movement, swept encounter radii, diagonal crossings and explicit radius-28 approach segments to every listed working/maintenance position. These supplement the navigation grid rather than treating its smaller connector radius as clearance proof.
- Live-brute loops cover all production breach offsets and representative player destinations. The integrated test retains the real room-2 director and pending pipeline, checks safety relocation and the 650 ms warning, observes mixed enemies and finishes canonical clear/reward/routing with deterministic damage. This is bounded structural integration, not human combat or an all-seed stall guarantee.
- Projectile tests now pin first rejected movement, shotgun face normals, previous-centre rifle/hazard effects and stopped grenade fuse behavior across all 28 accessible faces. Real L1/L2 traces, representative grazing and splash occlusion supplement the visible-solid ray checks. This closes the earlier event-existence-only concern for layout contacts. Screen-space impact/VFX polish remains unmeasured in the noncombat PNGs.
- Real legal drops and ordinary attraction cover accessible faces, including island east faces, with movement before collection. Existing corner tests and the actual clear/reward test provide complementary coverage.

R1 is explicitly disposed of here under the instructed preservation policy. A radius-14 crawler can die at a location illegal for a radius-16 pickup. Production rejects the drop; it does not relocate it or strand an existing pickup. The expanded tests prove that behavior at accessible faces. For this gate, the proposal's "Drops must resolve to reachable floor" means admitted pickups must occupy legal, reachable floor. It does not mean every successful chance roll must create a pickup. Room-clear sweep awards created pickups only. Guaranteed edge-drop relocation is not an accepted requirement and must not be added in this room slice.

## Residual gates and handoff limits

There is no remaining must-fix geometry, camera-layout or pickup-policy gate established by this evidence. Preserve this report's pickup interpretation when synchronizing the proposal and checkpoint; the old unqualified sentence and UNVALIDATED labels should not be quoted without this disposition. That is documentation reconciliation, not a demand for new runtime behavior.

This pass does not waive later requirements:

- Finished equipment must retain these footprints, actor-radius routes, service access and conservative heights, with independently readable closed living-passenger cues. Material changes require renewed relevant layout evidence.
- Live gameplay, screen-space shot effects, prolonged crowd behavior, actual-device performance and final production verification remain unproven here. The deterministic staging is not a substitute for the later real gameplay video and release gates.
- No equipment acceptance, release readiness, deployment verification or merge approval is claimed.
