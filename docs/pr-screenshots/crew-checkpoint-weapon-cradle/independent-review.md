# Room5 weapon cradle independent review

## Verdict

ACCEPT the bounded replacement of the generic equipment case with the retained weapon cradle. Preserve the accepted central bay grouping. Whole-room art acceptance remains pending.

This accepts a small guard-station prop improvement at the current rough-art stage. It does not certify instant weapon recognition on phone, final asset quality, combat readability or release readiness.

## Pixel findings

I inspected all four candidate PNG originals, then both baseline gameplay originals, before reading the source diff or tests. I inspected native station crops afterward to check the small prop. The supplied task identified the intended weapon cradle, so this was not a blind object-identification test.

- Desktop gameplay shows a low, exposed horizontal object to the right of the terminal. Its broad stock end, stepped middle and narrow dark barrel replace the baseline's closed rectangular case. Two warm retaining strips cross the object on its backing bed. This gives the guard station a more specific equipment cue without adding a loose object to the floor.
- Phone gameplay preserves the elongated shape and retaining strips. The prop is small and dark. The grip and magazine are not independently legible at native size. The replacement is visible, but recognition is weaker than on desktop.
- Desktop overview retains the counter between the two cover lines and the open central bay. The new prop stays subordinate to that grouping.
- Phone overview is useful for the room arrangement only. The fitted room occupies a small part of the tall image, so it cannot establish weapon-detail readability.
- Against both gameplay baselines, the terminal, seat, counter and cover grouping remain visually intact. The new bed is wider and lower than the old case, but it does not obscure the terminal or invade the bay in these views.

The retained pixels support this replacement. They do not justify approving the room as a whole.

## Source and test review

The tracked diff contains only the renderer and its test file listed below. The renderer replaces the case and case bands with a bed, weapon pieces and retaining locks. It does not change the cover lines, counter, terminal, room reservations, camera, HUD, AI, lighting or transport.

Geometry supports the visual claim. In authored local coordinates, the cabinet top and cradle bottom meet at y=0.87. The bed top, stock bottom and receiver bottom meet at y=0.95. The locks descend into the bed and intersect the receiver or barrel. The barrel connects to the receiver rather than standing as an isolated floating piece.

The new test checks case removal, stock/receiver/barrel connection and order, their horizontal containment over the bed, cabinet-to-bed contact and both retaining locks. Existing tests cover the central bay reservations, footprint containment and cached geometry/material use. The new test does not explicitly check grip or magazine attachment, or prove recognition from pixels. Those are limits of its coverage, not a blocker for this bounded art decision.

Tests were inspected, not executed. No GPU, browser runtime, worker or publishing operation was started. Git status also showed an untracked node_modules entry. I did not alter it or any runtime file.

## Evidence and scope

All six unique originals exist and decoded as PNGs. Desktop originals are 1280 by 900. Phone originals are 390 by 844.

Candidate originals:

- /home/chernodubv/.hermes/workspaces/containment-art-roadmap/crew-checkpoint/weapon-cradle-20260914/desktop/05-crew-checkpoint-gameplay.png
- /home/chernodubv/.hermes/workspaces/containment-art-roadmap/crew-checkpoint/weapon-cradle-20260914/desktop/05-crew-checkpoint-overview.png
- /home/chernodubv/.hermes/workspaces/containment-art-roadmap/crew-checkpoint/weapon-cradle-20260914/phone/05-crew-checkpoint-gameplay.png
- /home/chernodubv/.hermes/workspaces/containment-art-roadmap/crew-checkpoint/weapon-cradle-20260914/phone/05-crew-checkpoint-overview.png

Baseline originals:

- /home/chernodubv/dev/.cron-worktrees/containment-rooms/crew-checkpoint/docs/pr-screenshots/crew-checkpoint-central-bay/desktop-gameplay.png
- /home/chernodubv/dev/.cron-worktrees/containment-rooms/crew-checkpoint/docs/pr-screenshots/crew-checkpoint-central-bay/phone-gameplay.png

Reviewed source:

- /home/chernodubv/dev/.cron-worktrees/containment-rooms/crew-checkpoint/src/render/CrewCheckpointBlockout.ts
- /home/chernodubv/dev/.cron-worktrees/containment-rooms/crew-checkpoint/tests/CrewCheckpointBlockout.test.ts

The gameplay images are supplied staged production-camera views without the DOM HUD. Overviews use a fitted camera. This is static art evidence, not integrated HUD, touch, traversal or live combat verification. I did not independently reproduce the captures.

The only file created by this review is /home/chernodubv/.hermes/workspaces/containment-art-roadmap/crew-checkpoint/weapon-cradle-20260914/independent-review.md.
