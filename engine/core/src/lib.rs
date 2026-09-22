//! DOM-free engine primitives shared by native and WebAssembly runtimes.

use core::fmt;

/// Stable, serialized identity. This is deliberately separate from a runtime handle.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct PersistentId(pub u128);

/// Cache-friendly runtime identity with stale-reference detection.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct GenerationalHandle {
    pub index: u32,
    pub generation: u32,
}

/// Causal identity propagated across browser, Wasm, workers and daemon jobs.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct TraceId(pub u128);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ClockKind {
    Real,
    Game,
    Fixed,
    Editor,
    Replay,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ClockSnapshot {
    pub kind: ClockKind,
    pub elapsed_seconds: f64,
    pub delta_seconds: f64,
    pub frame: u64,
    pub paused: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CoreError {
    InvalidDelta,
    GenerationExhausted,
}

impl fmt::Display for CoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let code = match self {
            Self::InvalidDelta => "AX_TIME_0001",
            Self::GenerationExhausted => "AX_ID_0001",
        };
        formatter.write_str(code)
    }
}

pub fn advance_clock(
    snapshot: ClockSnapshot,
    delta_seconds: f64,
) -> Result<ClockSnapshot, CoreError> {
    if !delta_seconds.is_finite() || delta_seconds < 0.0 {
        return Err(CoreError::InvalidDelta);
    }
    if snapshot.paused {
        return Ok(snapshot);
    }
    Ok(ClockSnapshot {
        elapsed_seconds: snapshot.elapsed_seconds + delta_seconds,
        delta_seconds,
        frame: snapshot.frame + 1,
        ..snapshot
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn paused_clock_does_not_advance() {
        let clock = ClockSnapshot {
            kind: ClockKind::Game,
            elapsed_seconds: 2.0,
            delta_seconds: 0.1,
            frame: 12,
            paused: true,
        };
        assert_eq!(advance_clock(clock, 1.0), Ok(clock));
    }

    #[test]
    fn invalid_delta_has_stable_error_code() {
        let clock = ClockSnapshot {
            kind: ClockKind::Fixed,
            elapsed_seconds: 0.0,
            delta_seconds: 0.0,
            frame: 0,
            paused: false,
        };
        assert_eq!(
            advance_clock(clock, -1.0).unwrap_err().to_string(),
            "AX_TIME_0001"
        );
    }
}
