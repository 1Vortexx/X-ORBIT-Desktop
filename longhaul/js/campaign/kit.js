// Long Haul – what every chapter's world shares: people standing at places while a mission wants them there,
// props laid out once, handing things over (pockets or the bed), and the checks "is the pickup parked here",
// "is this in the bed", "is this in my hands". Chapter worlds (world2.js, world3.js, …) extend ChapterWorld.
//
// The hooks index.js calls on every chapter world (all optional):
//   bind()              name places (right after the seed is set)       begin()        build garage-side objects
//   update(p)           every quarter second                            view()         facts for the rules (w.chN)
//   choose(sceneKey)    ask a scene's branch question: true asked, false can't open yet, undefined not mine
//   sceneDone(key)      a scene played to its end                       phone()        an office telephone action | null
//   shutter()           a yard shutter action | null                    mapSites(out)  places to mark on the map
//   travel(cur)         where the current objective sends you: a place | null
//   marker(cur)         what the objective marker points at: { place?, who?, obj? } | null (defaults to travel)
//   noteMap()           the map was opened
import * as THREE from "three";
import { M, box } from "./mesh.js";

export const dist2 = (a, x, z) => Math.hypot(a.x - x, a.z - z);

export class ChapterWorld {
  constructor(camp) { this.camp = camp; this.built = {}; }

  get st() { return this.camp.st; }
  get ctx() { return this.camp.ctx; }
  near(place, r) { return dist2(this.ctx.player().pos, place.x, place.z) < r; }
  // The pickup stopped within r metres of a place
  parkedAt(place, r = 45) {
    const v = this.ctx.truck();
    return !!v && dist2(v.pos, place.x, place.z) < r && Math.abs(v.speed) < 1;
  }
  inBed(id) { const v = this.ctx.truck(); return !!v && v.cargo.items.some((e) => e.item && (e.item.id === id || e.item.type === id)); }
  bedCount(type) { const v = this.ctx.truck(); return v ? v.cargo.items.filter((e) => e.item && e.item.type === type).length : 0; }
  holding(id) { const h = this.ctx.interaction.held; return !!h && (h.id === id || h.type === id); }
  carried(type) { return this.ctx.stock ? this.ctx.stock.count(type) : 0; }
  // In the hands or in the bed
  brought(id) { return this.holding(id) || this.inBed(id); }

  spawnOnce(fact, items) {
    const st = this.st;
    if (st.fact(fact)) return;
    st.setFact(fact);
    for (const [item, pos, yaw] of items) this.ctx.props.spawn(item, pos, { yaw });
  }
  // Someone hands Kit something: small things go in the pockets, the rest lands at her feet
  hand(from, items, text) {
    this.ctx.stock && this.ctx.stock.give({ items });
    this.ctx.notify(text || `${from} hands you ${items.map((g) => g.type).join(", ")}.`, { icon: "🤝", level: "good", ms: 5000 });
    this.ctx.sfx("pickup");
  }
  // Kit hands something over out of her pockets. false = she hasn't got it
  takeFromPockets(type, n = 1) {
    const s = this.ctx.stock;
    return !!s && s.count(type) >= n && s.pay({ items: [{ type, n }] });
  }

