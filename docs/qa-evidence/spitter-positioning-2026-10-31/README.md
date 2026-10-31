# Spitter positioning verification

Final source: `d2cccf94e4a456445fd2ca93ca20a44a4d614efc`. Baseline: `2d4ed1081660124474598b50bdc2e32537bc4f23`, integrated original PR112 before alternate firing-goal repair. Refs #108, #109, PR112.

The repair preserves 180–420 attack range, the radius9 projectile-clearance predicate and legal movement. When the straight retreat goal is illegal or unreachable, it searches a bounded set of valid firing positions and retains a reachable goal while approaching it. Disconnected searches are throttled; no completeness claim is made for every possible room configuration.

## Reproductions

- Original Gallery regression passes on the baseline while explicitly expecting the spitter to stay trapped below180 range. The revised regression fails on that same source and passes after repair. It requires escape and an attack within100 frames, legal occupancy/sweeps and unchanged range/projectile-clearance checks. The second player location is south after the spitter escapes north, preserving a clear firing-opportunity control.
- Current38-case stronger suite on the baseline:15 fail,23 pass. Post-fix focused suite including Gallery:51 pass. The six documented Room17 coordinates include five recovered failures and one south-threshold case that already passes the baseline. This disagreement with historical claims is retained.
- The twenty Room15 breach-to-anchor fixtures are new reproducible coverage, not recovered historical300-case replay inputs.
- Each damage witness runs actual `DepthGame.update(50)`. Only the encounter director is disabled to isolate one spitter. A hazard attack must occur and health/armor loss must happen inside real projectile stepping; contact damage cannot satisfy the witness. Every movement position and sweep is checked. The deadline is900 frames, not unbounded waiting.
- Full CPU/asset test chain:1010 pass, one optional skip. Browser gates are tracked separately in PR112.

## Independent review

A separate read-only reviewer inspected the runtime fix and semantic Gallery regression. No blocking finding. Its initial observation that contact damage could satisfy the matrix prompted the stronger projectile-only witness above. A follow-up review found no blocker: the actual frame preserves cooldown behavior, contact damage occurs outside the measured projectile call, and the legal movement/deadline assertions remain. This is a code/test review, not independent visual or physical-device acceptance.

## Unresolved acceptance

Fresh ordinary-encounter CPU probes with default resources and no boons reached16 kills in Room15 and37 in Room17, then the automated player died at56.75s and108.45s respectively. They are retained as unsuccessful qualification attempts, not gameplay passes or proof of a game defect. Full rendered combat, reward/onward progression and small-enemy visibility still need appropriate fixtures and evidence. Historical replay bytes remain unavailable. Do not close #108/#109/#96/#97 from the bounded regression suite alone.
