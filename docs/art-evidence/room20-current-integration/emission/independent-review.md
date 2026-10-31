# Room20 emission implementation review

Independent read-only review on 2026-10-31, `/workspace/containment-room20-review`, uncommitted changes atop f72c3651e6c1b051e771f0ff897cd0ff4d24fd31. No blocking code or lifecycle finding. No renderer launched; no source modified.

## State semantics and scope

`DepthGame.overloadVisualState` returns a frozen projection of the actual director phase/dispatched/totalSpawns and playing status only in overload-floor. Reading it neither advances nor changes the director. Authorization, room entry, spawn scheduling, enemy occupancy accounting, combat, resources and completion are unchanged. The update is correctly gated to playing combat: paused, dead, complete, menu and undefined state freeze it. All-dispatched with survivors remains combat and can approach maximum intensity; it is not presented as completion.

`OverloadEmission.update` derives its target solely from clamped real dispatch fraction, smoothstepped into [.20,.45]. The finite positive render delta is capped at .05 seconds and only eases toward that target. At the maximum allowed delta the blend is about .1813; a full-range jump changes intensity by at most about .0454 per call, with no overshoot. Production dispatch is monotonic until room reset, so this cannot create a periodic flash or an independent overload clock. Main passes seconds to render and uses zero delta during graphics recovery. State and dt guards reject nonfinite inputs. No global lighting, exposure, bloom, collision, gameplay timer or model geometry changes appear in the diff.

## Binding and retirement

The column material is uniquely marked overloadColumn and actorMaterial, retains its original emissive color, and initializes at .20. Binding is guarded by exact room ID and requires an owned MeshStandardMaterial. Collection happens once after world baking; material identity survives both model batching and renderer batching. The updater stores no obsolete mesh/group/geometry, performs no per-frame scene traversal, and creates no new material.

Renderer loadRoom clears the old binding before world retirement, then binds the rebuilt world. Renderer dispose clears the binding before disposal. The updater never disposes materials itself; existing disposeModel ownership remains authoritative. Other-room binding clears references and makes no mutation. Both minimum and maximum remain below bakeWorld's .5 emissive-fixture threshold, avoiding new light fixture registration. Existing material count, bounds, lobe/void geometry and clevis fix are unchanged.

The binding chooses the last marked material if multiple distinct markers are accidentally introduced. The current model has exactly one and the post-bake regression checks this; this is not a current blocker. Future multiple-column changes would need an explicit binding contract rather than silently relying on traversal order.

## Tests reviewed and independent validation

The added tests exercise actual production authorization and read-only state, game pause and defeat, a real capacity-blocked director despite large elapsed increments, survivors preventing completion after final dispatch, monotonic bounded easing, terminal freeze, malformed input guards and unrelated material preservation. The lifecycle case carries the original owned material through both production batching stages, verifies no generated light fixture, then resets and disposes through three visits with exactly one disposal per material. Existing model and story-route assertions are retained unchanged.

Independent commands:

```sh
npx tsc --noEmit
npx vitest run tests/OverloadEmission.test.ts src/render/OverloadDraft.test.ts src/render/OverloadShell.test.ts tests/StoryRoute.test.ts
```

Typecheck passed; 21/21 focused tests passed in four files. Logs: `/workspace/room20-emission-independent-typecheck.log` and `/workspace/room20-emission-independent-focused.log`.

The lifecycle regression invokes production bake and disposal with a CPU-only world, not the full WebGL renderer constructor/recovery pipeline. Renderer call-site ordering was reviewed in code; native repeated entry/recovery remains integration evidence, not established by this unit test alone.

## Remaining acceptance

This implements a bounded state-driven emission binding to the existing authorized holdout. It does not invent a separate staged overload timer. Native comparison and full final-room capture are still required to determine whether the subtle .20→.45 change reads adequately and whether enemies, marine and all three lobes remain legible under existing high-tier bloom and low-tier rendering. Preserve real dispatch/phase observations alongside early/intermediate/late footage, fatal authorization and terminal ending evidence. No art/readability, all-enemy visibility, wall-time performance or release approval is inferred from these passing CPU tests.
