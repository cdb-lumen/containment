# Combined first-room media review

## Decision

PASS for whole-room visual acceptance at `27bff3a431cdbdd66cd1c76c4c2a6b1743efe357`. No must-fix visual defect found in the inspected evidence. This is an independent evidence review, not the user's final art approval and not a target-device performance approval.

Inspected eight distinct PNGs: desktop and portrait built-app openings, whole-room overview and controlled gameplay, and decoded video frames 0, 40, 80 and 119. Dimensions match their manifests: desktop 1280x900 and portrait 390x844. Only Awakening bay is covered. The room manifest's 20 route entries are inventory, not 20 captured rooms; its selected scope is one room with two image modes.

## Visible room and kit

- Whole-room overview contains the complete perimeter, rear life-support assembly, two banks of four sealed chambers, the released west berth and boarding deck, southwest monitoring console/medical unit, recovery chair, personal KIT locker, east satellite service cabinet and parked trolley, and the communications exit.
- The east cabinet and trolley are both inside the overview and gameplay frame. They project as a close pair: cabinet upper body behind the lower trolley tray, frame and feet. Their presence is visible, but this camera does not expose cabinet shelf interiors or folding-door mechanics. Do not claim those hidden details were independently validated from these room pixels.
- Console screen, locker silhouette, berth and occupied-neighbour cues remain readable at the opening camera. The portrait frame correctly crops the east room and much of both chamber banks. It is opening/HUD evidence, not whole-room evidence. No blank, loading or wrong-route retained frame was accepted.
- Gameplay and decoded frames show actual actor movement and gunfire, with restrained contact particles and readable environmental silhouettes. Frame 40 temporarily overlaps the player with a brute; later samples clearly separate them. No persistent clipping or missing assembly was demonstrated.

## Provenance and state checks

Live HEAD equals the manifest SHA. Git comparison against `c7f97e7` changes only `scripts/smoke.mjs`, four insertions and one deletion; runtime and assets are unchanged. No tracked working-tree modifications were present. Existing untracked `.sealed-evidence/` and `node_modules` were left alone.

The video records identical before/after source tree SHA256 `8b93b1f69e4f49aa9bf5a42ed46b0dd1997c2556e544abf25cafe81a7b7ffa1d`. All 191 unique source/asset paths independently match their recorded hashes in both lists. MP4, two room PNGs and four decoded PNG hashes also match.

Opening `assetSha256` is specifically the released berth, not the room-kit bundle:
- Released berth: `eb11cdda45519484ddcf50735607a4c170adfd520c35ac6eb65a932bf483d997`.
- Combined room-kit: `78f5daae3d6d409cd1dfcce8365373fbec9768ad5f4036e8b49ab1b4eee0ea0f`.

Both unique opening viewport rows record berth, bank and kit transitioning from three loading owners to three ready owners, eight sealed passengers, shipping zoom 1, playing state, and both fallback flags false. Opening error/WebGL arrays and both room error arrays are empty; room WebGL error is zero with no context loss. All 120 video frame records report WebGL error zero; browser, encoder and decode errors are empty. Room/video manifests still say pixel review pending; this report supplies the review without modifying those source manifests.

## Verified gates and budgets

`combined-verify-retry.log` completes the canonical verifier:
- Vitest: 57 passed files, one skipped file; 456 passed tests, one skipped test.
- Native GLB preview: 2 passed, zero failed.
- Room evidence/recorder tests: 7 passed, zero failed.
- Total automated test cases passed: 465, with one skipped Vitest case. Browser smoke is separate, not added as invented test cases.
- TypeScript and production build pass. Desktop 1280x720 and touch 390x844 smoke both pass, each reporting 46 assets, no errors, no graphics loss, and successful audio menu/pause coverage. Vite reports a nonfatal bundle-size warning, 955.94 kB JavaScript and 262.87 kB gzip.

Independent GLB parsing gives 1,662,788 bytes, 21 primitives and 29,304 triangles for room-kit, within owner ceilings of 1,800,000 bytes, 24 meshes and 30,000 triangles. The file has 21 materials and nine image definitions.

Observed rendering counters are evidence-class-specific:
- Built opening: desktop balanced 159 draw calls / 574,020 triangles; portrait low 71 / 281,340.
- High overview: 109 / 322,215; high controlled gameplay: 116 / 322,515.
- High video: 194 to 209 draw calls, maximum 644,538 triangles.
- Smoke: desktop balanced 176 / 585,538; touch low 70 / 280,956.

These are recorded counts, not proof of a shared scene-wide draw-call ceiling. Software-WebGL timings are slow and remain an accepted environment limitation, not evidence of real-GPU FPS.

Independent `ffprobe -count_frames` confirms H.264, 1280x900, 20 fps encoding, exactly 120 decoded frames and 6.000000 seconds. Manifest has 120 unique sequential frame records and 120 distinct motion-crop hashes. Runtime records 31 shots, 480 damage, 480 legal checks and 453.3 units of travel. The video is a controlled fixed-step encounter with three stationary high-health, zero-attack-damage brutes and no DOM HUD/campaign progression. Its encoded frame rate is not measured live FPS.

## Strongest handoff artifacts

- Whole room: `/home/chernodubv/.hermes/workspaces/containment-awakening-completion/combined-room/01-awakening-bay-overview.png`
- Desktop opening/HUD: `/home/chernodubv/.hermes/workspaces/containment-awakening-completion/combined-opening/desktop.png`
- Portrait opening/HUD: `/home/chernodubv/.hermes/workspaces/containment-awakening-completion/combined-opening/portrait.png`
- Gameplay still: `/home/chernodubv/.hermes/workspaces/containment-awakening-completion/combined-room/01-awakening-bay-gameplay.png`
- Gameplay video: `/home/chernodubv/.hermes/workspaces/containment-awakening-completion/combined-video/awakening-bay-desktop.mp4`

Only this report was created. No source edits, browser/render runs, full test reruns, process interference, merge or push. The parent's separately running final lifecycle job was not audited or claimed complete here.
