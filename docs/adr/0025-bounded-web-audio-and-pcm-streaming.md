# ADR-0025 — Bounded Web Audio and canonical PCM streaming

Status: Accepted, verified in M12. Date: 2026-10-05.

## Context

Audio needs shared authoring/control contracts and bounded resources while the
browser owns platform audio and Rust/Wasm owns world/physics/animation transforms.

## Decision

AudioSource/AudioListener and mixer settings are optional schema-backed data.
Inspector and isolated agent proposals share revisions, Undo and persistence;
live C#/human/agent controls are transient and require matching runtime leases.
Use immutable PCM WAV assets, revision-checked canonical ranges of at most 4096
frames, short AudioBuffers within 16 MiB total and fixed 16384-frame streaming
queues in an AudioWorklet. Retained events contain range metadata, not samples;
successful proposal reads never rewrite the authoring journal.
Web Audio provides equal-power pan, inverse attenuation, bus gain/lowpass and a
master compressor. Admit at most 32 sources, eight buses and one enabled listener,
falling back to the authored Game camera. World transforms drive audio positions.
Scene navigation never changes the listener. Stopped previews are silent;
Scene/simulation pause preserve transport, bus mute preserves clocks, and Stop
clears nodes/queues and restores authored state. Browser activation, source errors,
buffering and Null are explicit. Null never fetches PCM or fabricates playback.

## Alternatives

A native audio backend adds a deployment boundary absent from this browser
engine. Whole-file decoding of long clips violates the chosen memory budgets.
Unbounded effect/routing graphs and compressed network streams lack validated
contracts here and remain future extensions.

## Consequences

The daemon reads/hashes its bounded 8 MiB immutable source for each range; this
integrity-first I/O cost is outside the DSP benchmark. RMS proves graph signal,
not physical speaker connectivity. No compressed codecs, arbitrary effects,
reverb/occlusion, editor audition, streaming seek or sample-accurate cross-voice
sync is claimed. See M12_AUDIO.md and M12_CURRENT_REPORT.md for limits/evidence.
