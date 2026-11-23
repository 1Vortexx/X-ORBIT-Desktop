// Long Haul – THE RETURN TRIP: the campaign in the world. Places, story objects, the people of chapter 1, scene
// playback (subtitles; a recorded take is played instead when audio/voice/index.json lists its line id) and the HUD plate.
// Rules and progress live in state.js / chapter1.js (pure); this file only turns the world into facts and back.
//
// Places on the authored road (CAMPAIGN_SEED): Vale Garage is the start site, Mercy Motel is the first motel at least
// 10 km down the highway, and the pull-off sits halfway between them. They are never closed down by the Digimap.
import * as THREE from "three";
import { addTarget, removeAllUnder } from "../core/targets.js";
import { emit } from "../core/bus.js";
import { heightAt, roadX, roadDir, ROAD_HALF } from "../world/terrain.js";
import { startSite, nextSiteAfter, sitesBetween, siteToWorld } from "../world/sites.js";
import { ITEMS, registerItems, makeItem } from "../items.js";
import { SCRIPT } from "./script.js";
import { CampaignState, stepMissions, sceneByKey, lineOk, lineSeconds, missionView, chapterOf, SPEAKERS, weekday, nextWeekday } from "./state.js";
import { CHAPTER1, CONDS } from "./chapter1.js";
import { CHAPTER2, CONDS2 } from "./chapter2.js";
import { CHAPTER3, CONDS3 } from "./chapter3.js";
import { CHAPTER4, CONDS4 } from "./chapter4.js";
import { Chapter2World } from "./world2.js";
import { Chapter3World } from "./world3.js";
import { Chapter4World } from "./world4.js";
import { Marker } from "./marker.js";
import { M, box } from "./mesh.js";
import { CAST } from "../cast.js";

const DEFS = { ...CHAPTER1, ...CHAPTER2, ...CHAPTER3, ...CHAPTER4 };
const ALL_CONDS = { ...CONDS, ...CONDS2, ...CONDS3, ...CONDS4 };
const MOTEL_FROM = 10000;            // metres of road before Mercy Motel can appear
const PAPER_AHEAD = 32000;           // June's paper map: the highway this far past the garage
const WAYPOINT_ARRIVE = 30;          // metres: a destination you reach clears itself
const DOOR_ID = "camp:door", BATTERY_ID = "camp:battery", KIT_ID = "camp:recoverykit";

// ── The yellow door: a real cargo item (its box fits the pickup bed; the slab overhangs the tailgate) ──
function doorMesh(item) {
  const g = new THREE.Group();
  box(g, 0.78, 0.05, 1.95, M("door", 0xe8b923, { r: 0.6 }), -0.03, 0, -0.17);
  for (const [x, z] of [[-0.2, 0.25], [0.15, 0.25], [-0.2, -0.65], [0.15, -0.65]]) box(g, 0.26, 0.012, 0.6, M("doorp", 0xd6a51c, { r: 0.55 }), x, 0.03, z);
  box(g, 0.07, 0.07, 1.98, M("jamb", 0xf0e3c4, { r: 0.8 }), 0.39, 0.005, -0.17);                 // one side of the frame
  for (let i = 0; i < 9; i++) box(g, 0.05, 0.004, 0.006, M("pencil", 0x3a3530), 0.39, 0.042, 0.6 - i * 0.17 - (i % 3) * 0.03);
  box(g, 0.03, 0.04, 0.03, M("brass", 0xc9a24a, { r: 0.3, m: 0.8 }), -0.36, 0.04, -0.2);       // handle
  if (item && item.wrapped) box(g, 0.16, 0.1, 2.0, M("blanket", 0x5c6f8a, { r: 0.95 }), 0.37, 0.01, -0.17);
  return g;
}
// June's recovery kit for 01.02: a crate with a tow strap, a shovel and a jack in it
function recoveryKitMesh() {
  const g = new THREE.Group();
  box(g, 0.62, 0.3, 0.4, M("rkit", 0xd9731f, { r: 0.6 }), 0, 0, 0);
  box(g, 0.64, 0.04, 0.08, M("rkitstrap", 0x2b2d31), 0, 0.02, 0);
  box(g, 0.3, 0.12, 0.005, M("tag", 0xf3ead2), 0, 0.02, 0.2);
  box(g, 0.2, 0.03, 0.04, M("rkith", 0x2b2d31), 0, 0.165, 0);
  return g;
}
registerItems({
  recovery_kit: { name: "Recovery kit", icon: "🧰", kind: "tool", mass: 14, size: [0.62, 0.3, 0.4], price: 0, pocket: false,
    desc: "June's recovery kit: tow strap, folding shovel, a bottle jack and gloves. 'KIT' on the lid in marker.", makeMesh: recoveryKitMesh },
  yellow_door: { name: "Yellow front door", icon: "🚪", kind: "misc", mass: 26, size: [0.84, 0.1, 1.6], price: 0, pocket: false,
    desc: "Alma Reyes's front door, with one side of its frame and the family's pencil heights up the jamb.", makeMesh: doorMesh },
});


// ── Small helpers ──
// A route from p to a place: onto the highway, along it, and up the place's side track (or straight off the road)
const ROUTE_STEP = 30;
function routeTo(p, t) {
  const pts = [{ x: p.x, z: p.z }];
  if (Math.hypot(t.x - p.x, t.z - p.z) < 150) { pts.push({ x: t.x, z: t.z }); return pts; }
  const z1 = t.zRoad ?? t.z, dir = Math.sign(z1 - p.z) || 1;
  for (let z = p.z; dir > 0 ? z < z1 : z > z1; z += dir * ROUTE_STEP) pts.push({ x: roadX(z), z });
  pts.push({ x: roadX(z1), z: z1 });
  const track = t.route && t.route.pts;
  if (track && track.length) {
    const a = track[0], b = track[track.length - 1], end = pts[pts.length - 1];
    const fromRoad = Math.hypot(a.x - end.x, a.z - end.z) <= Math.hypot(b.x - end.x, b.z - end.z);
    for (const q of fromRoad ? track : [...track].reverse()) pts.push({ x: q.x, z: q.z });
  }
  pts.push({ x: t.x, z: t.z });
  return pts;
}
const dist2 = (a, x, z) => Math.hypot(a.x - x, a.z - z);
const lerp = (a, b, t) => a + (b - a) * t;

export class Campaign {
  // ctx: { root, npcs, vehicles, props, interaction, stock, notify, sfx, say(name, text, secs), dialogue(spec) -> bool,
  //        fade(text, secs), setDay(day, time), day(), player() -> { pos, vehicle, onFoot, speed }, truck() -> Vehicle|null,
  //        speaking() -> bool (a line is still being said), stopVoice(), facing() -> { x, z } (where the camera looks) }
  constructor(ctx) {
    this.ctx = ctx;
    this.active = false;
    this.st = new CampaignState();
    this.group = null;
    this.voice = null;
    this.ch2 = new Chapter2World(this);
    this.ch3 = new Chapter3World(this);
    this.ch4 = new Chapter4World(this);
    this.worlds = [this.ch2, this.ch3, this.ch4];      // chapter worlds: the hooks are listed in kit.js
    this.objs = new Map();                             // target id → Object3D, for the objective marker
    loadVoiceIndex().then((v) => { this.voice = v; });
  }

