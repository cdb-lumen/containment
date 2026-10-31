# Shared heading/Pause clearance — independent native review

The two matched static witnesses support the heading/Pause repair. Independently inspected all four PNGs and recalculated overlaps from raw recorded rectangles. No remaining marine/HUD overlap is present in either candidate pose among the recorded panels, and the actual candidate images show the marine unobscured by the relocated heading and Pause control. This is shared mainline Room12 static evidence, not the authored Room12 encounter.

| Witness | Baseline intersection | Candidate intersection |
|---|---:|---:|
| Recorded frame366 position, heading/body | 46.407988 px² | 0 |
| Northeast legal corner, Pause/body | 1759.090909 px² | 0 |

All other recorded rectangles—vitals, story, stock and build—have zero body intersection in both before/after poses. Every recorded panel rectangle and body rectangle is within the 1280×900 viewport. Candidate body tops remain 49.702791 and 23.184200 pixels; camera/player/body/projection/zoom are exactly identical between paired captures. This repair moves UI rather than reframing the actor.

The candidate heading and Pause are legible on the left above the status rows. Their addition moves those rows down by 53 pixels; text remains readable and the expanded and skipped story states both fit within the image. The expanded story panel covers more of a generic left-side room fixture, so these views must not be promoted to an all-environment/actor readability guarantee. Ammo, weapon picker and desktop hint are visibly distant from the northeast marine in all four images. Their rectangles were not saved by this particular static harness, so their clearance is a pixel observation rather than an independently computed numeric assertion. The fallback-font Pause symbol appears as a missing-glyph box, as in baseline; it is not a new repair regression or evidence of ideal icon readability. Its accessible name and interaction were separately covered by the DOM review.

The frame366 heading overlap is a conservative body-envelope intersection near the actor's upper/right extent; it should not be described as 46 pixels of measured opaque helmet removal. The northeast baseline does visibly put the Pause backplate over the marine's upper body, and the candidate removes it.

## Provenance

Before: `/workspace/room-heading-before`, clean source `d64bb1d4980dc4e78b125d73ad129d326aa0aa08` (documentation head retaining the pre-heading runtime).
After: `/workspace/room-heading-after`, clean source `9c9e8ea99f02e3edbf7163b0d6655a3f21b125f5`.

Both manifests are terminal passed, errors empty, and sourceBefore/sourceAfter identical. Independently checked all 288 source-file hashes per capture against their exact Git commits and all four PNG hashes: no mismatch. The only `src`/`public` differences between these heads are `src/main.ts` and `src/style.css`. Harness `/workspace/room-heading-native-inspect.mjs` SHA-256 matches both manifests: `2b730fb6a6e50c674b370a47877ab20e85809d5d5e1f7f38479465e6299f4bf5`.

The harness uses real Continue/route controls, stages legal positions, settles only renderer/HUD, and invokes native Skip between the two poses. The manifests record storySkipped false then true on both sides; pixels retain status/objective after dialogue is skipped. Native zoom remains 1, GL errors are zero, and loading is false. External font CSS suppression is disclosed. The harness records rather than asserts the overlap result; the numeric qualification above is an independent calculation, not reliance on its generic “passed” state.

No renderer was launched and no source was changed for this review. The preserved authored Room12 frame366 failure remains failed. The active fresh full encounter must independently qualify movement, combat, transitions and all-frame visibility; this matched static review does not certify it, all rooms/viewports, human art acceptance or historical approval.
