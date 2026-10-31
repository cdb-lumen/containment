# Final-source hood geometry comparison

Final source `34be8dc06b27343765e1321dcce946187ae736dc`; diagnostic original-hood baseline `5a240d3efe11556a608dc5fe881aba07615d65cc`. The diagnostic baseline differs only by reverting the hood geometry and its comment, as recorded in `original-hood-baseline.patch`. Apply that patch to the final source to reproduce the baseline; it is not a release candidate. The original cavity regression and the added 45-ray matrix both fail on the original hood, with nine other tests passing. Neither assertion was waived.

Both recordings use the same desktop1280x720 native camera, HUD and legal staged center/north poses. The final north-native and explicitly fitted overview images expose the dark framed cavity that the original full-depth hood obscures. The center-native PNG is byte-identical. Native camera position/projection and zoom1 match. The sill and jambs still provide depth; this is not a flattened decal.

The source-pinned manifests record hashes, readiness and zero browser/GL errors. Final source passes1075 tests with one existing skip, imported-asset checks, evidence checks, build and exact-head CI41203741290. This is settled-position visibility evidence, not a live approach/traversal/combat or fatal-choice recording, device-performance certification or human art approval. Existing required authored desktop CI retains final-room consent checks.

The parent directory preserves the earlier separate camera-only comparison3d6cc5e→8ed266e. That comparison already had the repaired hood on both sides and must not be presented as a hood regression comparison. No historical attempt or failure is reset. Phone support is out of scope.
