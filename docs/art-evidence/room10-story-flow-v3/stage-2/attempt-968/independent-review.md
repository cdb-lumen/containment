# Attempt968 independent review

## Verdict

PASS for bounded Room10 stage2 antenna model placement. The north dish is fully visible in all three retained shipping-camera desktop views. It still reads as a small dish on a braced stand, rather than an unidentified floor mark. Its feet visibly meet the existing plinth. No blocking placement defect found.

This is static staged art review, not combat verification, campaign acceptance or human acceptance. No mobile or HUD acceptance gate was applied. The overview uses a capture-only fitted camera and does not establish shipping-camera fit.

## Direct image review

I opened all four original PNGs with the vision tool. All are 1280 by 900, unique and hash-matched to capture-result.json.

| Image | Observation |
| --- | --- |
| desktop-entry-static.png | Complete pale dish, central feed line, lateral mounting points and two feet are visible above the room's north plinth. The dish is separated from the radial fixtures and remains recognizable at native size. |
| desktop-north-static.png | The nearby actor gives a useful scale comparison. The assembly is wider than the actor and has a distinct bowl silhouette. Both feet appear seated on the plinth, with no visible floating gap. |
| desktop-south-static.png | Tightest top clearance. The dish rim and feet remain visible without touching the top edge. The north object retains the same readable supported silhouette. |
| overview-static.png | The antenna is identifiable in its north position, but small. The central feed and radial equipment dominate the room. This view supports layout context, not fine receiver readability. |

## Remaining weaknesses

- The unchanged wide plinth is visually oversized for the compact hardware, leaving large empty areas on either side. The assembly looks like a small instrument mounted on a reserved equipment pad rather than a large room-defining antenna. This does not break physical support or identification in the desktop views.
- Fine receiver and gimbal detail is weak at native size and largely lost in the overview. Recognition depends on the bowl, center line and braced feet. Do not treat the passing fit check as proof that every mechanical detail is readable.

Neither weakness blocks this bounded placement repair. No claim of final room-art approval is made.

## Runtime and test review

The working diff contains only src/render/TransmissionChamberRoom.ts and src/render/TransmissionChamberRoom.test.ts. The runtime change wraps existing antenna hardware in a uniformly scaled group at 0.32 and translates that group south. The plinth and its footprint remain unchanged. No collision or camera source is edited. Existing stage3-named source comments and tests predate this diff; the candidate adds no stage3 dressing.

The transform preserves round dish proportions. The outer rim diameter is 50.56 game units. Hardware foot bottoms remain at height 8, matching the existing plinth top. Direct pixels also show grounded feet, so support is not inferred from coordinates alone.

The added test projects every antenna mesh vertex through three fixed desktop-camera samples and checks top-edge clearance. Existing reflector checks now transform probes through the hardware group and measure the original bowl profile in group-local coordinates. That is appropriate for uniform scaling and translation and retains the concavity and front/back material checks.

Test coverage limits: the new camera assertion checks only the top edge, and its "larger than a person" assertion uses a fixed 48-unit threshold rather than a rendered actor measurement. Grounding of the whole antenna bounds is partly supplied by the unchanged plinth. These are not substitutes for the direct scale and foot-contact review above.

## Verification

Independent rerun from the worktree:

```text
npx vitest run src/render/TransmissionChamberRoom.test.ts src/render/AuthoredRooms.test.ts
Test Files  2 passed (2)
Tests       25 passed (25)
Exit code   0
Duration    1.69s
```

All five source hashes recorded by the capture manifest match the inspected worktree. The manifest records four unique captures, no browser errors and no aborted requests. I checked the capture script: native desktop rows use the shipping renderer camera; only the overview branch overrides it. No GPU capture or build was rerun.

Only this review file was created. No runtime or test edits, commits or publication were performed.
