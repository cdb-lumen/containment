# Shared north headroom — independent native comparison

No blocking finding for the two inspected camera witnesses. The shared policy gives both previously failing body envelopes visible headroom while retaining player coordinates, projection and zoom.

Inspected all four full-resolution PNGs in `/workspace/desktop-headroom-before` (51610c63cc18aac817e384f4182113162e296e56) and `/workspace/desktop-headroom-after` (0b22f4723e2a15d77ad020256e21c0c68b34bc13). Before, each marine is uncomfortably close to the upper edge and its conservative envelope extends beyond it. After, helmet/body are visibly clear of the edge and listed HUD panels. Room12-derived envelope top moves−7.317144→42.182132px; Armory-derived top moves−3.386063→46.158351px. Horizontal envelope extents remain unchanged. Native camera z changes by approximately−1.5 as intended; player states and projection matrices match exactly, zoom stays1. Extra north wall/header enters view, with no new obstruction at these poses.

Independently verified288 source hashes per run against exact commits, stable clean before/after records and all four PNG hashes. Both terminal manifests pass. Same saved harness `/workspace/desktop-headroom-native-inspect.mjs` matches SHA-256 `c15adb10effdfd5e1cbdf1e76a4795ca2e185f1ffea76cfa0c83a8216b270fef`.

Both failure coordinates are staged in the mainline Safety Interlock environment to isolate the camera change. The filename armory-frame178 denotes the origin of that coordinate; it is not an Armory/carousel scene or combat replay. This does not qualify authored Room12 equipment, carousel art, actual moving combat, Room19 cavity composition or all other rooms. The conservative body-envelope failure should not be described as a measured count of cropped helmet pixels.

These witnesses support the shared camera repair alongside `/workspace/desktop-north-headroom-review.md`. Original Room12 and carousel failed full captures remain failed; fresh integrated full-encounter retries are still required with unchanged viewport/HUD assertions. No renderer launched or runtime changed during independent review, and no general visual/human/release approval inferred.
