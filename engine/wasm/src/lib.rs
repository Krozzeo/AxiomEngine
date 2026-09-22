//! Scalar, versioned host boundary. No pointer or shared-memory API.
use axiom_core::{TraceId, demo::DemoKernel};
use axiom_renderer::{NullRenderer, RenderFrame, Renderer};
use std::cell::RefCell;
use std::collections::BTreeMap;

#[derive(Default)]
struct Registry {
    next: u32,
    worlds: BTreeMap<u32, DemoKernel>,
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
            id
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn axiom_destroy(id: u32) {
        REGISTRY.with_borrow_mut(|registry| {
            registry.worlds.remove(&id);
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
