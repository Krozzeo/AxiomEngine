//! Small shared scene used to verify the browser/Wasm/rendering boundary.
use crate::{Camera, CoreError, EngineLoop, JobKind, JobQueue, LoopStep, TraceId, Transform, Vec3};

pub struct DemoKernel {
    pub transform: Transform,
    pub camera: Camera,
    clock: EngineLoop,
    vertices: [Vec3; 3],
    jobs: JobQueue,
    pub step: Option<LoopStep>,
    pub trace_id: TraceId,
}

impl Default for DemoKernel {
    fn default() -> Self {
        Self {
            transform: Transform::identity(),
            camera: Camera::default(),
            clock: EngineLoop::new(1.0 / 60.0, 8).expect("valid fixed step"),
            vertices: [
                Vec3 {
                    x: 0.0,
                    y: 0.8,
                    z: -2.0,
                },
                Vec3 {
                    x: -0.8,
                    y: -0.6,
                    z: -2.0,
                },
                Vec3 {
                    x: 0.8,
                    y: -0.6,
                    z: -2.0,
                },
            ],
            jobs: JobQueue::default(),
            step: None,
            trace_id: TraceId(0),
        }
    }
}

impl DemoKernel {
    pub fn tick(&mut self, delta: f64, trace_id: TraceId) -> Result<(), CoreError> {
        let step = self.clock.tick(delta)?;
        self.trace_id = trace_id;
        self.jobs.schedule(trace_id, JobKind::RenderPreparation)?;
        while self.jobs.pop().is_some() {}
        self.step = Some(step);
        Ok(())
    }

    /// Perspective clip coordinates. The camera is at the origin looking down -Z.
    pub fn clip_vertices(&self, aspect: f32) -> Option<[[f32; 4]; 3]> {
        if !aspect.is_finite() || aspect <= 0.0 {
            return None;
        }
        let scale = 1.0 / (self.camera.vertical_fov_radians * 0.5).tan();
        let near = self.camera.near_plane;
        let far = self.camera.far_plane;
        Some(self.vertices.map(|vertex| {
            let x = vertex.x * self.transform.scale.x + self.transform.position.x;
            let y = vertex.y * self.transform.scale.y + self.transform.position.y;
            let z = vertex.z * self.transform.scale.z + self.transform.position.z;
            [
                x * scale / aspect,
                y * scale,
                far * (z + near) / (near - far),
                -z,
            ]
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shared_mesh_projects_inside_clip_volume() {
        let demo = DemoKernel::default();
        for [x, y, z, w] in demo.clip_vertices(16.0 / 9.0).unwrap() {
            assert!(x.abs() < w && y.abs() < w && z >= 0.0 && z <= w);
        }
        assert!(demo.clip_vertices(0.0).is_none());
    }

    #[test]
    fn frame_retains_trace_and_fixed_clock() {
        let mut demo = DemoKernel::default();
        demo.tick(1.0 / 30.0, TraceId(42)).unwrap();
        assert_eq!(demo.trace_id, TraceId(42));
        assert_eq!(demo.step.unwrap().fixed_steps, 2);
    }
}
