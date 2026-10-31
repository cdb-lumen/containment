# Independent Room17 north-framing code review

No blocking findings in the reviewed candidate in `/workspace/containment-room17-framing` atop `99cdb878`.

The runtime diff changes only `roomFocus`: Shielding Gate gets a north limit computed with 2.2 instead of .7 ground-plane margin. Horizontal framing, south limit, projection/zoom and all other room policies are unchanged. Computing the new margin before `min(depth/2, …)` preserves the existing centering behavior where the projected view covers the room; this is preferable to blindly subtracting from an already-capped limit. The new clamp remains continuous and monotonic.

The regression preserves the actual frame499 position and adds legal radius16 north-boundary poses across five desktop window shapes. It calls production `playerScreenBounds`, requires an eight-pixel top margin and all other body-envelope edges in the viewport, and checks zoom 1. The follow cases retain production exponential easing and maximum movement speed; center/south and unrelated room comparisons remain present. The preserved red log shows seven failures and two passes before the change. Independently ran RoomFraming and ShieldingGateDesktopFraming tests: all 13 passed.

No acceptance waiver was found: the old clipping is retained as failure evidence and the new test demands stronger visibility. One coverage-description limit: the dt=.1 case is an extra synthetic stress case, not exact native render stepping, because production DepthRenderer clamps render delta to .05. The 1/60 and .05 cases represent the actual tested render-step range. These tests use a fixed 2.2-height body envelope, not animated mesh pixel bounds, and do not establish visibility through HUD or room geometry.

Matched native before/after pixels and a fresh full encounter remain required. The ongoing aa4 recording must remain preserved as failed viewport-visibility evidence regardless of its combat/ammo result. No source or renderer changes were made by this review.

Integration requirement: when merging into the Room19 stack, retain Manual Control Chamber’s separately qualified four-unit north policy. Its unrelated-room regression may explicitly exclude Shielding Gate only while retaining dedicated positive coverage for both room-specific policies; do not replace the Room19 policy or broadly relax the assertion.
