# Independent review, Room10 stage4 attempt966

Verdict: PASS for the bounded concave reflector correction. No blocking defect found in this diff. This is not whole-room acceptance, human acceptance, gameplay verification or a full verifier result.

## Construction and code

- PASS. `TransmissionChamberRoom.ts:93-95` now recesses the ceramic center to world z48 behind the rim at z66, away from the south-side receiver. Intermediate profile rings advance toward the rim rather than bulging toward the receiver. The previous attempt965 center was z84. Its rejection remains valid.
- PASS. The reversed alloy profile puts the backing behind the ceramic face. The materials retain default front-face rendering rather than masking reversed winding with double-sided material. Focused front and rear ray tests hit ceramic from the arena and alloy from behind at radii 10, 30, 50 and 70. The existing arena-facing normal assertion also passes.
- PASS. The central receiver rod now starts at the recessed center. The rim, receiver horn, side bearings and truss retain their positions. Only the two reflector profiles and that rod endpoint change in production code.
- PASS. The new regression test checks all five radial depth levels, center recess, rim alignment and sampled front/back material ordering. Existing tests and strict resource ceilings remain intact. The receiver-depth comparison uses a literal 99 rather than the receiver's measured bounds, so future receiver movement could escape that particular assertion. This does not invalidate the current geometry, which I also checked in source.

## Visual review

I opened all eight original PNGs and `model-contact-sheet.png` through the vision tool. These are actual in-scene before/after images, not isolated model renders.

| Original pair | Finding |
| --- | --- |
| `before/desktop-entry-static.png`, `after/desktop-entry-static.png` | Most of the dish lies above the frame. The lower assembly is visible, but these pixels cannot establish a readable complete bowl. The central feed and six surrounding fixtures remain unchanged. |
| `before/desktop-north-static.png`, `after/desktop-north-static.png` | The best shipping-camera view still clips the upper dish. The visible ceramic band recedes and the central support has more separation after the correction. This is partial evidence only. |
| `before/desktop-south-static.png`, `after/desktop-south-static.png` | Almost all reflector detail is offscreen. The grounded support remains visible. No complete-dish readability claim is justified. |
| `before/overview-static.png`, `after/overview-static.png` | The full assembly is visible. The former smooth bulging face becomes a recessed face with visible internal shading behind the rim and receiver. Bearings and grounded legs remain connected in the image. |

The contact sheet agrees with the originals. Its enlarged reflector crops expose the changed face and shadows, but are enlarged overview pixels, not additional native-camera evidence. The horizontal truss beam still obscures much of the lower face. That inherited occlusion limits the bowl's visual clarity, without contradicting the corrected depth ordering. The restrained palette, radial arrangement and quiet blue indicators remain intact.

## Verification

- Independently ran `npx vitest run src/render/TransmissionChamberRoom.test.ts`. One file and all 10 tests passed. These CPU tests cover the depth correction, sampled materials, footprint containment, reviewed routes, grounding, disposal and resource ceilings.
- `git diff --check` passed. Git shows only the Room10 renderer and its test modified. No camera, HUD, layout, topology or shared runtime changes appear in the diff.
- Programmatically verified eight unique originals, all at 1280 by 900, their manifest hashes, the contact-sheet hash and all four pixel-difference bounds. Changes remain confined to the dish and its nearby shadow region.
- Checked all four recorded camera/player pairs for equality. Both retained capture records report no errors or aborted requests. This is verification of saved records, not a fresh browser run.
- Every capture row reports 73 meshes and 8692 triangles before and after. The independently rerun CPU assertions confirm the room stays strictly below 90 meshes and 15000 triangles.
- All five current source hashes match the after manifest. Saved after renderer/test files match the working tree. Saved before renderer/test files match HEAD. Attempt965's directory and rejection report remain present; its rejected renderer hash matches this attempt's before source pin.

## Limits and scope

The overview uses a capture-only fitted camera. Shipping-camera visibility remains limited and has not been repaired by this change. HUD and mobile are not acceptance gates here. Static staged Chromium images do not establish live traversal, combat, performance or campaign behavior. The test rays sample the backing; they are not an exhaustive watertightness audit.

I started no server or GPU work, edited no runtime or tests, and made no commit. The only review deliverable written is this file. Attempt965 remains rejected and preserved. Attempt966 passes only this stage4 model-correction review.
