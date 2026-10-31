# Lower HUD matched native review

No blocking finding for the bounded static lower-control clearance fix. Inspected all four full-size PNGs in `/workspace/lower-hud-native-before-valid` (d2a87bff0917b85ad1441fe1271c29b82d57bb6d) and `/workspace/lower-hud-native-after` (2631c47ca9751c9f1832cf023283f24e9b15f58e).

The right witness visibly places the old picker over the marine's lowest projected envelope. After repair, ammo/picker/hint move to the left, leaving the marine unobscured. The mirrored left control keeps all three on the right. Text/buttons remain legible at 1280×900; no new obstruction of the marine appears in these views. This is not a claim that the panels never hide environment art.

Independently verified all 290 baseline and 292 candidate recorded source hashes against Git, four PNG hashes, terminal passed/error-free manifests and identical clean before/after source records. Both harness hashes match `/workspace/lower-hud-native-inspect.mjs`: d01a4fad3ed6335675e582b641e62f5a6718cb8c61bfb89fc699991084c81cbf. Pose/player/body bounds and native zoom1/projection match across each pair. Baseline right picker intersects body y826–836.624; candidate's three recorded lower rectangles all clear both bodies.

Shared `src/WeaponHud.ts`, `src/main.ts`, `src/style.css` are byte-identical between PR125 source06893a11887d33266b306e44c711a1b396b90d46 and capture2631. Armory model/layout are unchanged from d2. This supports applying the shared HUD witness to PR125 without pretending its generic-main source contains the carousel model.

The witness stages recorded frame746 position and camera with a standing body. It does not reconstruct historical animation/recoil/enemies or establish full combat/traversal. External font CSS is suppressed. Original failed frame746/remote bb97963 remains failed evidence; prior invalid capture is not used. Pointer gesture safety is separately reviewed in `/workspace/lower-hud-independent-review.md`; this static pair does not exercise it. Unified all-HUD layouts, fresh full encounter and required verification remain separate. No renderer launched or source edited; no human acceptance inferred.
