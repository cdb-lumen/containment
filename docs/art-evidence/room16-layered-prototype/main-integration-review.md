# Room16 layered prototype/main integration review

No blocking integration finding at f0885b3318e26a334a25b6c76a68ad2c931e5e22, integrating main 76b4a23 with prototype 938482a. Read-only review; no renderer launched.

Confirmed byte identity against 938482a for SwarmJunction.ts, its dedicated test, organicShell.ts and swarmJunctionLayout.ts. Confirmed byte identity against 76b4a23 for ArmoryCarousel.ts, ArmoryBlockout.ts and armoryCarouselLayout.ts. Main roomTemplates.ts and storyRooms.ts are also byte-identical. The authored topology delta against main only imports SWARM_ORGAN and adds the intended swarm-junction entry; all other room topology entries, including Armory, remain unchanged. Together these establish unchanged other-room template definitions without relying on an obsolete snapshot hash.

ShipEnvironments.ts versus main adds only the Swarm import and its room-specific infested/swarm-junction architecture branch. Armory import/dispatch and all other branches remain. authoredRoomTopologies.ts retains both entries. The topology test retains all main Armory probes, radius assertions, boundary check and original five room probes, plus the existing Room16 sealed-organ assertions from the prototype. The combined title accurately describes both scopes; there is no assertion waiver.

Tracked working tree is clean (an untracked node_modules entry is present). Integrated full CPU/assets/evidence/build verification is being run separately by the parent; this review does not certify its unfinished result. Prior 26-test focused prototype review remains relevant because model/helper/test bytes are unchanged. Native visual qualification remains pending; neither merge fidelity nor tests resolve the previous Room16 art rejection.

## Addendum: stale other-room baseline correction

The hash/comment-only update in SwarmJunction.test.ts is legitimate; no other-room regression is waived. The old expected digest was explicitly pinned to HUD51610c6, before main's intended Armory topology change. The assertion still hashes every complete template except swarm-junction and still requires exact equality to a pinned main baseline.

Independently reran the Vite SSR comparison using a separate output file: /workspace/check-room16-main-independent-fidelity.mjs and /workspace/room16-current-main-independent-fidelity.json. Every non-Swarm template from ed13a96 and f0885b3 is byte-equivalent after JSON serialization; both digests are 341bcc775e848414f93dc7d3e1d86d4f45c096e55bf435aa4ac548fab1262053. Also verified `git diff 76b4a23 ed13a96 -- src` is empty, so this reference is genuinely current-main-equivalent rather than merely an assumed label. The test delta changes only that expected digest and reference comment; no exclusions or coverage were added/removed. Preserve the initial integrated run's 1547 passed / 1 failed / 1 skipped result as a stale-baseline failure. The new full rerun remains a separate required result.
