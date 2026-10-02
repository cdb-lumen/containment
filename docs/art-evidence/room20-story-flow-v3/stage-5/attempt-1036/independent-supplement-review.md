# Room20 overall1036 independent supplemental review

Verdict: passed for bounded stage5 static art. The supplement resolves the missing far-lobe normal-camera inspection identified in independent-review.md. This is not release approval or human acceptance. The initial failed review remains unchanged as the record of the evidence available then.

## Evidence and integrity

I inspected all three original supplement PNGs through vision at 1280 by 900, not a contact sheet or replacement render:

- 20-overload-floor-far-north.png, player x600 y180. SHA256 4427dfc536f151651e1a6d654dcb4871b02c7181199e1abc5599ce5f80d3bb02.
- 20-overload-floor-west.png, player x340 y440. SHA256 739b8c18ff9fe0da53786e79db83db8845c20cb640eb281b7c17b66e87f347f8.
- 20-overload-floor-east.png, player x860 y440. SHA256 3a3b2823f873995e7165902abb0531724595efc300a081d64f21b0d9759270e5.

I read the prior review, supplement manifest, verification.json, inspection.md, adapt.py, adaptation-map.json and actual external room-evidence-static.mjs. I also read OverloadDraft.ts, OverloadShell.ts and the production camera code. The prior two-image and CPU findings are inherited from the preserved review, not represented as fresh executions here.

Read-only verification found three unique capture rows, matching PNG hashes and dimensions, legal occupancy and identical before/after snapshots for every row. Browser errors were empty, WebGL errors zero and context loss false. Source, original evidence, base harness, adapted harness and dependency hashes matched their pins. HEAD remains 4712bd3076a7fe2b8a3542c9cb055549c692d662 and Git status is clean. The prior review hash remains f43fc9250e8a1ec0e44c3ed52175abcdf750059c13b9ea73568ee4731160b73b.

## Coverage decision

The far-north image visibly places the player on the service plates beyond the pit. West and east show legal lateral positions with the entire pit assembly retained in normal framing. These are the missing player-location inspections, not another fitted overview.

DepthRenderer follows roomFocus with a fixed camera offset and look direction. All three snapshots retain the same orientation, zoom and frustum. The external capture executes only far-north, west and east modes. Its inherited overview camera branch is not executed. A far-lobe player position therefore does not produce a reverse-angle view, nor should it. Requiring camera rotation or newly exposed back faces would invent a camera requirement the shipping game cannot satisfy. The small north framing shift is not grounds to reject valid far-lobe coverage.

## Construction and style

The north image retains readable bronze ring tiers around the pale core column. Ceramic bands and segmented shoes remain distinct from the coolant header and three-conductor power head. The forward restraint has visible raised cheeks and a recessed actuator. Lateral return lines connect toward the core rather than appearing as detached floor ornaments. Vertical machine legs descend into the shaft. The near outer deck skirt, horizontal lower edge and bronze ties give the visible platform edge structural depth.

West and east framing preserve those silhouettes without burying the ring stack or service heads behind the apron. Staged brutes overlap parts of the near rail and apron, but not the critical central machinery. No demonstrated floating, clipping or new model-readability defect appears in these originals. Dark shaft regions and opaque deck surfaces still hide some connections. This pass does not certify every concealed face or joint.

The source agrees with the visible construction: separate service assemblies, foundation legs, nested rings and shoes, bus saddles, guide rods and a clevis connection. Shell finishes remain flush on the deck and the structural frame stays below it. Source geometry supports these observations but does not substitute for visible attachment.

The restrained blue-gray steel, pale ceramic and bronze separate functional assemblies without filling the retreat deck with detail. The broad apron remains brighter than the narrow core, but frames the correct focal point. Quiet plates and grilles distinguish the lobes. Nothing in these images introduces an evacuation cue or a survivable pod. The fixed-camera crops of remote perimeter sections are ordinary framing limits, not a demonstrated construction failure.

## Remaining release limits

This supplement is static staged production-renderer evidence without the DOM HUD. It retains three fixture brutes and repositions only the player. Render settling advances animation, but simulation updates are zero. Legal occupancy is not recorded traversal, natural combat or campaign progression.

The following remain unverified by this review and are not waived:

- Sequence-dependent overload emission and lighting. The current core material is explicitly static.
- Dense enemy readability throughout the actual overload holdout, natural survival and live traversal/combat behavior across that sequence.
- Integrated HUD and phone/touch readability or operation.
- Real browser fatal authorization and the recorded post-authorization ending, including SHIP DESTROYED, ALL ABOARD LOST and NEW EARTH WARNED with no escape continuation.
- Complete browser-level no-skip-gameplay-change acceptance and full campaign progression. Prior passing CPU story and Skip tests are narrower evidence.

No GPU work or tests were run for this supplemental review because no discrepancy required them. No runtime files were edited. The preserved failed capture attempt and earlier failed review remain historical evidence. Human room acceptance, release authorization, stage routing and publication remain separate decisions. This report grants none of them.
