//! Scalar, versioned host boundary. No pointer or shared-memory API.
use axiom_core::{
    PersistentId, Quat, TraceId, Transform, Vec3,
    authoring::{Matrix, RuntimeMesh, RuntimeScene, camera, model, multiply},
    demo::DemoKernel,
};
use axiom_renderer::{NullRenderer, RenderFrame, Renderer};
use std::cell::RefCell;
use std::collections::BTreeMap;

#[allow(unsafe_code)]
mod physics_abi;

#[derive(Default)]
struct Registry {
    next: u32,
    worlds: BTreeMap<u32, DemoKernel>,
    scenes: BTreeMap<u32, RuntimeScene>,
    cameras: BTreeMap<u32, Matrix>,
    two_d: BTreeMap<u32, axiom_core::two_d::Clock>,
    physics: BTreeMap<u32, axiom_core::physics::World>,
}

thread_local! {
    static REGISTRY: RefCell<Registry> = RefCell::new(Registry::default());
}

// Only the exported symbol attributes need this lint exception. There are no
// unsafe operations. Each instance owns a registry with explicit create/destroy.
#[allow(unsafe_code)]
mod exports {
    use super::*;

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_2d_tick(id: u32, delta: f64) -> f64 {
        REGISTRY.with_borrow_mut(|r| {
            r.two_d.get_mut(&id).map_or(f64::NAN, |c| {
                if c.tick(delta) {
                    c.elapsed
                } else {
                    f64::NAN
                }
            })
        })
    }
    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_2d_animation(time: f64, fps: f64, count: u32, looping: u32) -> u32 {
        axiom_core::two_d::animation_frame(time, fps, count, looping != 0)
    }
    #[unsafe(no_mangle)]
    #[allow(clippy::too_many_arguments)]
    pub extern "C" fn axiom_2d_particle(
        time: f64,
        slot: u32,
        capacity: u32,
        rate: f64,
        life: f64,
        seed: u32,
        speed: f64,
        spread: f64,
        gravity: f64,
        axis: u32,
    ) -> f64 {
        axiom_core::two_d::particle(time, slot, capacity, rate, life, seed, speed, spread, gravity)
            .and_then(|v| v.get(axis as usize).copied())
            .unwrap_or(f64::NAN)
    }
    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_abi_version() -> u32 {
        1
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_create() -> u32 {
        REGISTRY.with_borrow_mut(|registry| {
            let Some(id) = registry.next.checked_add(1) else {
                return 0;
            };
            registry.next = id;
            registry.worlds.insert(id, DemoKernel::default());
            registry.two_d.insert(id, axiom_core::two_d::Clock::default());
            id
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_destroy(id: u32) {
        REGISTRY.with_borrow_mut(|registry| {
            registry.worlds.remove(&id);
            registry.scenes.remove(&id);
            registry.cameras.remove(&id);
            registry.physics.remove(&id);
            registry.two_d.remove(&id);
        });
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_tick(id: u32, delta: f64, trace: u64) -> u32 {
        REGISTRY.with_borrow_mut(|registry| {
            let Some(world) = registry.worlds.get_mut(&id) else {
                return 1;
            };
            if world.tick(delta, TraceId(u128::from(trace))).is_ok() {
                0
            } else {
                2
            }
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_frame(id: u32) -> u64 {
        REGISTRY.with_borrow(|registry| {
            registry
                .worlds
                .get(&id)
                .and_then(|world| world.step)
                .map_or(0, |step| step.variable.frame)
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_fixed_steps(id: u32) -> u32 {
        REGISTRY.with_borrow(|registry| {
            registry
                .worlds
                .get(&id)
                .and_then(|world| world.step)
                .map_or(0, |step| step.fixed_steps)
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_trace(id: u32) -> u64 {
        REGISTRY.with_borrow(|registry| {
            registry
                .worlds
                .get(&id)
                .map_or(0, |world| world.trace_id.0 as u64)
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_vertex(id: u32, index: u32, axis: u32, aspect: f32) -> f32 {
        REGISTRY.with_borrow(|registry| {
            registry
                .worlds
                .get(&id)
                .and_then(|world| world.clip_vertices(aspect))
                .and_then(|vertices| {
                    vertices
                        .get(index as usize)
                        .and_then(|vertex| vertex.get(axis as usize))
                        .copied()
                })
                .unwrap_or(f32::NAN)
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_scene_clear(id: u32) -> u32 {
        REGISTRY.with_borrow_mut(|registry| {
            if !registry.worlds.contains_key(&id) {
                return 1;
            }
            registry.scenes.insert(id, RuntimeScene::default());
            0
        })
    }
    #[unsafe(no_mangle)]
    #[allow(clippy::too_many_arguments)]
    pub extern "C" fn axiom_scene_add(
        id: u32,
        hi: u64,
        lo: u64,
        count: u32,
        px: f32,
        py: f32,
        pz: f32,
        qx: f32,
        qy: f32,
        qz: f32,
        qw: f32,
        sx: f32,
        sy: f32,
        sz: f32,
    ) -> u32 {
        REGISTRY.with_borrow_mut(|registry| {
            let Some(scene) = registry.scenes.get_mut(&id) else {
                return u32::MAX;
            };
            let qlen = qx * qx + qy * qy + qz * qz + qw * qw;
            if scene.meshes.len() >= 1024
                || count == 0
                || count > 150000
                || ![px, py, pz, qx, qy, qz, qw, sx, sy, sz]
                    .iter()
                    .all(|v| v.is_finite())
                || !qlen.is_finite()
                || qlen < 1e-12
            {
                return u32::MAX;
            }
            let transform = Transform {
                position: Vec3 {
                    x: px,
                    y: py,
                    z: pz,
                },
                rotation: Quat {
                    x: qx,
                    y: qy,
                    z: qz,
                    w: qw,
                },
                scale: Vec3 {
                    x: sx,
                    y: sy,
                    z: sz,
                },
            };
            let handle = scene.meshes.len() as u32;
            scene.meshes.push(RuntimeMesh {
                entity: PersistentId((u128::from(hi) << 64) | u128::from(lo)),
                transform,
                vertices: count,
            });
            handle
        })
    }
    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_scene_position(id: u32, handle: u32, x: f32, y: f32, z: f32) -> u32 {
        if ![x, y, z]
            .iter()
            .all(|v| v.is_finite() && v.abs() <= 1_000_000.0)
        {
            return 2;
        }
        REGISTRY.with_borrow_mut(|registry| {
            let Some(mesh) = registry
                .scenes
                .get_mut(&id)
                .and_then(|scene| scene.meshes.get_mut(handle as usize))
            else {
                return 1;
            };
            mesh.transform.position = Vec3 { x, y, z };
            0
        })
    }
    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_scene_rotation(
        id: u32,
        handle: u32,
        x: f32,
        y: f32,
        z: f32,
        w: f32,
    ) -> u32 {
        let q = [x, y, z, w];
        let norm = q.iter().map(|v| v * v).sum::<f32>().sqrt();
        if !norm.is_finite() || norm < 1e-8 {
            return 2;
        }
        REGISTRY.with_borrow_mut(|r| {
            let Some(mesh) = r
                .scenes
                .get_mut(&id)
                .and_then(|s| s.meshes.get_mut(handle as usize))
            else {
                return 1;
            };
            mesh.transform.rotation = Quat {
                x: x / norm,
                y: y / norm,
                z: z / norm,
                w: w / norm,
            };
            0
        })
    }
    #[unsafe(no_mangle)]
    #[allow(clippy::too_many_arguments)]
    pub extern "C" fn axiom_scene_camera(
        id: u32,
        px: f32,
        py: f32,
        pz: f32,
        tx: f32,
        ty: f32,
        tz: f32,
        aspect: f32,
        ortho: u32,
        extent: f32,
    ) -> u32 {
        REGISTRY.with_borrow_mut(|registry| {
            let Some(matrix) = camera([px, py, pz], [tx, ty, tz], aspect, ortho != 0, extent)
            else {
                return 1;
            };
            if !registry.scenes.contains_key(&id) {
                return 1;
            }
            registry.cameras.insert(id, matrix);
            0
        })
    }
    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_scene_matrix(id: u32, mesh: u32, index: u32, projection: u32) -> f32 {
        REGISTRY.with_borrow(|registry| {
            let Some(mesh) = registry
                .scenes
                .get(&id)
                .and_then(|s| s.meshes.get(mesh as usize))
            else {
                return f32::NAN;
            };
            let mut matrix = model(mesh.transform);
            if projection != 0 {
                let Some(camera) = registry.cameras.get(&id) else {
                    return f32::NAN;
                };
                matrix = multiply(*camera, matrix);
            }
            matrix.get(index as usize).copied().unwrap_or(f32::NAN)
        })
    }
    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_scene_null(id: u32) -> u32 {
        REGISTRY.with_borrow(|registry| {
            let Some(scene) = registry.scenes.get(&id) else {
                return 0;
            };
            NullRenderer
                .render(&RenderFrame {
                    sequence: registry
                        .worlds
                        .get(&id)
                        .and_then(|w| w.step)
                        .map_or(0, |s| s.variable.frame),
                    visible_items: scene.meshes.len() as u32,
                })
                .processed_items
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_null_render(id: u32, aspect: f32) -> u32 {
        REGISTRY.with_borrow(|registry| {
            let Some(world) = registry.worlds.get(&id) else {
                return 0;
            };
            let Some(vertices) = world.clip_vertices(aspect) else {
                return 0;
            };
            let frame = RenderFrame {
                sequence: world.step.map_or(0, |step| step.variable.frame),
                visible_items: (vertices.len() / 3) as u32,
            };
            NullRenderer.render(&frame).processed_items
        })
    }
}