  // ── lifecycle ───────────────────────────────────────────────────────────────────────────────
  // Name the authored places. Call right after the seed is set and before the world builds any chunk.
  bindPlaces() {
    const garage = startSite();
    garage.name = "Vale Garage"; garage.campaign = "garage";
    let motel = null;
    for (let z = garage.zRoad + MOTEL_FROM; !motel; ) {
      const s = nextSiteAfter(z, "motel");
      if (s.zRoad >= garage.zRoad + MOTEL_FROM) motel = s; else z = s.zRoad + 1;
    }
    motel.name = "Mercy Motel"; motel.campaign = "motel";
    // Pull-off: about halfway, nudged clear of any site, on the shoulder
    let z = lerp(garage.zRoad, motel.zRoad, 0.5);
    for (let k = 0; k < 40 && sitesBetween(z - 140, z + 140).length; k++) z += 60;
    const d = roadDir(z), side = -1;
    const off = ROAD_HALF + 4.5;
    const x = roadX(z) + d.z * side * off, zz = z - d.x * side * off;
    this.places = {
      garage, motel,
      pulloff: { x, z: zz, zRoad: z, yaw: Math.atan2(d.x, d.z), side, name: "Pull-off", kind: "wreck", campaign: "pulloff" },
    };
    for (const w of this.worlds) w.bind();
  }
  // A roadside place the campaign builds itself, nudged clear of any site. Same local frame as a site:
  // origin at its centre, +z towards the highway.
  roadSpot(zNominal, side, name, key, depth = 6) {
    let z = zNominal;
    for (let k = 0; k < 40 && sitesBetween(z - 140, z + 140).length; k++) z += 60;
    const d = roadDir(z), ax = d.z * side, az = -d.x * side, off = ROAD_HALF + 4 + depth;
    const x = roadX(z) + ax * off, zz = z + az * off;
    return { x, z: zz, zRoad: z, yaw: Math.atan2(-ax, -az), side, name, kind: "wreck", campaign: key, id: "camp:" + key };
  }
  spotPos(place, lx, lz, y = 0) { return this.at(place, lx, lz, y); }
  placeAt(obj, place, lx, lz, y = 0, yaw = 0) { return this.place(obj, place, lx, lz, y, yaw); }
  solidAt(place, lx, lz, w, d, h, yaw = 0, test) { return this.solid(place, lx, lz, w, d, h, yaw, test); }
  // An interaction target the objective marker can point at by its id
  target(obj, def) { addTarget(obj, def); if (def.id) this.objs.set(def.id, obj); return obj; }
  // absolute position → place-local (x along the frontage, z towards the highway)
  local(place, pos) {
    const dx = pos.x - place.x, dz = pos.z - place.z, c = Math.cos(place.yaw), s = Math.sin(place.yaw);
    return { x: dx * c - dz * s, z: dx * s + dz * c };
  }

  begin(rec, { fresh }) {
    this.end();
    this.active = true;
    this.st = new CampaignState(rec);
    this.group = new THREE.Group();
    this.group.name = "campaign";
    this.ctx.root.add(this.group);
    this.playing = null; this.waitChoice = false; this.clock = 0; this.planeT = 0; this.pullBuilt = this.motelBuilt = false;
    this.view = null;
    const truck = this.ctx.truck();
    if (fresh && truck) {
      // The pickup has stood since June died: the old battery is finished (01.02 replaces it)
      const b = truck.slots.battery;
      if (b) { b.charge = 3; b.cond = 34; }
      truck.dirty = true;
    }
    if (truck && truck.slots.battery && !this.st.store.oldBattery) this.st.store.oldBattery = truck.slots.battery.id;
    this.objs = new Map();
    this.buildGarage();
    for (const w of this.worlds) w.begin();
    this.marker = new Marker(this.group);
    this.people = new Map();
    this.restorePeople();
  }

  end() {
    if (this.people) for (const n of this.people.values()) this.ctx.npcs.remove(n);
    this.people = new Map();
    if (this.group) { removeAllUnder(this.group); this.group.removeFromParent(); this.group = null; }
    this.motelTable = null;
    if (this.ch2) this.ch2.chairs = null;
    if (this.strapTarget) { removeAllUnder(this.strapTarget); this.strapTarget.removeFromParent(); this.strapTarget = null; }
    this.active = false; this.playing = null; this.waitChoice = false; this.colls = [];
    this.marker = null;
  }

  serialize() {
    if (!this.active) return null;
    this.flushPeople();
    return this.st.serialize();
  }

  // ── authored objects at Vale Garage ─────────────────────────────────────────────────────────
  // site-local (lx, lz) → absolute position on the ground
  at(site, lx, lz, y = 0) {
    const p = siteToWorld(site, lx, lz);
    return new THREE.Vector3(p.x, heightAt(p.x, p.z) + y, p.z);
  }
  place(obj, site, lx, lz, y = 0, yaw = 0) {
    obj.position.copy(this.at(site, lx, lz, y));
    obj.rotation.y = site.yaw + yaw;
    this.group.add(obj);
    return obj;
  }
  // A static box collider in site-local terms
  solid(site, lx, lz, w, d, y1, yaw = 0, test = () => true) {
    const p = siteToWorld(site, lx, lz), y0 = heightAt(p.x, p.z);
    const c = { kind: "box", x: p.x, z: p.z, hx: w / 2, hz: d / 2, yaw: site.yaw + yaw, y0, y1: y0 + y1, solid: true };
    this.colls.push({ c, test });
    return c;
  }
  colliders(x, z, r, out = []) {
    if (!this.active) return out;
    for (const { c, test } of this.colls) if (Math.abs(c.x - x) < r + 4 && Math.abs(c.z - z) < r + 4 && test()) out.push(c);
    return out;
  }

