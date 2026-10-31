# Room20 state-bound emission plan

Independent read-only review, 2026-10-31. Source inspected: `/workspace/containment-room20-review` HEAD `f72c3651e6c1b051e771f0ff897cd0ff4d24fd31`. No implementation or rendering performed.

The issue42 requirement quoted in the request—“Overload emission follows real sequence state; exposure and bloom must not wash out enemies or lobes”—is actionable as a bounded binding to the existing postauthorization holdout. Current `OverloadDraft.ts:10–11` explicitly implements only a fixed .35 intensity; that does not satisfy state-following emission. There is no separately defined overload charge timer, phased overload subsystem, or progressive lighting sequence to recover. Do not invent one or claim an independent timer exists.

## Actual authoritative state

- `DepthGame.authorizeDestruction()` requires route status in manual-control-chamber, calls the explicit expedition authorization API, then ordinary enterRoom. Generic routing cannot authorize it.
- `EncounterDirector.createEncounterPlan` recognizes authored depth19 as a holdout: 48 planned spawns, scheduled at 650 + index×900ms. Dispatch is also constrained by live/pending occupancy and carrier cost. The last nominal schedule time is not a completion deadline.
- The director snapshot already exposes phase, dispatched, totalSpawns and elapsedMs. It is private inside DepthGame. A narrow read-only getter can expose the relevant snapshot or a room-specific render-state value without changing any gameplay updates.
- Complete requires all planned commands dispatched and occupiedCount zero on a later update. Pending/reserved children count toward occupancy. The game then applies the existing sacrifice damage and terminal state. Ordinary death is distinct.
- `game.elapsed` is cumulative across rooms. Renderer `this.time` also advances for cosmetic effects. Neither is a truthful Room20 sequence driver. Kills/48 and `1-encounterRemaining/48` are unsuitable because carrier children/reservations change population counts.

## Smallest proposed implementation

1. Add a read-only DepthGame overload visual state, available only when node.templateId is overload-floor. Expose director phase and bounded dispatched/totalSpawns (or immutable derived progress). No setter, new gameplay timer, damage, hazard, spawn or scheduling changes.
2. Use dispatched/totalSpawns as **dispatch progress**, explicitly not a percentage of encounter completion. It is monotonic during this holdout, reflects real progression and pauses when capacity blocks dispatch. Full dispatch must not imply victory: reserve a terminal state for actual complete; ordinary dead must not map to completed overload. If no distinct terminal intensity is needed, retain the last reached intensity for either terminal state and keep ending semantics in the existing game/UI.
3. Bind only the room-owned `overload-column` material. Suggested conservative initial intensity range .20→.45 (subject to native judgment), fixed existing emissive color. A smoothstep mapping of dispatch progress bounds the target; a short monotonic exponential approach smooths discrete dispatch jumps. Its interpolation accumulator is visual easing of real state, not a new sequence clock. Use bounded finite dt only while status is playing; freeze on pause/death/complete and reset on room load/revisit. Never sine-pulse, flash or oscillate. Completing the encounter need not introduce a sudden final brightness jump.
4. Keep initial and maximum intensity below .5 for this first bounded patch. `DepthRenderer.bakeWorld()` registers emissive material fixtures at intensity>=.5 and y>=.65; staying below that threshold prevents accidentally expanding dynamic lighting through the bake path. The exact .20/.45 values are a starting hypothesis, not a readability or bloom guarantee.
5. Do not change tone mapping, exposure, bloom strength/threshold, scene lights, global material tables or renderer effects. Existing final sacrifice explosion is separate production behavior and should remain unchanged.

## Material/bake lifecycle

`createOverloadDraft` creates six unique owned materials, including `overload-column` marked actorMaterial. `batchOverloadDraft` merges by material identity, disposing source/intermediate geometry but retaining materials. `AuthoredRooms.reactorFloor` transfers batch children; `appendEnvironment` flattens mesh transforms; `DepthRenderer.bakeWorld` again merges by material identity. Consequently updating the owned material object survives both batching stages, while a named mesh/group handle would not.

Use a stable material userData role marker (or the existing unique material name plus strict room guard), collect its reference once after world construction/bake, and store only that reference and the visual easing value. Do not traverse the scene each frame, clone a material, retain removed meshes or create a per-frame updater geometry. Confirm exactly one distinct owned column material in Room20. Clear the stored reference before retiring the world, reacquire on each load, and never separately dispose it: `disposeModel(world)` already deduplicates owned material disposal. Renderer disposal must clear references as well. Other rooms should have no binding and no modified shared material.

## Required CPU regressions

- Real production authorization→Room20: no progress before authorization, then actual combat phase; read-only observation does not alter resources, schedule, damage or elapsed state.
- Actual director dispatch under occupiedCount at cap versus available slots: emission target follows dispatch, not elapsed wall time; huge elapsed time with blocked capacity cannot fake full progress. All dispatched with survivors is not complete. Ordinary defeat is not sacrifice completion.
- Finite clamped intensity, no overshoot/oscillation; bounded change on discrete batch dispatch; dt0/pause frozen; reset/revisit independent; non-Room20 leaves materials untouched. Test behavior, not only duplicate the formula.
- Existing raw→batch→append→bake test extended to demonstrate the bound reference is the live baked column material. Bounds, triangles, material count and all gameplay footprints unchanged. No additional registered light fixtures.
- Three room load/retirement cycles with owned material disposed exactly once, geometry retirement retained, no leaked handles or mutations of shared materials. Keep current clevis/void/lobe/geometry tests intact.

## Native acceptance still required

Capture source-pinned native states with actual recorded director phase/dispatched/totalSpawns: early authorized holdout, intermediate progress, final dispatch with survivors, and real complete or ordinary-death outcome. Include actual normal encounter footage, not only staged intensity screenshots. Compare native center/north views and high-tier bloom versus low-tier direct rendering as relevant; verify enemies, marine, all three lobes and their silhouette edges remain legible at maximum intensity. Preserve HUD/pairwise/viewport and legal movement gates. Review adjacent frames for nonflashing smoothness; no wall-time FPS claim from fixed-step capture.

This can satisfy the state-binding portion using the real holdout already authored. It cannot certify a more elaborate overload animation/charging sequence not defined in production, nor satisfy bloom/readability/art acceptance without native evidence. If the desired art requires specific additional sequence stages, those need an explicit room-local design rather than relabeling this dispatch binding as such a sequence.
