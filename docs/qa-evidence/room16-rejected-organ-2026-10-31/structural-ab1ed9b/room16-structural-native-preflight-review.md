# Room16 structural native recorder preflight

No blocking recorder delta found. Read-only review; no renderer or source edits. `node --check` passed.

The complete diff from `/workspace/room16-shoulder-native-inspect.mjs` consists of an added exact `swarm-junction` argument assertion and revised disclosure for the joint structural prototype. Checkpoint construction, real Continue/route actions, staged player poses, render settling, camera handling, error/readiness assertions, screenshot hashes and before/after source checks are unchanged. New harness SHA256: `7586b8327285093f545271a5aa21d1a83c6a027c8976bce7d852539373295386`.

The preserved shoulder manifest is terminal passed at df335897, with identical sourceBefore/sourceAfter. Its recorded harness hash matches the preserved script (`fa551eb3b8735d5e57d963e051c19ccbb45b7bfb1105068b00db04fe985be027`). All three actual PNG byte hashes match the manifest.

Expected matched fixtures:
- Desktop 1280×720, device scale 1; center (600,440), then north approach (600,100), radius16, angle0, legal staged occupancy. Sixty production render calls at 1/60 settle each view; these are not player traversal frames.
- Same seed1729/version3 prior-room route checkpoint, eleven first-offered mutations, default resources (100 health/50 armor), real Continue followed by Room16 route choice. Gameplay/checkpoint/camera/HUD files are unchanged between df335897 and prototype ab1ed9b.
- Native camera zoom1 and unchanged projection. Preserved positions are center `[18.75,26,32.75]`, north `[18.75,26,30.426248926045425]`; both projection matrices start with x scale .05113636363636363 and y scale .09090909090909091. Compare the completed candidate metrics against these, not merely its passed flag.
- Third view deliberately overwrites camera pose/frustum using the same geometry-bounds fit and 1.08 margin. Its manifest label explicitly says fitted overview, not shipping gameplay projection. Native views retain production HUD; the overview also retains the DOM HUD but does not demonstrate its gameplay alignment. Overview camera metrics are not recorded, so parity there is supported by unchanged fitting code/bounds, not a recorded matrix comparison.

No acceptance is waived: new disclosure explicitly preserves prior visual rejection, identifies joint sectioned-body/enclosure changes, and excludes traversal, ordinary combat, audio and performance claims. It also states the floating/walkable-looking undercut and perched/indistinct cabinet rejection criteria. External font CSS suppression remains disclosed.

Limits: the script records source commit/hash and enforces scoped clean source before and after; it does not hardcode ab1ed9b, so the actual terminal manifest must be checked against the intended frozen commit. Its longstanding tracked-file hash scope covers src/public/scripts/package files/Vite config, not every repository file (for example root index.html); this is unchanged and no such runtime file differs in the prototype. Harness hash is recorded at start rather than rechecked at end. Preserve the script unchanged during execution. This preflight does not qualify unfinished images or repair the separate environment-only missing-Chromium test run; that failed run remains preserved and the configured rerun must be assessed independently.
