# Cryo benchmark asset

Original geometry authored for Containment, no external model or image sources. The deterministic source is `scripts/build-cryo-benchmark.py`. Redistribution follows this repository's terms. No purchased assets, transmission textures or Draco dependency.

Export and roundtrip validation:

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/build-cryo-benchmark.py
```

`cryo-review.glb` is metre-scale, Y-up after glTF export, X across the berth, Z head-to-foot. Its origin is the tub centre at the rack datum. The renderer translates it without nonuniform fitting. Nine material batches cover cast ceramic, machined metal, rubber, upholstery, suit, skin, opaque frosted glazing, condensation and safety markings. The small head aperture preserves an occupant cue, the opaque canopy obscures the torso. This is a low-cost frosted-lid interpretation, not transparent glass.

The template remains CPU-side and immutable after loading. Each passenger room copies geometry and one material per batch, then merges all 28 pods. Room disposal owns those copies. A failed optional model load retains procedural pods and may retry on later preparation. Only passenger-vault requests the model. Existing global lighting, topology and game simulation are unchanged.

The real passenger-room entry loads the optional asset without blocking play. Procedural pods remain until the bounded five-second attempt succeeds, and a room-instance identity guard prevents a late replacement of another room. Direct preparation also has the five-second deadline. A later room entry may retry a failed transfer.

Resource review measured 5,844 triangles per pod, 163,632 triangles across 28 pods and 15,708,672 bytes of expanded position/normal/UV attributes before room architecture, temporary merge buffers and GPU copies. Low quality currently uses the same pod geometry. The 355,028-byte GLB download is not runtime memory. Low-tier capture metrics remain required before approving or expanding this prototype.

This is a review-only candidate. It does not approve the look, extend it to other rooms, alter the map-update process, or authorize merging.
