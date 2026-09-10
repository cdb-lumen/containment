# Flush-kit independent spec review

Verdict: FAIL. One must-fix blocks this construction-family gate.

Scope: only `service_finish.py`, `test_service_finish.py`, `verify_service_finish.py`, the delivered `service-finish/` package and `public/assets/passenger-vault/service-finish.glb`, against equipment-plan lines 32, 36, 42–46 and 56 and layout lines 54–87. Reviewed base `0a56af7711aa92ccea634acbbda7ef84e018bb27`. This is not materials, runtime, finished-room, release or independent code/pixel-quality acceptance.

## Must fix

1. **Deliver and verify the missing editable Blender source for this kit.** Equipment-plan lines 42–44 require a saved Blender scene as well as reproducible GLB output. `service_finish.py:99–125` exports/reimports the GLB and writes PNGs/manifest but never saves a `.blend`. No kit `.blend` exists in the delivered directory or manifest. CPU inspection of the existing `passenger-vault.blend` found chamber/carrier/fit objects, not this flush kit. The verifier at `verify_service_finish.py:66–83` can therefore report success while this required deliverable is absent. Save a kit-specific source scene without overwriting accepted families, include its hash and documented rebuild path, and verify that a clean-root rebuild produces a reopenable source with the same room-origin kit geometry. Keep reservation fixtures source-only and exclude them from the GLB. Reissue the receipt after this check is enforced.

## Verified within scope

- Fresh bounded Blender 4.0.2 import run exited 0: all 9 tests passed, including missing feeds/consoles, broken console link, raised/recessed geometry, displaced bounds, channel moved onto floor, empty surface and a deleted-triangle hole.
- Actual imported GLB has 13 connected mesh objects, 1,026 triangles and 325 successful surface probes. Four feeds occupy x420/780, north y120..248 and south y632..760. Headers/console connections follow y100,780,280,600. Channel x1162..1166 lies inside the east wall, not the floor annotation x1148. Geometry is planar at h0, with no raised pipes or holes.
- Fresh binary contract check passed: native metre room-origin placement, no node transforms, two neutral materials, no embedded textures, animations or cameras. GLB is 42,520 bytes, SHA-256 `85517cc282d247b4a09d0daf3c56405b80f2417a5da1675e3186080ceb1337b6`.
- Tracked diff is empty. The construction scripts do not alter collision, gameplay, camera, VFX or runtime lighting. Eight reservation footprints match the layout, remain evidence-only and are absent from the shipping GLB. No new volumetric route obstruction is introduced. This does not certify future loader/coplanar handling.
- Viewed both actual 1200×880 PNGs: uncropped neutral full-room top/oblique diagrams with four row reservation silhouettes and service context. They are not installed-equipment or gameplay evidence. Detailed pixel-quality review remains separate.
- Source, manifest, log and artifact hashes match the supplied receipts. The retained clean root exists; its author/test sources and GLB bytes match the checkout. The recorded log contains 9 clean-root import tests, 18 layout tests and a successful build. I did not rerun the authoring/rendering verifier or those broader commands; missing Blender-source coverage remains a blocker regardless of their recorded success.

Review execution: CPU import/library probes only, no render or GPU work. Only this review file was created; no implementation edits or commit.
