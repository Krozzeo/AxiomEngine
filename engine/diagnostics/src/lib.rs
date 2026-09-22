//! Bounded diagnostics primitives. Instrumentation is never allowed to grow without limit.

use axiom_core::TraceId;
use std::collections::VecDeque;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DiagnosticLevel {
    Normal,
    Diagnostic,
    DeepTrace,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReasonCode(pub &'static str);

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TraceRecord {
    pub trace_id: TraceId,
    pub reason: ReasonCode,
    pub evidence: Vec<(&'static str, i64)>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct FrameProfile {
    pub frame_sequence: u64,
    pub trace_id: TraceId,
    pub cpu_time_ns: u64,
    pub gpu_time_ns: Option<u64>,
    pub fixed_steps: u32,
}

pub struct FrameProfiler {
    capacity: usize,
    dropped: u64,
    frames: VecDeque<FrameProfile>,
}

impl FrameProfiler {
    #[must_use]
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            dropped: 0,
            frames: VecDeque::with_capacity(capacity),
        }
    }

    pub fn record(&mut self, profile: FrameProfile) {
        if self.capacity == 0 {
            self.dropped += 1;
            return;
        }
        if self.frames.len() == self.capacity {
            self.frames.pop_front();
            self.dropped += 1;
        }
        self.frames.push_back(profile);
    }

    #[must_use]
    pub fn latest(&self) -> Option<&FrameProfile> {
        self.frames.back()
    }

    #[must_use]
    pub fn dropped(&self) -> u64 {
        self.dropped
    }
}

pub struct TraceBuffer {
    capacity: usize,
    dropped: u64,
    records: VecDeque<TraceRecord>,
}

impl TraceBuffer {
    #[must_use]
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            dropped: 0,
            records: VecDeque::with_capacity(capacity),
        }
    }

    pub fn push(&mut self, record: TraceRecord) {
        if self.capacity == 0 {
            self.dropped += 1;
            return;
        }
        if self.records.len() == self.capacity {
            self.records.pop_front();
            self.dropped += 1;
        }
        self.records.push_back(record);
    }

    #[must_use]
    pub fn dropped(&self) -> u64 {
        self.dropped
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn latest(&self) -> Option<&TraceRecord> {
        self.records.back()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn buffer_is_bounded_and_reports_backpressure() {
        let mut buffer = TraceBuffer::new(1);
        for value in 1..=2 {
            buffer.push(TraceRecord {
                trace_id: TraceId(value),
                reason: ReasonCode("AX_TEST_0001"),
                evidence: vec![],
            });
        }
        assert_eq!(buffer.len(), 1);
        assert_eq!(buffer.dropped(), 1);
    }

    #[test]
    fn frame_profiler_retains_bounded_cpu_and_gpu_timings() {
        let mut profiler = FrameProfiler::new(1);
        for frame_sequence in 1..=2 {
            profiler.record(FrameProfile {
                frame_sequence,
                trace_id: TraceId(u128::from(frame_sequence)),
                cpu_time_ns: frame_sequence * 100,
                gpu_time_ns: Some(frame_sequence * 80),
                fixed_steps: 1,
            });
        }
        assert_eq!(profiler.latest().map(|frame| frame.frame_sequence), Some(2));
        assert_eq!(profiler.dropped(), 1);
    }
}
