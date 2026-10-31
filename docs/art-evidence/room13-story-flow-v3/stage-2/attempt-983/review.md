# Parent rough-placement review

Verdict: passed for stage2 rough model placement only.

I inspected the original overview and desktop PNGs. The two upper exchangers and two lower pump/motor assemblies have distinct silhouettes and grounded plinths. Both installation spines connect to the low central saddle. Outer loops and the north/south bypasses remain open. The overview includes the descent exit. These images meet rough placement, not finished machinery or whole-room visual quality.

Independent reviewer sa-0 of deleg_3594e0d6 also passed this stage after inspecting both images and the accepted layout, rerunning 30 focused tests and separately testing production flattening/batching. Bright service covers dominate the dark machinery, and the saddle is still a generic box. Carry these defects into room visuals under the next permit. No new approval question or final-room acceptance is implied.

The reviewer found that the original test evaluated bake before its purported pre-bake assertion. I corrected only that test to assert before and after the mutation separately. Original capture pins, source snapshots and independent report remain unchanged. parent-verification.json records the single test-file delta and identical runtime/capture inputs. No recapture was needed for a test-only correction.

Parent reran the complete npm test and npm run build successfully after the correction. Vitest passed 764 tests with one skipped; subsequent Node/Python artifact checks passed. The writer also ran room-evidence tests and the actual selected-room capture. Git whitespace and current-main ancestry checks passed. Build retains its existing large-chunk warning. Full npm run verify and browser smoke were not run locally, and remote CI is a separate result.

Evidence is a controlled simulation with staged actors, production renderer/composer and no DOM HUD. The capture's legal movement and shot/damage counters are bounded fixture results, not live pursuit, campaign play or release verification. No topology, gameplay, camera, HUD, shared materials or other-room behavior changed. No human acceptance, merge or deployment.
