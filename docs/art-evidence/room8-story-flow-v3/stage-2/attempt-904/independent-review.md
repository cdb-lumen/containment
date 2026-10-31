# Independent stage 2 review

Verdict: PASS for rough main-object scale, placement, functions, neighbors and visual route arrangement only. This is not finished model/material acceptance, stage-publication verification or release approval.

## Evidence reviewed

I inspected the actual `overview.png` and `desktop-in-scene.png` through the vision tool, plus `../../stage-1/attempt-903/layout.png` and `layout.json`. I read `capture-result.json` and the current `map-model-production.md` contract. Both stage 2 PNGs are 1280 by 900, decode successfully and match their recorded SHA-256 hashes. The saved renderer and topology source snapshots also match the manifest hashes. The manifest reports no capture errors or aborted requests.

The desktop frame uses the shipping camera and visible HUD. The overview uses a capture-only fitted camera. These are paused Chromium software-WebGL art captures with a staged player, not movement or combat evidence. The manifest's `passed` field is capture status, not my visual verdict.

## Why the rough placement passes

- The large diagonal sealed assembly occupies the central scar footprint rather than becoming a wall-to-wall barrier. Its closed ribbed mass and surrounding plate read as solid obstruction, not an opening into space. It dominates both views at a scale clearly larger than the player and freight.
- The overview preserves open floor around its north side and a broad southern handling apron. The two sides visually reconnect near the right-side exit marker. This matches the draft's instruction to fight around the sealed breach rather than through it.
- The southwest freight block and the paired southern freight blocks remain separate from the central assembly and each other. Their subordinate scale and apron placement retain rough staging/outbound cargo functions without filling the room with crates.
- Small dark growth forms follow the assembly's southwest-facing edge. Their placement preserves the intended relationship in "Alien growth follows the boarding scar. Hull seal intact." Their organic identity still needs development.
- The shipping-camera frame retains the focal assembly, nearby player, freight and useful southern floor context. The whole-room overview supplies the peripheral layout that the normal desktop crop does not show. No camera or HUD adjustment is needed for this placement verdict.

## Concrete defects for later stages

1. The central shape reads strongly as a regular ribbed housing on a pale slab. The repeated ribs, tidy orange spine and evenly spaced jagged border do not yet distinguish a boarding scar from manufactured equipment. In stages 3 and 4, develop damaged plate continuity, seal construction and attachment to the surrounding deck while keeping the seal visibly closed.
2. The growth is a row of separate dark rounded pads. Its spacing and similar silhouettes can read as hardware or stones. Develop connected, irregular growth along the damaged southwest edge, with readable contact to the scar. Do not expand it across the open southern route merely to increase prominence.
3. The room's broad floor and low repeated perimeter modules remain generic. The isolated freight placeholders suggest cargo, but loading-bay use is weak beyond them. Develop room-local loading and handling cues without occupying the route space preserved by this draft.
4. The right-side exit object is a dark upright shape with little architectural context. Entry and exit connections are much clearer in the labeled layout than in the overview. Later shell work should make those connections legible as room transitions without moving the required routes or introducing a fake hull opening.

These are later visual-development tasks, not reasons to reject rough placement. Preserve the successful central-to-freight scale hierarchy and surrounding floor space during refinement.

## Limits and disposition

Visual gaps are not proof of actor clearance, collision agreement, projectile behavior or traversable progression. This review did not run those checks and makes no combat claim. Full closure and support around hidden sides also remain unverified from these views. Mobile visibility and HUD overlap are outside this gate, not failures and not claimed fixes.

The placement is suitable to proceed to stage 3 room visuals once the parent workflow satisfies its separate publication and guard requirements. I changed only this review file. No production source, camera, HUD, routing or guard state was modified.