  buildGarage() {
    const s = this.places.garage, st = this.st;
    this.colls = [];
    // Office = the house (house floor centre (-9, -5) in site-local terms); the table at house (1.5, 0.6), top 0.74
    const H = (x, z) => [-9 + x, -5 + z];
    const TOP = 0.74;
    const tags = [
      ["generator", "Job tag · Generator", "“Lauren” Bell, Bell's Bakery. Cuts out after twenty minutes warm. Runs the cold room."],
      ["van", "Job tag · Van radiator", "Manny. Weeping at the seam. Paid in advance. Ring when sealed."],
      ["sewing", "Job tag · Sewing-machine motor", "Edie. Hums, won't turn. Not started. No rush, she says (underlined twice)."],
    ];
    tags.forEach(([id, name, text], i) => {
      const g = new THREE.Group();
      box(g, 0.1, 0.004, 0.14, M("tag", 0xf3ead2), 0, 0, 0);
      box(g, 0.02, 0.005, 0.02, M("tagred", 0xb3261e), 0, 0.001, 0.055);
      const [lx, lz] = H(1.0 + i * 0.22, 0.45 + (i % 2) * 0.3);
      this.place(g, s, lx, lz, TOP + 0.003, 0.3 * (i - 1));
      this.target(g, {
        id: "camp:tag:" + id, name, reach: 2.2,
        info: () => ({ note: st.fact("tag:" + id) ? "Read" : "Customer job" }),
        actions: () => [{ key: "use", label: "Read the tag", run: () => {
          st.setFact("tag:" + id);
          this.ctx.notify(`${name}: ${text}`, { icon: "🏷", key: "camp-tag", ms: 7000 });
        } }],
      });
    });
    // Telephone and answering machine
    const phone = new THREE.Group();
    box(phone, 0.2, 0.07, 0.16, M("phone", 0x2b2d31, { r: 0.5 }), 0, 0.035, 0);
    box(phone, 0.2, 0.04, 0.05, M("phone", 0x2b2d31, { r: 0.5 }), 0, 0.09, 0);
    this.place(phone, s, ...H(1.95, 0.85), TOP);
    this.target(phone, { id: "camp:phone", name: "Telephone", reach: 2.2, actions: () => this.phoneActions() });
    const machine = new THREE.Group();
    box(machine, 0.2, 0.06, 0.14, M("machine", 0x45403a, { r: 0.6 }), 0, 0.03, 0);
    const lamp = box(machine, 0.02, 0.01, 0.02, M("machlamp", 0xff5533, { r: 0.3 }), 0.07, 0.065, 0.04);
    lamp.material = new THREE.MeshStandardMaterial({ color: 0xff5533, emissive: 0xff3311, emissiveIntensity: 1.2 });
    this.machineLamp = lamp;
    this.place(machine, s, ...H(1.95, 0.4), TOP);
    this.target(machine, {
      id: "camp:machine", name: "Answering machine", reach: 2.2,
      info: () => ({ note: st.seen("01.03.A") ? "No new messages" : "1 new message" }),
      actions: () => [this.storyAction("01.03", "Play the message", "01.03.A", "Later. The jobs in front of you come first.")],
    });

    // June's paper map of the basin, pinned to the office wall: capturing it puts the whole highway on your maps
    const paper = new THREE.Group();
    box(paper, 1.1, 0.75, 0.01, M("papermap", 0xe8dcbc, { r: 0.95 }), 0, 0, 0);
    box(paper, 0.05, 0.7, 0.012, M("mapr", 0x8a6a3e), -0.1, 0, 0.002).rotation.z = 0.25;       // the highway, in June's pen
    for (const [x, y] of [[-0.3, 0.2], [0.05, -0.1], [0.25, 0.25], [-0.15, -0.28]]) box(paper, 0.035, 0.035, 0.014, M("tagred", 0xb3261e), x, y, 0.003);
    this.place(paper, s, ...H(-2.2, -4.38), 1.35);
    this.target(paper, { id: "camp:papermap", name: "June's paper map", reach: 2.4,
      info: () => ({ note: st.store.mapCaptured ? "It's on your minimap" : "The whole basin, in June's pen" }),
      actions: () => (st.store.mapCaptured ? [] : [{ key: "use", label: "Capture", hold: 1, run: () => this.captureMap() }]) });

    // Garage (floor centre (8, -6)): roll-up shutter across the open bay at the front wall (z = -0.5)
    const G = (x, z) => [8 + x, -6 + z];
    const shutter = new THREE.Group();
    for (let i = 0; i < 13; i++) box(shutter, 5.6, 0.19, 0.05, M("shutter" + (i % 2), i % 2 ? 0x9aa3a8 : 0x8a9398, { r: 0.55, m: 0.4 }), 0, 0.1 + i * 0.2, 0);
    this.shutter = this.place(shutter, s, ...G(0, 5.42));
    this.shutterOpen = st.fact("shutter") ? 1 : 0;
    this.solid(s, ...G(0, 5.42), 5.6, 0.2, 2.6, 0, () => this.shutterOpen < 0.8);
    this.target(shutter, {
      id: "camp:shutter", name: "Yard shutter", reach: 2.8,
      info: () => ({ note: st.fact("shutter") ? "Open" : "Closed" }),
      actions: () => {
        if (st.fact("shutter")) { const a = this.ch2.shutter(); return a ? [a] : []; }
        return [{ key: "use", label: "Raise the shutter", hold: 1.6, run: () => { st.setFact("shutter"); this.ctx.sfx("hood_open"); } }];
      },
    });

    // The workbench: Alma's yellow door laid on two trestles, tools and brackets on top
    const bench = new THREE.Group();
    for (const x of [-0.75, 0.75]) {
      const t = new THREE.Group();
      box(t, 0.06, 0.06, 0.8, M("trestle", 0x6b4a2b), 0, 0.82, 0);
      for (const z of [-0.33, 0.33]) box(t, 0.05, 0.82, 0.05, M("trestle", 0x6b4a2b), 0, 0.41, z);
      t.position.x = x; bench.add(t);
    }
    const slab = doorMesh(null);
    slab.rotation.y = Math.PI / 2; slab.position.set(0.17, 0.875, 0);
    bench.add(slab);
    const tools = new THREE.Group();
    box(tools, 0.4, 0.05, 0.12, M("vice", 0x3d5a80, { r: 0.4, m: 0.6 }), -0.5, 0.925, -0.1);
    box(tools, 0.3, 0.03, 0.06, M("steel", 0x9aa0a6, { r: 0.4, m: 0.8 }), 0.3, 0.915, 0.12);
    box(tools, 0.06, 0.12, 0.25, M("bracket", 0x55585d, { r: 0.5, m: 0.6 }), 0.75, 0.96, -0.2);
    box(tools, 0.18, 0.08, 0.12, M("tin", 0xb3261e, { r: 0.5 }), 0.1, 0.94, -0.22);
    bench.add(tools);
    const blanket = box(bench, 2.0, 0.08, 0.16, M("blanket", 0x5c6f8a, { r: 0.95 }), 0.0, 0.91, 0.38);
    this.place(bench, s, ...G(0.4, -1.5));
    this.bench = { group: bench, slab, tools, blanket };
    this.solid(s, ...G(0.4, -1.5), 2.0, 0.9, 0.9, 0, () => !st.fact("door:lifted"));
    this.target(bench, { id: "camp:bench", name: () => (st.fact("bench:seen") ? "Yellow door on trestles" : "Workbench"), reach: 2.6,
      info: () => ({ note: this.benchNote() }), actions: (ctx) => this.benchActions(ctx) });

    // Cassette player on the back bench (garage bench top at 0.9)
    const deck = new THREE.Group();
    box(deck, 0.26, 0.08, 0.16, M("deck", 0x1f2022, { r: 0.5 }), 0, 0.04, 0);
    box(deck, 0.1, 0.012, 0.065, M("tape", 0xd9cfb8), 0.03, 0.086, 0);
    this.place(deck, s, ...G(1.6, -4.95), 0.9);
    this.target(deck, { id: "camp:tape", name: "Cassette player", reach: 2.2,
      info: () => ({ note: st.seen("01.03.C") ? "June's tape · in your journal" : "A cassette, labelled “KIT” in marker" }),
      actions: () => [st.seen("01.03.C") ? { key: "use", label: "Play the tape again", run: () => this.replay("01.03.C") }
        : this.storyAction("01.03", "Play the tape", "01.03.C", "Later.", { after: "message", tape: true })] });
    this.refreshGarage();
  }