  // Someone standing at a place while a mission wants them there (dropped again once you are far away).
  // talk: what "Talk" does right now (null = nothing to say); note: the line under their name.
  presence(id, name, seed, place, lx, lz, want, talk, note) {
    const c = this.camp, p = c.ctx.player().pos;
    const d = dist2(p, place.x, place.z);
    if (want && d < 320) {
      // a fresh arrival stands at their spot, not wherever they were last seen
      if (!c.people.has(id)) delete this.st.store["npc:" + id];
      const n = c.person(id, name, seed, c.spotPos(place, lx, lz), place.yaw || 0);
      // what talking does changes from mission to mission: the target always calls the current one
      n._talkFn = talk; n._note = typeof note === "function" ? note : () => note || "";
      if (!n._talk) {
        n._talk = true;
        n.setTarget({ name, info: () => ({ note: n._note() }), actions: () => (n._talkFn ? [{ key: "use", label: "Talk", run: () => n._talkFn() }] : []) });
      }
      if (d < 30 && !n.seat && !c.playing) n.lookAt(p);
      return n;
    }
    // people who aren't needed any more leave once you've gone, not in front of you
    if (c.people.has(id) && !c.people.get(id).seat && ((!want && d > 60) || d > 450)) c.drop(id);
    return null;
  }
  // A passenger who rides with Kit between two places. state lives in st.store[key]:
  //   "waiting" → (offerRide) "riding" → (arrives, gets out) "dropped"
  offerRide(key, id, name) {
    const c = this.camp, st = this.st, v = c.ctx.truck(), n = c.people.get(id);
    if (c.playing || !n || (st.store[key] || "waiting") !== "waiting") return false;
    const near = v && dist2(v.pos, n.pos.x, n.pos.z) < 12 && Math.abs(v.speed) < 1;
    if (!near || !v.seatFree("passenger")) {
      c.ctx.notify(!near ? `Bring the pickup alongside ${name} and stop.` : "The passenger seat is taken.", { key: "camp-ride", icon: "⛟" });
      return false;
    }
    st.store[key] = "riding";
    n.setTarget(null); n._talk = false;
    n.enterVehicle(v, "passenger");
    return true;
  }
  // Keeps a riding passenger with the truck across reloads and lets them out at `to`. true = just got out
  ride(key, id, name, seed, to, { canLeave = () => true, walk } = {}) {
    const c = this.camp, st = this.st, v = c.ctx.truck();
    if (st.store[key] !== "riding") return false;
    let n = c.people.get(id);
    if (!n) {
      const rec = st.store["npc:" + id];
      if (rec && rec.pos) c.person(id, name, seed, new THREE.Vector3().fromArray(rec.pos), rec.yaw || 0);
      return false;
    }
    if (!(v && n.seat && dist2(v.pos, to.x, to.z) < 50 && Math.abs(v.speed) < 1 && canLeave() && !c.playing)) return false;
    if (!n.exitVehicle()) { c.ctx.notify(`Park with room beside the passenger door so ${name} can get out.`, { key: "camp-ride" }); return false; }
    st.store[key] = "dropped";
    if (walk) { const w = c.at(to, walk[0], walk[1]); n.walkTo(w.x, w.z); }
    return true;
  }

  // A thing in the world that does something when used: a mesh at a place with one or more actions
  thing(place, lx, lz, y, mesh, def, yaw = 0) {
    this.camp.placeAt(mesh, place, lx, lz, y, yaw);
    if (def) this.camp.target(mesh, def);
    return mesh;
  }
  // A plain shed/room: back wall, two side walls and an optional roof, with colliders. w along the frontage, d deep.
  shed(place, lx, lz, w, d, h, { roof = true, color = 0x8b9196, sign = null } = {}) {
    const c = this.camp, g = new THREE.Group(), mat = M("shed" + color, color, { m: 0.3, r: 0.7 });
    box(g, w, h, 0.1, mat, 0, h / 2, -d / 2);
    for (const x of [-w / 2, w / 2]) box(g, 0.1, h, d, mat, x, h / 2, 0);
    if (roof) box(g, w + 0.2, 0.08, d + 0.2, M("shedroof", 0x6d7377, { m: 0.4 }), 0, h + 0.04, 0);
    if (sign) box(g, Math.min(w * 0.6, 2.4), 0.45, 0.04, M("sign" + sign, sign, { r: 0.5 }), 0, h - 0.3, d / 2 + 0.02);
    c.placeAt(g, place, lx, lz);
    c.solidAt(place, lx, lz - d / 2, w, 0.2, h);
    c.solidAt(place, lx - w / 2, lz, 0.2, d, h);
    c.solidAt(place, lx + w / 2, lz, 0.2, d, h);
    return g;
  }
}
