//! DOM-free engine primitives shared by native and WebAssembly runtimes.

use core::fmt;
use std::collections::VecDeque;

pub mod animation;
pub mod authoring;
pub mod demo;
pub mod physics;
pub mod two_d;

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

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Quat {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32,
}

impl Default for Quat {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Transform {
    pub position: Vec3,
    pub rotation: Quat,
    pub scale: Vec3,
}

impl Transform {
    #[must_use]
    pub fn identity() -> Self {
        Self::default()
    }
}

impl Default for Transform {
    fn default() -> Self {
        Self {
            position: Vec3::default(),
            rotation: Quat::default(),
            scale: Vec3 {
                x: 1.0,
                y: 1.0,
                z: 1.0,
            },
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Camera {
    pub vertical_fov_radians: f32,
    pub near_plane: f32,
    pub far_plane: f32,
}

impl Default for Camera {
    fn default() -> Self {
        Self {
            vertical_fov_radians: core::f32::consts::FRAC_PI_3,
            near_plane: 0.1,
            far_plane: 1_000.0,
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Entity {
    pub id: PersistentId,
    pub transform: Transform,
    pub camera: Option<Camera>,
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Scene {
    entities: Vec<Entity>,
}

impl Scene {
    pub fn add(&mut self, entity: Entity) -> Result<(), CoreError> {
        if self
            .entities
            .iter()
            .any(|existing| existing.id == entity.id)
        {
            return Err(CoreError::DuplicateEntity);
        }
        self.entities.push(entity);
        Ok(())
    }

    #[must_use]
    pub fn entities(&self) -> &[Entity] {
        &self.entities
    }

    #[must_use]
    pub fn active_camera(&self) -> Option<&Entity> {
        self.entities.iter().find(|entity| entity.camera.is_some())
    }
}

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

impl ClockSnapshot {
    #[must_use]
    pub const fn new(kind: ClockKind) -> Self {
        Self {
            kind,
            elapsed_seconds: 0.0,
            delta_seconds: 0.0,
            frame: 0,
            paused: false,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CoreError {
    InvalidDelta,
    GenerationExhausted,
    CapacityExhausted,
    DuplicateEntity,
    InvalidFixedStep,
    JobIdExhausted,
}

impl fmt::Display for CoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let code = match self {
            Self::InvalidDelta => "AX_TIME_0001",
            Self::GenerationExhausted => "AX_ID_0001",
            Self::CapacityExhausted => "AX_RESOURCE_0001",
            Self::DuplicateEntity => "AX_SCENE_0001",
            Self::InvalidFixedStep => "AX_TIME_0002",
            Self::JobIdExhausted => "AX_JOB_0001",
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

#[derive(Clone, Debug)]
struct ResourceSlot<T> {
    generation: u32,
    value: Option<T>,
}

#[derive(Clone, Debug)]
pub struct ResourceManager<T> {
    slots: Vec<ResourceSlot<T>>,
}

impl<T> Default for ResourceManager<T> {
    fn default() -> Self {
        Self { slots: Vec::new() }
    }
}

impl<T> ResourceManager<T> {
    pub fn insert(&mut self, value: T) -> Result<GenerationalHandle, CoreError> {
        if let Some((index, slot)) = self
            .slots
            .iter_mut()
            .enumerate()
            .find(|(_, slot)| slot.value.is_none())
        {
            slot.value = Some(value);
            return Ok(GenerationalHandle {
                index: u32::try_from(index).map_err(|_| CoreError::CapacityExhausted)?,
                generation: slot.generation,
            });
        }

        let index = u32::try_from(self.slots.len()).map_err(|_| CoreError::CapacityExhausted)?;
        self.slots.push(ResourceSlot {
            generation: 0,
            value: Some(value),
        });
        Ok(GenerationalHandle {
            index,
            generation: 0,
        })
    }

    #[must_use]
    pub fn get(&self, handle: GenerationalHandle) -> Option<&T> {
        let slot = self.slots.get(usize::try_from(handle.index).ok()?)?;
        if slot.generation == handle.generation {
            slot.value.as_ref()
        } else {
            None
        }
    }

    pub fn remove(&mut self, handle: GenerationalHandle) -> Result<Option<T>, CoreError> {
        let Some(slot) = self
            .slots
            .get_mut(usize::try_from(handle.index).map_err(|_| CoreError::CapacityExhausted)?)
        else {
            return Ok(None);
        };
        if slot.generation != handle.generation || slot.value.is_none() {
            return Ok(None);
        }
        let next_generation = slot
            .generation
            .checked_add(1)
            .ok_or(CoreError::GenerationExhausted)?;
        let value = slot.value.take();
        slot.generation = next_generation;
        Ok(value)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum JobKind {
    Simulation,
    Asset,
    RenderPreparation,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Job {
    pub id: u64,
    pub trace_id: TraceId,
    pub kind: JobKind,
}

#[derive(Clone, Debug, Default)]
pub struct JobQueue {
    next_id: u64,
    pending: VecDeque<Job>,
}

impl JobQueue {
    pub fn schedule(&mut self, trace_id: TraceId, kind: JobKind) -> Result<Job, CoreError> {
        let job = Job {
            id: self.next_id,
            trace_id,
            kind,
        };
        self.next_id = self
            .next_id
            .checked_add(1)
            .ok_or(CoreError::JobIdExhausted)?;
        self.pending.push_back(job);
        Ok(job)
    }

    pub fn pop(&mut self) -> Option<Job> {
        self.pending.pop_front()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.pending.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.pending.is_empty()
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct LoopStep {
    pub variable: ClockSnapshot,
    pub fixed: ClockSnapshot,
    pub fixed_steps: u32,
    pub interpolation_alpha: f64,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct EngineLoop {
    variable: ClockSnapshot,
    fixed: ClockSnapshot,
    fixed_step_seconds: f64,
    accumulator_seconds: f64,
    max_fixed_steps: u32,
}

impl EngineLoop {
    pub fn new(fixed_step_seconds: f64, max_fixed_steps: u32) -> Result<Self, CoreError> {
        if !fixed_step_seconds.is_finite() || fixed_step_seconds <= 0.0 || max_fixed_steps == 0 {
            return Err(CoreError::InvalidFixedStep);
        }
        Ok(Self {
            variable: ClockSnapshot::new(ClockKind::Game),
            fixed: ClockSnapshot::new(ClockKind::Fixed),
            fixed_step_seconds,
            accumulator_seconds: 0.0,
            max_fixed_steps,
        })
    }

    pub fn tick(&mut self, delta_seconds: f64) -> Result<LoopStep, CoreError> {
        self.variable = advance_clock(self.variable, delta_seconds)?;
        self.accumulator_seconds += delta_seconds;
        let mut fixed_steps = 0;
        while self.accumulator_seconds >= self.fixed_step_seconds
            && fixed_steps < self.max_fixed_steps
        {
            self.fixed = advance_clock(self.fixed, self.fixed_step_seconds)?;
            self.accumulator_seconds -= self.fixed_step_seconds;
            fixed_steps += 1;
        }
        if fixed_steps == self.max_fixed_steps {
            self.accumulator_seconds %= self.fixed_step_seconds;
        }
        Ok(LoopStep {
            variable: self.variable,
            fixed: self.fixed,
            fixed_steps,
            interpolation_alpha: self.accumulator_seconds / self.fixed_step_seconds,
        })
    }
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
        let clock = ClockSnapshot::new(ClockKind::Fixed);
        assert_eq!(
            advance_clock(clock, -1.0).unwrap_err().to_string(),
            "AX_TIME_0001"
        );
    }

    #[test]
    fn scene_rejects_duplicate_stable_ids() {
        let mut scene = Scene::default();
        let entity = Entity {
            id: PersistentId(7),
            transform: Transform::identity(),
            camera: Some(Camera::default()),
        };
        scene.add(entity.clone()).unwrap();
        assert_eq!(scene.add(entity), Err(CoreError::DuplicateEntity));
        assert_eq!(
            scene.active_camera().map(|value| value.id),
            Some(PersistentId(7))
        );
    }

    #[test]
    fn removed_resource_invalidates_old_handle() {
        let mut resources = ResourceManager::default();
        let old = resources.insert("mesh-a").unwrap();
        assert_eq!(resources.remove(old).unwrap(), Some("mesh-a"));
        let replacement = resources.insert("mesh-b").unwrap();
        assert_eq!(old.index, replacement.index);
        assert_ne!(old.generation, replacement.generation);
        assert_eq!(resources.get(old), None);
        assert_eq!(resources.get(replacement), Some(&"mesh-b"));
    }

    #[test]
    fn engine_loop_runs_fixed_and_variable_clocks() {
        let mut engine_loop = EngineLoop::new(0.01, 4).unwrap();
        let step = engine_loop.tick(0.025).unwrap();
        assert_eq!(step.variable.frame, 1);
        assert_eq!(step.fixed.frame, 2);
        assert_eq!(step.fixed_steps, 2);
        assert!((step.interpolation_alpha - 0.5).abs() < f64::EPSILON * 8.0);
    }

    #[test]
    fn job_queue_preserves_order_and_trace() {
        let mut jobs = JobQueue::default();
        let first = jobs.schedule(TraceId(11), JobKind::Simulation).unwrap();
        let second = jobs
            .schedule(TraceId(12), JobKind::RenderPreparation)
            .unwrap();
        assert_eq!(jobs.len(), 2);
        assert_eq!(jobs.pop(), Some(first));
        assert_eq!(jobs.pop(), Some(second));
        assert!(jobs.is_empty());
    }

    #[test]
    fn rejected_tick_leaves_loop_unchanged() {
        let mut engine_loop = EngineLoop::new(0.01, 4).unwrap();
        let before = engine_loop;
        assert_eq!(engine_loop.tick(f64::NAN), Err(CoreError::InvalidDelta));
        assert_eq!(engine_loop, before);
    }

    #[test]
    fn long_frame_caps_catch_up_work() {
        let mut engine_loop = EngineLoop::new(0.01, 4).unwrap();
        let step = engine_loop.tick(1.005).unwrap();
        assert_eq!(step.fixed_steps, 4);
        assert!((0.0..1.0).contains(&step.interpolation_alpha));
    }

    #[test]
    fn default_transform_preserves_unit_scale() {
        assert_eq!(Transform::default(), Transform::identity());
        assert_eq!(Transform::default().scale.x, 1.0);
    }
}
