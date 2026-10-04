use super::REGISTRY;
use axiom_core::physics::{Body, World};
#[unsafe(no_mangle)]
pub extern "C" fn axiom_physics_clear(id: u32) -> u32 {
    REGISTRY.with_borrow_mut(|r| {
        if !r.worlds.contains_key(&id) {
            return 1;
        }
        r.physics.insert(id, World::default());
        0
    })
}
#[unsafe(no_mangle)]
#[allow(clippy::too_many_arguments)]
pub extern "C" fn axiom_physics_add(
    id: u32,
    dimension: u32,
    shape: u32,
    px: f64,
    py: f64,
    pz: f64,
    vx: f64,
    vy: f64,
    vz: f64,
    hx: f64,
    hy: f64,
    hz: f64,
    inverse_mass: f64,
    restitution: f64,
    friction: f64,
    gravity_scale: f64,
    trigger: u32,
    layer: u32,
    mask: u32,
) -> u32 {
    REGISTRY.with_borrow_mut(|r| {
        r.physics
            .get_mut(&id)
            .and_then(|w| {
                w.add(Body {
                    position: [px, py, pz],
                    velocity: [vx, vy, vz],
                    rotation: [0.0, 0.0, 0.0, 1.0],
                    angular_velocity: [0.0; 3],
                    freeze_rotation: false,
                    half: [hx, hy, hz],
                    inverse_mass,
                    restitution,
                    friction,
                    gravity_scale,
                    dimension,
                    sphere: shape == 1,
                    trigger: trigger == 1,
                    layer,
                    mask,
                })
                .ok()
            })
            .map_or(u32::MAX, |v| v as u32)
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_physics_step(id: u32, count: u32) -> u32 {
    REGISTRY.with_borrow_mut(|r| {
        let Some(w) = r.physics.get_mut(&id) else {
            return 1;
        };
        if count > 8 {
            return 2;
        }
        for _ in 0..count {
            w.step();
        }
        0
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_physics_read(id: u32, index: u32, field: u32) -> f64 {
    REGISTRY.with_borrow(|r| {
        r.physics
            .get(&id)
            .and_then(|w| w.bodies.get(index as usize))
            .map_or(f64::NAN, |b| match field {
                0..=2 => b.position[field as usize],
                3..=5 => b.velocity[field as usize - 3],
                6..=9 => b.rotation[field as usize - 6],
                10..=12 => b.angular_velocity[field as usize - 10],
                _ => f64::NAN,
            })
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_physics_write(id: u32, index: u32, field: u32, value: f64) -> u32 {
    if !value.is_finite() || value.abs() > if field < 3 { 1e6 } else { 1e4 } {
        return 2;
    }
    REGISTRY.with_borrow_mut(|r| {
        let Some(b) = r
            .physics
            .get_mut(&id)
            .and_then(|w| w.bodies.get_mut(index as usize))
        else {
            return 1;
        };
        match field {
            0..=2 => b.position[field as usize] = value,
            3..=5 => b.velocity[field as usize - 3] = value,
            10..=12 => b.angular_velocity[field as usize - 10] = value,
            13 => b.freeze_rotation = value != 0.0,
            _ => return 2,
        };
        0
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_physics_info(id: u32, field: u32) -> u32 {
    REGISTRY.with_borrow(|r| {
        r.physics.get(&id).map_or(0, |w| match field {
            0 => w.bodies.len() as u32,
            1 => w.contacts.len() as u32,
            2 => w.candidates as u32,
            _ => w.steps as u32,
        })
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_physics_contact(id: u32, index: u32, field: u32) -> f64 {
    REGISTRY.with_borrow(|r| {
        r.physics
            .get(&id)
            .and_then(|w| w.contacts.get(index as usize))
            .map_or(f64::NAN, |c| match field {
                0 => c.a as f64,
                1 => c.b as f64,
                2 => {
                    if c.trigger {
                        1.0
                    } else {
                        0.0
                    }
                }
                3 => c.depth,
                4..=6 => c.normal[field as usize - 4],
                7..=9 => c.point[field as usize - 7],
                _ => f64::NAN,
            })
    })
}
#[unsafe(no_mangle)]
#[allow(clippy::too_many_arguments)]
pub extern "C" fn axiom_physics_ray(
    id: u32,
    ox: f64,
    oy: f64,
    oz: f64,
    dx: f64,
    dy: f64,
    dz: f64,
    max: f64,
    dimension: u32,
    mask: u32,
    field: u32,
) -> f64 {
    REGISTRY.with_borrow(|r| {
        r.physics
            .get(&id)
            .and_then(|w| w.raycast([ox, oy, oz], [dx, dy, dz], max, dimension, mask))
            .map_or(-1.0, |(i, t)| if field == 0 { i as f64 } else { t })
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn axiom_physics_rotation(
    id: u32,
    index: u32,
    x: f64,
    y: f64,
    z: f64,
    w: f64,
) -> u32 {
    let q = [x, y, z, w];
    let norm = q.iter().map(|v| v * v).sum::<f64>().sqrt();
    if !norm.is_finite() || norm < 1e-8 {
        return 2;
    }
    REGISTRY.with_borrow_mut(|r| {
        let Some(b) = r
            .physics
            .get_mut(&id)
            .and_then(|w| w.bodies.get_mut(index as usize))
        else {
            return 1;
        };
        b.rotation = if b.dimension == 2 {
            let angle = 2.0 * z.atan2(w);
            [0.0, 0.0, (angle * 0.5).sin(), (angle * 0.5).cos()]
        } else {
            q.map(|v| v / norm)
        };
        0
    })
}