  refreshGarage() {
    const st = this.st;
    if (this.bench) {
      const lifted = !!st.fact("door:lifted");
      this.bench.slab.visible = !lifted;
      this.bench.tools.visible = !st.fact("door:cleared");
      this.bench.blanket.visible = !!st.fact("door:wrapped") && !lifted;
    }
    if (this.machineLamp) this.machineLamp.visible = !st.seen("01.03.A");
  }

  benchNote() {
    const st = this.st;
    if (!st.fact("bench:seen")) return st.mission === "01.03" && st.seen("01.03.A") ? "Look closer" : "June's workbench";
    if (!st.fact("door:cleared")) return "Tools and brackets screwed to the paint";
    if (!st.fact("door:wrapped") && !st.fact("door:wiped")) return "Pencil heights up the jamb";
    return st.fact("door:wrapped") ? "Jamb wrapped · ready to lift" : "Ready to lift";
  }
  benchActions(ctx) {
    const st = this.st, inMission = st.mission === "01.03" && st.seen("01.03.A");
    if (st.fact("door:lifted")) return [];
    if (!inMission) return [];
    if (!st.fact("bench:seen")) return [{ key: "use", label: "Look closer", run: () => {
      st.setFact("bench:seen");
      this.ctx.notify("It's a front door laid flat: yellow paint, one side of its frame still on, pencil marks climbing the jamb.", { icon: "🚪", ms: 7000 });
    } }];
    if (!st.fact("door:cleared")) return [{ key: "use", label: "Clear the tools and brackets", hold: 3, run: () => {
      st.setFact("door:cleared"); this.ctx.sfx("ratchet"); this.refreshGarage();
    } }];
    if (!st.fact("door:wrapped") && !st.fact("door:wiped")) return [
      { key: "use", label: "Wrap the jamb in a moving blanket", hold: 1.5, run: () => {
        st.setFact("door:wrapped"); st.flags.PENCIL_PROTECTED = true; this.ctx.sfx("pickup"); this.refreshGarage();
      } },
      { key: "alt", label: "Wipe the door down first", hold: 1.5, run: () => {
        st.setFact("door:wiped"); this.ctx.sfx("pour_stop"); this.refreshGarage();
        this.ctx.notify("The dust comes off. So does some of the pencil.", { icon: "🚪", level: "warn" });
      } },
    ];
    return [{ key: "grab", label: "Lift the door", blocked: ctx && ctx.held ? "Put down what you're holding" : undefined, run: (c) => {
      const item = makeItem("yellow_door", { id: DOOR_ID, wrapped: !!st.fact("door:wrapped") || undefined });
      if (!c.giveHeld(item)) return;
      st.setFact("door:lifted"); this.refreshGarage();
    } }];
  }

  // Telephone: who there is to call depends on the mission
  phoneActions() {
    const st = this.st;
    if (st.mission === "01.01" && !st.seen("01.01.B")) {
      const known = st.fact("tag:generator");
      return [{ key: "use", label: "Call Bell's Bakery", blocked: known ? undefined : "Find out whose generator it is first",
        run: () => this.queue("01.01.B") }];
    }
    if (st.mission === "01.03" && st.seen("01.03.A") && !st.seen("01.03.B")) return [{ key: "use", label: "Call Alma Reyes", run: () => this.queue("01.03.B") }];
    for (const w of this.worlds) { const more = w.phone && w.phone(); if (more) return [more]; }
    return [{ key: "use", label: "Telephone", blocked: "Nobody you need to call right now" }];
  }
  // An action that plays a story scene during one mission (and is explained, not hidden, outside it)
  storyAction(mission, label, scene, early, o = {}) {
    const st = this.st, now = st.mission === mission && (!o.after || st.objDone(mission, o.after));
    if (st.seen(scene) && !o.tape) return { key: "use", label, blocked: "Already done" };
    if (!now && !st.done[mission]) return { key: "use", label, blocked: early };
    return { key: "use", label, run: () => { if (o.tape) st.addTape(scene); this.queue(scene); } };
  }

  captureMap() {
    this.st.store.mapCaptured = true;
    this.ctx.sfx("discover");
    this.ctx.notify("June's map is on your minimap: the whole highway and everything along it. Story places get a ★ as you need them. On the map (M), click to set a destination.", { icon: "🗺", level: "good", ms: 9000, key: "camp-map" });
  }
  // The stretch of highway the paper map covers, once it's captured
  paperRange() {
    if (!this.active || !this.st.store.mapCaptured) return null;
    const z = this.places.garage.zRoad;
    return [z - 800, z + PAPER_AHEAD];
  }
  // Story places for the maps: every place the story has sent you so far; the current objective's is ringed
  mapPins() {
    if (!this.active) return [];
    const keys = this.st.store.pins || [], cur = this.aimPlace;
    const out = keys.map((k) => this.places[k]).filter(Boolean).map((p) => ({ x: p.x, z: p.z, name: p.name, current: p === cur }));
    if (cur && !keys.some((k) => this.places[k] === cur)) out.push({ x: cur.x, z: cur.z, name: cur.name, current: true });
    return out;
  }
  notePins() {
    const st = this.st, pins = st.store.pins || (st.store.pins = ["garage"]);
    for (const s of [...this.mapSites(), this.aimPlace]) {
      if (!s) continue;
      const k = Object.keys(this.places).find((key) => this.places[key] === s);
      if (k && !pins.includes(k)) pins.push(k);
    }
  }
  // The way to go, for the maps: from the player along the highway to the objective's place, and to their destination
  mapRoutes() {
    if (!this.active) return [];
    const p = this.ctx.player().pos, out = [];
    if (this.aimPlace) out.push({ pts: routeTo(p, this.aimPlace), color: "#ffc23d" });
    const wp = this.st.store.waypoint;
    if (wp) out.push({ pts: routeTo(p, wp), color: "#4fa8ff" });
    return out;
  }
  // A destination the player picked on the map
  get waypoint() { return this.active ? this.st.store.waypoint || null : null; }
  setWaypoint(x, z, name) {
    if (!this.active) return;
    this.st.store.waypoint = { x: Math.round(x), z: Math.round(z), name: name || "Destination" };
    this.ctx.sfx("pickup");
  }
  clearWaypoint() { if (this.active) this.st.store.waypoint = null; }

