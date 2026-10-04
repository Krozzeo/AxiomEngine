//! Bounded skeletal pose sampling and transient animation state, without host APIs.
use crate::authoring::{Matrix, model, multiply};
use crate::{Quat, Transform, Vec3};

#[derive(Clone)]
pub struct Node {
    pub parent: Option<usize>,
    pub position: [f32; 3],
    pub rotation: [f32; 4],
    pub scale: [f32; 3],
    pub matrix: Option<Matrix>,
}
#[derive(Clone)]
pub struct Key {
    pub time: f64,
    pub value: [f32; 4],
}
#[derive(Clone)]
pub struct Track {
    pub node: usize,
    pub path: u32,
    pub step: bool,
    pub keys: Vec<Key>,
}
#[derive(Clone, Default)]
pub struct Clip {
    pub duration: f64,
    pub tracks: Vec<Track>,
}
#[derive(Clone)]
pub struct State {
    pub clip: usize,
    pub looping: bool,
    pub speed: f64,
}
#[derive(Clone)]
pub struct Transition {
    pub from: usize,
    pub to: usize,
    pub parameter: Option<usize>,
    pub comparison: u32,
    pub threshold: f64,
    pub duration: f64,
}
pub struct Animator {
    pub nodes: Vec<Node>,
    pub clips: Vec<Clip>,
    pub states: Vec<State>,
    pub transitions: Vec<Transition>,
    pub parameters: [f64; 8],
    pub current: usize,
    pub time: f64,
    pub previous: Option<(usize, f64)>,
    pub blend_elapsed: f64,
    pub blend_duration: f64,
    pub speed: f64,
    pub paused: bool,
    pub matrices: Vec<Matrix>,
}
pub fn slerp(a: [f32; 4], mut b: [f32; 4], t: f32) -> [f32; 4] {
    let normalize = |v: [f32; 4]| {
        let n = v.iter().map(|x| x * x).sum::<f32>().sqrt().max(1e-8);
        v.map(|x| x / n)
    };
    let a = normalize(a);
    b = normalize(b);
    let mut dot = a.iter().zip(b).map(|(x, y)| x * y).sum::<f32>();
    if dot < 0.0 {
        b = b.map(|v| -v);
        dot = -dot;
    }
    let (x, y) = if dot > 0.9995 {
        (1.0 - t, t)
    } else {
        let angle = dot.clamp(-1.0, 1.0).acos();
        (
            ((1.0 - t) * angle).sin() / angle.sin(),
            (t * angle).sin() / angle.sin(),
        )
    };
    normalize(std::array::from_fn(|i| a[i] * x + b[i] * y))
}
fn sample(track: &Track, time: f64) -> [f32; 4] {
    let index = track
        .keys
        .partition_point(|k| k.time <= time)
        .saturating_sub(1);
    let a = &track.keys[index];
    let Some(b) = track.keys.get(index + 1) else {
        return a.value;
    };
    if track.step || time <= a.time {
        return a.value;
    }
    let t = ((time - a.time) / (b.time - a.time)).clamp(0.0, 1.0) as f32;
    if track.path == 1 {
        slerp(a.value, b.value, t)
    } else {
        std::array::from_fn(|i| a.value[i] * (1.0 - t) + b.value[i] * t)
    }
}
impl Animator {
    pub fn new(nodes: Vec<Node>, clips: Vec<Clip>) -> Self {
        let matrices = vec![[0.0; 16]; nodes.len()];
        Self {
            nodes,
            clips,
            states: Vec::new(),
            transitions: Vec::new(),
            parameters: [0.0; 8],
            current: 0,
            time: 0.0,
            previous: None,
            blend_elapsed: 0.0,
            blend_duration: 0.0,
            speed: 1.0,
            paused: false,
            matrices,
        }
    }
    pub fn change(&mut self, state: usize, duration: f64) -> bool {
        if state >= self.states.len() || !duration.is_finite() || !(0.0..=5.0).contains(&duration) {
            return false;
        }
        self.previous = (duration > 0.0).then_some((self.current, self.time));
        self.current = state;
        self.time = 0.0;
        self.blend_elapsed = 0.0;
        self.blend_duration = duration;
        true
    }
    fn pose(&self, state: usize, time: f64) -> Vec<Node> {
        let mut pose = self.nodes.clone();
        if let Some(state) = self.states.get(state) {
            let clip = &self.clips[state.clip];
            let time = if state.looping {
                time % clip.duration
            } else {
                time.min(clip.duration)
            };
            for track in &clip.tracks {
                let value = sample(track, time);
                let n = &mut pose[track.node];
                match track.path {
                    0 => n.position = [value[0], value[1], value[2]],
                    1 => n.rotation = value,
                    _ => n.scale = [value[0], value[1], value[2]],
                }
            }
        }
        pose
    }
    pub fn tick(&mut self, delta: f64, playing: bool) -> bool {
        if !delta.is_finite() || !(0.0..=0.25).contains(&delta) || self.states.is_empty() {
            return false;
        }
        if playing && !self.paused {
            self.time += delta * self.speed * self.states[self.current].speed;
            if let Some((state, time)) = self.previous.as_mut() {
                *time += delta * self.speed * self.states[*state].speed;
                self.blend_elapsed += delta;
                if self.blend_elapsed >= self.blend_duration {
                    self.previous = None;
                }
            }
            if self.previous.is_none() {
                let state = &self.states[self.current];
                let ended = !state.looping && self.time >= self.clips[state.clip].duration;
                let next = self
                    .transitions
                    .iter()
                    .find(|t| {
                        t.from == self.current
                            && t.parameter.map_or(ended, |i| match t.comparison {
                                0 => self.parameters[i] > t.threshold,
                                1 => self.parameters[i] < t.threshold,
                                _ => self.parameters[i] == t.threshold,
                            })
                    })
                    .cloned();
                if let Some(t) = next {
                    self.change(t.to, t.duration);
                }
            }
        }
        let mut pose = if playing {
            self.pose(self.current, self.time)
        } else {
            self.nodes.clone()
        };
        if playing && let Some((state, time)) = self.previous {
            let old = self.pose(state, time);
            let t = (self.blend_elapsed / self.blend_duration).clamp(0.0, 1.0) as f32;
            for (n, p) in pose.iter_mut().zip(old) {
                n.position = std::array::from_fn(|i| p.position[i] * (1.0 - t) + n.position[i] * t);
                n.scale = std::array::from_fn(|i| p.scale[i] * (1.0 - t) + n.scale[i] * t);
                n.rotation = slerp(p.rotation, n.rotation, t);
            }
        }
        let local: Vec<_> = pose
            .iter()
            .map(|n| {
                n.matrix.unwrap_or_else(|| {
                    model(Transform {
                        position: Vec3 {
                            x: n.position[0],
                            y: n.position[1],
                            z: n.position[2],
                        },
                        rotation: Quat {
                            x: n.rotation[0],
                            y: n.rotation[1],
                            z: n.rotation[2],
                            w: n.rotation[3],
                        },
                        scale: Vec3 {
                            x: n.scale[0],
                            y: n.scale[1],
                            z: n.scale[2],
                        },
                    })
                })
            })
            .collect();
        let mut done = vec![false; pose.len()];
        for _ in 0..pose.len() {
            for i in 0..pose.len() {
                if !done[i] && pose[i].parent.is_none_or(|p| done[p]) {
                    self.matrices[i] = pose[i]
                        .parent
                        .map_or(local[i], |p| multiply(self.matrices[p], local[i]));
                    done[i] = true;
                }
            }
        }
        done.iter().all(|v| *v)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn animator() -> Animator {
        let node = Node {
            parent: None,
            position: [0.0; 3],
            rotation: [0.0, 0.0, 0.0, 1.0],
            scale: [1.0; 3],
            matrix: None,
        };
        let clip = Clip {
            duration: 1.0,
            tracks: vec![Track {
                node: 0,
                path: 0,
                step: false,
                keys: vec![
                    Key {
                        time: 0.0,
                        value: [0.0; 4],
                    },
                    Key {
                        time: 1.0,
                        value: [2.0, 0.0, 0.0, 0.0],
                    },
                ],
            }],
        };
        let mut a = Animator::new(vec![node], vec![clip]);
        a.states = vec![
            State {
                clip: 0,
                looping: false,
                speed: 1.0,
            },
            State {
                clip: 0,
                looping: true,
                speed: 1.0,
            },
        ];
        a
    }
    #[test]
    fn playback_pause_and_bind_preview() {
        let mut a = animator();
        assert!(a.tick(0.25, true));
        assert_eq!(a.matrices[0][12], 0.5);
        a.paused = true;
        a.tick(0.25, true);
        assert_eq!(a.time, 0.25);
        a.tick(0.0, false);
        assert_eq!(a.matrices[0][12], 0.0);
        assert!(!a.tick(f64::NAN, true));
        assert_eq!(a.time, 0.25);
    }
    #[test]
    fn state_transition_blends_and_finishes() {
        let mut a = animator();
        a.transitions.push(Transition {
            from: 0,
            to: 1,
            parameter: Some(0),
            comparison: 0,
            threshold: 0.5,
            duration: 0.5,
        });
        a.parameters[0] = 1.0;
        a.tick(0.25, true);
        assert_eq!(a.current, 1);
        assert!(a.previous.is_some());
        a.tick(0.25, true);
        assert!((a.matrices[0][12] - 0.75).abs() < 1e-6);
        a.tick(0.25, true);
        assert!(a.previous.is_none());
    }
    #[test]
    fn shortest_quaternion_arc_is_normalized() {
        let a = [0.0, 0.0, 0.0, 1.0];
        assert_eq!(slerp(a, a.map(|v| -v), 0.5), a);
        let b = slerp(a, [0.0, 0.0, 1.0, 0.0], 0.5);
        assert!((b[2] - std::f32::consts::FRAC_1_SQRT_2).abs() < 1e-5);
    }
}
