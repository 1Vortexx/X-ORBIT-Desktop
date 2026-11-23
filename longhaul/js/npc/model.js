// All positions are metres above the soles. Limbs pivot at their joints so sitting works in the same rig as walking.
import * as THREE from "three";
import { rng } from "../world/terrain.js";
import { J, poseFor } from "./pose.js";

const shape = {
  oval: new THREE.SphereGeometry(1, 10, 8),
  boot: new THREE.BoxGeometry(1, 1, 1),
  sleeve: new THREE.CylinderGeometry(0.88, 1, 1, 8),
};
const palette = new Map();
function cloth(color) {
  if (!palette.has(color)) palette.set(color, new THREE.MeshStandardMaterial({color, roughness: 0.94}));
  return palette.get(color);
}
function joint(parent, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}
function part(parent, kind, color, x,y,z, w,h,d) {
  const mesh = new THREE.Mesh(shape[kind], cloth(color));
  mesh.position.set(x,y,z);
  mesh.scale.set(w,h,d);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
// Joints: body (root) → hips → spine → shoulders → elbows → hands, and head; hips → legs → knees → ankles.
// opts.age (years) greys the hair and shortens the person a touch; the rig remembers it for the gait.
export function buildPerson(seed, role, opts = {}) {
  const R = rng(seed), pick = a => a[Math.floor(R()*a.length)];
  const skin = pick([0x875a42,0xb87956,0xd6a17b,0x704e3f,0xd6aa89]);
  let shirt = pick([0x546458,0x855142,0x555f71,0xac8864,0x776e5f]);
  let pants = pick([0x484844,0x405263,0x595645]);
  const age = opts.age ?? Math.round(19 + R()*52);
  let hair = pick([0x332b28,0x695143,0x786556,0x383332]);
  if (age > 52) hair = new THREE.Color(hair).lerp(new THREE.Color(0xc9c4bc), Math.min(1, (age - 52) / 20)).getHex();
  if (role === "police") { shirt = 0x2f4566; pants = 0x1c2433; }   // navy uniform (the picks above still run, so looks stay seeded)
  const mesh = new THREE.Group(), body = joint(mesh,0,0,0);
  const height = (0.92 + R()*0.14) * (age > 65 ? 0.97 : 1);
  body.scale.set(0.90+R()*0.20,height,height);
  const hips = joint(body,0,.888,0);
  part(hips,"sleeve",pants,0,.012,0,.194,.11,.137);
  const spine = joint(hips,0,.06,0);
  part(spine,"sleeve",shirt,0,.192,0,.215,.53,.147);
  part(spine,"sleeve",skin,0,.492,0,.067,.13,.069);
  const head = joint(spine,0,.637,0);
  part(head,"oval",skin,0,0,.014,.117,.153,.117);
  part(head,"oval",skin,0,.005,.124,.030,.037,.027);
  part(head,"oval",hair,0,.077,-.018,.121,.09,.121);
  const face = buildFace(head, R, skin, hair);
  if (R()<.62 || role === "police") {
    part(head,"sleeve",pants,0,.121,-.01,.134,.07,.136);
    part(head,"oval",pants,0,.093,.064,.142,.015,.147);
  }
  if (role === "police") {
    part(spine,"oval",0xd8b552,-.11,.38,.075,.03,.035,.012);          // badge
    part(hips,"sleeve",0x15191f,0,.07,0,.2,.05,.142);                  // duty belt
  }
  if (role === "hitchhiker") {
    part(spine,"oval",pants,0,.222,-.157,.165,.225,.096);
    for (const s of [-1,1]) part(spine,"boot",pants,s*.12,.292,.123,.035,.32,.023);
  }
  // [0] is the figure's right side (−x: it faces +z), [1] its left
  const arms=[], elbows=[], hands=[], legs=[], knees=[], feet=[];
  for (const s of [-1,1]) {
    const shoulder=joint(spine,s*.216,.412,0);
    part(shoulder,"sleeve",shirt,s*.008,-.122,0,.068,.265,.07);
    const elbow=joint(shoulder,s*.01,-.265,.005);
    part(elbow,"oval",skin,s*.001,-.086,.015,.049,.133,.053);
    const hand=joint(elbow,s*.002,-.19,.01);
    part(hand,"oval",skin,0,-.021,.004,.048,.068,.042);
    const hip=joint(hips,s*.103,0,0), knee=joint(hip,0,-.42,0), ankle=joint(knee,0,-.37,0);
    part(hip,"sleeve",pants,0,-.213,0,.094,.44,.098);
    part(knee,"sleeve",pants,0,-.193,0,.076,.4,.081);
    part(ankle,"boot",0x392f29,0,-.035,.039,.152,.116,.241);
    arms.push(shoulder); elbows.push(elbow); hands.push(hand); legs.push(hip); knees.push(knee); feet.push(ankle);
  }
  // Knife in the right hand, shown while the person is hostile (rig.armed, set by Npc.update)
  const knife = new THREE.Group();
  knife.position.set(0,-.04,.05); knife.rotation.x = Math.PI/2; knife.visible = false;
  const steel = new THREE.Mesh(shape.boot, new THREE.MeshStandardMaterial({color:0xc9ced4, roughness:.25, metalness:.9}));
  steel.scale.set(.006,.03,.17); steel.position.z = .1; knife.add(steel);
  const grip = new THREE.Mesh(shape.boot, cloth(0x3a2416)); grip.scale.set(.024,.028,.1); knife.add(grip);
  hands[0].add(knife);
  const style = gaitStyle(R, age);
  return {mesh,body,hips,spine,head,arms,elbows,hands,legs,knees,feet,height,knife,face,age,style,role,
    idle:{kind:null,t:0,dur:0,next:2+R()*6,R}, out:new Float32Array(J.N), t:0, seed01:R()};
}

// How someone carries themselves: from their age (and, per frame, their health)
function gaitStyle(R, age) {
  const old = Math.max(0, Math.min(1, (age - 50) / 30));
  return {
    old,
    walk: (1.32 + R()*0.22) * (1 - 0.38*old),        // m/s at an ordinary walk
    run: (4.3 + R()*0.6) * (1 - 0.7*old),             // m/s flat out (the elderly manage a hurried shuffle)
    stoop: 0.22*old + R()*0.04,                       // forward lean of the spine
    swing: 1 - 0.45*old,                              // arm swing
    stride: 1 - 0.3*old,                              // leg swing
    fidget: 0.6 + R()*0.8,                            // how often idle habits come round
    limpSide: R() < 0.5 ? 0 : 1,
  };
}
// Walking speed for this person: age, then injuries (health 0..100)
export function walkSpeed(rig, health = 100, run = false) {
  const st = rig.style, hurt = health < 70 ? 0.5 + 0.5 * Math.max(0, health) / 70 : 1;
  return (run ? Math.max(st.walk * 1.35, st.run * hurt) : st.walk * hurt);
}

const IDLES = ["look", "look", "cross", "hips", "watch", "neck", "pockets", "stretch", "shift"];
const ease = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
// s: { mode: "stand"|"sit"|"down", speed, phase, health, talk, threat, armed, strike, hitch, signal, lookYaw, sit (0..1), dt }
export function animate(p, s) {
  const dt = s.dt ?? 1/30;
  p.t += dt;
  const st = p.style, out = p.out, speed = s.speed || 0, health = s.health ?? 100;
  const hurt = health < 60 ? Math.min(1, (60 - health) / 45) : 0;
  poseFor(out, { mode: s.mode || "stand", speed: speed / Math.max(0.6, st.stride), phase: s.phase || 0, t: p.t, seed: p.seed01,
    sit: s.sit, recline: s.recline, chair: s.chair, act: s.act, turn: s.turn, lean: s.lean, talk: s.talk, hitch: s.hitch, signal: s.signal, threat: s.threat, armed: s.armed,
    strike: s.strike ?? -1, lookYaw: s.lookYaw, lookPitch: s.lookPitch });
  const stand = (s.mode || "stand") === "stand" && !(s.sit > 0);
  const moving = speed > 0.15;
  if (stand) {
    // age: a stoop, the head held forward, softer knees, less swing
    const k = moving ? 1 : 0.8;
    out[J.spineRx] += st.stoop * k; out[J.headRx] -= st.stoop * 0.6;
    out[J.kneeL] += 0.06 * st.old; out[J.kneeR] += 0.06 * st.old;
    out[J.armLRx] *= st.swing; out[J.armRRx] *= st.swing;
    out[J.legLRx] *= st.stride; out[J.legRRx] *= st.stride;
    // injuries: a limp (one leg takes less weight and swings short), a hunch, a hand held to the side
    if (hurt > 0) {
      const L = st.limpSide === 0, ph = s.phase || 0, onBad = Math.sin(ph) * (L ? 1 : -1) > 0;
      out[L ? J.legLRx : J.legRRx] *= 1 - 0.45 * hurt;
      out[L ? J.kneeL : J.kneeR] *= 1 - 0.5 * hurt;
      if (moving) { out[J.hipsY] -= (onBad ? 0.045 : 0) * hurt; out[J.spineRz] += (onBad ? 0.09 : 0) * hurt * (L ? 1 : -1); }
      out[J.spineRx] += 0.14 * hurt;
      if (hurt > 0.5 && !s.threat && !s.talk) { out[J.armLRx] = -0.5; out[J.elbL] = -1.6; out[J.armLRz] = 0.25; }
    }
    // standing about: little habits, one at a time, blended in and out
    if (!moving && !s.talk && !s.lean && !s.threat && !s.signal && !s.hitch && !(s.strike >= 0)) idleHabit(p, out, dt);
    else p.idle.kind = null;
  }
  apply(p, out, s);
}
function idleHabit(p, out, dt) {
  const I = p.idle, R = I.R;
  if (!I.kind) {
    if ((I.next -= dt) > 0) return;
    I.kind = IDLES[Math.floor(R() * IDLES.length)]; I.t = 0; I.dur = 3 + R() * 5; I.dir = R() < 0.5 ? -1 : 1;
  }
  I.t += dt;
  const w = ease(I.t / 0.7) * ease((I.dur - I.t) / 0.7), t = I.t;
  if (I.t >= I.dur) { I.kind = null; I.next = (3 + R() * 8) / p.style.fidget; return; }
  const mix = (j, v) => { out[j] = out[j] * (1 - w) + v * w; };
  switch (I.kind) {
    case "look":    out[J.headRy] += w * I.dir * 0.7 * Math.sin(Math.min(1, t / I.dur) * Math.PI); out[J.spineRy] += w * I.dir * 0.12; break;
    case "cross":   mix(J.armLRx, -0.55); mix(J.armRRx, -0.6); mix(J.elbL, -1.9); mix(J.elbR, -1.85); mix(J.armLRz, -0.15); mix(J.armRRz, 0.15); mix(J.armLRy, 0.5); mix(J.armRRy, -0.5); break;
    case "hips":    mix(J.armLRz, 0.55); mix(J.armRRz, -0.55); mix(J.elbL, -1.5); mix(J.elbR, -1.5); mix(J.armLRy, -1.2); mix(J.armRRy, 1.2); mix(J.armLRx, 0.2); mix(J.armRRx, 0.2); break;
    case "watch":   mix(J.armLRx, -1.05); mix(J.elbL, -1.55); mix(J.armLRz, -0.3); mix(J.armLRy, 1.1); mix(J.headRx, 0.42); mix(J.headRy, 0.2); break;
    case "neck":    mix(J.armRRx, -2.5); mix(J.elbR, -2.2); mix(J.armRRz, -0.35); out[J.headRx] += w * 0.15 * Math.sin(t * 2); out[J.headRy] -= w * 0.2; break;
    case "pockets": mix(J.armLRx, 0.18); mix(J.armRRx, 0.18); mix(J.elbL, -0.35); mix(J.elbR, -0.35); mix(J.armLRz, 0.13); mix(J.armRRz, -0.13); break;
    case "stretch": { const u = Math.sin(Math.min(1, t / I.dur) * Math.PI); mix(J.armLRx, -2.9 * u); mix(J.armRRx, -2.9 * u); mix(J.elbL, -0.3); mix(J.elbR, -0.3); mix(J.spineRx, -0.18 * u); mix(J.headRx, -0.3 * u); break; }
    case "shift":   out[J.hipsRz] += w * I.dir * 0.07; out[J.spineRz] -= w * I.dir * 0.06; out[I.dir > 0 ? J.kneeL : J.kneeR] += w * 0.25; out[J.legLRz] += w * I.dir * 0.04; out[J.legRRz] += w * I.dir * 0.04; break;
  }
}
// Joint angles → bones. Left = index 1, right = index 0 (see buildPerson).
function apply(p, o, s) {
  const sitK = s.mode === "sit" ? 1 : Math.max(0, Math.min(1, s.sit || 0));
  p.body.rotation.set(o[J.rootRx], 0, 0);
  p.body.position.y = s.mode === "down" ? o[J.rootY] + 0.04 : -0.888 * p.height * sitK;
  p.hips.position.y = 0.888 + o[J.hipsY] * (1 - sitK);
  p.hips.rotation.set(o[J.hipsRx], o[J.hipsRy], o[J.hipsRz]);
  p.spine.rotation.set(o[J.spineRx], o[J.spineRy], o[J.spineRz]);
  p.head.rotation.set(o[J.headRx], o[J.headRy], 0);
  const A = [[J.armRRx, J.armRRy, J.armRRz, J.elbR, J.handRRx], [J.armLRx, J.armLRy, J.armLRz, J.elbL, J.handLRx]];
  const L = [[J.legRRx, J.legRRz, J.kneeR, J.footR], [J.legLRx, J.legLRz, J.kneeL, J.footL]];
  for (let i = 0; i < 2; i++) {
    const a = A[i], l = L[i];
    p.arms[i].rotation.set(o[a[0]], o[a[1]], o[a[2]], "XZY");     // twist about the arm first, then the swing
    p.elbows[i].rotation.set(o[a[3]], 0, 0);
    p.hands[i].rotation.set(o[a[4]], 0, 0);
    p.legs[i].rotation.set(o[l[0]], 0, o[l[1]]);
    p.knees[i].rotation.set(o[l[2]], 0, 0);
    p.feet[i].rotation.set(o[l[3]], 0, 0);
  }
  if (p.knife) p.knife.visible = !!p.armed && s.mode !== "down";
}

// The old entry point (vehicle seats, the player's body): a state name and whether they're moving
export function pose(p, state, phase, moving, role) {
  const sit = state === "sit", down = state === "down";
  animate(p, { dt: 0, mode: sit ? "sit" : down ? "down" : "stand", speed: moving ? 1.4 : 0, phase,
    hitch: role === "hitchhiker" && state === "idle" && !moving ? -1 : 0,
    threat: state === "threaten", strike: state === "strike" ? 0.5 : -1, armed: !!p.armed, talk: state === "talk" });
}

// A simple cartoon face (big eyes, brows, a mouth, ears): different on everyone, blinks, and talks
const flat = (color) => {
  if (!palette.has("f"+color)) palette.set("f"+color, new THREE.MeshStandardMaterial({color, roughness: 0.6}));
  return palette.get("f"+color);
};
function feature(parent, kind, mat, x,y,z, w,h,d) {
  const m = new THREE.Mesh(shape[kind], mat);
  m.position.set(x,y,z); m.scale.set(w,h,d);
  parent.add(m);
  return m;
}
function buildFace(head, R, skin, hair) {
  const white = flat(0xf4efe6), iris = flat([0x3b2a1e,0x2e4a63,0x3f5b34,0x1c1714,0x5a4630][Math.floor(R()*5)]);
  const dark = flat(0x1a1210), lip = flat(new THREE.Color(skin).multiplyScalar(0.72).getHex());
  const spread = .038 + R()*.01, eyeY = .022 + R()*.012, big = .9 + R()*.25;
  const eyes = [], pupils = [], brows = [];
  for (const sx of [-1,1]) {
    const lid = joint(head, sx*spread, eyeY, .11);          // the eye blinks by squashing this joint
    feature(lid,"oval",white,0,0,0,.024*big,.029*big,.014);
    pupils.push(feature(lid,"oval",iris,0,-.002,.011,.013*big,.016*big,.006));
    feature(lid,"oval",dark,0,-.002,.0145,.006*big,.008*big,.003);
    eyes.push(lid);
    const brow = feature(head,"boot",flat(hair),sx*spread,eyeY+.042,.118,.036,.009,.012);
    brow.rotation.z = sx*(R()*.3 - .12);
    brows.push(brow);
    feature(head,"oval",flat(skin),sx*.116,.0,.0,.016,.034,.024);   // ears
  }
  const mouth = joint(head,0,-.068,.118);
  feature(mouth,"boot",lip,0,0,0,.05+R()*.015,.012,.012);
  const inside = feature(mouth,"boot",dark,0,-.004,.002,.04,.012,.01);
  inside.visible = false;
  return { eyes, pupils, brows, mouth, inside, blinkAt: 1 + R()*4, seed: R()*10 };
}
// Per frame for people near the camera: blink every few seconds; talking moves the mouth
export function animateFace(rig, t, talking) {
  const f = rig.face;
  if (!f) return;
  const since = (t + f.seed) % (f.blinkAt + 2.5);
  const shut = since < 0.12 ? 0.1 : 1;
  for (const e of f.eyes) e.scale.y = shut;
  const open = talking ? 0.5 + 0.5 * Math.abs(Math.sin(t * 13 + f.seed) * Math.sin(t * 5.3)) : 0;
  f.mouth.scale.y = 1 + open * 2.4;
  f.inside.visible = open > 0.25;
}
