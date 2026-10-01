# Room12 rough model placement

Stage 2, attempt 975. Author handoff only. No commit, publication, receipt or stage acceptance is claimed.

## Candidate

The upper-west reservation holds one squat ivory recorder with a dark inspection recess, two layered spools, a timestamp plate, seal, small manual test lever and steady local indicator. The upper-east reservation holds a separate dark AI housing with two empty south-facing sockets. The lower reservation holds split copper contactor jaws on ceramic supports and a separate battery cylinder. All three bases remain inside the retained solid collision reservations. The contactor gap is not walkable.

Only `SafetyInterlockBlockout.ts`, its focused test and a two-line registration in `ShipEnvironments.ts` change runtime-related source. No imported other-room draft assets, new interactions, topology, story, shared camera, HUD or lighting changes. Materials are local and use the existing owned-material disposal contract. The objective and record text remain unchanged.

## Actual evidence

`overview.png` and `desktop-in-scene.png` are original 1280 by 900 Chromium captures using the repository room-evidence harness and production high-quality renderer. The overview alone fits the whole room with its capture camera. The desktop retains production camera and composition. These are controlled simulation captures with three staged legal enemies, not an ordinary campaign playthrough. No DOM HUD or real touch input is present.

The harness completed spawn-to-exit traversal in 291 update steps over 1000 units, ending at the exit. Desktop combat ran 25 fixed steps with four shots, 48 damage and 100 legal actor checks. Both captures report zero browser errors, WebGL error zero and no lost context. Overview has 75 draw calls, desktop 82.

Author inspected both originals. Recorder spools and window are visible, the AI housing stays physically separate across open floor, and the contactor gap and battery read in both views. The lever is small at this scale. The timestamp plate is a rough blank shape, not readable archival text. Shell and engineering floor remain inherited generic treatment. These are model-placement drafts, not finished equipment or a completed environmental narrative. No flashing AI-light behavior is claimed.

## Verification

- Focused suite: 39 tests passed in three files, including seven Room12 tests, all-room model containment and residential regression coverage.
- Full `npm test`: 766 Vitest tests passed, one skipped; two Node tests passed; 29 Python tests passed across nine suites. Exit 0.
- `npm run build`: exit 0. Vite reports its over-500-kB bundle warning.
- `npm run test:room-evidence`: exit 0.
- `git diff --check`: exit 0.
- PNGs decoded with Pillow, dimensions checked and exact-byte copies verified. Local `source-pins.json` records candidate source hashes because HEAD alone excludes these uncommitted changes.

## Failed trials and limits

The first dependency symlink pointed to an unavailable directory, causing test startup failure. It was removed and `npm ci` succeeded. The RED run then produced six expected missing-feature failures and one faulty assertion expecting optional `voids` to be an empty array. That assertion was corrected to accept absent voids before GREEN. A process-inspection pipeline was blocked by the security scanner; ordinary `ps` succeeded. `execute_code` is unavailable under cron policy; ordinary tools completed the work. No failed GPU capture occurred.

Operational logs, complete manifest, source snapshot, exact hashes and capture metrics remain local beside these notes. Independent and parent review, commit, remote publication and receipt remain the parent worker's responsibility.
