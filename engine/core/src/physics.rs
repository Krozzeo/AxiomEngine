//! Deterministic-order, fixed-step translational 2D/3D physics foundation.
//! Boxes are axis aligned; spheres/circles use radius in half[0].
#[derive(Clone, Debug, PartialEq)]
pub struct Body {
    pub position: [f64; 3],
    pub velocity: [f64; 3],
    pub half: [f64; 3],
    pub inverse_mass: f64,
    pub restitution: f64,
    pub friction: f64,
    pub gravity_scale: f64,
    pub dimension: u32,
    pub sphere: bool,
    pub trigger: bool,
    pub layer: u32,
    pub mask: u32,
}
#[derive(Clone, Debug, PartialEq)]
pub struct Contact {
    pub a: usize,
    pub b: usize,
    pub normal: [f64; 3],
    pub depth: f64,
    pub trigger: bool,
}
#[derive(Default)]
pub struct World {
    pub bodies: Vec<Body>,
    pub contacts: Vec<Contact>,
    pub candidates: usize,
    pub steps: u64,
}
fn dot(a: [f64; 3], b: [f64; 3]) -> f64 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}
fn sub(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    std::array::from_fn(|i| a[i] - b[i])
}
fn extent(b: &Body, i: usize) -> f64 {
    if b.sphere { b.half[0] } else { b.half[i] }
}
fn collision(a: &Body, b: &Body) -> Option<([f64; 3], f64)> {
    let n = a.dimension as usize;
    if a.sphere && b.sphere {
        let mut d = sub(b.position, a.position);
        if n == 2 { d[2] = 0.0; }
        let distance = dot(d, d).sqrt();
        let depth = a.half[0] + b.half[0] - distance;
        if depth < 0.0 { return None; }
        return Some((if distance > 1e-12 { d.map(|x| x / distance) } else { [1.0, 0.0, 0.0] }, depth));
    }
    if a.sphere || b.sphere {
        let (s, bx, sign) = if a.sphere { (a, b, 1.0) } else { (b, a, -1.0) };
        let mut d = [0.0; 3];
        for (i, value) in d.iter_mut().enumerate().take(n) {
            *value = s.position[i].clamp(bx.position[i] - bx.half[i], bx.position[i] + bx.half[i]) - s.position[i];
        }
        let distance = dot(d, d).sqrt();
        if distance > s.half[0] { return None; }
        if distance > 1e-12 { return Some((d.map(|x| sign * x / distance), s.half[0] - distance)); }
        let axis = (0..n).min_by(|&i, &j| (bx.half[i] - (s.position[i] - bx.position[i]).abs()).total_cmp(&(bx.half[j] - (s.position[j] - bx.position[j]).abs()))).unwrap_or(0);
        d[axis] = if s.position[axis] >= bx.position[axis] { -sign } else { sign };
        return Some((d, s.half[0] + bx.half[axis] - (s.position[axis] - bx.position[axis]).abs()));
    }
    let mut depth = f64::INFINITY;
    let mut normal = [0.0; 3];
    for i in 0..n {
        let overlap = a.half[i] + b.half[i] - (b.position[i] - a.position[i]).abs();
        if overlap < 0.0 { return None; }
        if overlap < depth {
            depth = overlap;
            normal = [0.0; 3];
            normal[i] = if b.position[i] >= a.position[i] { 1.0 } else { -1.0 };
        }
    }
    Some((normal, depth))
}
impl World {
    pub fn add(&mut self, body: Body) -> Result<usize, &'static str> {
        if self.bodies.len() >= 256 || ![2, 3].contains(&body.dimension)
            || body.position.iter().any(|v| !v.is_finite() || v.abs() > 1e6)
            || body.velocity.iter().any(|v| !v.is_finite() || v.abs() > 1e4)
            || body.half.iter().any(|v| !v.is_finite() || *v <= 0.0 || *v > 1e4)
            || !body.inverse_mass.is_finite() || !(0.0..=1000.0).contains(&body.inverse_mass)
            || !body.restitution.is_finite() || !(0.0..=1.0).contains(&body.restitution)
            || !body.friction.is_finite() || !(0.0..=1.0).contains(&body.friction)
            || !body.gravity_scale.is_finite() || body.gravity_scale.abs() > 100.0 {
            return Err("AX_PHYSICS_0001");
        }
        let id = self.bodies.len();
        self.bodies.push(body);
        Ok(id)
    }
    pub fn step(&mut self) {
        const DT: f64 = 1.0 / 60.0;
        for b in &mut self.bodies {
            if b.inverse_mass > 0.0 {
                b.velocity[1] -= 9.81 * b.gravity_scale * DT;
                for i in 0..b.dimension as usize { b.position[i] += b.velocity[i] * DT; }
            }
        }
        // Stable sweep on x; insertion index is the tie breaker.
        let mut order: Vec<usize> = (0..self.bodies.len()).collect();
        order.sort_by(|&i, &j| (self.bodies[i].position[0] - extent(&self.bodies[i], 0)).total_cmp(&(self.bodies[j].position[0] - extent(&self.bodies[j], 0))).then(i.cmp(&j)));
        self.contacts.clear();
        self.candidates = 0;
        for (offset, &i) in order.iter().enumerate() {
            for &j in &order[offset + 1..] {
                let a = &self.bodies[i]; let b = &self.bodies[j];
                if b.position[0] - extent(b, 0) > a.position[0] + extent(a, 0) { break; }
                if a.dimension != b.dimension || a.layer & b.mask == 0 || b.layer & a.mask == 0 { continue; }
                self.candidates += 1;
                if let Some((normal, depth)) = collision(a, b) {
                    self.contacts.push(Contact { a: i, b: j, normal, depth, trigger: a.trigger || b.trigger });
                }
            }
        }
        for c in &self.contacts {
            if c.trigger { continue; }
            let a = self.bodies[c.a].clone(); let b = self.bodies[c.b].clone();
            let mass = a.inverse_mass + b.inverse_mass;
            if mass == 0.0 { continue; }
            let relative = sub(b.velocity, a.velocity);
            let speed = dot(relative, c.normal);
            let impulse = if speed < 0.0 { -(1.0 + a.restitution.min(b.restitution)) * speed / mass } else { 0.0 };
            let tangent = std::array::from_fn(|i| relative[i] - speed * c.normal[i]);
            let length = dot(tangent, tangent).sqrt();
            let friction = (length / mass).min(impulse * (a.friction * b.friction).sqrt());
            for axis in 0..a.dimension as usize {
                let force = impulse * c.normal[axis] - if length > 1e-12 { friction * tangent[axis] / length } else { 0.0 };
                self.bodies[c.a].velocity[axis] -= force * a.inverse_mass;
                self.bodies[c.b].velocity[axis] += force * b.inverse_mass;
                let correction = (c.depth - 0.0001).max(0.0) * 0.8 / mass * c.normal[axis];
                self.bodies[c.a].position[axis] -= correction * a.inverse_mass;
                self.bodies[c.b].position[axis] += correction * b.inverse_mass;
            }
        }
        self.steps += 1;
    }
    /// Closest segment hit; ties retain insertion order. Includes triggers.
    pub fn raycast(&self, origin: [f64; 3], direction: [f64; 3], max: f64, dimension: u32, mask: u32) -> Option<(usize, f64)> {
        if ![2, 3].contains(&dimension) || !max.is_finite() || max < 0.0 || origin.iter().chain(direction.iter()).any(|v| !v.is_finite()) { return None; }
        let mut direction = direction;
        if dimension == 2 { direction[2] = 0.0; }
        let length = dot(direction, direction).sqrt();
        if length < 1e-12 { return None; }
        let d = direction.map(|v| v / length);
        let mut best = max;
        let mut hit = None;
        for (index, b) in self.bodies.iter().enumerate() {
            if b.dimension != dimension || b.layer & mask == 0 { continue; }
            let distance = if b.sphere {
                let mut v = sub(origin, b.position); if dimension == 2 { v[2] = 0.0; }
                let c = dot(v, v) - b.half[0] * b.half[0]; let q = dot(v, d); let disc = q * q - c;
                if c <= 0.0 { Some(0.0) } else if disc >= 0.0 && -q - disc.sqrt() >= 0.0 { Some(-q - disc.sqrt()) } else { None }
            } else {
                let mut near: f64 = 0.0; let mut far = best;
                for axis in 0..dimension as usize {
                    if d[axis].abs() < 1e-12 {
                        if (origin[axis] - b.position[axis]).abs() > b.half[axis] { far = -1.0; }
                    } else {
                        let x = (b.position[axis] - b.half[axis] - origin[axis]) / d[axis];
                        let y = (b.position[axis] + b.half[axis] - origin[axis]) / d[axis];
                        near = near.max(x.min(y)); far = far.min(x.max(y));
                    }
                }
                if near <= far { Some(near) } else { None }
            };
            if let Some(t) = distance { if t <= best && (hit.is_none() || t < best) { best = t; hit = Some((index, t)); } }
        }
        hit
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn body(position: [f64; 3], dynamic: bool, dimension: u32, sphere: bool) -> Body {
        Body { position, velocity: [0.0; 3], half: [0.5; 3], inverse_mass: if dynamic { 1.0 } else { 0.0 }, restitution: 0.0, friction: 0.5, gravity_scale: 1.0, dimension, sphere, trigger: false, layer: 1, mask: u32::MAX }
    }
    #[test]
    fn golden_falling_shapes_rest_and_repeat() {
        for dimension in [2, 3] { for sphere in [false, true] {
            let simulate = || {
                let mut w = World::default();
                let mut ground = body([0.0, -1.0, 0.0], false, dimension, false); ground.half = [10.0, 0.5, 10.0];
                w.add(ground).unwrap(); w.add(body([0.0, 3.0, 0.0], true, dimension, sphere)).unwrap();
                for _ in 0..600 { w.step(); }
                assert!(w.bodies[1].position[1].abs() < 0.01);
                assert!(w.bodies[1].velocity[1].abs() < 0.01);
                assert_eq!(w.steps, 600); w.bodies
            };
            assert_eq!(simulate(), simulate());
        }}
    }
    #[test]
    fn triggers_layers_and_dimensions_do_not_resolve() {
        for mode in 0..3 {
            let mut w = World::default();
            let mut a = body([0.0; 3], true, 2, false); a.gravity_scale = 0.0;
            let mut b = body([0.0; 3], false, 2, false);
            match mode { 0 => b.trigger = true, 1 => b.mask = 0, _ => b.dimension = 3 }
            w.add(a).unwrap(); w.add(b).unwrap(); w.step();
            assert_eq!(w.bodies[0].position, [0.0; 3]);
            assert_eq!(w.contacts.len(), usize::from(mode == 0));
        }
    }
    #[test]
    fn equal_mass_impulse_and_friction_are_bounded() {
        let mut w = World::default();
        let mut a = body([-0.4, 0.0, 0.0], true, 3, true); a.gravity_scale = 0.0; a.restitution = 1.0; a.velocity[0] = 1.0;
        let mut b = a.clone(); b.position[0] = 0.4; b.velocity[0] = -1.0;
        w.add(a).unwrap(); w.add(b).unwrap(); w.step();
        assert!((w.bodies[0].velocity[0] + 1.0).abs() < 1e-10);
        assert!((w.bodies[1].velocity[0] - 1.0).abs() < 1e-10);
    }
    #[test]
    fn raycasts_choose_closest_shape_and_filter_layers() {
        let mut w = World::default(); w.add(body([0.0; 3], false, 3, true)).unwrap(); w.add(body([3.0, 0.0, 0.0], false, 3, false)).unwrap();
        assert_eq!(w.raycast([-2.0, 0.0, 0.0], [1.0, 0.0, 0.0], 10.0, 3, 1), Some((0, 1.5)));
        assert_eq!(w.raycast([0.0; 3], [1.0, 0.0, 0.0], 10.0, 3, 1), Some((0, 0.0)));
        assert_eq!(w.raycast([-2.0, 0.0, 0.0], [1.0, 0.0, 0.0], 10.0, 3, 2), None);
        assert_eq!(w.raycast([-2.0, 0.0, 0.0], [0.0; 3], 10.0, 3, 1), None);
    }
    #[test]
    fn broad_phase_prunes_separated_bodies_and_rejects_bad_inputs() {
        let mut w = World::default(); for i in 0..256 { w.add(body([f64::from(i) * 2.0, 0.0, 0.0], false, 3, false)).unwrap(); }
        assert!(w.add(body([0.0; 3], true, 3, false)).is_err()); w.step(); assert_eq!(w.candidates, 0);
        let mut w = World::default(); assert!(w.add(body([f64::NAN; 3], true, 3, false)).is_err());
    }
}