  // ── the road to Mercy Motel ─────────────────────────────────────────────────────────────────
  buildPulloff() {
    const p = this.places.pulloff, g = new THREE.Group();
    box(g, 1.6, 0.06, 0.4, M("bench", 0x7a5a3a), 0, 0.45, 0);
    for (const x of [-0.7, 0.7]) box(g, 0.08, 0.45, 0.36, M("bench", 0x7a5a3a), x, 0.225, 0);
    box(g, 0.32, 0.36, 0.2, M("bag", 0xd8c9a8), -0.4, 0.66, 0);
    box(g, 0.3, 0.32, 0.2, M("bag", 0xd8c9a8), 0.05, 0.64, 0.02);
    box(g, 0.1, 2.0, 0.1, M("post", 0x8a9398, { m: 0.5 }), 1.6, 1.0, 0);
    box(g, 0.9, 0.45, 0.04, M("signblue", 0x1f4e8c, { r: 0.5 }), 1.6, 2.0, 0);
    g.position.set(p.x, heightAt(p.x, p.z), p.z);
    g.rotation.y = p.yaw + Math.PI / 2 * p.side;
    this.group.add(g);
    this.pullBuilt = true;
  }
  buildMotelTable() {
    const s = this.places.motel, g = new THREE.Group();
    for (const x of [-0.75, 0.75]) {
      box(g, 0.06, 0.06, 0.8, M("trestle", 0x6b4a2b), x, 0.82, 0);
      for (const z of [-0.33, 0.33]) box(g, 0.05, 0.82, 0.05, M("trestle", 0x6b4a2b), x, 0.41, z);
    }
    const slab = doorMesh({ wrapped: false });
    slab.rotation.y = Math.PI / 2; slab.position.set(0.17, 0.875, 0);
    g.add(slab);
    this.place(g, s, -6, 0.5);
    this.solid(s, -6, 0.5, 2.0, 0.9, 0.9);
    this.motelBuilt = true;
    this.motelTable = g;
  }

  // ── people (Del, Alma) ──────────────────────────────────────────────────────────────────────
  person(id, name, seed, pos, yaw) {
    let n = this.people.get(id);
    if (n) return n;
    n = this.ctx.npcs.spawn({ id: "camp:" + id, role: "local", name, seed, x: pos.x, z: pos.z, yaw, age: CAST[name] && CAST[name].age });
    const rec = this.st.store["npc:" + id];
    if (rec) n.restore(rec);
    this.people.set(id, n);
    return n;
  }
  drop(id) {
    const n = this.people.get(id);
    if (!n) return;
    this.st.store["npc:" + id] = n.serialize();
    this.ctx.npcs.remove(n); this.people.delete(id);
  }
  flushPeople() { for (const [id, n] of this.people) this.st.store["npc:" + id] = n.serialize(); }
  restorePeople() {
    // Del riding in the pickup comes back with it
    if (this.st.store.del === "riding") {
      const rec = this.st.store["npc:del"];
      if (rec && rec.pos) this.person("del", "Del", 7104, new THREE.Vector3().fromArray(rec.pos), rec.yaw || 0);
    }
  }

  updatePeople(p) {
    const st = this.st, pl = this.places;
    // Ellis hangs about Vale Garage through chapter 1 (the office doorway, then the bay); talking gets a pointer
    const m1 = st.mission;
    if (m1 === "01.01" || m1 === "01.02" || m1 === "01.03" || this.people.has("ellis1")) {
      const spot = m1 === "01.01" ? [-8, 1.2] : [6.5, 1.8];
      this.ch2.presence("ellis1", "Ellis", 2929, pl.garage, spot[0], spot[1], m1 === "01.01" || m1 === "01.02" || m1 === "01.03",
        () => this.ellisTip(), "Came for the generator");
    }
    // Del at the pull-off (01.04)
    const delState = st.store.del || "waiting";
    const nearPull = dist2(p.pos, pl.pulloff.x, pl.pulloff.z);
    if (st.mission === "01.04" && delState === "waiting" && nearPull < 320) {
      const at = new THREE.Vector3(pl.pulloff.x, 0, pl.pulloff.z);
      const d = roadDir(pl.pulloff.zRoad);
      at.x += d.x * 2.2; at.z += d.z * 2.2;
      const del = this.person("del", "Del", 7104, at, pl.pulloff.yaw);
      if (!del._talk) {
        del._talk = true;
        del.setTarget({ name: "Del", info: () => ({ note: "Waiting with his shopping" }), actions: () => [{ key: "use", label: "Talk", run: () => this.talkDel() }] });
      }
      if (nearPull < 25) del.lookAt(p.pos);
    } else if (this.people.has("del") && delState !== "riding" && (st.mission !== "01.04" || dist2(p.pos, this.people.get("del").pos.x, this.people.get("del").pos.z) > 400)) this.drop("del");
    // Del gets out at the motel
    if (delState === "riding") {
      const del = this.people.get("del"), v = this.ctx.truck();
      const m = pl.motel;
      if (del && v && dist2(v.pos, m.x, m.z) < 55 && Math.abs(v.speed) < 1 && del.seat) {
        if (del.exitVehicle()) {
          st.store.del = "home"; st.setFact("del:home");
          const door = this.at(m, -12, -4.6);
          del.walkTo(door.x, door.z);
          this.ctx.say("Del", "There you are. Had time to complain to a pigeon.", 4);
        } else this.ctx.notify("Park with room beside the passenger door so Del can get out.", { key: "camp-del" });
      }
    }
    // Alma at the motel
    const m = pl.motel, nearMotel = dist2(p.pos, m.x, m.z);
    if (st.mission === "01.04" && nearMotel < 320 && !st.seen("01.04.B")) {
      const alma = this.person("alma", "Alma", 6812, this.at(m, -9, 1.6), m.yaw);
      if (!alma._talk) {
        alma._talk = true;
        alma.setTarget({ name: "Alma Reyes", info: () => ({ note: "Mercy Motel" }), actions: () => [{ key: "use", label: "Talk", run: () => this.talkAlma() }] });
      }
      if (nearMotel < 40) alma.lookAt(p.pos);
    } else if (this.people.has("alma") && (nearMotel > 450 || st.mission !== "01.04")) this.drop("alma");
  }

  // Ellis on what to do next: the current objective's hint, in his words
  ellisTip() {
    if (this.playing) return;
    const cur = this.view && this.view.current, def = cur && DEFS[this.st.mission];
    const o = def && def.objectives.find((x) => x.id === cur.id);
    this.ctx.say("Ellis", o && o.hint ? o.hint : "I'll be out here.", 5);
  }

  talkDel() {
    const st = this.st;
    if (this.playing || st.store.del && st.store.del !== "waiting") return;
    this.queue("01.04.A");
  }
  // The choice after the shared lines of 01.04.A
  chooseDel() {
    const v = this.ctx.truck(), del = this.people.get("del");
    const alongside = v && del && dist2(v.pos, del.pos.x, del.pos.z) < 12 && Math.abs(v.speed) < 1;
    const seat = v && v.seatFree && v.seatFree("passenger");
    this.waitChoice = this.ctx.dialogue({
      speaker: "Del", role: "At the pull-off", lines: ["“Motel. These need the fridge. I can wait longer than the butter.”"],
      choices: [
        { id: "DRIVE", label: "Give Del a lift to the motel", detail: "His bags go by his feet. He gets out at Mercy Motel.",
          disabled: !alongside ? "Bring the pickup alongside and stop" : !seat ? "The passenger seat is taken" : undefined },
        { id: "CALL", label: "Phone Ellis to collect him", detail: "No safe room in the cab with this load." },
      ],
      onChoose: (id) => {
        this.waitChoice = false;
        const st = this.st;
        st.branch["01.04.A"] = id;
        if (id === "DRIVE") {
          st.flags.DEL_HELPED = true; st.store.del = "riding";
          const d = this.people.get("del");
          if (d && v) { d.setTarget(null); d.enterVehicle(v, "passenger"); }
        } else {
          st.flags.DEL_ASSISTED = true; st.store.del = "called";
          const d = this.people.get("del");
          if (d) d.setTarget(null);
        }
        this.branchChosen(id);
      },
    });
    return this.waitChoice;
  }

