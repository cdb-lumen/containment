# Room11 overall independent review

## Verdict

FAIL for complete stage5 art acceptance. The systems-theatre composition and focused CPU checks pass, but the physical operator-to-board construction does not meet the room brief. The visible service runs stop short of both assemblies. The fatal meaning of the amber routing also remains weak in the retained images. Keep the successful layout, occupied berth silhouettes and instrument banks. Return only the affected connection and consequence communication work for bounded review under the existing workflow. This review does not authorize runtime edits or another attempt.

This is an independent review of attempt995 at pinned source de75906b30330fa19d81d3a227e79a300b415ae2. I inspected both original final PNGs through vision_analyze, fetched current issue32 and its current gallery comment, read map-model-production.md, and read the requested technical records. I did not run a browser, GPU job, guard call, git command or publication command.

## Scope and authority

The live issue was OPEN, updated 2026-10-01T07:45:48Z, at https://github.com/cdb-lumen/containment/issues/32. Its current brief calls for a physical ship cutaway, occupied cryo evidence, all-deck purge routing, curved instrument consoles, hinged maintenance panels and cable trunks descending to the board. The original stage0 brief specifically warns against amber routing reading as ordinary power distribution.

The current production contract separates art review from release. This failure is not for missing HUD, mobile evidence, a full browser verifier, campaign completion, a combat video or deployment. Those are not added art gates here. No accepted unrelated room or shared asset is reopened. Human acceptance remains separate regardless of this machine review.

## Direct pixel assessment

The overview establishes a coherent systems theatre. The semicircular teal apron groups the two ivory console banks around the raised cutaway. The center gap and broad outer floor leave visibly intelligible circulation space. The rear shell frames the exhibit rather than introducing a competing screen. The lower central floor stripe is an approach cue, not proof of the actual spawn or exit.

At desktop scale the cutaway has three distinct stepped deck plates, a common amber spine on the left and an amber branch on each plate. The top plate has four tapered occupied berth symbols. Their pale head and body shapes read better as people in pods than as ordinary monitors. Small limbs merge at overview scale, which is a limitation rather than a reason to reject the retained silhouettes.

The curved banks are recognizable physical consoles. Separate sloped ivory housings sit over darker continuous cabinets, with cyan circular gauges and smaller selectors. Their low profile does not hide the staged actors. Repeated controls do not communicate different station roles or readable operating states, but that alone is not a stage5 blocker.

Muted teal, ivory and restrained amber are consistent across the room. Broad floor sheets and dark joints do not compete strongly with the exhibit. The actors are visibly more textured than the architectural props, but I do not reopen those shared assets. I see no obvious floating major object or gross interpenetration in these two views. That is a bounded visual observation, not an exhaustive contact audit.

## Blocking findings

1. The console-to-board service connection is absent, rather than merely hard to see. In final-desktop.png the thin straight runs flanking the display terminate in empty apron above the console banks. They do not visibly descend from a cabinet or turn into the board. The overview preserves the same disconnection. Source confirms the visual reading: DiagnosticGalleryArchitecture.ts lines 33-35 creates two flat floor strips at x362 and x833, z54 through z310. DiagnosticGalleryModels.ts lines 60-92 builds the console cabinets and instruments but no joining trunk. This does not satisfy issue32's connected cable-trunk construction. Retain the current banks and routes; the affected task is to make their physical service relationship legible within the allowed room-local scope. The same model source has cabinet seams but no authored hinges or identifiable maintenance panel assembly. That is a smaller retained brief omission, not a claim that tiny hinges must be readable from every camera.

2. The board clearly communicates a common feed reaching occupied berths and all three decks, but its destructive meaning is not independently legible in these retained art views. The clean amber rails and terminal blocks can read as ordinary distribution. No distinct physical consequence cue identifies the feed as fatal. This is the specific ambiguity already identified in the stage0 brief, not a request for HUD text, a new interaction or already destroyed passengers. The warning supplies context, so I am not claiming that no player could understand it. I am declining to certify the complete environmental consequence requirement from these pixels. Preserve the live occupied berths and the Room12 story boundary.

## Fresh CPU verification

From /home/chernodubv/dev/.cron-worktrees/containment-rooms/diagnostic-gallery-v3 I ran:

- `./node_modules/.bin/vitest run tests/DiagnosticGallery.test.ts tests/ShipEnvironments.test.ts`. Exit 0. Two files, 34 tests passed.
- `./node_modules/.bin/vitest run tests/StoryRoute.test.ts -t 'dismisses only optional presentation|publishes immutable room names'`. Exit 0. Two tests passed, seven excluded by selection.

The first run checks canonical shell, spawn, exit and breaches; named swept routes at actor radii16 and28; legal activity points; rejected model interiors; transformed model vertices contained within their declared solids; floor and shell bounds; occupied berth construction; console support; runtime freezing; and isolation from Room12. Vertex containment is not a complete bidirectional collision-to-visible-surface or projectile-height audit. The second run confirms optional presentation can be skipped without losing story status and that the immutable story route retains objectives. It does not exercise Room11's muted post-warning UI sequence or ordinary combat.

I independently hashed 208 pinned src, tests, scripts and package files before and after the test runs. Both comparisons returned no mismatches. This checks those file bytes against source-pins.json, not git state or every asset in the repository.

## Retained technical evidence and limits

verification.json records successful author focused tests, full tests, build, evidence tests, capture and CPU audit. Its summary records 768 Vitest passes with one skipped. I did not rerun that full suite or build. The build's large-chunk warning remains disclosed.

The author's overall-cpu.json reports 288 meshes baked to13, 13 materials, unchanged bounds and6374 triangles, and26 monitored resources disposed exactly once. Reading overall-cpu.mjs confirms it constructs the real environment and invokes bakeWorld and disposeModel without a WebGL renderer. This supports that bounded CPU construction and disposal claim. It does not prove GPU memory behavior or repeated browser lifecycle safety, and I did not overwrite or rerun that author output.

The capture is controlled fixed-step simulation with staged actors and no DOM HUD, not ordinary gameplay. The author record reports356 traversal steps with356 legal checks and zero exit distance. Desktop combat has25 fixed steps, four shots and48 damage. These are fixture observations, not a sustained encounter, input trial or campaign acceptance. Both images report no WebGL error or context loss in that capture. I did not independently reproduce those GPU observations.

capture-adaptations.json describes external capture entry, dependency resolution and evidence-local cache changes, with no camera, fixture or rendering edits. The overview is byte-identical to stage4 according to the retained record. It is valid for the unchanged candidate, not evidence of a newly improved overview. Earlier acceptance of model iteration does not supply missing overall story or construction acceptance.

## Exact reviewed image identity

Both originals are 1280 by 900 pixels. Independent SHA256 computation matched verification.json:

- final-desktop.png: `799863b473cadeb8f11099b174bf45b3c1bbebf05278c337540852c347f22474`
- final-overview.png: `ca90ca0902db87815b69317d538d09adec6e721c28c5ea3d04b00cabd432e7e0`

All paths in this section are under /home/chernodubv/.hermes/workspaces/containment-art-roadmap/diagnostic-gallery/story-flow-v3/stage-5/attempt-995.

Only this independent-review.md was intentionally created by this review. The runtime was not edited. An initial execute_code read was blocked by unattended-tool policy; normal read and terminal tools completed the work. No human acceptance, release readiness, merge or deployment is claimed.
