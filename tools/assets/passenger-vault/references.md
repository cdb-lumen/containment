# Construction references and provenance

## Timing and authority

The initial procedural candidate did not deliver a consulted-reference record. We cannot claim its original author consulted the external references below before modeling. They were retrieved during this bounded construction correction, after independent-review.md identified an unsupported bed and buried fittings. They are comparison references and decision checks, not retroactive proof of reference-led original design.

The dimensions, opaque lid, supported cradle, gasket, rear services and working-face/upward status cues come from the approved [equipment plan](../../../docs/design/passenger-vault-equipment-plan.md) and [layout](../../../docs/design/passenger-vault-layout.md). Those project constraints take precedence over real product dimensions. No real product is reproduced or medically simulated.

## External sources consulted during correction

- [Tekna monoplace hyperbaric chamber components](https://hyperbaric-chamber.com/monoplace-hyperbaric-chamber/). Retrieved product text separates pressure vessel, operating console, patient bed and supplies, and describes an integrated stretcher. Used to check that the modeled internal bed needs an actual structural seat, not an unexplained air gap. We retained the project-defined opaque shell and fixed bed; no stretcher mechanism or clinical claim was added.
- [Parker O-Ring Handbook ORD 5700](https://www.parker.com/content/dam/Parker-com/Literature/O-Ring-Division-Literature/ORD-5700.pdf). Retrieved introductory material establishes that sealing design requires application-specific engineering and testing. Used to keep the annular gasket and clamp geometry explicitly illustrative; these meshes are not a validated pressure seal. No sizing tables or seal specifications were adopted.
- [BeaconMedaes Magnis MSV catalog excerpt, MedicalExpo](https://pdf.medicalexpo.com/pdf/beaconmedaes/magnis-msv/75674-224949.html). Search-returned catalog text describes fully enclosed pump modules and steel canopies with removable panels. Used as a comparison for retaining enclosed rear service construction rather than inventing exposed machinery. No carrier change or pump design is claimed from this source.
- [Rittal wall-mounted enclosures](https://www.rittal.com/com-en/products/PG20231215SCH101/PG20231512SCH301). Retrieved product description covers enclosed controller installations and cable entry. Used to distinguish backed service faces from holes into an enclosure. The carrier was left unchanged in this correction.
- [Blender 4.0 Boolean modifier manual](https://docs.blender.org/manual/en/4.0/modeling/modifiers/generate/booleans.html). Retrieved documentation describes difference operations and manifold-input requirements. Used for the actual shallow front-wall cut, followed by topology and exported-geometry validation.

## Rights and source history

build.py constructs every exported mesh from generated vertices or Blender primitives. geometry_checks.py performs measurements. The builder imports only GLBs it has just written, never an existing equipment asset. No PR58 binary, downloaded mesh, photograph, logo or texture is read by the builder. The blend and GLBs are procedural outputs, not manual binary edits.

Authorship is AI-assisted original project work by Hermes Agent under Viktor's direction. This describes the inspected build path, not an exhaustive historical similarity audit. External manufacturers retain rights to their reference material. Links are citations, not licenses to redistribute imagery. No external imagery is packaged. Do not invent a CC0 or other third-party asset license for these outputs; project licensing governs their use.