  // After a branch choice: the shared lines already spoken come first in both lists, so the index carries on unchanged
  branchChosen(id) {
    this.waitChoice = false;
    if (this.playing) this.playing.lines = this.playing.all.filter((l) => !l.branch || l.branch === id);
  }

  talkAlma() {
    const st = this.st, v = this.ctx.truck();
    if (this.playing || st.seen("01.04.B")) return;
    const doorIn = v && v.cargo.items.some((e) => e.item && e.item.id === DOOR_ID);
    const near = v && dist2(v.pos, this.places.motel.x, this.places.motel.z) < 45 && Math.abs(v.speed) < 1;
    if (!doorIn || !near) {
      this.ctx.notify(doorIn ? "Park the pickup at the motel first." : "Alma's door needs to be in the pickup bed.", { key: "camp-alma", icon: "🚪" });
      return;
    }
    // The door changes hands before the scene plays
    this.ctx.props.remove(DOOR_ID);
    st.store.doorDelivered = true;
    if (!this.motelBuilt) this.buildMotelTable();
    this.queue("01.04.B");
  }

  // The bed strap check: a soft target over the pickup's bed while 01.04 needs it
  updateStraps(p) {
    const st = this.st, v = this.ctx.truck(), pl = this.places.pulloff;
    const want = st.mission === "01.04" && !st.fact("straps") && v && dist2(v.pos, pl.x, pl.z) < 60;
    if (!want) {
      if (this.strapTarget) { removeAllUnder(this.strapTarget); this.strapTarget.removeFromParent(); this.strapTarget = null; }
      return;
    }
    if (this.strapTarget && this.strapTarget.parent === v.mesh) return;
    const z = v.cargo.zone;
    const geo = new THREE.BoxGeometry(z.max[0] - z.min[0], 0.3, z.max[2] - z.min[2]);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set((z.min[0] + z.max[0]) / 2, z.min[1] + 0.15, (z.min[2] + z.max[2]) / 2);
    v.mesh.add(m);
    this.strapTarget = m;
    addTarget(m, { id: "camp:straps", name: "Load straps", soft: true, reach: 2.6, info: () => ({ note: "Check before the longer road" }),
      actions: (ctx) => (ctx && ctx.held ? [] : [{ key: "use", label: "Check the straps", hold: 2, run: () => {
        st.setFact("straps"); this.ctx.sfx("ratchet");
        this.ctx.notify("Straps tight, knots holding. The door hasn't shifted.", { icon: "✓", level: "good" });
      } }]) });
  }

  // ── scenes ──────────────────────────────────────────────────────────────────────────────────
  queue(key) { this.st.queueScene(key); }
  replay(key) {
    if (this.playing) return;
    this.startScene(key, true);
  }
  startScene(key, replay = false) {
    const scene = sceneByKey(key);
    if (!scene) { this.st.queue = this.st.queue.filter((k) => k !== key); return; }
    const chosen = this.st.branch[key] || null;
    // every line that could play, in order; lines of the branch not taken are dropped once the choice is made
    const cand = scene.lines.filter((l) => lineOk(l, this.st, ALL_CONDS));
    const hasBranches = cand.some((l) => l.branch);
    this.playing = { key, replay, all: cand, lines: hasBranches && chosen ? cand.filter((l) => !l.branch || l.branch === chosen) : cand, i: 0, t: 0.5, cur: null, choiceAsked: !!chosen || !hasBranches };
    this.summon(this.playing);
  }
  // Everyone with lines in the scene who is about walks over to Kit first; the scene waits (a few seconds at most)
  summon(P) {
    const names = new Set(P.all.map((l) => SPEAKERS[l.sp] || l.sp)), me = this.ctx.player().pos;
    P.waitFor = []; P.waitT = 6;
    for (const n of this.people.values()) {
      if (!names.has(n.name) || n.seat) continue;
      const d = dist2(n.pos, me.x, me.z);
      if (d < 3.5 || d > 60) continue;
      const k = 2.4 / d;
      n.walkTo(me.x + (n.pos.x - me.x) * k, me.z + (n.pos.z - me.z) * k);
      P.waitFor.push(n);
    }
  }
  updateScene(dt, skip) {
    const P = this.playing;
    if (!P) {
      if (this.st.queue.length && !this.waitChoice) this.startScene(this.st.queue[0]);
      return;
    }
    if (this.waitChoice) return;
    if (P.i === 0 && P.waitFor.length && (P.waitT -= dt) > 0 && P.waitFor.some((n) => n.arrived === false)) return;
    if (P.cur && skip) { P.t = 0; this.ctx.stopVoice && this.ctx.stopVoice(); }
    P.t -= dt;
    if (P.t > 0) return;
    // a line that's still being said finishes first (a stuck voice gives up after a while)
    if (P.cur && this.ctx.speaking && this.ctx.speaking() && (P.hold = (P.hold || 0) + dt) < 15) return;
    const line = P.lines[P.i];
    if (line && !this.attending(P, line)) return;
    P.hold = 0;
    if (line && line.branch && !P.choiceAsked) {
      // the branch is chosen in a dialogue; until it can open (another overlay is up) the scene waits
      const asked = P.key === "01.04.A" ? this.chooseDel() : this.askBranch(P.key);
      if (asked === false) { P.t = 0.25; return; }
      if (asked === true && !this.st.branch[P.key]) this.waitChoice = true;     // the scene waits for the answer
      P.choiceAsked = true;
      if (this.waitChoice) return;
    }
    if (!line) { this.finishScene(); return; }
    P.i++;
    P.cur = line;
    const secs = lineSeconds(line.text);
    P.t = secs + 0.25;
    const voiced = this.voice && this.voice.has(line.id);
    this.stage(line, voiced, secs);
    this.ctx.say(SPEAKERS[line.sp] || line.sp, line.text, secs, voiced ? line.id : null, line.dir);
  }
  // The people in the scene play it: whoever speaks faces Kit, everyone else nearby turns to the speaker
  stage(line, voiced, secs) {
    const name = SPEAKERS[line.sp] || line.sp, me = this.ctx.player().pos;
    let speaker = null;
    for (const n of this.people.values()) if (n.name === name && !n.seat && dist2(n.pos, me.x, me.z) < 30) speaker = n;
    for (const n of this.people.values()) {
      if (n.seat || dist2(n.pos, me.x, me.z) > 30) continue;
      n.lookAt(n === speaker || !speaker ? me : speaker.pos);
    }
    if (speaker && speaker.talkFor) speaker.talkFor(secs);
    if (speaker && !voiced) this.ctx.sfx("npc_talk", { pos: speaker.pos });
  }
  // Nobody on foot starts talking to Kit's back: the scene holds before their first line until she turns to face them
  attending(P, line) {
    if (P.engaged || line.sp === "KIT" || P.replay) return true;
    const p = this.ctx.player(), name = SPEAKERS[line.sp] || line.sp;
    if (!p.onFoot || !this.ctx.facing) { P.engaged = true; return true; }
    let n = null;
    for (const q of this.people.values()) if (q.name === name && !q.seat && dist2(q.pos, p.pos.x, p.pos.z) < 25) n = q;
    if (!n) { P.engaged = true; return true; }
    const f = this.ctx.facing();
    if (!f) { P.engaged = true; return true; }
    const dx = n.pos.x - p.pos.x, dz = n.pos.z - p.pos.z, d = Math.hypot(dx, dz) || 1, fl = Math.hypot(f.x, f.z) || 1;
    if ((dx * f.x + dz * f.z) / (d * fl) > Math.cos(0.7)) { P.engaged = true; return true; }
    if (!P.nudged) { P.nudged = true; this.ctx.notify(`${name} is behind you. Turn round.`, { icon: "👀", key: "camp-turn", ms: 5000 }); }
    return false;
  }
  askBranch(key) {
    for (const w of this.worlds) { const r = w.choose && w.choose(key); if (r !== undefined) return r; }
    return undefined;
  }
  finishScene() {
    const P = this.playing;
    this.playing = null;
    if (P.replay) return;
    this.st.scenePlayed(P.key);
    if (P.key === "01.02.A" || P.key === "01.03.C") this.st.addTape(P.key);
    const sc = sceneByKey(P.key);
    if (sc && sc.journal && this.st.done[sc.key.slice(0, 5)]) this.st.addJournal(sc.key.slice(0, 5), sc.journal, this.ctx.day());
    for (const w of this.worlds) w.sceneDone && w.sceneDone(P.key);
    this.refreshGarage();
  }

