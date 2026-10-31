# Independent stage 1 review

Verdict: failed. One conceptual-layout blocker remains. This is not a runtime rejection.

## Blocker

The service saddle does not read as joining the two installations. In the actual PNG, S is an isolated central square with short dashed stubs. The vertical exchanger-to-pump connections are visible, but the saddle stubs never join them. In draw_layout.py lines 162-166, paired vertical plumbing sits at x366/384 and x816/834, while the horizontal connector only spans x458-745. The nearest gaps are 74 and 71 game units. The amber entry/descent annotation also paints over much of the horizontal plumbing. The native central crop confirms disconnected pixels, not merely a weak thumbnail.

Issue34 intent, preserved in rollout-sources/room13-brief.json line 17, calls for two installations joined by a low service saddle. Show an explicit, readable below-deck connection from each installation into S, or an equally clear conceptual connection notation. Keep the existing collision footprints and walkable crossings. No detailed models or runtime implementation are needed to resolve this stage 1 blocker.

## What passes

- I inspected the original PNG through vision, including a native central crop, and read brief.md, checks.json, layout-manifest.json and draw_layout.py. Labels, equipment roles, entry, descent and both saddle bypasses are readable. The sidebar separates explanatory text from the map. The clearance envelopes are faint but visible at native scale.
- The plan retains canonical geometry at dff12bbc91359e1588efd3a28ae9aef1298b95f7. storyRoomTemplates.ts lines 19 and 31-34 specify the same five solids, 1200 by 880 room and anchors. authoredRoomTopologies.ts has no coolant-plant override. A custom figure-eight shell is not falsely presented as existing code.
- Two exchanger/pump pairs are allocated clearly. Both outer circuits and north/south central bypasses remain available. S stays solid, and the central route avoids it. The figure-eight is a composite walk through connected circuits, not a literal figure-eight enclosure.
- The life-support headline and informed descent agree with storyRooms.ts line 16 and the supplied issue34 intent. Nothing depicts purge activation, dead passengers, a new valve interaction or a liquid hazard. Operating machinery is a conceptual statement here, not proven animation.

## Validation and test limits

Read-only execution of the generator's AST before its drawing/output section reproduced 69 checks, all passing, and an identical manifest. The retained file contains 72 passing records. The remaining records concern PNG decoding, unchanged source bytes and clean source status. I separately decoded the original 1800 by 1320 RGB PNG, verified all nine source pins plus generator and PNG hashes, and confirmed the current source worktree was clean. I did not regenerate any artifact. These checks verify current consistency, not historical absence of every possible write.

Every named route has 50-unit minimum center clearance, leaving 22 units for a radius28 circle. The segment/rectangle distance method is sound for these finite rectangular inputs. Named routes also use the stricter expanded-rectangle test, and negative controls reject the saddle crossing, oversized circle and outside-room point.

The grid is deliberately an ideal circular-clearance model, not production traversal. expeditionGeometry.ts lines 68-71 uses square-expanded rectangular blockers. For example, the radius28 edge from 280/190 to 280/180 has Euclidean clearance 28.284271247461902 and passes the diagram grid, but fails the production-style expanded-rectangle check. This does not invalidate the separately checked named routes. Do not promote the one-component grid result to full production reachability.

The containment checks validate declared symbol bounds, not all drawn pixels. The PNG-decoded check verifies format and dimensions, not semantic legibility or plumbing connectivity. The missing saddle junction is therefore not covered by the passing checks.

Minor clarity issue: both amber crossing arrows point east, while the manifest's complete figure-eight returns west through the south bypass. Since these are entry/descent annotations and routes are tested both ways, this is not a separate blocker. Bidirectional crossing notation would remove the ambiguity.

No gameplay camera, pursuit, combat, hit feedback, 3D collision matching or integrated rendering was exercised. Those are later-stage requirements, not reasons to fail this conceptual diagram. Issue34 intent was checked against the supplied task and pinned local brief, not a fresh remote issue fetch.

Only independent-review.md was written. Source files, Git state and original attempt artifacts were not modified.
