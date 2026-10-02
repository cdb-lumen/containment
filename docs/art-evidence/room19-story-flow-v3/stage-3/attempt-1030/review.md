# Room19 room visuals, attempt1030

Failed independent and parent review. Do not advance stage3.

Graphite lining, ivory upper cladding and a flush service apron establish the bunker shell. Muted amber improves separation of the passenger board from the guarded actuator. The observation opening still reads as a shallow gray inset. Its hood conceals the sampled cavity sightline. Parent inspected both original PNGs and agrees with the independent review.

Parent reran `npx vitest run tests/ManualControlBlockout.test.ts tests/ShipEnvironments.test.ts tests/StoryRoute.test.ts`: 43 passed, one failed. The ray expected `armored-observation-recess` but hit `observation-hood`. This is a technical failure requiring room-local repair and revalidation, not permission to waive a check. The failing regression remains in the draft branch.

The implementation run completed npm test and build before adding that visibility regression. Those earlier passes do not describe the final test tree. Independent and parent final focused runs reproduce the failure. Full browser verifier was not run. Capture completed with two PNGs and empty capture error arrays. Controlled staged simulation without DOM HUD, not ordinary gameplay. The desktop frame does not include the upper observation opening; overview supplies that evidence.

The implementer timed out after writing the candidate, captures and verification readback. Parent recovered the actual artifacts and independently checked them. All captured runtime pins match. The sole changed pin is the test file, because the failing visibility regression was added after capture. Preserve capture-source.json unchanged and use verification-readback.json for the later test hash. No claim of complete test-tree pin equality.

Only the room-local renderer and its tests changed. Collision, shared engine, camera, HUD, story authorization and other rooms remain unchanged. Previous stages and failures remain historical. The next required work is a room-local observation-hood correction under guard routing, followed by fresh pixels and passing checks. No human acceptance, merge or deployment.