  // ── facts from the world ────────────────────────────────────────────────────────────────────
  worldView(p) {
    const v = this.ctx.truck(), st = this.st;
    const g = this.places.garage;
    const lx = (() => { const dx = p.pos.x - g.x, dz = p.pos.z - g.z, c = Math.cos(g.yaw), s = Math.sin(g.yaw); return { x: dx * c - dz * s, z: dx * s + dz * c }; })();
    const inOffice = p.onFoot && Math.abs(lx.x + 9) < 5.4 && Math.abs(lx.z + 5) < 4.4;
    const b = v && v.slots.battery;
    const types = new Set(v ? v.cargo.items.map((e) => e.item && e.item.type) : []);
    const truck = {
      hood: v ? v.doors.hood || 0 : 0,
      newBattery: !!(b && b.id !== st.store.oldBattery && Math.min(b.charge ?? 100, b.cond ?? 100) >= 8),
      running: !!v && v.ign === "running",
      oil: v ? v.oil / v.def.oilCap : 0, coolant: v ? v.coolant / v.def.coolantCap : 0,
      cargo: types, door: !!v && v.cargo.items.some((e) => e.item && e.item.id === DOOR_ID),
    };
    const stk = this.ctx.stock;
    const water = stk ? stk.count("water") + stk.count("waterjug") : 0;
    return { day: this.ctx.day(), inOffice, water, truck, ch2: this.ch2.view(), ch3: this.ch3.view(), ch4: this.ch4.view() };
  }
  watchFacts(p) {
    const st = this.st, v = this.ctx.truck(), held = this.ctx.interaction.held;
    if (st.mission === "01.02") {
      // Turning the key on the dead battery is the test
      if (v && v.slots.battery && v.slots.battery.id === st.store.oldBattery && p.vehicle === v && (v._crankCool > 0 || v.ign !== "off")) st.setFact("battery:tested");
      if (v && (!v.slots.battery || v.slots.battery.id !== st.store.oldBattery)) st.setFact("battery:tested");
      if (!st.fact("battery:spawned")) {
        st.setFact("battery:spawned");
        const g = this.places.garage, pos = this.at(g, 8.9, -10.3, 0.12);
        this.ctx.props.spawn(makeItem("battery", { id: BATTERY_ID, cond: 100, charge: 100 }), pos, { yaw: g.yaw });
      }
      // June's recovery kit waits on the garage floor by the bay
      if (!st.fact("rkit:spawned")) {
        st.setFact("rkit:spawned");
        const g = this.places.garage;
        this.ctx.props.spawn(makeItem("recovery_kit", { id: KIT_ID }), this.at(g, 8 - 2.2, -6 + 1.6, 0.16), { yaw: g.yaw + 0.3 });
      }
      const found = (held && held.id === BATTERY_ID) || (v && v.slots.battery && v.slots.battery.id === BATTERY_ID);
      if (found && st.setFact("battery:found")) this.queue("01.02.A");
    }
  }

  // ── per frame ───────────────────────────────────────────────────────────────────────────────
  update(dt, { skip = false } = {}) {
    if (!this.active) return;
    const p = this.ctx.player();
    // shutter animation
    const want = this.st.fact("shutter") ? 1 : 0;
    if (this.shutter && this.shutterOpen !== want) {
      this.shutterOpen = want ? Math.min(1, this.shutterOpen + dt * 0.7) : Math.max(0, this.shutterOpen - dt * 0.7);
      this.shutter.scale.y = 1 - this.shutterOpen * 0.92;
      this.shutter.position.y = heightAt(this.shutter.position.x, this.shutter.position.z) + this.shutterOpen * 2.35;
    }
    this.updateScene(dt, skip);
    if (this.marker) this.marker.update(dt, this.aim, p.pos, !!this.playing, this.st.store.waypoint);
    if ((this.clock -= dt) > 0) return;
    this.clock = 0.25;
    this.watchFacts(p);
    const w = this.worldView(p);
    const events = stepMissions(this.st, DEFS, w);
    for (const e of events) this.onEvent(e);
    this.view = missionView(this.st, DEFS, w);
    const pl = this.places;
    if (!this.pullBuilt && dist2(p.pos, pl.pulloff.x, pl.pulloff.z) < 900) this.buildPulloff();
    if (!this.motelBuilt && this.st.store.doorDelivered && dist2(p.pos, pl.motel.x, pl.motel.z) < 900) this.buildMotelTable();
    this.updatePeople(p);
    this.updateStraps(p);
    for (const w of this.worlds) w.update(p);
    this.aim = this.markerTarget(this.view && this.view.current);
    this.notePins();
    const wp = this.st.store.waypoint;
    if (wp && dist2(p.pos, wp.x, wp.z) < WAYPOINT_ARRIVE) {
      this.st.store.waypoint = null;
      this.ctx.notify(`You've reached ${wp.name === "Destination" ? "your destination" : wp.name}.`, { icon: "📍", key: "camp-wp" });
    }
  }

  onEvent(e) {
    const n = this.ctx.notify, m = this.view;
    if (e.type === "start") {
      const ch = chapterOf(e.mission), mi = ch.missions.find((x) => x.id === e.mission);
      n(`Chapter ${ch.n} · ${ch.title}: ${mi.title}`, { icon: "★", level: "good", ms: 6000, key: "camp-mission" });
    } else if (e.type === "objective") {
      n(e.text, { icon: "✓", level: "good", key: "camp-obj-" + e.id, ms: 3500 });
      this.ctx.sfx("discover");
      emit("campaign:checkpoint");
    } else if (e.type === "complete") {
      const mi = chapterOf(e.mission).missions.find((x) => x.id === e.mission);
      n(`Mission complete: ${mi.title}`, { icon: "★", level: "good", ms: 6000, key: "camp-mission" });
      if (e.day) this.pendingDay = { name: e.day, time: e.time };
      emit("campaign:checkpoint");
    } else if (e.type === "end") {
      const mi = chapterOf(e.mission);
      n(`That's everything playable in the campaign for now. ${mi ? `Chapter ${mi.n}, ${mi.title}, ` : "The next chapter "}is still being built: the road is yours until then, and your progress is saved.`, { icon: "★", ms: 10000, key: "camp-end" });
    }
    if (m && e.type) this.refreshGarage();
  }

