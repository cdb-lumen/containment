# Independent wider navigation review

Reviewed the uncommitted FacilityNavigation change and new clearance regression/fixture in `/workspace/containment-large-actor-navigation`, based on `76b4a23aa323f0256c6034af0d57595f0e7139b7`. No blocking findings for this bounded API extension. No runtime files modified, renderer launched, or merge approval submitted.

Default behavior is preserved: radii at most 28 retain clearance 30, the original radius-12 closest-cell connector, goal selection, BFS and seven-step smoothing. The new branch (FacilityNavigation.ts:42–49) applies only above that threshold. Ceiled clearance keys share wider grids; at most four direct children are retained with insertion-order eviction. A child accepts the originating query without further delegation. Each retains normal wave/player-cell invalidation and immutable geometry reference.

The wider grid checks occupancy with its own clearance. Its start connector uses actual radius plus two, and subsequent returned candidates still require the full actor-to-target segment to clear. This addresses the reproduced unreachable-cell selection without relaxing collision checks. The goal connector remains radius 12, reflecting the player's connection to a nearby wide walkable cell; it does not promise a large actor can occupy every player position. Direct clear paths still return null; lack of a reachable connector still returns the actor position.

The fixture is explicitly a rejected Room16 outline used as deterministic navigation data. Three routes at each radius 14/18/24/28/38 require legal endpoints, legal movement sweeps and actual arrival within four units. This is meaningful end-to-end routing coverage, not a replacement of a failed expectation with a weaker assertion. The preserved baseline log has four passes and the radius-38 failure; current five pass. Radius 38 is conservative API coverage, not a demonstrated live standard-enemy bug or resolution of issue #108.

Independent validation:
- `npx vitest run tests/FacilityNavigationClearance.test.ts`: 5 passed; `/workspace/wide-navigation-independent-focused.log`.
- `npx vitest run tests/unit/stalkerPursuit.test.ts tests/unit/spitterLosSteering.test.ts tests/unit/spitterRetreat.test.ts tests/unit/spitterProjectileClearance.test.ts`: 121 passed; `/workspace/wide-navigation-independent-regression.log`.
- `npx tsc --noEmit`: exit 0; `/workspace/wide-navigation-independent-typecheck.log`.
- `git diff --check`: passed.

Limits: fixed 32-unit sampling, bounded nearest-cell search and vertex-based BFS do not establish route completeness for every continuous passage; full segment validation protects returned wider waypoints. `reachable()` remains a query of that instance's prepared grid, not an actor-radius API. The four-child bound is not a new global memory guarantee for arbitrary floating radii: the existing per-instance expanded-wall cache remains keyed by exact radius. Dedicated mixed-radius eviction/goal-change tests would improve future maintenance coverage, but no concrete failing production case was found. No art, browser, performance or whole-campaign acceptance claim.
