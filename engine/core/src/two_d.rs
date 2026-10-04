//! Deterministic, bounded 2D sampling. Rendering and DOM are host responsibilities.
#[derive(Default)]
pub struct Clock {
    pub elapsed: f64,
}
impl Clock {
    pub fn tick(&mut self, delta: f64) -> bool {
        if !delta.is_finite() || !(0.0..=0.25).contains(&delta) {
            return false;
        }
        self.elapsed += delta;
        true
    }
}
#[must_use]
pub fn animation_frame(elapsed: f64, fps: f64, count: u32, looping: bool) -> u32 {
    if !elapsed.is_finite() || elapsed < 0.0 || !fps.is_finite() || fps <= 0.0 || count == 0 {
        return 0;
    }
    let frame = (elapsed * fps).floor() as u64;
    if looping {
        (frame % u64::from(count)) as u32
    } else {
        frame.min(u64::from(count - 1)) as u32
    }
}
#[must_use]
pub fn random(seed: u32, index: u32) -> f64 {
    let mut x = seed ^ index.wrapping_mul(0x9e37_79b9);
    x ^= x >> 16;
    x = x.wrapping_mul(0x85eb_ca6b);
    x ^= x >> 13;
    x = x.wrapping_mul(0xc2b2_ae35);
    x ^= x >> 16;
    f64::from(x) / f64::from(u32::MAX)
}
/// A slot contains the most recent emission using that slot; capacity bounds work.
#[must_use]
#[allow(clippy::too_many_arguments)]
pub fn particle(
    time: f64,
    slot: u32,
    capacity: u32,
    rate: f64,
    life: f64,
    seed: u32,
    speed: f64,
    spread: f64,
    gravity: f64,
) -> Option<[f64; 3]> {
    if capacity == 0
        || capacity > 512
        || slot >= capacity
        || ![time, rate, life, speed, spread, gravity]
            .iter()
            .all(|v| v.is_finite())
        || time < 0.0
        || rate <= 0.0
        || life <= 0.0
    {
        return None;
    }
    let emitted = (time * rate).floor() as u64;
    if emitted == 0 || u64::from(slot) >= emitted {
        return None;
    }
    let serial = u64::from(slot)
        + (emitted - 1 - u64::from(slot)) / u64::from(capacity) * u64::from(capacity);
    let age = time - (serial + 1) as f64 / rate;
    if age >= life {
        return None;
    }
    let angle = (random(seed, serial as u32) - 0.5) * spread.to_radians();
    Some([
        angle.sin() * speed * age,
        angle.cos() * speed * age + gravity * age * age * 0.5,
        1.0 - age / life,
    ])
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn animation_loop_clamp_and_invalid_inputs() {
        assert_eq!(animation_frame(0.51, 8.0, 4, true), 0);
        assert_eq!(animation_frame(0.51, 8.0, 4, false), 3);
        assert_eq!(animation_frame(f64::NAN, 8.0, 4, true), 0);
    }
    #[test]
    fn rejected_tick_keeps_state() {
        let mut clock = Clock::default();
        assert!(clock.tick(0.25));
        assert!(!clock.tick(-1.0));
        assert_eq!(clock.elapsed, 0.25);
    }
    #[test]
    fn emissions_are_reproducible_bounded_and_expire() {
        let a = particle(0.2, 0, 4, 10.0, 1.0, 7, 2.0, 90.0, -9.8);
        assert_eq!(a, particle(0.2, 0, 4, 10.0, 1.0, 7, 2.0, 90.0, -9.8));
        assert_ne!(a, particle(0.2, 0, 4, 10.0, 1.0, 8, 2.0, 90.0, -9.8));
        assert!(particle(0.2, 3, 4, 10.0, 1.0, 7, 2.0, 90.0, -9.8).is_none());
        assert!(particle(0.2, 0, 513, 10.0, 1.0, 7, 2.0, 90.0, -9.8).is_none());
        assert!(particle(0.25, 0, 4, 10.0, 0.01, 7, 2.0, 90.0, -9.8).is_none());
    }
}