  // Called by main once the closing scene of a mission that moves the calendar has played
  takeDay() {
    if (!this.pendingDay || this.playing || this.st.queue.length) return null;
    const d = this.pendingDay; this.pendingDay = null;
    return d;
  }

  hud() {
    if (!this.active || !this.view) return null;
    const v = this.view, ch = v.chapter;
    if (!v.playable) return null;
    const cur = v.current;
    let text = cur ? cur.text : "";
    if (cur && cur.hint) text += ` · ${cur.hint}`;
    const travel = this.travelHint(cur);
    if (travel) text += ` · ${travel}`;
    const wp = this.st.store.waypoint;
    if (wp) { const me = this.ctx.player().pos, fmt = this.ctx.fmtDist || ((m) => (m / 1000).toFixed(1) + " km"); text += ` · 📍 ${wp.name} ${fmt(dist2(me, wp.x, wp.z))}`; }
    return { title: `${ch ? ch.n + " · " : ""}${v.title}`, text, level: "info" };
  }
  travelHint(cur) {
    if (!cur) return "";
    const p = this.ctx.player().pos, pl = this.places, fmt = this.ctx.fmtDist || ((m) => (m / 1000).toFixed(1) + " km");
    if (cur.id === "straps" || (cur.id === "del" && !this.st.branch["01.04.A"])) return `Pull-off ${fmt(Math.max(0, dist2(p, pl.pulloff.x, pl.pulloff.z)))}`;
    if (this.st.mission.startsWith("01.") && (cur.id === "deliver" || cur.id === "del")) return `Mercy Motel ${fmt(Math.max(0, dist2(p, pl.motel.x, pl.motel.z)))}`;
    const to = this.travelTo(cur);
    if (to && dist2(p, to.x, to.z) > 80) return `${to.name} ${fmt(dist2(p, to.x, to.z))}`;
    return "";
  }
  travelTo(cur) {
    for (const w of this.worlds) { const to = w.travel && w.travel(cur); if (to) return to; }
    return null;
  }
  // What the objective marker points at: a beam over the place you have to drive to, and a chevron over the person or
  // thing to use once you are there. → { pos: Vector3 | null (the place), over: Object3D | null }
  markerTarget(cur) {
    this.aimPlace = null;
    if (!cur || !this.active) return null;
    let m = null;
    for (const w of this.worlds) { m = w.marker ? w.marker(cur) : null; if (m) break; }
    if (!m) m = this.marker1(cur) || { place: this.travelTo(cur) };
    const n = m.who && this.people.get(m.who);
    const over = n && !n.seat ? n.mesh : typeof m.obj === "string" ? this.objs.get(m.obj) || null : m.obj || null;
    const pl = m.place;
    this.aimPlace = pl || null;
    return { pos: pl ? new THREE.Vector3(pl.x, heightAt(pl.x, pl.z), pl.z) : null, over: over && over.visible !== false ? over : null, person: !!n };
  }
  marker1(cur) {
    const st = this.st, pl = this.places, v = this.ctx.truck(), k = st.mission + ":" + cur.id;
    if (!st.mission.startsWith("01.")) return null;
    const truck = v ? v.mesh : null, battery = this.ctx.props.get && this.ctx.props.get(BATTERY_ID), rkit = this.ctx.props.get && this.ctx.props.get(KIT_ID);
    const unread = ["generator", "van", "sewing"].find((t) => !st.fact("tag:" + t));
    const obj = {
      "01.01:office": "camp:tag:generator", "01.01:tags": unread ? "camp:tag:" + unread : null, "01.01:truck": truck, "01.01:phone": "camp:phone", "01.01:shutter": "camp:shutter",
      "01.02:test": truck, "01.02:find": battery && !battery.held ? battery.mesh : null, "01.02:install": truck, "01.02:fluids": truck, "01.02:start": truck,
      "01.02:kit": rkit && !rkit.held && !rkit.secured ? rkit.mesh : truck,
      "01.03:message": "camp:machine", "01.03:bench": "camp:bench", "01.03:call": "camp:phone", "01.03:clear": "camp:bench", "01.03:marks": "camp:bench",
      "01.03:load": st.fact("door:lifted") ? truck : "camp:bench",
    }[k];
    if (obj !== undefined) return { obj };
    if (k === "01.04:straps") return { place: pl.pulloff, obj: st.fact("straps") ? null : this.strapTarget };
    if (k === "01.04:del") return st.store.del === "riding" ? { place: pl.motel } : { place: pl.pulloff, who: "del" };
    if (k === "01.04:deliver") return { place: pl.motel, who: "alma" };
    return null;
  }
  // Campaign places for the map: shown ahead as soon as a mission sends you there
  mapSites() {
    if (!this.active) return [];
    const out = [], st = this.st;
    if (st.mission >= "01.04" || st.done["01.04"]) out.push(this.places.motel);
    if (st.mission === "01.04" && !st.fact("straps")) out.push(this.places.pulloff);
    for (const w of this.worlds) w.mapSites(out);
    return out;
  }
  note(what) {
    if (!this.active || what !== "map") return;
    if (this.st.mission === "01.04") this.st.setFact("map:opened");
    for (const w of this.worlds) w.noteMap && w.noteMap();
  }

  // Journal overlay data
  journal() {
    const st = this.st, v = this.view || missionView(st, DEFS, { day: this.ctx.day(), truck: { cargo: new Set() }, water: 0 });
    const chapters = [];
    for (const ch of SCRIPT.chapters) {
      chapters.push({ n: ch.n, title: ch.title, missions: ch.missions.map((m) => ({ id: m.id, title: m.title, done: !!st.done[m.id], current: st.mission === m.id, playable: !!DEFS[m.id] })) });
    }
    return {
      day: this.ctx.day(), weekday: weekday(this.ctx.day()), mission: v, help: st.help, ended: st.ended,
      journal: st.journal.slice().reverse(), tapes: st.tapes.map((k) => ({ key: k, title: sceneByKey(k)?.title || k })), chapters,
    };
  }
  askHelp() { this.st.help = true; this.clock = 0; }
}

// Recorded takes: audio/voice/index.json = ["LH-01-01-A-001", …] lists the line ids that have a file
// audio/voice/<id>.mp3. Missing index = subtitles only (no 404s per line).
async function loadVoiceIndex() {
  try {
    const r = await fetch(new URL("../../audio/voice/index.json", import.meta.url));
    if (!r.ok) return null;
    const ids = await r.json();
    return Array.isArray(ids) ? new Set(ids) : null;
  } catch (e) { return null; }
}
export const voiceUrl = (id) => new URL(`../../audio/voice/${id}.mp3`, import.meta.url).href;
export { nextWeekday };
