# Room16 ray-test budget review

Independent review 2026-10-31 of the uncommitted test-only diff in `/workspace/containment-room16-remodel`, based on HEAD `13508f50e9b97afae90d11150cc5b135ae16a8b2`. No blocking findings; the split preserves the geometric coverage and assertions.

Only `src/render/SwarmJunction.test.ts` changed (16 insertions, 3 deletions). The former combined test becomes one vertex/bake-bounds test plus parameterized pre/post ray tests. All solid-vertex containment checks, existence of marked solid meshes, pre-bake mesh budget/type assertions, post-bake <=7 and reduced mesh count, bounds tolerance 1e-5, and disposal are retained. The production bake helper is unchanged.

Each ray representation retains exactly 49 x positions (360..840, step10) and 28 y positions (105..375, original loop bound <=380 and step10), totaling 1,372 rays each, 2,744 across pre/post. Origins remain (x/32,4,y/32), direction (0,-1,0), hit threshold >.5 game units, and comparison remains exact equality to !canOccupyExpedition at radius0. No grid coarsening, removed sample, weaker predicate, tolerance change, timeout override or skipped test was introduced.

Pre/post now use fresh deterministic model instances rather than one instance traversed before and after baking. The model helper invokes the same room architecture and updates world matrices; source inspection found no randomness/time dependency in the Room16 model or shell. Ray intersection is observational, so the previous pre-pass is not required to prepare the post-bake fixture. The retained vertex/bounds case still explicitly checks before/after baking on the same object. Separate existing disposal and shot-plane tests remain unchanged. This is a legitimate workload partition, not an acceptance waiver.

Independent CPU rerun:

```sh
npx vitest run src/render/SwarmJunction.test.ts src/render/organicShell.test.ts --reporter=verbose
```

25/25 tests pass in two files; log `/workspace/room16-ray-test-independent.log`. Vertex/bounds case 268ms; pre rays 1,583ms; post rays 1,643ms. Total run 8.22s, tests 7.40s. All cases use the ordinary runner budget. These local timings do not guarantee future CI scheduling latency; exact CI rerun remains necessary. The reported earlier CI timeout remains a failed run and is not reclassified.

No runtime edit, renderer launch or art/native acceptance occurred during this review.
