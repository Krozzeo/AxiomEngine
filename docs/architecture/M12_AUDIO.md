# M12 — Bounded audio contracts

Status: implementation in progress; browser/CI acceptance pending. Version 0.0.24.

Sources reuse immutable PCM WAV imports: mono/stereo, 8/16/24/32-bit integer,
8–192 kHz, existing 8 MiB source limit, at most 600 seconds. The daemon converts
bounded ranges to canonical interleaved float PCM, never exposing a filesystem
path. asset.audio.read checks project, workspace, revision, immutable source hash,
frame offset and maximum 4096 frames. Requests remain valid during Play only at
its current revision. The derived importer advances to version 5.

AudioSource and AudioListener are optional components. At most 32 sources and
one enabled entity listener; otherwise the authored Game camera is the listener.
World transform position/orientation follow the same engine transforms as visuals.
2D sources are nonspatial; spatial sources must be mono and use Web Audio inverse
attenuation and equal-power pan, min/max distance and rolloff. Scene camera never
changes the listener. Source volume 0–1, rate .25–4, loop/autoplay and bus are stored.

scene.audio defines master volume and up to eight unique buses with volume,
mute and lowpass cutoff 20–20000 Hz. A master compressor limits output. Optional
settings default to Master/Music/Effects; no routing graph or arbitrary plug-ins.
Short sources use AudioBuffer only below 30 seconds / 4 MiB decoded per resource;
unique buffers together are limited to 16 MiB. Longer clips require streaming.
AudioWorklet consumes canonical PCM through a fixed 16384-frame queue (128 KiB
for stereo), requests 4096-frame chunks with backpressure, and exposes queued frames
and underruns. Linear resampling supports playback rate; this is bounded local-file
streaming, not compressed network-radio streaming or sample-perfect cross-voice sync.
Up to 4 MiB of queue storage across 32 stereo streams, plus bounded in-flight
JSON PCM replies and the existing 8 MiB daemon source read/hash per request.

The browser adapter owns transport against AudioContext time and observed worklet
cursor; Rust remains owner of world/physics/animation transforms. No gameplay is
moved into the renderer or worklet. Stopped previews are silent and do not advance.
Game Play starts autoplay sources; Scene silences and pauses transport, independent
from Scene navigation. Simulation UI pause also pauses sound. Stop destroys live
nodes/queues and restores authored parameters. Muting a bus suppresses output
without stopping its transport. Browser activation requires a human gesture;
blocked contexts return an explicit reason. Null has semantic state but no sound,
PCM fetching or invented playhead advancement. Device/context failures are explicit.

Authoring scene.audioSource.set, scene.audioListener.set and scene.audio.update
shares schema validation, revision, atomic Undo/Save and private M6 proposals.
Human and AI runtime controls offer play/pause/resume/stop/source volume, master
volume and bus volume/mute; these never author the project. audio.query exposes
observed source state, listener, buses, RMS and reasons paired with frame/generation,
or unavailable for stale/disconnected editors. Buffering, muted bus, zero volume,
Scene, stopped Play, paused source, completion and activation are distinct reasons.
RMS proves generated graph signal, not that a physical speaker is connected.
C# Entity adds PlayAudio, PauseAudio, ResumeAudio, StopAudio and SetAudioVolume;
complete packets validate before applying any audio or transform intent.

Not included: MP3/Ogg import, arbitrary effects, convolution, occlusion/reverb,
Doppler, physical-output capture, independent editor audition, streaming seek,
exact cross-device latency or sample-accurate cross-voice synchronization.
These are future extensions; basic bus lowpass and master dynamics are implemented.
Reference: https://www.w3.org/TR/webaudio-1.1/
