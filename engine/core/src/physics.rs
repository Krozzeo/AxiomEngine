//! Fixed-step 2D/3D rigid bodies: oriented boxes, circles/spheres and angular impulses.
#[derive(Clone, Debug, PartialEq)]
pub struct Body {
    pub position: [f64; 3],
    pub velocity: [f64; 3],
    pub rotation: [f64; 4],
    pub angular_velocity: [f64; 3],
    pub freeze_rotation: bool,
    pub gravity: [f64; 3],
    pub linear_damping: f64,
    pub angular_damping: f64,
    pub kinematic: bool,
    pub sleeping: bool,
    pub constraints: u32,
    pub continuous: bool,
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
    pub point: [f64; 3],
    pub trigger: bool,
    pub relative_velocity: [f64; 3],
    pub impulse: f64,
}
#[derive(Default)]
pub struct World {
    pub bodies: Vec<Body>,
    pub contacts: Vec<Contact>,
    pub grounded: Vec<bool>,
    pub candidates: usize,
    pub steps: u64,
    pub ignored_pairs: std::collections::BTreeSet<(usize, usize)>,
}
fn dot(a: [f64; 3], b: [f64; 3]) -> f64 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}
fn add(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    std::array::from_fn(|i| a[i] + b[i])
}
fn sub(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    std::array::from_fn(|i| a[i] - b[i])
}
fn mul(a: [f64; 3], s: f64) -> [f64; 3] {
    a.map(|v| v * s)
}
fn cross(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}
fn unit(a: [f64; 3]) -> [f64; 3] {
    mul(a, 1.0 / dot(a, a).sqrt().max(1e-12))
}
fn rotate(q: [f64; 4], v: [f64; 3]) -> [f64; 3] {
    let u = [q[0], q[1], q[2]];
    add(
        v,
        add(
            mul(cross(u, v), 2.0 * q[3]),
            mul(cross(u, cross(u, v)), 2.0),
        ),
    )
}
fn axes(b: &Body) -> [[f64; 3]; 3] {
    std::array::from_fn(|i| {
        rotate(
            b.rotation,
            std::array::from_fn(|j| if i == j { 1.0 } else { 0.0 }),
        )
    })
}
fn extent(b: &Body, i: usize, ax: [[f64; 3]; 3]) -> f64 {
    if b.sphere {
        b.half[0]
    } else {
        ax.iter()
            .enumerate()
            .take(b.dimension as usize)
            .map(|(j, a)| a[i].abs() * b.half[j])
            .sum()
    }
}
fn support(b: &Body, n: [f64; 3], ax: [[f64; 3]; 3]) -> [f64; 3] {
    if b.sphere {
        return add(b.position, mul(n, b.half[0]));
    }
    let mut p = b.position;
    for (i, a) in ax.iter().enumerate().take(b.dimension as usize) {
        let d = dot(*a, n);
        if d.abs() > 1e-8 {
            p = add(p, mul(*a, b.half[i] * d.signum()));
        }
    }
    p
}
fn face(b: &Body, n: [f64; 3], ax: [[f64; 3]; 3]) -> Vec<[f64; 3]> {
    let count = b.dimension as usize;
    let i = (0..count)
        .max_by(|&i, &j| dot(ax[i], n).abs().total_cmp(&dot(ax[j], n).abs()))
        .unwrap();
    let center = add(b.position, mul(ax[i], b.half[i] * dot(ax[i], n).signum()));
    let j = (i + 1) % count;
    if count == 2 {
        return vec![
            add(center, mul(ax[j], b.half[j])),
            sub(center, mul(ax[j], b.half[j])),
        ];
    }
    let k = (i + 2) % 3;
    [(1.0, 1.0), (-1.0, 1.0), (-1.0, -1.0), (1.0, -1.0)]
        .iter()
        .map(|&(x, y)| {
            add(
                center,
                add(mul(ax[j], x * b.half[j]), mul(ax[k], y * b.half[k])),
            )
        })
        .collect()
}
fn clip(poly: Vec<[f64; 3]>, n: [f64; 3], limit: f64) -> Vec<[f64; 3]> {
    let mut out = Vec::new();
    if poly.is_empty() {
        return out;
    }
    for i in 0..poly.len() {
        let a = poly[i];
        let b = poly[(i + 1) % poly.len()];
        let da = dot(a, n) - limit;
        let db = dot(b, n) - limit;
        if da <= 1e-8 {
            out.push(a);
        }
        if (da > 0.0) != (db > 0.0) {
            out.push(add(a, mul(sub(b, a), da / (da - db))));
        }
    }
    out.dedup_by(|a, b| dot(sub(*a, *b), sub(*a, *b)) < 1e-16);
    out
}
type Manifold = ([f64; 3], f64, Vec<[f64; 3]>);
fn collision(a: &Body, b: &Body, aa: [[f64; 3]; 3], ba: [[f64; 3]; 3]) -> Option<Manifold> {
    let dim = a.dimension as usize;
    if a.sphere && b.sphere {
        let mut d = sub(b.position, a.position);
        if dim == 2 {
            d[2] = 0.0;
        }
        let len = dot(d, d).sqrt();
        let depth = a.half[0] + b.half[0] - len;
        if depth < 0.0 {
            return None;
        }
        let n = if len > 1e-12 {
            mul(d, 1.0 / len)
        } else {
            [1.0, 0.0, 0.0]
        };
        return Some((
            n,
            depth,
            vec![add(a.position, mul(n, a.half[0] - depth * 0.5))],
        ));
    }
    if a.sphere || b.sphere {
        let (s, bx, sign) = if a.sphere { (a, b, 1.0) } else { (b, a, -1.0) };
        let ax = if a.sphere { ba } else { aa };
        let offset = sub(s.position, bx.position);
        let local: [f64; 3] = std::array::from_fn(|i| dot(offset, ax[i]));
        let mut closest = bx.position;
        for i in 0..dim {
            closest = add(closest, mul(ax[i], local[i].clamp(-bx.half[i], bx.half[i])));
        }
        let d = sub(closest, s.position);
        let distance = dot(d, d).sqrt();
        if distance > s.half[0] {
            return None;
        }
        if distance > 1e-12 {
            return Some((mul(d, sign / distance), s.half[0] - distance, vec![closest]));
        }
        let i = (0..dim)
            .min_by(|&i, &j| {
                (bx.half[i] - local[i].abs()).total_cmp(&(bx.half[j] - local[j].abs()))
            })
            .unwrap();
        let outward = mul(ax[i], if local[i] >= 0.0 { 1.0 } else { -1.0 });
        let depth = s.half[0] + bx.half[i] - local[i].abs();
        return Some((
            mul(outward, -sign),
            depth,
            vec![add(s.position, mul(outward, bx.half[i] - local[i].abs()))],
        ));
    }
    let mut tests = [([0.0; 3], 0usize, 0usize); 15];
    let mut test_count = 0;
    let mut add_test = |v| {
        tests[test_count] = v;
        test_count += 1;
    };
    for i in 0..dim {
        add_test((aa[i], 0, i));
        add_test((ba[i], 1, i));
    }
    if dim == 3 {
        for x in aa {
            for y in ba {
                let n = cross(x, y);
                if dot(n, n) > 1e-12 {
                    add_test((unit(n), 2, 0));
                }
            }
        }
    }
    let offset = sub(b.position, a.position);
    let mut depth = f64::INFINITY;
    let mut normal = [0.0; 3];
    let mut reference = (0, 0);
    for (n, owner, index) in tests.into_iter().take(test_count) {
        let ra: f64 = (0..dim).map(|i| a.half[i] * dot(aa[i], n).abs()).sum();
        let rb: f64 = (0..dim).map(|i| b.half[i] * dot(ba[i], n).abs()).sum();
        let overlap = ra + rb - dot(offset, n).abs();
        if overlap < 0.0 {
            return None;
        }
        if overlap < depth {
            depth = overlap;
            normal = mul(n, if dot(offset, n) >= 0.0 { 1.0 } else { -1.0 });
            reference = (owner, index);
        }
    }
    let mut points = Vec::new();
    if reference.0 < 2 {
        let (r, incident, rn) = if reference.0 == 0 {
            (a, b, normal)
        } else {
            (b, a, mul(normal, -1.0))
        };
        let ax = if reference.0 == 0 { aa } else { ba };
        let incident_axes = if reference.0 == 0 { ba } else { aa };
        let mut poly = face(incident, mul(rn, -1.0), incident_axes);
        for (i, n) in ax.iter().enumerate().take(dim) {
            if i == reference.1 {
                continue;
            }
            poly = clip(poly, *n, dot(r.position, *n) + r.half[i]);
            poly = clip(poly, mul(*n, -1.0), -dot(r.position, *n) + r.half[i]);
        }
        let plane = dot(support(r, rn, ax), rn);
        for p in poly {
            let separation = dot(p, rn) - plane;
            if separation <= 1e-7 {
                let midpoint = sub(p, mul(rn, separation * 0.5));
                if !points
                    .iter()
                    .any(|q| dot(sub(*q, midpoint), sub(*q, midpoint)) < 1e-14)
                {
                    points.push(midpoint);
                }
            }
        }
    }
    if points.is_empty() {
        points.push(mul(
            add(support(a, normal, aa), support(b, mul(normal, -1.0), ba)),
            0.5,
        ));
    }
    points.truncate(4);
    Some((normal, depth, points))
}
struct Inertia {
    diagonal: [f64; 3],
    axes: [[f64; 3]; 3],
    constraints: u32,
}
impl Inertia {
    fn new(b: &Body) -> Self {
        if b.freeze_rotation || b.inverse_mass == 0.0 {
            return Self {
                diagonal: [0.0; 3],
                axes: [[0.0; 3]; 3],
                constraints: b.constraints,
            };
        }
        let h = b.half;
        let inertia = if b.dimension == 2 {
            [
                0.0,
                0.0,
                if b.sphere {
                    2.0 * b.inverse_mass / (h[0] * h[0])
                } else {
                    3.0 * b.inverse_mass / (h[0] * h[0] + h[1] * h[1])
                },
            ]
        } else if b.sphere {
            [2.5 * b.inverse_mass / (h[0] * h[0]); 3]
        } else {
            std::array::from_fn(|i| {
                3.0 * b.inverse_mass / (h[(i + 1) % 3].powi(2) + h[(i + 2) % 3].powi(2))
            })
        };
        Self {
            diagonal: inertia,
            axes: axes(b),
            constraints: b.constraints,
        }
    }
    fn apply(&self, v: [f64; 3]) -> [f64; 3] {
        let ax = self.axes;
        let inertia = self.diagonal;

        let local: [f64; 3] = std::array::from_fn(|i| dot(v, ax[i]) * inertia[i]);
        let result = (0..3).fold([0.0; 3], |sum, i| add(sum, mul(ax[i], local[i])));
        std::array::from_fn(|i| {
            if self.constraints & (16 << i) != 0 {
                0.0
            } else {
                result[i]
            }
        })
    }
}
fn point_velocity(b: &Body, p: [f64; 3]) -> [f64; 3] {
    add(b.velocity, cross(b.angular_velocity, sub(p, b.position)))
}
fn linear_mass(b: &Body, vector: [f64; 3]) -> [f64; 3] {
    std::array::from_fn(|i| {
        if b.constraints & (2 << i) != 0 {
            0.0
        } else {
            vector[i] * b.inverse_mass
        }
    })
}
fn matrix_vector(columns: &[[f64; 3]; 3], vector: [f64; 3]) -> [f64; 3] {
    std::array::from_fn(|i| {
        columns[0][i] * vector[0] + columns[1][i] * vector[1] + columns[2][i] * vector[2]
    })
}
struct ContactMass {
    linear_a: [f64; 3],
    linear_b: [f64; 3],
    angular_a: [[f64; 3]; 3],
    angular_b: [[f64; 3]; 3],
    response: [[f64; 3]; 3],
}
impl ContactMass {
    fn new(a: &Body, b: &Body, point: [f64; 3], ia: &Inertia, ib: &Inertia) -> Self {
        let ra = sub(point, a.position);
        let rb = sub(point, b.position);
        let linear_a = linear_mass(a, [1.0; 3]);
        let linear_b = linear_mass(b, [1.0; 3]);
        let angular_a = std::array::from_fn(|i| {
            ia.apply(cross(
                ra,
                std::array::from_fn(|j| if i == j { 1.0 } else { 0.0 }),
            ))
        });
        let angular_b = std::array::from_fn(|i| {
            ib.apply(cross(
                rb,
                std::array::from_fn(|j| if i == j { 1.0 } else { 0.0 }),
            ))
        });
        let response = std::array::from_fn(|i| {
            add(
                std::array::from_fn(|j| {
                    if i == j {
                        linear_a[j] + linear_b[j]
                    } else {
                        0.0
                    }
                }),
                add(cross(angular_a[i], ra), cross(angular_b[i], rb)),
            )
        });
        Self {
            linear_a,
            linear_b,
            angular_a,
            angular_b,
            response,
        }
    }
    fn effective(&self, direction: [f64; 3]) -> f64 {
        dot(direction, matrix_vector(&self.response, direction))
    }
}
fn apply(b: &mut Body, impulse: [f64; 3], linear: &[f64; 3], angular: &[[f64; 3]; 3]) {
    b.velocity = add(b.velocity, std::array::from_fn(|i| linear[i] * impulse[i]));
    if dot(impulse, impulse) > 1e-12 && b.inverse_mass > 0.0 {
        b.sleeping = false;
    }
    b.angular_velocity = add(b.angular_velocity, matrix_vector(angular, impulse));
    if b.dimension == 2 {
        b.velocity[2] = 0.0;
        b.angular_velocity[0] = 0.0;
        b.angular_velocity[1] = 0.0;
    }
}
fn integrate_rotation(b: &mut Body, dt: f64) {
    if b.freeze_rotation {
        return;
    }
    let w = b.angular_velocity;
    let speed = dot(w, w).sqrt();
    if speed < 1e-12 {
        return;
    }
    let s = (speed * dt * 0.5).sin() / speed;
    let d = [w[0] * s, w[1] * s, w[2] * s, (speed * dt * 0.5).cos()];
    let q = b.rotation;
    let v = add(
        add(mul([q[0], q[1], q[2]], d[3]), mul([d[0], d[1], d[2]], q[3])),
        cross([d[0], d[1], d[2]], [q[0], q[1], q[2]]),
    );
    let r = [
        v[0],
        v[1],
        v[2],
        d[3] * q[3] - dot([d[0], d[1], d[2]], [q[0], q[1], q[2]]),
    ];
    let n = r.iter().map(|x| x * x).sum::<f64>().sqrt();
    b.rotation = r.map(|x| x / n);
}
impl World {
    pub fn add(&mut self, mut body: Body) -> Result<usize, &'static str> {
        if self.bodies.len() >= 65536
            || ![2, 3].contains(&body.dimension)
            || body
                .position
                .iter()
                .any(|v| !v.is_finite() || v.abs() > 1e6)
            || body
                .velocity
                .iter()
                .chain(body.angular_velocity.iter())
                .any(|v| !v.is_finite() || v.abs() > 1e4)
            || body.rotation.iter().any(|v| !v.is_finite())
            || body.rotation.iter().map(|v| v * v).sum::<f64>() < 1e-12
            || body
                .half
                .iter()
                .any(|v| !v.is_finite() || *v <= 0.0 || *v > 1e4)
            || !body.inverse_mass.is_finite()
            || !(0.0..=1000.0).contains(&body.inverse_mass)
            || !body.restitution.is_finite()
            || !(0.0..=1.0).contains(&body.restitution)
            || !body.friction.is_finite()
            || !(0.0..=1.0).contains(&body.friction)
            || body.gravity.iter().any(|v| !v.is_finite() || v.abs() > 1e4)
            || !body.linear_damping.is_finite()
            || !(0.0..=1e4).contains(&body.linear_damping)
            || !body.angular_damping.is_finite()
            || !(0.0..=1e4).contains(&body.angular_damping)
            || body.constraints & !126 != 0
            || !body.gravity_scale.is_finite()
            || body.gravity_scale.abs() > 100.0
        {
            return Err("AX_PHYSICS_0001");
        }
        let n = body.rotation.iter().map(|v| v * v).sum::<f64>().sqrt();
        body.rotation = body.rotation.map(|v| v / n);
        let id = self.bodies.len();
        self.bodies.push(body);
        Ok(id)
    }
    pub fn step(&mut self) {
        let before = self.steps;
        let minimum = self
            .bodies
            .iter()
            .map(|b| {
                b.half
                    .iter()
                    .take(b.dimension as usize)
                    .copied()
                    .fold(f64::INFINITY, f64::min)
            })
            .fold(f64::INFINITY, f64::min)
            .max(0.001);
        let samples = self
            .bodies
            .iter()
            .filter(|b| b.continuous)
            .map(|b| {
                ((dot(b.velocity, b.velocity).sqrt() / 60.0 / (minimum * 0.5)).ceil() as usize)
                    .clamp(1, 64)
            })
            .max()
            .unwrap_or(1);
        if samples == 1 {
            self.step_dt(1.0 / 60.0);
            self.update_grounded();
            return;
        }
        let mut contacts = std::collections::BTreeMap::new();
        let mut candidates = 0;
        for _ in 0..samples {
            self.step_dt(1.0 / 60.0 / samples as f64);
            candidates += self.candidates;
            for c in &self.contacts {
                contacts
                    .entry((c.a, c.b))
                    .or_insert_with(Vec::new)
                    .push(c.clone());
            }
        }
        self.contacts = contacts
            .into_values()
            .flat_map(|points| points.into_iter().take(4))
            .collect();
        self.candidates = candidates;
        self.steps = before + 1;
        self.update_grounded();
    }
    fn update_grounded(&mut self) {
        self.grounded = vec![false; self.bodies.len()];
        for c in &self.contacts {
            if c.trigger {
                continue;
            }
            if c.normal[1] < -0.5 {
                self.grounded[c.a] = true;
            }
            if c.normal[1] > 0.5 {
                self.grounded[c.b] = true;
            }
        }
    }
    fn step_dt(&mut self, dt: f64) {
        for b in &mut self.bodies {
            if (b.inverse_mass > 0.0 || b.kinematic) && !b.sleeping {
                if !b.kinematic {
                    for i in 0..b.dimension as usize {
                        b.velocity[i] += b.gravity[i] * b.gravity_scale * dt;
                    }
                }
                for i in 0..3 {
                    b.velocity[i] /= 1.0 + b.linear_damping * dt;
                    b.angular_velocity[i] /= 1.0 + b.angular_damping * dt;
                    if b.constraints & (2 << i) != 0 {
                        b.velocity[i] = 0.0;
                    }
                    if b.constraints & (16 << i) != 0 {
                        b.angular_velocity[i] = 0.0;
                    }
                }
                for i in 0..b.dimension as usize {
                    b.position[i] += b.velocity[i] * dt;
                }
                integrate_rotation(b, dt);
            }
        }
        let mut order: Vec<usize> = (0..self.bodies.len()).collect();
        let geometry: Vec<[[f64; 3]; 3]> = self.bodies.iter().map(axes).collect();
        let bounds: Vec<([f64; 3], [f64; 3])> = self
            .bodies
            .iter()
            .enumerate()
            .map(|(index, b)| {
                let extents: [f64; 3] = std::array::from_fn(|i| extent(b, i, geometry[index]));
                (
                    std::array::from_fn(|i| b.position[i] - extents[i]),
                    std::array::from_fn(|i| b.position[i] + extents[i]),
                )
            })
            .collect();
        let spread: [f64; 3] = std::array::from_fn(|a| {
            self.bodies
                .iter()
                .map(|b| b.position[a])
                .fold(f64::NEG_INFINITY, f64::max)
                - self
                    .bodies
                    .iter()
                    .map(|b| b.position[a])
                    .fold(f64::INFINITY, f64::min)
        });
        let axes = if self.bodies.iter().any(|b| b.dimension == 2) {
            2
        } else {
            3
        };
        let axis = (0..axes)
            .max_by(|&a, &b| spread[a].total_cmp(&spread[b]).then(b.cmp(&a)))
            .unwrap_or(0);
        order.sort_by(|&i, &j| {
            bounds[i].0[axis]
                .total_cmp(&bounds[j].0[axis])
                .then(i.cmp(&j))
        });
        self.contacts.clear();
        self.candidates = 0;
        for (offset, &i) in order.iter().enumerate() {
            for &j in &order[offset + 1..] {
                let a = &self.bodies[i];
                let b = &self.bodies[j];
                if bounds[j].0[axis] > bounds[i].1[axis] {
                    break;
                }
                if (0..a.dimension as usize)
                    .any(|k| bounds[i].0[k] > bounds[j].1[k] || bounds[j].0[k] > bounds[i].1[k])
                    || self.ignored_pairs.contains(&(i.min(j), i.max(j)))
                    || a.dimension != b.dimension
                    || a.layer & b.mask == 0
                    || b.layer & a.mask == 0
                {
                    continue;
                }
                self.candidates += 1;
                if let Some((normal, depth, points)) = collision(a, b, geometry[i], geometry[j]) {
                    for point in points {
                        self.contacts.push(Contact {
                            a: i,
                            b: j,
                            normal,
                            depth,
                            point,
                            trigger: a.trigger || b.trigger,
                            relative_velocity: sub(
                                point_velocity(a, point),
                                point_velocity(b, point),
                            ),
                            impulse: 0.0,
                        });
                    }
                }
            }
        }
        if self.contacts.is_empty() {
            self.steps += 1;
            return;
        }
        // One positional correction per pair, independent of manifold point count.
        let mut corrected = None;
        for c in &self.contacts {
            if c.trigger || corrected == Some((c.a, c.b)) {
                continue;
            }
            corrected = Some((c.a, c.b));
            let mass = dot(c.normal, linear_mass(&self.bodies[c.a], c.normal))
                + dot(c.normal, linear_mass(&self.bodies[c.b], c.normal));
            if mass <= 0.0 {
                continue;
            }
            let correction = mul(c.normal, (c.depth - 0.0001).max(0.0) * 0.8 / mass);
            self.bodies[c.a].position = sub(
                self.bodies[c.a].position,
                linear_mass(&self.bodies[c.a], correction),
            );
            self.bodies[c.b].position = add(
                self.bodies[c.b].position,
                linear_mass(&self.bodies[c.b], correction),
            );
        }
        let bounce: Vec<f64> = self
            .contacts
            .iter()
            .map(|c| {
                let a = &self.bodies[c.a];
                let b = &self.bodies[c.b];
                let speed = dot(
                    sub(point_velocity(b, c.point), point_velocity(a, c.point)),
                    c.normal,
                );
                if speed < -1.0 {
                    -a.restitution.min(b.restitution) * speed
                } else {
                    0.0
                }
            })
            .collect();
        // Body orientation/shape and contact positions do not change during velocity iterations.
        let inertia: Vec<Inertia> = self.bodies.iter().map(Inertia::new).collect();
        let mass: Vec<ContactMass> = self
            .contacts
            .iter()
            .map(|c| {
                ContactMass::new(
                    &self.bodies[c.a],
                    &self.bodies[c.b],
                    c.point,
                    &inertia[c.a],
                    &inertia[c.b],
                )
            })
            .collect();
        let normal_mass: Vec<f64> = self
            .contacts
            .iter()
            .zip(&mass)
            .map(|(c, m)| m.effective(c.normal))
            .collect();
        let friction: Vec<f64> = self
            .contacts
            .iter()
            .map(|c| (self.bodies[c.a].friction * self.bodies[c.b].friction).sqrt())
            .collect();
        let mut accumulated = vec![0.0; self.contacts.len()];
        for _ in 0..12 {
            for (i, c) in self.contacts.iter().enumerate() {
                if c.trigger {
                    continue;
                }
                let a = &self.bodies[c.a];
                let b = &self.bodies[c.b];
                let normal_mass = normal_mass[i];
                if normal_mass < 1e-12 {
                    continue;
                }
                let relative = sub(point_velocity(b, c.point), point_velocity(a, c.point));
                let speed = dot(relative, c.normal);
                let next = (accumulated[i] + (bounce[i] - speed) / normal_mass).max(0.0);
                let impulse = mul(c.normal, next - accumulated[i]);
                accumulated[i] = next;
                apply(
                    &mut self.bodies[c.a],
                    mul(impulse, -1.0),
                    &mass[i].linear_a,
                    &mass[i].angular_a,
                );
                apply(
                    &mut self.bodies[c.b],
                    impulse,
                    &mass[i].linear_b,
                    &mass[i].angular_b,
                );
                let a = &self.bodies[c.a];
                let b = &self.bodies[c.b];
                let relative = sub(point_velocity(b, c.point), point_velocity(a, c.point));
                let tangent = sub(relative, mul(c.normal, dot(relative, c.normal)));
                let len = dot(tangent, tangent).sqrt();
                if len > 1e-12 {
                    let tangent = mul(tangent, 1.0 / len);
                    let tangent_mass = mass[i].effective(tangent);
                    if tangent_mass > 1e-12 {
                        let limit = friction[i] * accumulated[i];
                        let impulse = mul(tangent, (-len / tangent_mass).clamp(-limit, limit));
                        apply(
                            &mut self.bodies[c.a],
                            mul(impulse, -1.0),
                            &mass[i].linear_a,
                            &mass[i].angular_a,
                        );
                        apply(
                            &mut self.bodies[c.b],
                            impulse,
                            &mass[i].linear_b,
                            &mass[i].angular_b,
                        );
                    }
                }
            }
        }
        for (c, impulse) in self.contacts.iter_mut().zip(accumulated) {
            c.impulse = impulse;
        }
        self.steps += 1;
    }
    /// Closest oriented shape hit. Includes triggers and honors dimensions/masks.
    pub fn raycast(
        &self,
        origin: [f64; 3],
        direction: [f64; 3],
        max: f64,
        dimension: u32,
        mask: u32,
    ) -> Option<(usize, f64)> {
        if ![2, 3].contains(&dimension)
            || !max.is_finite()
            || max < 0.0
            || origin
                .iter()
                .chain(direction.iter())
                .any(|v| !v.is_finite())
        {
            return None;
        }
        let mut direction = direction;
        if dimension == 2 {
            direction[2] = 0.0;
        }
        if dot(direction, direction) < 1e-24 {
            return None;
        }
        let d = unit(direction);
        let mut best = max;
        let mut hit = None;
        for (index, b) in self.bodies.iter().enumerate() {
            if b.dimension != dimension || b.layer & mask == 0 {
                continue;
            }
            let distance = if b.sphere {
                let mut v = sub(origin, b.position);
                if dimension == 2 {
                    v[2] = 0.0;
                }
                let c = dot(v, v) - b.half[0] * b.half[0];
                let q = dot(v, d);
                let disc = q * q - c;
                if c <= 0.0 {
                    Some(0.0)
                } else if disc >= 0.0 && -q - disc.sqrt() >= 0.0 {
                    Some(-q - disc.sqrt())
                } else {
                    None
                }
            } else {
                let ax = axes(b);
                let v = sub(origin, b.position);
                let mut near: f64 = 0.0;
                let mut far = best;
                for axis in ax.iter().enumerate().take(dimension as usize) {
                    let (i, n) = axis;
                    let o = dot(v, *n);
                    let direction = dot(d, *n);
                    if direction.abs() < 1e-12 {
                        if o.abs() > b.half[i] {
                            far = -1.0;
                        }
                    } else {
                        let x = (-b.half[i] - o) / direction;
                        let y = (b.half[i] - o) / direction;
                        near = near.max(x.min(y));
                        far = far.min(x.max(y));
                    }
                }
                if near <= far { Some(near) } else { None }
            };
            match distance {
                Some(t) if t <= best && (hit.is_none() || t < best) => {
                    best = t;
                    hit = Some((index, t));
                }
                _ => {}
            }
        }
        hit
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn body(position: [f64; 3], dynamic: bool, dimension: u32, sphere: bool) -> Body {
        Body {
            position,
            velocity: [0.0; 3],
            rotation: [0.0, 0.0, 0.0, 1.0],
            angular_velocity: [0.0; 3],
            freeze_rotation: false,
            gravity: [0.0, -9.81, 0.0],
            linear_damping: 0.0,
            angular_damping: 0.0,
            kinematic: false,
            sleeping: false,
            constraints: 0,
            continuous: false,
            half: [0.5; 3],
            inverse_mass: if dynamic { 1.0 } else { 0.0 },
            restitution: 0.0,
            friction: 0.5,
            gravity_scale: 1.0,
            dimension,
            sphere,
            trigger: false,
            layer: 1,
            mask: u32::MAX,
        }
    }
    #[test]
    fn golden_falling_shapes_rest_and_repeat() {
        for dimension in [2, 3] {
            for sphere in [false, true] {
                let simulate = || {
                    let mut w = World::default();
                    let mut ground = body([0.0, -1.0, 0.0], false, dimension, false);
                    ground.half = [10.0, 0.5, 10.0];
                    w.add(ground).unwrap();
                    w.add(body([0.0, 3.0, 0.0], true, dimension, sphere))
                        .unwrap();
                    for _ in 0..600 {
                        w.step();
                    }
                    assert!(w.bodies[1].position[1].abs() < 0.01);
                    assert!(w.bodies[1].velocity[1].abs() < 0.01);
                    assert_eq!(w.steps, 600);
                    w.bodies
                };
                assert_eq!(simulate(), simulate());
            }
        }
    }
    #[test]
    fn triggers_layers_and_dimensions_do_not_resolve() {
        for mode in 0..3 {
            let mut w = World::default();
            let mut a = body([0.0; 3], true, 2, false);
            a.gravity_scale = 0.0;
            let mut b = body([0.0; 3], false, 2, false);
            match mode {
                0 => b.trigger = true,
                1 => b.mask = 0,
                _ => b.dimension = 3,
            }
            w.add(a).unwrap();
            w.add(b).unwrap();
            w.step();
            assert_eq!(w.bodies[0].position, [0.0; 3]);
            assert_eq!(!w.contacts.is_empty(), mode == 0);
        }
    }
    #[test]
    fn equal_mass_impulse_and_friction_are_bounded() {
        let mut w = World::default();
        let mut a = body([-0.4, 0.0, 0.0], true, 3, true);
        a.gravity_scale = 0.0;
        a.restitution = 1.0;
        a.velocity[0] = 1.0;
        let mut b = a.clone();
        b.position[0] = 0.4;
        b.velocity[0] = -1.0;
        w.add(a).unwrap();
        w.add(b).unwrap();
        w.step();
        assert!((w.bodies[0].velocity[0] + 1.0).abs() < 1e-10);
        assert!((w.bodies[1].velocity[0] - 1.0).abs() < 1e-10);
    }
    #[test]
    fn raycasts_choose_closest_shape_and_filter_layers() {
        let mut w = World::default();
        w.add(body([0.0; 3], false, 3, true)).unwrap();
        w.add(body([3.0, 0.0, 0.0], false, 3, false)).unwrap();
        assert_eq!(
            w.raycast([-2.0, 0.0, 0.0], [1.0, 0.0, 0.0], 10.0, 3, 1),
            Some((0, 1.5))
        );
        assert_eq!(
            w.raycast([0.0; 3], [1.0, 0.0, 0.0], 10.0, 3, 1),
            Some((0, 0.0))
        );
        assert_eq!(
            w.raycast([-2.0, 0.0, 0.0], [1.0, 0.0, 0.0], 10.0, 3, 2),
            None
        );
        assert_eq!(w.raycast([-2.0, 0.0, 0.0], [0.0; 3], 10.0, 3, 1), None);
    }
    #[test]
    fn broad_phase_prunes_separated_bodies_and_rejects_bad_inputs() {
        let mut w = World::default();
        for i in 0..2048 {
            w.add(body([f64::from(i) * 2.0, 0.0, 0.0], false, 3, false))
                .unwrap();
        }
        assert!(w.add(body([5000.0, 0.0, 0.0], true, 3, false)).is_ok());
        w.step();
        assert_eq!(w.candidates, 0);
        let mut w = World::default();
        assert!(w.add(body([f64::NAN; 3], true, 3, false)).is_err());
    }
}

