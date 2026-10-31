# Room17 desktop encounter qualification

`completed-with-framing-and-sweep-defects` preserves original gameplay source `aa4eaa17b3195fa36f4fe2114fad1f8238f93e24`. The recorder completed897 frames,41 kills,zero remaining,reward selection and onward Containment Annulus entry. Its internal ammo/encounter checks passed, but this is **failed qualification**, not release acceptance.

Independent pixel inspection found the helmet clipped at the north viewport edge (frame499, body top−17.417px). Postprocessing identifies24 clipped playing frames, all at the top edge. `viewport-failures.json` preserves the raw witnesses. Other health/story HUD overlaps remain outside the bounded ammo and viewport checks.

Separate production-geometry trace verification also fails enemy14's sweep at frame421. Both radius18 endpoints are legal, but the segment crosses a Shielding Gate corner. A direct production damage/knockback regression reproduces the defect: the game callback checked destination occupancy only. The original failing trace is preserved; it was not waived as encounter completion.

The fixture uses default resources and valid prior-room first-offered boons, not played prior rooms. The director, damage and actual keyboard/mouse controller run through the production main frame at fixed50ms steps. Room17 has no authored dialogue; Skip is explicitly inapplicable. This does not certify wall-time/device performance, general balance, historical replay equivalence, human art approval or Telegram delivery. Phone support is out of scope.

Camera and swept-movement repairs require independent code review, exact-head CI and fresh native qualification. Harness paths are executor-local and must be adapted for reproduction without changing the source pins or acceptance assertions.
