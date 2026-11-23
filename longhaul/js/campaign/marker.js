// Long Haul – the objective marker: a tall column of light over the place the current objective sends you to (seen from
// kilometres away, fading out as you arrive), and a bobbing chevron over the person or thing to use once you are there.
// Hidden while a scene plays. aim = { pos: Vector3 | null, over: Object3D | null, person } from Campaign.markerTarget().
import * as THREE from "three";
import { toWorld } from "../core/origin.js";

const COLOR = 0xffc23d, DEST_COLOR = 0x4fa8ff;
const ARRIVE = 70;          // metres: the beam fades out inside this
const NEAR = 140;           // metres: the chevron shows inside this
const HORIZON = 4500;       // metres: farther places get their beam this far out along the way (inside the camera's far plane)

export class Marker {
  constructor(parent) {
    const beamMat = new THREE.MeshBasicMaterial({ color: COLOR, transparent: true, opacity: 0.25, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 260, 20, 1, true), beamMat);
    this.beam.name = "objective-beam"; this.beam.renderOrder = 5; this.beam.frustumCulled = false;
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 260, 8, 1, true), beamMat.clone());
    core.material.opacity = 0.5;
    this.beam.add(core);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(5.5, 6.3, 48), new THREE.MeshBasicMaterial({ color: COLOR, transparent: true, opacity: 0.5, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2;
    const chev = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 4), new THREE.MeshBasicMaterial({ color: COLOR, fog: false, depthTest: false, transparent: true }));
    cone.rotation.x = Math.PI;                 // pointing down at the person
    cone.renderOrder = 10;
    chev.add(cone);
    this.chev = chev;
    // the player's own destination: the same beam, in blue
    this.dest = this.beam.clone();
    this.dest.material = beamMat.clone(); this.dest.material.color.set(DEST_COLOR);
    this.dest.children[0].material = beamMat.clone(); this.dest.children[0].material.color.set(DEST_COLOR);
    this.beam.visible = this.ring.visible = this.chev.visible = this.dest.visible = false;
    parent.add(this.beam, this.ring, this.chev, this.dest);
    this.t = 0;
    this.tops = new WeakMap();
  }

  update(dt, aim, me, hidden, wp) {
    this.t += dt;
    this.updateDest(wp, me, hidden);
    const show = !!aim && !hidden;
    // beam over the destination
    const d = show && aim.pos ? Math.hypot(aim.pos.x - me.x, aim.pos.z - me.z) : 0;
    const beam = show && !!aim.pos && d > ARRIVE * 0.6;
    this.beam.visible = beam;
    this.ring.visible = beam && d < 600;
    if (beam) {
      const far = d > HORIZON, k0 = far ? HORIZON / d : 1;
      const bx = me.x + (aim.pos.x - me.x) * k0, bz = me.z + (aim.pos.z - me.z) * k0;
      this.beam.position.set(bx, (far ? me.y : aim.pos.y) + 130, bz);
      const k = Math.min(1, (d - ARRIVE * 0.6) / ARRIVE);
      this.beam.material.opacity = 0.08 + 0.2 * k;
      this.beam.children[0].material.opacity = 0.2 + 0.35 * k;
      this.beam.scale.set(1 + Math.min(4, d / 1500), 1, 1 + Math.min(4, d / 1500));     // stays readable from far off
      this.ring.position.set(bx, aim.pos.y + 0.15, bz);
      this.ring.material.opacity = 0.25 + 0.2 * Math.sin(this.t * 3);
    }
    // chevron over who or what to use
    const o = show ? aim.over : null;
    let chev = false;
    if (o && o.parent) {
      // world positions come back in render space (floating origin): the marker lives in absolute coordinates
      const p = toWorld(o.getWorldPosition(this.chev.position));
      if (Math.hypot(p.x - me.x, p.z - me.z) < NEAR) {
        chev = true;
        p.y += this.top(o, aim.person) + 0.35 + Math.sin(this.t * 3.2) * 0.12;
        this.chev.rotation.y = this.t * 1.6;
      }
    }
    this.chev.visible = chev;
  }
  updateDest(wp, me, hidden) {
    const d = wp ? Math.hypot(wp.x - me.x, wp.z - me.z) : 0;
    this.dest.visible = !!wp && !hidden && d > 20;
    if (!this.dest.visible) return;
    const k0 = d > HORIZON ? HORIZON / d : 1;
    this.dest.position.set(me.x + (wp.x - me.x) * k0, me.y + 130, me.z + (wp.z - me.z) * k0);
    const s = 0.6 + Math.min(4, d / 1500);
    this.dest.scale.set(s, 1, s);
    this.dest.material.opacity = 0.06 + 0.16 * Math.min(1, d / 200);
  }
  // Height of an object above its origin (people: their head)
  top(o, person) {
    if (person) return 1.95;
    let h = this.tops.get(o);
    if (h === undefined) {
      const b = new THREE.Box3().setFromObject(o), p = o.getWorldPosition(new THREE.Vector3());
      h = isFinite(b.max.y) ? Math.max(0.2, b.max.y - p.y) : 0.5;
      this.tops.set(o, h);
    }
    return h;
  }
}