#[cfg(test)]
mod angular_tests {
    use super::*;
    fn body(position: [f64; 3], dynamic: bool, dimension: u32) -> Body {
        Body {
            position,
            velocity: [0.0; 3],
            rotation: [0.0, 0.0, 0.0, 1.0],
            angular_velocity: [0.0; 3],
            freeze_rotation: false,
            gravity: [0.0, -9.81, 0.0],
            linear_damping: 0.0,
            angular_damping: 0.0,
            kinematic: false,
            sleeping: false,
            constraints: 0,
            continuous: false,
            half: [0.5; 3],
            inverse_mass: if dynamic { 1.0 } else { 0.0 },
            restitution: 0.0,
            friction: 0.4,
            gravity_scale: 1.0,
            dimension,
            sphere: false,
            trigger: false,
            layer: 1,
            mask: u32::MAX,
        }
    }
    #[test]
    fn offset_impacts_generate_torque_and_frozen_bodies_do_not_spin() {
        for dim in [2, 3] {
            for freeze in [false, true] {
                let mut w = World::default();
                w.add(body([0.0, -0.5, 0.0], false, dim)).unwrap();
                let mut b = body([0.65, 1.0, 0.0], true, dim);
                b.freeze_rotation = freeze;
                w.add(b).unwrap();
                let mut spin: f64 = 0.0;
                for _ in 0..90 {
                    w.step();
                    spin = spin.max(
                        dot(w.bodies[1].angular_velocity, w.bodies[1].angular_velocity).sqrt(),
                    );
                }
                if freeze {
                    assert_eq!(spin, 0.0);
                } else {
                    assert!(spin > 0.1, "dim {dim}: {spin}");
                    assert!(
                        (w.bodies[1].rotation.iter().map(|v| v * v).sum::<f64>() - 1.0).abs()
                            < 1e-10
                    );
                }
            }
        }
    }
    #[test]
    fn rotated_boxes_use_oriented_sat_and_raycast() {
        let mut w = World::default();
        let mut b = body([0.0; 3], false, 2);
        b.half = [2.0, 0.1, 0.5];
        let angle = std::f64::consts::FRAC_PI_4;
        b.rotation = [0.0, 0.0, (angle * 0.5).sin(), (angle * 0.5).cos()];
        w.add(b).unwrap();
        w.add(body([0.0, 1.5, 0.0], false, 2)).unwrap();
        w.step();
        assert!(w.contacts.is_empty());
        let hit = w
            .raycast([-3.0, 0.0, 0.0], [1.0, 0.0, 0.0], 10.0, 2, 1)
            .unwrap();
        assert!(hit.1 > 2.8 && hit.1 < 3.0);
    }
    #[test]
    fn flat_centered_manifold_has_no_artificial_corner_torque() {
        for dim in [2, 3] {
            let mut w = World::default();
            let mut ground = body([0.0, -1.0, 0.0], false, dim);
            ground.half = [10.0, 0.5, 10.0];
            w.add(ground).unwrap();
            w.add(body([0.0, 2.0, 0.0], true, dim)).unwrap();
            for _ in 0..300 {
                w.step();
            }
            assert!(w.bodies[1].position[0].abs() < 0.02);
            assert!(w.bodies[1].angular_velocity[2].abs() < 0.02);
        }
    }
}

