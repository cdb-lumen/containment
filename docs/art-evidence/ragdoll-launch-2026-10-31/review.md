# Ragdoll launch review — 2026-10-31

Runtime source: `0b1a971598d629f2093e62992e989538c7a44ce8` (PR113, including PR115). This evidence branch adds only documentation and captures; it is not a separate runtime change.

Both original videos contain six seconds / 120 decoded frames at 20 fps. Desktop is 1280×720 and portrait is 390×844. The recorder retained native zoom1, production camera, loaded models, input, projectile collisions, death routing and Rapier articulation. The opening encounter is controlled: director disabled, legal crawler and brute spawns, and setup-only nonlethal weakening to one health before actual shotgun and rocket kills. The videos are silent fixed-step recordings, not wall-clock FPS or physical-phone evidence.

## Inspection

The execution agent inspected the full-frame samples and every decoded frame in the numbered sheets (0–59 and60–119 in each viewport). This is frame-sequence inspection, not a claim of separate human or independent-agent review. The sheets are crops made after recording, solely for inspection: desktop crop240×200 at320,250; portrait crop180×150 at170,340. They do not alter the original video's camera, zoom or motion.

The crawler's shotgun death stays localized, bends and settles without repeated flips or long airborne travel. The brute's rocket death has a visible impulse and settles into a compact aftermath; no chaotic spin or detached limbs were visible across the inspected frames. Both remain legible at the native gameplay camera. Dark surfaces and small geometry limit fine floor-contact assessment; this is the motion-tuning acceptance for #68, not a new material/art or device-performance certification.

The root's maximum horizontal travel after the first observed corpse frame is1.2266 world units for the crawler and1.2378 for the heavier brute. Those different-family captures do not independently quantify same-family weapon strength. The production lethal-projectile CPU regression separately establishes stronger rocket launch than shotgun launch for the same family, while retaining inverse-family weight scaling.

## Mechanical checks

- Both clean source snapshots match the exact SHA above and have identical before/after file hashes.
- Recorder state is `verified`, all120 frames passed, console/network errors are empty, and every frame reports native zoom1, no loading/busy state and WebGL error0.
- Actual deaths occur at frames4 and65; each has one corpse event and a real lethal damage witness.
- Both MP4s pass ffprobe frame/duration checks and complete ffmpeg decoding.
- Original image and MP4 hashes were independently rechecked against the manifests before publication.
- Maximum joint separation is0.000323 world units. The additional screenshot-free aftermath ends with both corpses settled and zero active bodies. It is not a crowd-performance benchmark.

See `verification.json` for concise measurements, each viewport's original `manifest.json` for complete source/probe/frame records, `ragdolls-*.mp4` for the original video, `decoded-*.png` for full-frame samples and `frames-*.png` for the all-frame inspection sheets. The manifests retain their original local execution paths; these are provenance, not download links.

Reproduce from a clean checkout of the source SHA with Node24, Chromium and ffmpeg:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/ragdoll-demo.mjs --source-sha=0b1a971598d629f2093e62992e989538c7a44ce8 --viewport=desktop --out=/tmp/ragdoll-desktop
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/ragdoll-demo.mjs --source-sha=0b1a971598d629f2093e62992e989538c7a44ce8 --viewport=portrait --out=/tmp/ragdoll-portrait
```
