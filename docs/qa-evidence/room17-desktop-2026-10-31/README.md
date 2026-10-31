# Room17 desktop encounter qualification

`completed-with-framing-and-sweep-defects` preserves original gameplay source `aa4eaa17b3195fa36f4fe2114fad1f8238f93e24`. The recorder completed897 frames,41 kills,zero remaining,reward selection and onward Containment Annulus entry. Its internal ammo/encounter checks passed, but this is **failed qualification**, not release acceptance.

Independent pixel inspection found the helmet clipped at the north viewport edge (frame499, body top−17.417px). Postprocessing identifies24 clipped playing frames, all at the top edge. `viewport-failures.json` preserves the raw witnesses. Other health/story HUD overlaps remain outside the bounded ammo and viewport checks.

Separate production-geometry trace verification also fails enemy14's sweep at frame421. Both radius18 endpoints are legal, but the segment crosses a Shielding Gate corner. A direct production damage/knockback regression reproduces the defect: the game callback checked destination occupancy only. The original failing trace is preserved; it was not waived as encounter completion.

The fixture uses default resources and valid prior-room first-offered boons, not played prior rooms. The director, damage and actual keyboard/mouse controller run through the production main frame at fixed50ms steps. Room17 has no authored dialogue; Skip is explicitly inapplicable. This does not certify wall-time/device performance, general balance, historical replay equivalence, human art approval or Telegram delivery. Phone support is out of scope.

Camera and swept-movement repairs require independent code review, exact-head CI and fresh native qualification. Harness paths are executor-local and must be adapted for reproduction without changing the source pins or acceptance assertions.

`static-framing-comparison` preserves the matched camera-only repair: baseline `99cdb8788eb1ea045a38d66bda5c8bd5226f4a05`, candidate `b92c84166d43195ac3e61411b66544e6ed7b208a`. Independent review verifies source and image hashes, unchanged center/overview images, and the repaired viewport envelope at five staged legal positions. North-corner health/story HUD overlaps remain visible and outside this bounded repair. This pair predates the swept-movement fix; fresh combined native qualification remains pending.

## Repaired native qualification

`completed-native-repaired` records source `0fd88db6dacb07e6e99eef3104cbf8715a0139a8`: 877 decoded frames, 41 kills, zero remaining, reward selection and onward Containment Annulus gameplay. Independent review verifies 282 source hashes, clean source fidelity, video decoding and all 876 playing-frame viewport/ammo bounds. Zero marine viewport or ammo-panel intersections occurred.

The original frame-chord verifier still reports carrier3 frame235. This is preserved, not marked passed: exact production CPU replay matches every recorded frame and logs the actual movement decisions. Independent verification confirms all 6,847 accepted nonzero movement segments and 5,730 surviving-enemy endpoint chains are legal. The carrier moved around the corner in three legal segments; the failed straight chord was never traversed. Two obstructed knockback attempts were rejected. See the independent review, replay script, raw segment log and preserved chord diagnostic. This does not retroactively qualify the original aa4 spitter defect.

Exact-head CI passed at https://github.com/cdb-lumen/containment/actions/runs/41207785877. Integration with current main caabdfe produces the tested tree unchanged. Broader HUD occlusion, historical replay equivalence, physical performance and human art/delivery approval remain outside these bounded claims.
