// Procedural geometry generators.
// All cylinders/caps are unit-sized (r=1, h=1 along Y).
// Callers scale via model matrix to get actual disk dimensions.

const TWO_PI = Math.PI * 2;

/**
 * Cylinder body along Y axis: y=0..1, radius=1.
 * Returns { positions: Float32Array, normals: Float32Array, indices: Uint16Array }
 */
export function generateCylinder(slices = 50) {
  const vertCount = (slices + 1) * 2; // bottom + top ring, closed
  const positions = new Float32Array(vertCount * 3);
  const normals   = new Float32Array(vertCount * 3);
  const indices   = new Uint16Array(slices * 6);

  for (let i = 0; i <= slices; i++) {
    const theta = TWO_PI * i / slices;
    const cx = Math.cos(theta);
    const cz = Math.sin(theta);

    const bi = i * 2;     // bottom vertex index
    const ti = i * 2 + 1; // top vertex index

    // positions
    positions[bi*3]   = cx; positions[bi*3+1] = 0; positions[bi*3+2] = cz;
    positions[ti*3]   = cx; positions[ti*3+1] = 1; positions[ti*3+2] = cz;

    // outward radial normals
    normals[bi*3]   = cx; normals[bi*3+1] = 0; normals[bi*3+2] = cz;
    normals[ti*3]   = cx; normals[ti*3+1] = 0; normals[ti*3+2] = cz;
  }

  for (let i = 0; i < slices; i++) {
    const b0 = i * 2, t0 = i * 2 + 1;
    const b1 = (i + 1) * 2, t1 = (i + 1) * 2 + 1;
    const idx = i * 6;
    indices[idx]   = b0; indices[idx+1] = t0; indices[idx+2] = b1;
    indices[idx+3] = b1; indices[idx+4] = t0; indices[idx+5] = t1;
  }

  return { positions, normals, indices };
}

/**
 * Flat disk cap. faceDown=true → y=0, normal (0,-1,0).
 *                faceDown=false → y=1, normal (0,1,0).
 * Returns { positions: Float32Array, normals: Float32Array, indices: Uint16Array }
 */
export function generateDiskCap(slices = 50, faceDown = true) {
  const vertCount = slices + 1; // center + ring
  const positions = new Float32Array(vertCount * 3);
  const normals   = new Float32Array(vertCount * 3);
  const indices   = new Uint16Array(slices * 3);

  const y  = faceDown ? 0 : 1;
  const ny = faceDown ? -1 : 1;

  // Center vertex at index 0
  positions[0] = 0; positions[1] = y; positions[2] = 0;
  normals[0]   = 0; normals[1]   = ny; normals[2]  = 0;

  for (let i = 0; i < slices; i++) {
    const theta = TWO_PI * i / slices;
    const v = i + 1;
    positions[v*3]   = Math.cos(theta);
    positions[v*3+1] = y;
    positions[v*3+2] = Math.sin(theta);
    normals[v*3]   = 0; normals[v*3+1] = ny; normals[v*3+2] = 0;
  }

  for (let i = 0; i < slices; i++) {
    const next = (i + 1) % slices;
    const idx  = i * 3;
    if (faceDown) {
      // normal -Y: (center, ring[i], ring[next])
      indices[idx]   = 0;
      indices[idx+1] = i + 1;
      indices[idx+2] = next + 1;
    } else {
      // normal +Y: (center, ring[next], ring[i])
      indices[idx]   = 0;
      indices[idx+1] = next + 1;
      indices[idx+2] = i + 1;
    }
  }

  return { positions, normals, indices };
}

/**
 * Floor quad at y=0.
 * World coords: x: -2.5..10.5, z: -2.5..2.5
 * Per-vertex gradient colors matching the original.
 * Returns { positions, normals, colors } — 4 vertices, draw as TRIANGLE_STRIP.
 */
export function generateFloor() {
  // Vertex layout for TRIANGLE_STRIP: v0(10.5,2.5), v1(10.5,-2.5), v2(-2.5,2.5), v3(-2.5,-2.5)
  const positions = new Float32Array([
     10.5, 0,  2.5,
     10.5, 0, -2.5,
     -2.5, 0,  2.5,
     -2.5, 0, -2.5,
  ]);
  const normals = new Float32Array([
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
  ]);
  // Dark blue gradient, matching C++ original
  const colors = new Float32Array([
    0.1, 0.1, 0.2,
    0.1, 0.1, 0.1,
    0.2, 0.2, 0.3,
    0.1, 0.1, 0.2,
  ]);
  return { positions, normals, colors };
}
