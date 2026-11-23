// Long Haul – small mesh helpers shared by the campaign's story objects (plain boxes, cached materials).
import * as THREE from "three";

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.75, metalness: o.m ?? 0 });
const MATS = {};
export const M = (k, c, o) => MATS[k] || (MATS[k] = mat(c, o));
export function box(parent, w, h, d, m, x, y, z) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z); b.castShadow = b.receiveShadow = true;
  parent.add(b);
  return b;
}
