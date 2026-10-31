# Room16 rough model placement

The corrected candidate passed independent and parent stage2 review. This is a placed blockout, not finished room art or human acceptance.

- [Desktop production-camera original](rough-gameplay.png)
- [Fitted overview original](rough-overview.png)
- [Parent review](parent-review.md)
- [Independent review](independent-review.md)
- [Checks and retained failures](verification.json)

One three-root solid replaces the old separate rectangular obstacles. The recessed distributor, cut root ends, service directions and damaged gantry establish the main relationships. The exact proposed stage1 footprint, entry, exit and breaches remain intact. Organic shapes, material work and detailed construction remain unfinished.

The first candidate failed shot/model coherence at the renderer's fallback height. [Its review](rejected/independent-review.md), [desktop](rejected/first-gameplay.png), [overview](rejected/first-overview.png), source copies and pins remain under `rejected/`. [Repair notes](repair-notes.md) explain the physical-height correction and gantry gap. No shared physics changed.

The capture uses `node scripts/room-evidence.mjs --rooms=swarm-junction --gameplay-all --viewport=desktop --verify-all --out=<new external directory>`. This is controlled simulation with staged actors and production camera/composer, without DOM HUD. The overview uses fitted framing. No ordinary playtest or full browser-verifier claim follows.

Both capture manifests retain their original generated filenames. The final `16-swarm-junction-gameplay.png` maps to `rough-gameplay.png`, and the final `16-swarm-junction-overview.png` maps to `rough-overview.png`. The first candidate files map to `rejected/first-gameplay.png` and `rejected/first-overview.png`. The original bytes are unchanged. Reports use their original local relative paths.

Capture manifests name the pre-publication HEAD because runtime changes were still uncommitted during capture. `source-pins.json` binds every captured source file, including the dirty runtime files, to this publication's bytes. Parent and independent checks verified those hashes. Operational logs and process records remain outside the repository.

Next is room visuals under a new scheduler permit. No human room acceptance, merge or deployment.
