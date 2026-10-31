# Room14 stage4 independent supplement

Verdict: pass for the bounded machinery model refinement and the inspected local stage4 publication artifacts for room14-story-flow-v3, attempt1001. The contact-sheet review and current-source pin checks missing from the original review are now complete. This does not grant stage5 validation, final room or human acceptance, merge, deployment or release approval.

## Visual inspection

I loaded model-contact-sheet.png, after-in-scene.png and overview.png with native vision. The two scene originals are 1280 by 900. The contact sheet contains a before/after comparison and enlarged detail crops explicitly labeled 2x. Its crops supplement the originals, not native gameplay-scale evidence.

The rear X truss is exposed above the machinery and meets visible upright supports. It remains separate from the foreground X truss. Both sheaves have readable rims, spokes and support brackets. The plate stack sits within a visible frame, with crosspieces, side guides and amber roller-like parts. These changes make the assembly read as connected machinery. LOCAL ACCESS ONLY is readable on the upper-right curb without a brace crossing its text. The west junction and pale loose cable remain visible.

No blocking visual defect was found in these views. The foreground truss and shaft edge still obscure the lower assembly. Dark frame members are less distinct at scene scale than in the enlarged crops. Neither the contact sheet nor these angles proves every hidden joint, complete cable reeving, mechanical operation or structural validity.

## Source and artifact checks

I computed SHA256 directly from the specified worktree at /home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3. All six candidate_source_sha256 entries in source-pins.json match:

- src/render/ServiceShaftLanding.ts
- tests/unit/ServiceShaftLanding.test.ts
- src/game/roguelike/storyRoomTemplates.ts
- src/game/roguelike/authoredRoomTopologies.ts
- src/render/DepthRenderer.ts
- scripts/room-evidence.mjs

The evidence-local operations/capture-room14.mjs also matches capture_script_sha256. All five images listed in the pins match their recorded hashes. Checking rejected-sign-overlap.png's hash does not make it acceptance evidence.

The renderer SHA256 is 2d3aa87030202ef8e7257f4f54cb184b74168a27b04a476ea352574e2493bd0e. The test SHA256 is d8da9174b8e2ad396271f099b7f26ed4f7a16ddc39260ce92abc0180c18fab2e. Both agree with the original independent review.

source-pins.json records parent_capture_exit 0. parent-capture.log records both requested views and completion. The parent reports checking source SHA before and after that rerun. My direct checks establish the current source and artifact hashes; I did not witness capture-time hashing. The rerun supports the fresh packaged evidence, not retrospective proof of the timed-out writer's capture-time source bytes.

## Recovery comparison

I independently compared final/ with parent-final/ using decoded RGB pixels and file bytes. Gameplay differs only within the reported bounds x597..685, y130..212. These are Pillow bounding-box coordinates with exclusive upper edges. The changed region is above the machinery in the actor area. Overview is byte-identical. This is not complete-frame equality for gameplay, and the full pair must not be described as an identical recapture.

The packaged after-in-scene.png is byte-identical to parent-final/14-service-shaft-landing-gameplay.png. Its SHA256 is 9d85cfcdc96f9e0a8924732007f3c55396abd7c4e61932d3e7c323f2d35ff699, distinct from the recovered final gameplay hash recorded in the original review. Packaged overview.png is byte-identical to the parent overview and recovered final overview. The bounded machinery verdict survives this localized actor-area difference.

## Limits and preservation

This remains static art review of a controlled simulation without the DOM HUD. It does not establish ordinary gameplay, combat readability over time, mobile or HUD acceptance, traversal, performance or full-room quality. I did not rerun tests, build, capture or GPU work. The parent's reported successful focused tests, npm test, build and test:room-evidence remain supporting records, not new executions by this supplemental reviewer. Remote publication and remote-byte verification are outside this review.

I preserved independent-review.md. Its SHA256 before this supplement was 25c806774b42ef7a85cfdc4d4141ea939136e8711adf90dbdd4c47842dc08c3c. Only independent-supplement.md was written. Any later source or artifact change requires renewed checks.
