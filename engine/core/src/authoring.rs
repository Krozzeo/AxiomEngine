//! Compiled authoring transforms and camera, shared by WebGPU and Null hosts.
use crate::{PersistentId, Transform};

pub type Matrix = [f32; 16];

#[derive(Clone)]
pub struct RuntimeMesh {
    pub entity: PersistentId,
    pub transform: Transform,
    pub vertices: u32,
}

#[derive(Default)]
pub struct RuntimeScene {
    pub meshes: Vec<RuntimeMesh>,
}

pub fn multiply(a: Matrix, b: Matrix) -> Matrix {
    let mut output = [0.0; 16];
    for column in 0..4 {
        for row in 0..4 {
            output[column * 4 + row] = (0..4).map(|k| a[k * 4 + row] * b[column * 4 + k]).sum();
        }
    }
    output
}

pub fn model(transform: Transform) -> Matrix {
    let q = transform.rotation;
    let length = (q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w).sqrt();
    let (x, y, z, w) = (q.x / length, q.y / length, q.z / length, q.w / length);
    let s = transform.scale;
    let p = transform.position;
    [
        (1.0 - 2.0 * y * y - 2.0 * z * z) * s.x,
        (2.0 * x * y + 2.0 * w * z) * s.x,
        (2.0 * x * z - 2.0 * w * y) * s.x,
        0.0,
        (2.0 * x * y - 2.0 * w * z) * s.y,
        (1.0 - 2.0 * x * x - 2.0 * z * z) * s.y,
        (2.0 * y * z + 2.0 * w * x) * s.y,
        0.0,
        (2.0 * x * z + 2.0 * w * y) * s.z,
        (2.0 * y * z - 2.0 * w * x) * s.z,
        (1.0 - 2.0 * x * x - 2.0 * y * y) * s.z,
        0.0,
        p.x,
        p.y,
        p.z,
        1.0,
    ]
}

fn normalize(v: [f32; 3]) -> Option<[f32; 3]> {
    let length = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
    (length.is_finite() && length > 1e-8).then(|| v.map(|n| n / length))
}
fn cross(a: [f32; 3], b: [f32; 3]) -> [f32; 3] {
    [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}
fn dot(a: [f32; 3], b: [f32; 3]) -> f32 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

pub fn camera(
    position: [f32; 3],
    target: [f32; 3],
    aspect: f32,
    orthographic: bool,
    extent: f32,
) -> Option<Matrix> {
    if !aspect.is_finite() || aspect <= 0.0 || !extent.is_finite() || extent <= 0.0 {
        return None;
    }
    let z = normalize([
        position[0] - target[0],
        position[1] - target[1],
        position[2] - target[2],
    ])?;
    let up = if z[1].abs() > 0.999 {
        [0.0, 0.0, 1.0]
    } else {
        [0.0, 1.0, 0.0]
    };
    let x = normalize(cross(up, z))?;
    let y = cross(z, x);
    let view = [
        x[0],
        y[0],
        z[0],
        0.0,
        x[1],
        y[1],
        z[1],
        0.0,
        x[2],
        y[2],
        z[2],
        0.0,
        -dot(x, position),
        -dot(y, position),
        -dot(z, position),
        1.0,
    ];
    let (near, far) = (0.01, 10000.0);
    let projection = if orthographic {
        [
            2.0 / (extent * aspect),
            0.0,
            0.0,
            0.0,
            0.0,
            2.0 / extent,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0 / (near - far),
            0.0,
            0.0,
            0.0,
            near / (near - far),
            1.0,
        ]
    } else {
        let f = 1.0 / (extent.to_radians() * 0.5).tan();
        [
            f / aspect,
            0.0,
            0.0,
            0.0,
            0.0,
            f,
            0.0,
            0.0,
            0.0,
            0.0,
            far / (near - far),
            -1.0,
            0.0,
            0.0,
            far * near / (near - far),
            0.0,
        ]
    };
    let result = multiply(projection, view);
    result.iter().all(|v| v.is_finite()).then_some(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn perspective_and_orthographic_include_the_origin() {
        for ortho in [false, true] {
            let m = camera(
                [0.0, 0.0, 6.0],
                [0.0, 0.0, 0.0],
                16.0 / 9.0,
                ortho,
                if ortho { 6.0 } else { 60.0 },
            )
            .unwrap();
            assert!(m[12].abs() < m[15] && m[13].abs() < m[15] && m[14] >= 0.0 && m[14] <= m[15]);
        }
        assert!(camera([0.0; 3], [0.0; 3], 1.0, false, 60.0).is_none());
    }
    #[test]
    fn model_applies_quaternion_scale_and_translation() {
        let mut t = Transform::identity();
        t.position.x = 4.0;
        t.scale.x = 2.0;
        t.rotation.z = (core::f32::consts::FRAC_PI_4).sin();
        t.rotation.w = (core::f32::consts::FRAC_PI_4).cos();
        let m = model(t);
        assert!((m[0]).abs() < 1e-5 && (m[1] - 2.0).abs() < 1e-5 && m[12] == 4.0);
    }
}
