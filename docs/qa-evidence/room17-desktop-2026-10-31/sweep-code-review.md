# Independent production enemy sweep review

No blocking findings in the candidate in `/workspace/containment-room17-swept` atop the reviewed north-framing repair.

The one-line change in `DepthGame.makeEnemies` replaces destination-only occupancy with `canTraverseExpedition(from,to,radius)`. This is the correct production movement contract: both endpoints and the intervening radius-aware path must be legal. Shared geometry algorithms, damage, impulse magnitude/resistance, AI decisions and attack rules are unchanged.

The new regression demonstrates an actual production defect independently of interpreting a per-frame trace chord. Both recorded endpoints are legal, their connecting sweep is blocked, and directly applying that impulse through `game.damage` previously moved the enemy across the obstruction. The preserved red result fails the swept-path assertion while the open-floor control passes. The repair retains damage amount, requires nonzero legal movement at the corner, and preserves exact ordinary open-floor knockback. It does not pass by disabling damage or all displacement.

Reviewed all movement-callback consumers: normal integration and knockback retain their existing axis/alternative candidate fallbacks, now checking each candidate sweep; mutation moveBy continues incremental checks. Spitter firing-position eligibility deliberately uses a zero-length move at the candidate, so occupancy checks still allow an indirectly reachable goal and do not incorrectly demand a straight route to it. No AI decision implementation changes are included.

Independently ran EnemyMovementSweep, spitterRetreat and spitterLosSteering: all 53 tests passed. No assertions were removed or weakened.

Shared regression risks and limits: this callback affects all enemy movement in every room, not just Room17 knockback. Former corner-cutting or tunneling moves will now be blocked or slide, which can change encounter trajectories. Enemies already illegally embedded cannot use a legal endpoint to escape because the start must also be legal; production spawn/placement validation and broader pursuit tests remain relevant. Swept checks do more geometry work than endpoint-only checks; no performance claim is established here. The regression proves the direct knockback bug but does not reconstruct every event contributing to the historical frame420→421 trace. The fresh full encounter must use this movement fix plus the framing repair and pass legal movement verification; the original recording remains failed evidence. Static camera captures from the earlier framing-only source cannot qualify this new movement behavior.

No renderer was launched and no shipping source or tests were edited by this review.