#[cfg(test)]
mod expanded_api_tests {
    use super::*;
    fn body(position: [f64; 3], dynamic: bool) -> Body {
        Body {
            position,
            velocity: [0.0; 3],
            rotation: [0.0, 0.0, 0.0, 1.0],
            angular_velocity: [0.0; 3],
            freeze_rotation: false,
            gravity: [0.0, -9.81, 0.0],
            linear_damping: 0.0,
            angular_damping: 0.0,
            kinematic: false,
            sleeping: false,
            constraints: 0,
            continuous: false,
            half: [0.5; 3],
            inverse_mass: if dynamic { 1.0 } else { 0.0 },
            restitution: 0.0,
            friction: 0.5,
            gravity_scale: 1.0,
            dimension: 3,
            sphere: false,
            trigger: false,
            layer: 1,
            mask: u32::MAX,
        }
    }
    #[test]
    fn kinematic_velocity_and_custom_gravity_integrate() {
        let mut w = World::default();
        let mut a = body([0.0, 4.0, 0.0], false);
        a.kinematic = true;
        a.velocity = [3.0, 0.0, 0.0];
        w.add(a).unwrap();
        let mut b = body([4.0, 4.0, 0.0], true);
        b.gravity = [6.0, 0.0, 0.0];
        w.add(b).unwrap();
        w.step();
        assert!((w.bodies[0].position[0] - 0.05).abs() < 1e-9);
        assert_eq!(w.bodies[0].position[1], 4.0);
        assert!((w.bodies[1].velocity[0] - 0.1).abs() < 1e-9);
    }
    #[test]
    fn damping_and_axis_constraints_affect_real_integration() {
        let mut w = World::default();
        let mut a = body([0.0, 4.0, 0.0], true);
        a.velocity = [6.0, 6.0, 6.0];
        a.angular_velocity = [2.0, 2.0, 2.0];
        a.linear_damping = 60.0;
        a.angular_damping = 60.0;
        a.gravity_scale = 0.0;
        a.constraints = 2 | 32;
        w.add(a).unwrap();
        w.step();
        assert_eq!(w.bodies[0].velocity, [0.0, 3.0, 3.0]);
        assert_eq!(w.bodies[0].angular_velocity, [1.0, 0.0, 1.0]);
        assert_eq!(w.bodies[0].position[0], 0.0);
    }
    #[test]
    fn sleeping_body_stays_and_collision_wakes_it() {
        let mut w = World::default();
        let mut a = body([0.0, 0.0, 0.0], true);
        a.sleeping = true;
        w.add(a).unwrap();
        w.step();
        assert_eq!(w.bodies[0].position, [0.0; 3]);
        let mut b = body([-1.0, 0.0, 0.0], true);
        b.velocity = [6.0, 0.0, 0.0];
        b.gravity_scale = 0.0;
        w.add(b).unwrap();
        w.step();
        assert!(!w.bodies[0].sleeping);
    }
    #[test]
    fn pair_filter_and_pre_solver_evidence_are_real() {
        for ignore in [false, true] {
            let mut w = World::default();
            let mut a = body([0.0, 0.0, 0.0], true);
            a.velocity = [6.0, 0.0, 0.0];
            a.gravity_scale = 0.0;
            w.add(a).unwrap();
            w.add(body([1.0, 0.0, 0.0], false)).unwrap();
            if ignore {
                w.ignored_pairs.insert((0, 1));
            }
            w.step();
            if ignore {
                assert!(w.contacts.is_empty());
                assert_eq!(w.bodies[0].velocity[0], 6.0);
            } else {
                assert!(!w.contacts.is_empty());
                assert_eq!(w.contacts[0].relative_velocity[0], 6.0);
                assert!(w.contacts.iter().any(|c| c.impulse > 0.0));
            }
        }
    }
    #[test]
    fn bounded_continuous_substeps_stop_fast_box_at_thin_wall() {
        for continuous in [false, true] {
            let mut w = World::default();
            let mut a = body([-2.0, 0.0, 0.0], true);
            a.half = [0.05; 3];
            a.velocity = [240.0, 0.0, 0.0];
            a.gravity_scale = 0.0;
            a.continuous = continuous;
            w.add(a).unwrap();
            let mut wall = body([0.0; 3], false);
            wall.half = [0.05, 2.0, 2.0];
            w.add(wall).unwrap();
            w.step();
            assert_eq!(w.steps, 1);
            if continuous {
                assert!(w.bodies[0].position[0] < 0.1);
                assert!(!w.contacts.is_empty());
            } else {
                assert!(w.bodies[0].position[0] > 1.0);
            }
        }
    }
}
