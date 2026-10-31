# Independent Room17 static framing visual review

No blocking findings for the bounded viewport-clipping repair. This is not an all-HUD visibility qualification.

Compared completed `/workspace/room17-framing-before` (`99cdb8788eb1ea045a38d66bda5c8bd5226f4a05`) and `/workspace/room17-framing-after` (`b92c84166d43195ac3e61411b66544e6ed7b208a`). Both manifests are terminal passed; baseline mode explicitly requires reproducing the old clipping, while candidate mode requires body bounds within the viewport.

Independently verified all 282 recorded source-file hashes per capture against Git blobs, identical clean source-before/after records, matching capture-harness hashes and all twelve PNG hashes. Recorded runtime errors are empty. Matched native projections are identical and zoom remains 1. Center and explicit overview PNGs are byte-identical.

Actual-pixel inspection of the matched witness confirms the original head clipping and the repaired complete marine silhouette. The recorded envelope top changes from −17.442 to +32.057 pixels. Inspected the repaired left, center and right legal north-boundary views; their envelope tops change from approximately −26.360 to +23.184 pixels. The center-boundary marine is clearly framed below the viewport top. Center-room and overview images retain the room arrangement and apparent scale expected from their respective projections.

Important remaining obstruction: the north-left marine is substantially hidden behind the health HUD; the north-right marine also overlaps the top-right UI. These are visible in the actual candidate pixels. The repair qualifies viewport containment only, not unobscured actors behind every HUD panel. The witness away from those panels is the direct visual evidence of the framing correction.

The harness stages legal positions and settles only renderer/HUD at 1280×900; it does not record live approach, combat, swept movement or animation coverage. The overview explicitly changes camera framing and is not the native shipping projection. External font CSS is suppressed. This pair predates the movement fix and cannot qualify that behavior. The fresh full encounter using both fixes remains separate pending evidence; no performance or human art approval is inferred.

No renderer was launched and no shipping source was changed during this review.
