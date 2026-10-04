# ADR-0023 — Bounded 2D production

Status: accepted; full CI and software WebGPU/Null evidence verified.

M10 opts in through scene.twoD. It preserves legacy and HDR scenes unchanged.
A 2D scene uses sprite Renderables, atlas Sprite2D, SpriteAnimation, Tilemap,
Light2D, Particles2D and screen-space UI2D components; mesh/HDR mixing is rejected
explicitly. Settings select an orthographic Game camera. Scene navigation stays
transient and independent. Imported PNG resources retain normal immutable identity,
proposal isolation, revision validation, Undo and persistence.

Rust owns the playing 2D elapsed clock, frame selection and seeded analytic
particles through scalar Wasm exports. No DOM, renderer-owned gameplay or external
engine is introduced. Particle emission is bounded and reproducible for equal
elapsed time/seed; particles have velocity and gravity, but no collision response.
Sprites follow the existing Rust world transforms/2D angular physics. Tile cells
are visuals; collider entities are authored independently, never inferred silently.

The DOM-free 2D planner orders world quads by order/authored sequence, then UI.
Only consecutive compatible texture batches merge, preserving alpha ordering.
WebGPU uses premultiplied linear blending into an sRGB canvas view with depth
writes disabled; display encoding preserves sampled unlit PNG colors. Nearest sampling
and an integer-scaled, letterboxed reference canvas implement Game pixel-perfect
projection; its camera translation snaps to pixel units. Scene does not snap.
At most 8192 quads, 1024 batches, 4096 tile cells total, 2048 particle slots,
32 emitters, 16 lights and 128 UI controls are admitted; resource buffers have
fixed capacity and are destroyed with the renderer. Light2D applies bounded radial
additive color over ambient, without shadows or normal maps. UI uses normalized
screen rectangles and explicit input hit regions; a togglePause button consumes
Game input and pauses the transient simulation. No text/layout/widget toolkit is
claimed. UI previews while stopped but only activates during Game Play.

All six component setters and scene.twoD.update share the public Command Bus
and canonical schemas. Human forms, tile-cell painting, AI tools and demos use
these paths. Numeric limits and invalid references fail before publication.
