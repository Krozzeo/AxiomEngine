//! Scalar upload boundary. Browser resources are validated before compilation.
use super::REGISTRY;
use axiom_core::animation::{Animator, Clip, Key, Node, State, Track, Transition};

fn with<T>(world: u32, slot: u32, f: impl FnOnce(&mut Animator) -> T) -> Option<T> {
    REGISTRY.with_borrow_mut(|r| r.animations.get_mut(&world)?.get_mut(&slot).map(f))
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_anim_create(world: u32, slot: u32) -> u32 {
    REGISTRY.with_borrow_mut(|r| {
        if !r.worlds.contains_key(&world) || slot >= 16 {
            return 1;
        }
        r.animations
            .entry(world)
            .or_default()
            .insert(slot, Animator::new(Vec::new(), Vec::new()));
        0
    })
}
#[unsafe(no_mangle)]
#[allow(clippy::too_many_arguments)]
pub extern "C" fn axiom_anim_node(
    world: u32,
    slot: u32,
    parent: i32,
    x: f32,
    y: f32,
    z: f32,
    qx: f32,
    qy: f32,
    qz: f32,
    qw: f32,
    sx: f32,
    sy: f32,
    sz: f32,
) -> u32 {
    if ![x, y, z, qx, qy, qz, qw, sx, sy, sz]
        .iter()
        .all(|v| v.is_finite())
        || !(-1..128).contains(&parent)
        || sx <= 0.0
        || sy <= 0.0
        || sz <= 0.0
    {
        return 1;
    }
    with(world, slot, |a| {
        if a.nodes.len() >= 128 {
            return 1;
        }
        a.nodes.push(Node {
            parent: (parent >= 0).then_some(parent as usize),
            position: [x, y, z],
            rotation: [qx, qy, qz, qw],
            scale: [sx, sy, sz],
            matrix: None,
        });
        a.matrices.push([0.0; 16]);
        0
    })
    .unwrap_or(1)
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_anim_bind(world: u32, slot: u32, node: u32, index: u32, value: f32) -> u32 {
    if index >= 16 || !value.is_finite() {
        return 1;
    }
    with(world, slot, |a| {
        let Some(n) = a.nodes.get_mut(node as usize) else {
            return 1;
        };
        n.matrix.get_or_insert([0.0; 16])[index as usize] = value;
        0
    })
    .unwrap_or(1)
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_anim_track(
    world: u32,
    slot: u32,
    clip: u32,
    node: u32,
    path: u32,
    step: u32,
) -> u32 {
    with(world, slot, |a| {
        if clip >= 16
            || node as usize >= a.nodes.len()
            || path > 2
            || a.clips.iter().map(|c| c.tracks.len()).sum::<usize>() >= 256
        {
            return u32::MAX;
        }
        while a.clips.len() <= clip as usize {
            a.clips.push(Clip::default());
        }
        let c = &mut a.clips[clip as usize];
        let index = c.tracks.len();
        c.tracks.push(Track {
            node: node as usize,
            path,
            step: step != 0,
            keys: Vec::new(),
        });
        index as u32
    })
    .unwrap_or(u32::MAX)
}
#[unsafe(no_mangle)]
#[allow(clippy::too_many_arguments)]
pub extern "C" fn axiom_anim_key(
    world: u32,
    slot: u32,
    clip: u32,
    track: u32,
    time: f64,
    x: f32,
    y: f32,
    z: f32,
    w: f32,
) -> u32 {
    if !time.is_finite()
        || !(0.0..=3600.0).contains(&time)
        || ![x, y, z, w].iter().all(|v| v.is_finite())
    {
        return 1;
    }
    with(world, slot, |a| {
        if a.clips
            .iter()
            .flat_map(|c| &c.tracks)
            .map(|t| t.keys.len())
            .sum::<usize>()
            >= 4096
        {
            return 1;
        }
        let Some(c) = a.clips.get_mut(clip as usize) else {
            return 1;
        };
        let Some(t) = c.tracks.get_mut(track as usize) else {
            return 1;
        };
        if t.keys.last().is_some_and(|k| time <= k.time) {
            return 1;
        }
        t.keys.push(Key {
            time,
            value: [x, y, z, w],
        });
        c.duration = c.duration.max(time);
        0
    })
    .unwrap_or(1)
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_anim_state(
    world: u32,
    slot: u32,
    clip: u32,
    looping: u32,
    speed: f64,
) -> u32 {
    with(world, slot, |a| {
        if a.states.len() >= 8
            || !speed.is_finite()
            || !(0.01..=8.0).contains(&speed)
            || a.clips
                .get(clip as usize)
                .is_none_or(|c| c.duration <= 0.0 || c.tracks.iter().any(|t| t.keys.is_empty()))
        {
            return 1;
        }
        a.states.push(State {
            clip: clip as usize,
            looping: looping != 0,
            speed,
        });
        0
    })
    .unwrap_or(1)
}
#[unsafe(no_mangle)]
#[allow(clippy::too_many_arguments)]
pub extern "C" fn axiom_anim_transition(
    world: u32,
    slot: u32,
    from: u32,
    to: u32,
    param: i32,
    comparison: u32,
    threshold: f64,
    duration: f64,
) -> u32 {
    with(world, slot, |a| {
        if a.transitions.len() >= 16
            || from as usize >= a.states.len()
            || to as usize >= a.states.len()
            || !(-1..8).contains(&param)
            || comparison > 2
            || !threshold.is_finite()
            || !duration.is_finite()
            || !(0.0..=5.0).contains(&duration)
        {
            return 1;
        }
        a.transitions.push(Transition {
            from: from as usize,
            to: to as usize,
            parameter: (param >= 0).then_some(param as usize),
            comparison,
            threshold,
            duration,
        });
        0
    })
    .unwrap_or(1)
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_anim_control(
    world: u32,
    slot: u32,
    action: u32,
    index: u32,
    value: f64,
) -> u32 {
    with(world, slot, |a| {
        if !value.is_finite() {
            return 1;
        }
        match action {
            0 => u32::from(!a.change(index as usize, value)),
            1 => {
                a.paused = value != 0.0;
                0
            }
            2 if index < 8 => {
                a.parameters[index as usize] = value;
                0
            }
            3 if (0.0..=8.0).contains(&value) => {
                a.speed = value;
                0
            }
            _ => 1,
        }
    })
    .unwrap_or(1)
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_anim_tick(world: u32, slot: u32, delta: f64, playing: u32) -> u32 {
    with(world, slot, |a| {
        if a.nodes
            .iter()
            .any(|n| n.parent.is_some_and(|p| p >= a.nodes.len()))
        {
            return 1;
        }
        u32::from(!a.tick(delta, playing != 0))
    })
    .unwrap_or(1)
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_anim_matrix(world: u32, slot: u32, node: u32, index: u32) -> f32 {
    with(world, slot, |a| {
        a.matrices
            .get(node as usize)
            .and_then(|m| m.get(index as usize))
            .copied()
            .unwrap_or(f32::NAN)
    })
    .unwrap_or(f32::NAN)
}
#[unsafe(no_mangle)]
pub extern "C" fn axiom_anim_status(world: u32, slot: u32, field: u32) -> f64 {
    with(world, slot, |a| match field {
        0 => a.current as f64,
        1 => a.time,
        2 => {
            if a.paused {
                1.0
            } else {
                0.0
            }
        }
        3 => a.previous.map_or(-1.0, |(s, _)| s as f64),
        4 => {
            if a.previous.is_some() {
                a.blend_elapsed / a.blend_duration
            } else {
                1.0
            }
        }
        5 => a.speed,
        _ => f64::NAN,
    })
    .unwrap_or(f64::NAN)
}
