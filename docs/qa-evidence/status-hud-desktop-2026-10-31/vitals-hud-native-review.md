# Vitals HUD native comparison — independent review

No blocking finding for the two bounded staged HUD witnesses. The corrected source visibly resolves the recorded north-position health/armor obstruction while retaining the already-fixed expanded-story clearance.

Inspected all four full-resolution PNGs in `/workspace/room12-hud-before` (c745701cf47c5d52f36ae3cd5445f95de56274e4) and `/workspace/room12-hud-after` (51610c63cc18aac817e384f4182113162e296e56).

At the frame495-derived pose, the baseline's health/armor panel covers helmet/torso; the corrected panel moves to the lower left and the marine's helmet, torso, gun and legs are visible. Health100/armor50 remain readable, above the bottom hint and clear of the right ammunition panel. The body stays at x136.768896..177.677987,y32.915153..115.425726; vitals move from x28..228,y24..70 to x28..228,y748..794. Player position, camera/projection and zoom1 match exactly, so this is panel relocation rather than camera avoidance.

At the frame199-derived expanded-dialogue pose, the marine is visible left while the expanded story/status column and Skip control remain right. The vitals stay top-left and clear of the actor; before/after images are byte-identical. This preserves the earlier status fix. Some environment behind the right story panel remains obscured, so all-scene visibility is not claimed.

Independently verified288 source-file hashes per capture against the pinned commits, stable clean before/after source records, terminal passed state and all four image hashes. Both match saved harness `/workspace/room12-hud-native-inspect.mjs` SHA-256 `774c18a5f0ed5d7808260fa77e9ca7fd54ad986c71bce4aef30c8dca0be9a1d5`.

These sources use the mainline generic Room12 environment, not the authored recorder/equipment candidate from the failed full-encounter visibility recording bfc0126. The player coordinates/camera reproduce its HUD obstruction independently of that art; the comparison therefore establishes the shared HUD fix, not final Room12 art integration or a replay of historical animation/combat. No enemies, actual encounter progression, moving anchor transitions, all window sizes or full post-integration clearance are qualified by these static shots. Future full captures should use the expanded HUD-clearance harness and the exact integrated source.

The original bfc frame199/frame495 failures remain documented in `/workspace/room12-final-independent-review.md`. The invalid source-changing initial status capture remains excluded. No renderer launched or runtime edited for this review; no human art approval or general release acceptance inferred.
