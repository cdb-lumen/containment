# Room20 stage5 permit1036 static supplement

Captured and inspected three fresh original 1280 by 900 PNGs at unchanged HEAD 4712bd3076a7fe2b8a3542c9cb055549c692d662:

- 20-overload-floor-far-north.png, legal player x600 y180.
- 20-overload-floor-west.png, legal player x340 y440.
- 20-overload-floor-east.png, legal player x860 y440.

All use the shipping high-quality composer and production camera. No overview is captured. The inherited overview branch remains in the external script but is not executed. Each staged placement receives exactly 36 render-only calls at 0.05 seconds, followed by a zero-delta final draw. No simulation update, combat or traversal is executed. Camera position, quaternion, zoom, frustum, player and enemy snapshots are retained before and after each screenshot, with exact equality and legal occupancy asserted.

The inherited stageEvidenceGame fixture creates three brutes. Their simulation state is preserved throughout the three captures, without removal or repositioning. Only the player is repositioned. These are fresh staged actors, not a continuation of the earlier capture's post-combat actor state. Render animation time advances during the disclosed settling. No DOM HUD is added and no HUD acceptance gate is claimed.

## Native pixel inspection

The far-north original visibly places the player on the north service plates above the pit. The stacked bronze and ceramic core rings, paired coolant pipes, three-conductor power head and forward restraint assembly remain distinct. Vertical legs descend into the dark shaft. The near outer deck skirt and bronze ties are visible. Three brutes partially overlap the near apron and rail, but do not bury the core or service heads.

West and east originals show the same core and heads under lateral production-camera framing. The complete pit assembly remains in frame. Parts of the remote room perimeter are cropped by normal framing. No obvious floating or clipping defect is visible in these originals. Dark shaft areas and solid deck surfaces still conceal some support geometry. These screenshots do not prove hidden under-deck connections or reverse-facing surfaces are unobstructed.

The shipping orthographic camera retains its fixed orientation at every player placement. The north view is a normal-camera inspection with the player occupying the far lobe, not a rotated reverse-angle camera. Its framing shift is small because shipping roomFocus clamps the vertical framing. Independent review must decide whether these source-specific far-lobe pixels satisfy the prior missing-coverage requirement. This supplement does not revise the preserved failed review or claim stage acceptance.

## Integrity and cleanup

verification.json records three verified screenshot hashes, unchanged camera/player snapshots, legal occupancy, zero browser errors, clean Git status and unchanged HEAD. All 269 pinned source, public, script and configuration files and all 24 original evidence files were rehashed unchanged. Temporary external entries were removed. Browser and owned Vite server closed after the capture. The final process inspection found no Chromium or capture worker remaining. The unrelated containment-boons Vite process on port 5193 was left untouched.

adapt.py and room-evidence-static.mjs contain the external adaptation. adaptation-map.json records exact replacements, source hash and pinned dependency paths. source-before.json retains source and original evidence hashes. manifest.json retains full screenshot metadata and snapshots. No runtime source was edited. No publication, receipt or guard operation was performed.

The first attempt failed because the external entry could not resolve its bare Three import. failed-run-1.log preserves that timeout. Pinning the entry import to the worktree's exact Three module path fixed the dependency lookup. The second capture exited zero. capture.log preserves its output.
