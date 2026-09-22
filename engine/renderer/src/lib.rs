//! Thin renderer boundary. WebGPU details do not leak into engine state.

use axiom_core::Scene;

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

impl RenderFrame {
    pub fn from_scene(sequence: u64, scene: &Scene) -> Result<Self, RenderError> {
        Ok(Self {
            sequence,
            visible_items: u32::try_from(scene.entities().len())
                .map_err(|_| RenderError::SceneTooLarge)?,
        })
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RenderReport {
    pub frame_sequence: u64,
    pub processed_items: u32,
    pub submitted_items: u32,
    pub cpu_time_ns: Option<u64>,
    pub gpu_time_ns: Option<u64>,
    pub reason_code: &'static str,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RenderPassKind {
    Clear,
    Opaque,
    Present,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RenderPassNode {
    pub name: String,
    pub kind: RenderPassKind,
    pub dependencies: Vec<usize>,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RenderGraph {
    passes: Vec<RenderPassNode>,
}

impl RenderGraph {
    pub fn add_pass(
        &mut self,
        name: impl Into<String>,
        kind: RenderPassKind,
        dependencies: Vec<usize>,
    ) -> usize {
        let index = self.passes.len();
        self.passes.push(RenderPassNode {
            name: name.into(),
            kind,
            dependencies,
        });
        index
    }

    pub fn execution_order(&self) -> Result<Vec<usize>, RenderError> {
        if self
            .passes
            .iter()
            .flat_map(|pass| &pass.dependencies)
            .any(|dependency| *dependency >= self.passes.len())
        {
            return Err(RenderError::MissingDependency);
        }

        let mut order = Vec::with_capacity(self.passes.len());
        let mut emitted = vec![false; self.passes.len()];
        while order.len() < self.passes.len() {
            let next = self.passes.iter().enumerate().position(|(index, pass)| {
                !emitted[index]
                    && pass
                        .dependencies
                        .iter()
                        .all(|dependency| emitted[*dependency])
            });
            let Some(index) = next else {
                return Err(RenderError::DependencyCycle);
            };
            emitted[index] = true;
            order.push(index);
        }
        Ok(order)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RenderError {
    SceneTooLarge,
    MissingDependency,
    DependencyCycle,
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
            processed_items: frame.visible_items,
            submitted_items: 0,
            cpu_time_ns: None,
            gpu_time_ns: None,
            reason_code: "AX_RENDERER_0101",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axiom_core::{Camera, Entity, PersistentId, Transform};

    #[test]
    fn null_renderer_processes_the_same_scene_without_gpu_submission() {
        let mut scene = Scene::default();
        scene
            .add(Entity {
                id: PersistentId(1),
                transform: Transform::identity(),
                camera: Some(Camera::default()),
            })
            .unwrap();
        let frame = RenderFrame::from_scene(7, &scene).unwrap();
        let mut renderer = NullRenderer;
        let report = renderer.render(&frame);
        assert_eq!(report.frame_sequence, 7);
        assert_eq!(report.processed_items, 1);
        assert_eq!(report.submitted_items, 0);
        assert_eq!(report.gpu_time_ns, None);
    }

    #[test]
    fn render_graph_orders_dependencies() {
        let mut graph = RenderGraph::default();
        let clear = graph.add_pass("clear", RenderPassKind::Clear, vec![]);
        let opaque = graph.add_pass("opaque", RenderPassKind::Opaque, vec![clear]);
        let present = graph.add_pass("present", RenderPassKind::Present, vec![opaque]);
        assert_eq!(graph.execution_order(), Ok(vec![clear, opaque, present]));
    }

    #[test]
    fn render_graph_rejects_cycles() {
        let mut graph = RenderGraph::default();
        graph.add_pass("a", RenderPassKind::Opaque, vec![1]);
        graph.add_pass("b", RenderPassKind::Present, vec![0]);
        assert_eq!(graph.execution_order(), Err(RenderError::DependencyCycle));
    }

    #[test]
    fn render_graph_rejects_missing_dependencies() {
        let mut graph = RenderGraph::default();
        graph.add_pass("opaque", RenderPassKind::Opaque, vec![9]);
        assert_eq!(graph.execution_order(), Err(RenderError::MissingDependency));
    }
}
