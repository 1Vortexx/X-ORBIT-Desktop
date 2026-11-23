// Long Haul – people: local detours. When someone walking somewhere gets stuck against something (a fence, a parked
// car, a building corner, a tree), plan a way round it over a small grid of the space about them: each cell is free
// if a person fits there against the real colliders; a breadth-first search from where they stand reaches every
// free cell it can, and the route goes to the reachable cell nearest the destination. The route is then pulled
// tight (corners only where the straight line would hit something). Pure and synchronous; a few ms at most.
import { circleFree } from "../core/collide.js";

const HALF = 12, CELL = 0.5, N = Math.round(HALF * 2 / CELL), R = 0.3;
const free = new Uint8Array(N * N), prev = new Int32Array(N * N), queue = new Int32Array(N * N);

// from: {x,y,z}; dest: {x,z}; getColliders(x,z,r) → colliders. Returns [{x,z}, …] (the waypoints, ending as near
// the destination as can be reached) or null when no cell nearer than where they stand can be reached.
export function planDetour(from, dest, getColliders) {
  const ox = from.x - HALF, oz = from.z - HALF, y0 = from.y + 0.12, y1 = from.y + 1.6;
  const cols = getColliders(from.x, from.z, HALF + 2) || [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++)
    free[j * N + i] = circleFree(ox + (i + 0.5) * CELL, oz + (j + 0.5) * CELL, R, cols, y0, y1) ? 1 : 0;
  const cellOf = (x, z) => [Math.max(0, Math.min(N - 1, Math.floor((x - ox) / CELL))), Math.max(0, Math.min(N - 1, Math.floor((z - oz) / CELL)))];
  const [si, sj] = cellOf(from.x, from.z), start = sj * N + si;
  free[start] = 1;                                   // wherever they are standing counts as free
  prev.fill(-1); prev[start] = start;
  let head = 0, tail = 0, best = start;
  const d2 = (c) => { const x = ox + (c % N + 0.5) * CELL - dest.x, z = oz + (Math.floor(c / N) + 0.5) * CELL - dest.z; return x * x + z * z; };
  let bestD = d2(start);
  queue[tail++] = start;
  while (head < tail) {
    const c = queue[head++], ci = c % N, cj = (c - ci) / N;
    const dc = d2(c); if (dc < bestD) { bestD = dc; best = c; }
    for (let k = 0; k < 8; k++) {
      const di = [1, -1, 0, 0, 1, 1, -1, -1][k], dj = [0, 0, 1, -1, 1, -1, 1, -1][k], ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const nc = nj * N + ni;
      if (!free[nc] || prev[nc] !== -1) continue;
      if (di && dj && (!free[cj * N + ni] || !free[nj * N + ci])) continue;   // no squeezing diagonally past a corner
      prev[nc] = c; queue[tail++] = nc;
    }
  }
  if (best === start) return null;
  // walk back, then keep only the corners a straight line can't skip
  const cells = [];
  for (let c = best; c !== start; c = prev[c]) cells.push(c);
  cells.push(start); cells.reverse();
  const pt = (c) => ({ x: ox + (c % N + 0.5) * CELL, z: oz + (Math.floor(c / N) + 0.5) * CELL });
  const clear = (a, b) => {
    const A = pt(a), B = pt(b), steps = Math.ceil(Math.hypot(B.x - A.x, B.z - A.z) / (CELL * 0.5));
    for (let s = 1; s < steps; s++) { const [i, j] = cellOf(A.x + (B.x - A.x) * s / steps, A.z + (B.z - A.z) * s / steps); if (!free[j * N + i]) return false; }
    return true;
  };
  const out = [];
  let at = 0;
  while (at < cells.length - 1) {
    let far = cells.length - 1;
    while (far > at + 1 && !clear(cells[at], cells[far])) far--;
    out.push(pt(cells[far])); at = far;
  }
  // the last waypoint is the real destination when it was reached
  if (bestD < CELL * CELL) out[out.length - 1] = { x: dest.x, z: dest.z };
  return out;
}
