//! Thin renderer boundary. WebGPU details do not leak into engine state.

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RendererKind {
    WebGpu,
    Null,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RendererCapabilities {
    pub kind: RendererKind,
    pub timestamp_queries: bool,
    pub reason_code: &'static str,
}

pub trait Renderer {
    fn capabilities(&self) -> RendererCapabilities;
    fn render(&mut self, frame: &RenderFrame) -> RenderReport;
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct RenderFrame {
    pub sequence: u64,
    pub visible_items: u32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RenderReport {
    pub frame_sequence: u64,
    pub submitted_items: u32,
    pub reason_code: &'static str,
}

#[derive(Default)]
pub struct NullRenderer;

impl Renderer for NullRenderer {
    fn capabilities(&self) -> RendererCapabilities {
        RendererCapabilities {
            kind: RendererKind::Null,
            timestamp_queries: false,
            reason_code: "AX_RENDERER_0100",
        }
    }

    fn render(&mut self, frame: &RenderFrame) -> RenderReport {
        RenderReport {
            frame_sequence: frame.sequence,
            submitted_items: 0,
            reason_code: "AX_RENDERER_0101",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn null_renderer_runs_without_gpu() {
        let mut renderer = NullRenderer;
        let report = renderer.render(&RenderFrame {
            sequence: 7,
            visible_items: 42,
        });
        assert_eq!(report.frame_sequence, 7);
        assert_eq!(report.submitted_items, 0);
    }
}
