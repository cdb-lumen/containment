# Status HUD marine clearance

Pre-Armory source d1d24d3e17876f1d9c4587ca2d86414ffcf562d3 reproduces the recorded Armory frame199 obstruction. Current-main57eba3b6544c769d9dc6f98c383903a036dadeb1 also reproduces it, with the same camera, player and body bounds. Relevant HUD/render files are byte-identical between the pre-Armory and Armory integration sources. This defect predates PR69.

Corrected source17f5d6d5ad0d884e603518b99e37bde1c20ff4c0 moves the status/build/stock/story column opposite the marine, with hysteresis and flowing rows. Current-main/corrected captures use identical native camera and marine bounds. Independent pixel review confirms the marine is exposed at the targeted pose. This is a static legal-position witness, not a full encounter or proof of all actors/all HUD elements at every resolution. Desktop DOM regressions separately check resizing, Skip keyboard/mouse access and mouse aim/fire pass-through. Full1099tests+1existing skip, asset/evidence checks and build pass; exact-head CI remains a separate requirement.

Review found mouse interception in the first implementation80f080a. The final correction restores read-only copy pass-through while preserving Skip. The initial candidate capture was edited during execution and failed source pinning. It is preserved under invalid-source-changed-attempt solely as failed attempt history and must not be used as acceptance evidence. The final corrected capture is clean and source-stable.

No phone compatibility, general art approval, physical performance, live-site byte readback or historical delivery receipts are claimed.
