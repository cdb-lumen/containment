# Independent joint-HUD recorder review

Reviewed 2026-10-31. No blocking finding in the proposed recorder changes. This is code/semantic qualification to run the recorders, not completed native evidence or release approval. Neither recorder was executed and no renderer/browser was launched.

## Scope and checks

Compared the preserved `campaign-desktop-hud-clearance.mjs` against `campaign-desktop-joint-hud.mjs`, then that strengthened recorder against `campaign-overload-joint-hud.mjs`. Read production `src/main.ts`, `src/DepthGame.ts`, `src/game/roguelike/expedition.ts`, `run.ts`, and `storyRooms.ts` in `/workspace/containment-room20-review`, including AGENTS.md. Both new scripts pass `node --check`.

The ordinary-recorder diff changes disclosure, adds the visible boss panel to the observed HUD, and adds pairwise and viewport rectangle checks. The ten top-level panel rectangles are disjoint semantic groups (story includes its dialogue and Skip; status descendants are measured separately, not double-counted with their wrapper). Positive-area rectangle intersection is rejected; touching edges are permitted. Marine/ammo clearance, body viewport bounds, player traversal legality, native zoom, GL errors and console/network errors remain asserted. Frame observations and PNG are saved before the new assertions; the finally block persists failed manifest state.

The seeded checkpoint/first-offered boon construction, default resource fixture, native key policy, offscreen-target approach, actual main.frame and 50ms stepping, ordinary director/damage/enemies, Skip applicability and post-Skip playing-frame requirement are unchanged. Ordinary rewards and onward-room entry remain unchanged. Source cleanliness and before/after hashes/commit checks, full video decode and decoded frame-count equality remain intact. No gameplay waiver is introduced by the HUD additions.

## Room20 finale semantics

The variant rejects non-overload targets. Fixture construction stops after claiming the preceding manual-control room reward, at a serializable route boundary; preceding encounters are explicitly synthetic fixture construction. It uses native Continue, checks fatal copy including “kill them and you,” rejects ordinary route buttons, saves the authorization screen and clicks the real Destroy ship button. Production main registers that button with `game.authorizeDestruction()`, which requires route status in manual-control-chamber; the expedition API uses the explicit destroy-ship authorization token and normal room entry. Generic routing is prohibited there. There is no direct status mutation or encounter completion hook in the recorder.

Replacing ordinary reward/onward assertions with complete/dead/health-zero/no-route assertions is correct for this room. Production clearRoom only completes an active, living encounter, transitions the run to complete, then applies fatal sacrifice damage and removes the checkpoint. The recorder additionally requires zero remaining enemies, overload-floor identity, complete expedition phase, exact “Ship destroyed.” heading and exact SACRIFICE_ENDING text, and a Play again control. Premature ordinary death cannot satisfy complete status. Native inputs and the full ordinary combat loop are retained unchanged.

## Evidence and acceptance limits

A future passing run still needs independent PNG/video inspection, source/harness provenance validation and offline enemy movement geometry verification (including actual segment replay where a per-frame chord is ambiguous). The in-loop legality assertion covers player traversal, not every enemy segment. Neither recorder proves traversal of specific authored route landmarks.

The HUD assertions cover the listed visible top-level panel boxes during playing frames at 1280×900. They do not independently assert every expected panel remains present on every frame, inspect child text clipping, or certify all enemies/environment are unobscured. Boss clearance is only exercised if the production encounter actually shows that panel. Existing unified DOM regressions and actual-pixel review remain necessary for those broader concerns. There is no new missing-panel suppression in this change.

This is fixed-step automated native-input evidence with read-only aim/navigation observations and suppressed external font CSS, not wall-time performance, historical replay, a played entire campaign, human art approval, or progressive overload lighting. No lighting progression is asserted. The finale checks establish the production fatal authorization and terminal state, not additional unimplemented animation or lighting requirements.

## Reviewed file hashes

- `/workspace/campaign-desktop-hud-clearance.mjs`: `8e94f376f026dc269362f41c0ccfedc54a2520fa0dca29a4729286d8d1d33fb8`
- `/workspace/campaign-desktop-joint-hud.mjs`: `411bf9d1e892c764cad207a8ca19380348ceecb4e9f918bc0b365e2ea0d2123e`
- `/workspace/campaign-overload-joint-hud.mjs`: `dfb43b30ab0d25d38ac13abb91cfd513399b2756de19e6b41b033b1fa70aaf7e`
