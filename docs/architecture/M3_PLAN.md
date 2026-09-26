# M3 — Asset Pipeline

Status: implemented candidate; CI/browser acceptance pending. Source: master specification section 122.
M2 is complete; this is the next milestone.

## Goal

Changing a source texture rebuilds only dependent resources and refreshes the
active scene without restarting the editor. Preserve M2 project documents and
content-hashed sources; do not create a second incompatible asset store.

## Ordered work

1. Define a versioned Asset DB with stable logical IDs, source hashes, importer
   versions, dependency edges and derived-cache keys. Separate logical identity
   from content identity so editing source bytes preserves scene references.
2. Introduce an importer interface around the existing PNG/static GLB importers;
   specify deterministic outputs, bounded jobs, cancellation and error records.
3. Build incremental dependency invalidation and a derived cache. Verify that
   unchanged inputs reuse outputs and unrelated assets never rebuild.
4. Add background import/rebuild jobs and authenticated source-update commands,
   then hot reload renderer resources through revisioned events. Failed imports
   retain the last good scene and report a causal diagnostic.
5. Add the required audio source importer and document supported image/glTF/audio
   formats. Unsupported data must fail explicitly without external URL fetches.
6. Implement `whyAssetNotLoaded`, `whyWasRebuilt` and `whatUses` queries using
   stored dependency/job evidence rather than inferred explanations.
7. Automate a browser test with dependent and independent assets: update one
   texture, assert only its dependency closure rebuilds, observe changed pixels
   without restart and verify project reopen. Update the milestone report,
   handoff and project state with measured results.

## Read before implementation

AXIOM_MASTER_SPEC.md sections on assets and section 122; M2_BETA.md;
PROJECT_PERSISTENCE.md; SECURITY.md; PROTOCOL_V1.md; ADR-0010;
engine/assets/import.mjs; daemon/bootstrap/asset-store.mjs;
protocol/schema/project-document.schema.json; tests/asset-runtime.test.mjs.

## Completion reporting

Record executable criteria before implementing, then report accepted criteria
and the roadmap-weighted percentage per MILESTONE_REPORTING.md. M3 weighs 6%.
Do not claim that M2's immutable asset storage already completes this milestone.
