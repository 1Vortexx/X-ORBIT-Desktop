// Long Haul – Chapter 2 in the world: Lorna's generator on the garage trestles, Bell's Bakery, Basin Hire's chairs,
// Mercy Camp (Manny, the stove, the lamp oil), the supper at Mercy Motel and Ellis's lift home.
// The rules are in chapter2.js; this file writes facts and the world view (w.ch2) for them.
//
// Places on the authored road: Bell's Bakery is the first diner after Mercy Motel; Basin Hire, Mercy Camp and the weigh
// station are roadside spots the campaign builds itself; Ellis lives in the first house past the first fuel stop.
import * as THREE from "three";
import { heightAt } from "../world/terrain.js";
import { nextSiteAfter, sitesBetween } from "../world/sites.js";
import { registerItems, makeItem } from "../items.js";
import { M, box } from "./mesh.js";
import { ChapterWorld, dist2 } from "./kit.js";

const GEN = "camp:generator", STOVE = "camp:stove", OIL = "camp:lampoil", LEGS_TYPE = "stove_legs";
const BREAD = ["camp:bread1", "camp:bread2"], CHAIRS = [1, 2, 3, 4, 5, 6].map((i) => "camp:chair" + i);
const SUPPER = new Set(["folding_chair", "lamp_oil", "bread_crate", "camp_stove"]);
const FAIL_MIN = 20, PASS_MIN = 30;           // game minutes: when the blocked vent starves it, and the load test to pass

// ── items ──
function genMesh() {
  const g = new THREE.Group();
  box(g, 0.6, 0.06, 0.44, M("genframe", 0x2b2d31, { m: 0.5 }), 0, -0.22, 0);
  box(g, 0.5, 0.3, 0.36, M("genbody", 0xc23b22, { r: 0.5, m: 0.2 }), 0, -0.04, 0);
  box(g, 0.3, 0.1, 0.24, M("gentank", 0xd84a2c, { r: 0.45 }), 0.06, 0.16, 0);
  box(g, 0.05, 0.03, 0.05, M("gencap", 0x1b1c1e), 0.1, 0.225, 0.04);
  return g;
}
function crateMesh() {
  const g = new THREE.Group();
  box(g, 0.55, 0.2, 0.4, M("crate", 0x8a6a3e), 0, -0.04, 0);
  for (let i = 0; i < 4; i++) box(g, 0.12, 0.09, 0.3, M("loaf", 0xc68a45, { r: 0.9 }), -0.19 + i * 0.13, 0.1, 0);
  return g;
}
function chairMesh() {
  const g = new THREE.Group();
  box(g, 0.44, 0.03, 0.8, M("chairseat", 0x5f6b73, { m: 0.4 }), 0, 0, 0);
  for (const x of [-0.19, 0.19]) box(g, 0.025, 0.05, 0.84, M("chairleg", 0x9aa0a6, { m: 0.7 }), x, 0.02, 0);
  return g;
}
function stoveMesh() {
  const g = new THREE.Group();
  box(g, 0.6, 0.12, 0.42, M("stove", 0x3e5f43, { r: 0.5, m: 0.3 }), 0, -0.06, 0);
  for (const x of [-0.15, 0.15]) box(g, 0.16, 0.02, 0.16, M("burner", 0x1b1c1e), x, 0.01, 0);
  return g;
}
function oilMesh() {
  const g = new THREE.Group();
  box(g, 0.2, 0.28, 0.14, M("oiltin", 0x2f5d8a, { r: 0.4, m: 0.5 }), 0, 0, 0);
  box(g, 0.04, 0.04, 0.04, M("gencap", 0x1b1c1e), 0.05, 0.16, 0);
  return g;
}
function legsMesh() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) box(g, 0.02, 0.02, 0.4, M("chairleg", 0x9aa0a6, { m: 0.7 }), -0.03 + i * 0.02, 0, 0);
  return g;
}
registerItems({
  bakery_generator: { name: "Lorna's generator", icon: "⚡", kind: "misc", mass: 48, size: [0.62, 0.5, 0.46], price: 0, pocket: false,
    desc: "Bell's Bakery's generator. It runs the cold room during outages.", makeMesh: genMesh },
  bread_crate: { name: "Bread crate", icon: "🍞", kind: "misc", mass: 7, size: [0.56, 0.28, 0.42], price: 0, pocket: false,
    desc: "Lorna's bread for the supper. The ugly loaves on top are yours.", makeMesh: crateMesh },
  folding_chair: { name: "Folding chair", icon: "🪑", kind: "misc", mass: 4, size: [0.46, 0.08, 0.86], price: 0, pocket: false,
    desc: "From Basin Hire. Folds flat and stacks.", makeMesh: chairMesh },
  camp_stove: { name: "Camp stove", icon: "🔥", kind: "misc", mass: 11, size: [0.62, 0.14, 0.44], price: 0, pocket: false,
    desc: "Mercy Camp's two-burner stove. June brought it out of Mercy. It was theirs.", makeMesh: stoveMesh },
  lamp_oil: { name: "Lamp oil", icon: "🛢️", kind: "misc", mass: 4.5, size: [0.2, 0.3, 0.14], price: 0, pocket: false,
    desc: "For the supper lamps. Carry it in the bed, not on your lap.", makeMesh: oilMesh },
  stove_legs: { name: "Stove legs", icon: "🦵", kind: "misc", mass: 1.2, size: [0.1, 0.03, 0.42], price: 0, pocket: true, stack: 1,
    desc: "The camp stove's folding legs. Everybody forgets them.", makeMesh: legsMesh },
});

// Things said in conversations at the supper that the script leaves to the player (written, not voiced)
const TALKS = {
  nico: { name: "Nico Reyes", role: "Alma's son", lines: ["Nico keeps it light: his mother's cooking, the motel's water pressure, a claim at work that involves a goat.",
    "When June comes up he passes you the bread instead of answering."] },
  fern: { name: "Fern", role: "Used to call the auctions", lines: ["Fern called the household auctions in the barn for years. She still counts the room before she sits down.",
    "She asks what the garage is worth, then says she's sorry for asking, then asks again."] },
  ellis: { name: "Ellis Ward", role: "Mechanic", lines: ["Ellis eats standing by the door. Twice he starts to say something and finishes with \"later\".",
    "He keeps one hand on his jacket pocket."] },
};

export class Chapter2World extends ChapterWorld {

  bind() {
    const c = this.camp, pl = c.places;
    const bakery = nextSiteAfter(pl.motel.zRoad, "diner");
    bakery.name = "Bell's Bakery"; bakery.campaign = "bakery";
    let ward = null;
    const station = nextSiteAfter(pl.garage.zRoad, "station");
    for (const s of sitesBetween(pl.garage.z + 50, pl.garage.z + 6000)) if (s.kind === "home" && s.zRoad > station.zRoad) { ward = s; break; }
    ward = ward || nextSiteAfter(station.zRoad, "home");
    ward.name = "Ward house"; ward.campaign = "ellis";
    pl.bakery = bakery; pl.ward = ward;
    pl.hire = c.roadSpot(pl.garage.zRoad + 4000, 1, "Basin Hire", "hire");
    pl.camp = c.roadSpot(pl.garage.zRoad + 8000, 1, "Mercy Camp", "camp");
    pl.weigh = c.roadSpot(pl.bakery.zRoad + 4500, -1, "Mercy Weigh Station", "weigh");
  }

  begin() {
    this.built = {};
    this.buildGenerator();
    this.buildLedger();
  }

  // ── Vale Garage: the generator on the trestles where the door used to lie, and the office ledger ──
  buildGenerator() {
    const c = this.camp, st = c.st, g = c.places.garage;
    const stand = genMesh();
    const lamp = box(stand, 0.03, 0.03, 0.03, new THREE.MeshStandardMaterial({ color: 0x55ff66, emissive: 0x33ff44, emissiveIntensity: 1.5 }), -0.2, 0.12, 0.19);
    c.place(stand, g, 8.4, -7.5, 0.82 + 0.25);
    this.gen = { mesh: stand, lamp };
    this.camp.target(stand, { id: "camp:gen", name: "Lorna's generator", reach: 2.4, info: () => ({ note: this.genNote() }), actions: (ctx) => this.genActions(ctx) });
    this.refresh();
  }
  buildLedger() {
    const c = this.camp, g = c.places.garage;
    const book = new THREE.Group();
    box(book, 0.3, 0.035, 0.22, M("ledger", 0x5a2e1f), 0, 0.018, 0);
    box(book, 0.28, 0.006, 0.2, M("tag", 0xf3ead2), 0, 0.038, 0);
    c.place(book, g, -9 + 1.6, -5 + 0.95, 0.74, 0.2);
    const st = c.st;
    this.camp.target(book, { id: "camp:ledger", name: "Garage ledger", reach: 2.2, info: () => ({ note: st.fact("ticket:logged") ? "Weigh ticket logged" : "June's accounts" }),
      actions: () => {
        if (st.mission !== "02.04" || st.fact("ticket:logged")) return [];
        if (!st.seen("02.04.A")) return [{ key: "use", label: "Log the weigh ticket", blocked: "You haven't got anything to log yet" }];
        return [{ key: "use", label: "Log the weigh ticket", hold: 1.5, run: () => {
          st.setFact("ticket:logged");
          st.addJournal("02.04", "Weigh ticket from Ellis: 1,860 lb on June's truck, clearance day. Find out what was on it.", c.ctx.day());
          c.ctx.sfx("pickup");
        } }];
      } });
  }
  genState() { return this.camp.st.store.gen || { state: "idle" }; }
  genNote() {
    const g = this.genState(), st = this.camp.st;
    if (g.state === "running") return `Running under load · ${Math.floor(this.camp.ctx.hours() * 60 - g.start * 60)} min`;
    if (g.state === "failed") return "Coughed and died";
    if (g.state === "passed") return "Held under load";
    return st.fact("gen:vent") ? "Vent cleaned" : "Cuts out when it gets warm";
  }
  genActions(ctx) {
    const c = this.camp, st = c.st, g = this.genState();
    if (st.mission !== "02.01" || st.fact("gen:lifted")) return [];
    const run = (label) => ({ key: "use", label, hold: 1, run: () => { st.store.gen = { state: "running", start: c.ctx.hours() }; c.ctx.sfx("crank"); this.refresh(); } });
    if (g.state === "running") return [{ key: "use", label: "Stop it", run: () => { st.store.gen = { state: "idle" }; this.refresh(); } }];
    if (!st.fact("gen:diagnosed")) {
      if (g.state === "failed") return [{ key: "use", label: "Open the fuel cap", run: () => {
        st.setFact("gen:diagnosed"); st.store.gen = { state: "idle" }; this.refresh();
        c.ctx.notify("Air hisses into the tank and it catches again. The vent's blocked: it starves itself, then recovers when the cap comes off.", { icon: "⚡", ms: 8000 });
      } }];
      return [run("Run it under load")];
    }
    if (!st.fact("gen:vent")) return [{ key: "use", label: "Clean the fuel vent", hold: 3, run: () => { st.setFact("gen:vent"); c.ctx.sfx("ratchet"); this.refresh(); } }];
    if (g.state !== "passed") return [run(g.state === "failed" ? "Try the load test again" : "Start the load test")];
    return [{ key: "grab", label: "Lift the generator", blocked: ctx && ctx.held ? "Put down what you're holding" : undefined, run: (cc) => {
      if (!cc.giveHeld(makeItem("bakery_generator", { id: GEN }))) return;
      st.setFact("gen:lifted"); this.refresh();
    } }];
  }
  // The load test runs on the game clock, so sleeping or driving off while it runs is fine
  tickGenerator() {
    const c = this.camp, st = c.st, g = this.genState();
    if (g.state !== "running") return;
    const mins = (c.ctx.hours() - g.start) * 60;
    if (!st.fact("gen:vent") && mins >= FAIL_MIN) {
      st.store.gen = { state: "failed" };
      if (this.near(c.places.garage, 60)) c.ctx.notify("Twenty minutes in, the generator coughs and dies.", { icon: "⚡", level: "warn" });
      this.refresh();
    } else if (st.fact("gen:vent") && mins >= PASS_MIN) {
      st.store.gen = { state: "passed" };
      c.ctx.notify("Half an hour under load and the generator hasn't missed a beat.", { icon: "⚡", level: "good" });
      this.refresh();
    }
  }
  refresh() {
    if (!this.gen) return;
    const st = this.camp.st;
    this.gen.mesh.visible = !!st.done["01.04"] && !st.fact("gen:lifted") && !st.done["02.01"];
    this.gen.lamp.visible = this.genState().state === "running";
  }

  // ── places that appear when you get near them ──
  buildHire() {
    const c = this.camp, s = c.places.hire, g = new THREE.Group();
    box(g, 3.2, 2.4, 0.1, M("shed", 0x8b9196, { m: 0.4 }), 0, 1.2, -1.4);
    for (const x of [-1.6, 1.6]) box(g, 0.1, 2.4, 2.8, M("shed", 0x8b9196, { m: 0.4 }), x, 1.2, 0);
    box(g, 3.4, 0.08, 3.0, M("shedroof", 0x6d7377, { m: 0.4 }), 0, 2.44, 0);
    box(g, 1.6, 0.4, 0.04, M("signblue", 0x1f4e8c, { r: 0.5 }), 0, 2.1, 1.42);
    c.placeAt(g, s, 0, -3);
    c.solidAt(s, 0, -4.4, 3.4, 0.2, 2.4); c.solidAt(s, -1.6, -3, 0.2, 2.8, 2.4); c.solidAt(s, 1.6, -3, 0.2, 2.8, 2.4);
    this.built.hire = true;
  }
  buildCamp() {
    const c = this.camp, s = c.places.camp, g = new THREE.Group();
    for (const [x, z, col] of [[-3, -2, 0xb9a77f], [3.2, -2.6, 0x7f8a6a]]) {
      const t = new THREE.Group();
      for (const sgn of [-1, 1]) { const b = box(t, 1.6, 0.04, 2.4, M("tent" + col, col, { r: 0.95 }), sgn * 0.55, 0.7, 0); b.rotation.z = sgn * -0.9; }
      t.position.set(x, 0, z); g.add(t);
      c.solidAt(s, x, z, 2.2, 2.4, 1.4);
    }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; box(g, 0.26, 0.18, 0.22, M("rock", 0x6f6a62), Math.cos(a) * 0.6, 0.09, 1.4 + Math.sin(a) * 0.6).rotation.y = a; }
    box(g, 1.0, 0.04, 0.5, M("trestle", 0x6b4a2b), 1.8, 0.7, 0.2);
    c.placeAt(g, s, 0, -1);
    this.built.camp = true;
  }

  update(p) {
    const c = this.camp, st = c.st, pl = c.places, m = st.mission;
    this.tickGenerator();
    this.refresh();
    if (!this.built.hire && this.near(pl.hire, 900)) this.buildHire();
    if (!this.built.camp && this.near(pl.camp, 900)) this.buildCamp();
    const v = c.ctx.truck();
    // 02.01 Bell's Bakery
    this.presence("lorna", "Lorna", 5521, pl.bakery, 2.5, 2.2, m === "02.01" && !st.done["02.01"], () => this.talkLorna(), "Bell's Bakery");
    if (st.store.genDelivered && this.near(pl.bakery, 300)) {
      this.spawnOnce("bread:spawned", BREAD.map((id, i) => [makeItem("bread_crate", { id }), c.spotPos(pl.bakery, -2.4 + i * 0.7, 1.6, 0.2), pl.bakery.yaw]));
    }
    // 02.02 Basin Hire, Mercy Camp, the motel
    if (m === "02.02" && this.near(pl.hire, 300)) {
      this.spawnOnce("chairs:spawned", CHAIRS.map((id, i) => [makeItem("folding_chair", { id }), c.spotPos(pl.hire, -0.8 + (i % 3) * 0.6, -2.6 + Math.floor(i / 3) * 1.0, 0.1), pl.hire.yaw]));
    }
    if (m === "02.02" && this.near(pl.camp, 300)) {
      this.spawnOnce("camp:spawned", [[makeItem("camp_stove", { id: STOVE }), c.spotPos(pl.camp, 1.8, 0.8, 0.8), pl.camp.yaw],
        [makeItem("lamp_oil", { id: OIL }), c.spotPos(pl.camp, 2.6, 1.4, 0.2), pl.camp.yaw]]);
    }
    const held = c.ctx.interaction.held;
    if (m === "02.02" && held && held.id === STOVE && !st.seen("02.02.A")) c.queue("02.02.A");
    this.presence("manny", "Manny", 4410, pl.camp, 0.6, 1.4, m === "02.02" || m === "02.04", m === "02.04" ? () => this.talkMannyReturn() : null, "Mercy Camp");
    const motelPeople = m === "02.02" || m === "02.03" || (m === "02.04" && !st.done["02.04"]);
    this.presence("del2", "Del", 7104, pl.motel, -4.2, 1.8, m === "02.02" || m === "02.03", m === "02.02" ? () => this.unload() : null, "Mercy Motel");
    this.presence("alma2", "Alma", 6812, pl.motel, -7.8, 2.0, m === "02.02" || m === "02.03", null, "Mercy Motel");
    // 02.03 the supper
    const supper = m === "02.03";
    this.presence("nico", "Nico", 6813, pl.motel, -3.2, 3.6, supper, () => this.talkTo("nico"), "Alma's son");
    this.presence("fern", "Fern", 3307, pl.motel, -9.6, 3.4, supper, () => this.talkTo("fern"), "Used to call the auctions");
    this.presence("inez", "Inez", 8820, pl.motel, -13.5, -2.2, supper, () => this.talkInez(), "Radio host");
    this.presence("manny2", "Manny", 4410, pl.motel, -5.8, 3.9, supper, null, "Mercy Camp");
    // Ellis: at the supper, then riding home
    const ellis = st.store.ellis || "waiting";
    if (ellis !== "riding") this.presence("ellis", "Ellis", 2929, pl.motel, -11, 1.2, (supper || m === "02.04") && ellis === "waiting",
      () => (supper ? this.talkTo("ellis") : this.offerEllis()), "Mechanic");
    if (m === "02.04") {
      this.spawnOnce("stove:back", [[makeItem("camp_stove", { id: STOVE }), c.spotPos(pl.motel, -6, 1.6, 0.2), pl.motel.yaw]]);
      this.updateEllis(v);
    }
    if (motelPeople && c.motelTable && !c.motelTable._ch2) this.tableTarget();
    this.layChairs();
  }

  // ── 02.01 ──
  talkLorna() {
    const c = this.camp, st = c.st, v = c.ctx.truck();
    if (c.playing || st.mission !== "02.01") return;
    if (st.store.genDelivered) { c.ctx.notify("Lorna points at the crates by the door: the bread for supper.", { key: "camp-lorna", icon: "🍞" }); return; }
    const inBed = v && v.cargo.items.some((e) => e.item && e.item.id === GEN);
    const parked = v && dist2(v.pos, c.places.bakery.x, c.places.bakery.z) < 45 && Math.abs(v.speed) < 1;
    if (!inBed || !parked) {
      c.ctx.notify(inBed ? "Park the pickup at the bakery first." : st.fact("gen:lifted") ? "The generator needs to be in the pickup bed." : "Her generator is still at the garage.", { key: "camp-lorna", icon: "⚡" });
      return;
    }
    c.ctx.props.remove(GEN);
    st.store.genDelivered = true;
    c.queue("02.01.A");
  }

  // ── 02.02 ──
  supperItems() {
    const c = this.camp, v = c.ctx.truck(), pl = c.places.motel, out = [];
    if (v) for (const e of v.cargo.items) if (e.item && SUPPER.has(e.item.type)) out.push(e.item);
    const map = c.ctx.props.map;
    if (map) for (const pr of map.values()) if (pr.item && SUPPER.has(pr.item.type) && !pr.secured && !pr.held && dist2(pr.pos, pl.x, pl.z) < 40) out.push(pr.item);
    return out;
  }
  unload() {
    const c = this.camp, st = c.st, v = c.ctx.truck();
    if (c.playing || st.fact("supper:unloaded")) return;
    const items = this.supperItems();
    const chairs = items.filter((i) => i.type === "folding_chair").length, hasStove = items.some((i) => i.type === "camp_stove"), hasOil = items.some((i) => i.type === "lamp_oil");
    const near = v && dist2(v.pos, c.places.motel.x, c.places.motel.z) < 45 && Math.abs(v.speed) < 1;
    const missing = [chairs < 6 ? `${6 - chairs} more chair${6 - chairs > 1 ? "s" : ""}` : "", hasStove ? "" : "the stove", hasOil ? "" : "the lamp oil"].filter(Boolean);
    if (!near || missing.length) {
      c.ctx.notify(!near ? "Bring the pickup in close to the table first." : `Del counts what you've brought. Still missing: ${missing.join(", ")}.`, { key: "camp-del", icon: "🪑" });
      return;
    }
    for (const it of items) c.ctx.props.remove(it.id);
    st.setFact("chairs:delivered", 6); st.setFact("oil:delivered"); st.setFact("stove:delivered"); st.setFact("supper:unloaded");
    c.ctx.notify("Chairs, stove, lamp oil and bread come off the truck. Now the seating.", { icon: "🪑", level: "good" });
  }
  tableTarget() {
    const c = this.camp, st = c.st, t = c.motelTable;
    t._ch2 = true;
    this.camp.target(t, { id: "camp:supper", name: "The yellow door table", reach: 3,
      info: () => ({ note: st.mission === "02.03" ? `Served ${Math.min(3, st.count("serve:"))} of 3 tables` : "Mercy Motel" }),
      actions: () => {
        if (st.mission === "02.02" && st.fact("supper:unloaded") && !st.fact("seating:chosen")) return [
          { key: "use", label: "Leave the end clear with a straight path from the rooms", hold: 1.5, run: () => this.seat(true) },
          { key: "alt", label: "Fit the sixth chair at the end", hold: 1.5, run: () => this.seat(false) },
        ];
        if (st.mission === "02.03" && st.count("serve:") < 3 && !c.playing) return [{ key: "use", label: `Serve table ${st.count("serve:") + 1}`, hold: 2, run: () => {
          st.setFact("serve:" + (st.count("serve:") + 1)); c.ctx.sfx("pickup");
        } }];
        return [];
      } });
  }
  seat(accessible) {
    const c = this.camp, st = c.st;
    st.setFact("seating:chosen");
    if (accessible) st.flags.ACCESSIBLE_TABLE = true;
    c.queue("02.02.B");
  }
  // Chairs around the table once they are set out (five and a clear end, or six)
  layChairs() {
    const c = this.camp, st = c.st;
    if (!st.fact("seating:chosen") || this.chairs || !c.motelTable || !this.near(c.places.motel, 600)) return;
    const g = new THREE.Group(), n = st.flags.ACCESSIBLE_TABLE ? 5 : 6;
    const spots = [[-0.6, 0.75], [0.1, 0.75], [0.8, 0.75], [-0.6, -0.75], [0.1, -0.75], [1.35, 0]];
    for (let i = 0; i < n; i++) {
      const ch = new THREE.Group();
      box(ch, 0.42, 0.04, 0.42, M("chairseat", 0x5f6b73, { m: 0.4 }), 0, 0.45, 0);
      box(ch, 0.42, 0.42, 0.04, M("chairseat", 0x5f6b73, { m: 0.4 }), 0, 0.68, -0.2);
      for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(ch, 0.025, 0.45, 0.025, M("chairleg", 0x9aa0a6, { m: 0.7 }), x, 0.225, z);
      const [x, z] = spots[i];
      ch.position.set(x, 0, z); ch.rotation.y = i === 5 ? -Math.PI / 2 : z > 0 ? Math.PI : 0;
      g.add(ch);
    }
    c.placeAt(g, c.places.motel, -6, 0.5);
    this.chairs = g;
  }

  // ── 02.03 ──
  talkTo(id) {
    const c = this.camp, st = c.st, t = TALKS[id];
    if (c.playing) return;
    c.ctx.dialogue({ speaker: t.name, role: t.role, lines: t.lines, choices: [{ id: "back", label: "Leave them to their supper" }],
      onChoose: () => { st.setFact("talk:" + id); } });
  }
  talkInez() {
    const c = this.camp, st = c.st;
    if (c.playing || st.seen("02.03.B") || st.branch["02.03.B"]) return;
    if (st.count("serve:") < 3 || st.count("talk:") < 3) {
      c.ctx.notify("Inez is still eating. Serve the tables and talk to people first; she isn't going anywhere.", { key: "camp-inez", icon: "📻" });
      return;
    }
    c.queue("02.03.B");
  }
  // The branch choices of chapter 2's scenes. true = asked (or answered); false = could not open yet
  choose(key) {
    const c = this.camp, st = c.st;
    if (key !== "02.03.B") return undefined;
    return c.ctx.dialogue({
      speaker: "Kit", role: "At the supper", lines: ["“Mercy empty. Returning to depot.”", "She never played that at home."],
      choices: [
        { id: "PUBLIC_QUESTION", label: "Ask the table whether June said she'd collected everybody", detail: "Everyone hears the question." },
        { id: "PRIVATE_QUESTION", label: "Ask Inez quietly if you can hear the rest", detail: "Just between the two of you." },
      ],
      onChoose: (id) => { st.branch[key] = id; st.flags[id] = true; c.branchChosen(id); },
    });
  }

  // ── 02.04 ──
  offerEllis() {
    const c = this.camp, st = c.st, v = c.ctx.truck(), n = c.people.get("ellis");
    if (c.playing || !n || (st.store.ellis || "waiting") !== "waiting") return;
    const near = v && dist2(v.pos, n.pos.x, n.pos.z) < 12 && Math.abs(v.speed) < 1;
    if (!near || !v.seatFree("passenger")) {
      c.ctx.notify(!near ? "Bring the pickup alongside Ellis and stop." : "The passenger seat is taken.", { key: "camp-ellis", icon: "⛟" });
      return;
    }
    st.store.ellis = "riding";
    n.setTarget(null); n._talk = false;
    n.enterVehicle(v, "passenger");
  }
  updateEllis(v) {
    const c = this.camp, st = c.st, n = c.people.get("ellis");
    if (st.store.ellis !== "riding") return;
    if (!n) { const rec = st.store["npc:ellis"]; if (rec && rec.pos) c.person("ellis", "Ellis", 2929, new THREE.Vector3().fromArray(rec.pos), rec.yaw || 0); return; }
    if (v && n.seat && Math.abs(v.speed) > 6 && !st.seen("02.04.A")) c.queue("02.04.A");
    const home = c.places.ward;
    if (v && n.seat && dist2(v.pos, home.x, home.z) < 50 && Math.abs(v.speed) < 1 && st.seen("02.04.A") && !c.playing) {
      if (n.exitVehicle()) {
        st.store.ellis = "home";
        const door = c.at(home, -2, -0.5);
        n.walkTo(door.x, door.z);
      } else c.ctx.notify("Park with room beside the passenger door so Ellis can get out.", { key: "camp-ellis" });
    }
  }
  talkMannyReturn() {
    const c = this.camp, st = c.st, v = c.ctx.truck();
    if (c.playing || st.fact("stove:returned")) return;
    const stoveIn = (v && v.cargo.items.some((e) => e.item && e.item.id === STOVE)) || (c.ctx.interaction.held && c.ctx.interaction.held.id === STOVE);
    const legs = c.ctx.stock && c.ctx.stock.count(LEGS_TYPE) > 0;
    if (!stoveIn) { c.ctx.notify("The stove is still at the motel. Bring it in the pickup.", { key: "camp-manny", icon: "🔥" }); return; }
    if (!legs) { c.ctx.say("Manny", "Bring it back with the legs. Everybody forgets them.", 3.5); return; }
    c.ctx.props.remove(STOVE);
    c.ctx.stock.pay({ items: [{ type: LEGS_TYPE, n: 1 }] });
    st.setFact("stove:returned");
    c.ctx.notify("Stove and legs, back where they belong.", { icon: "🔥", level: "good" });
  }

  // Scenes ending: things handed over afterwards
  sceneDone(key) {
    const c = this.camp, st = c.st;
    if (key === "02.02.A" && !st.fact("legs:given")) {
      st.setFact("legs:given");
      c.ctx.stock && c.ctx.stock.give({ items: [{ type: LEGS_TYPE, n: 1 }] });
      c.ctx.notify("Manny hands you the stove legs. They're in your pockets.", { icon: "🦵" });
    }
  }

  view() {
    const c = this.camp, v = c.ctx.truck(), cargo = v ? v.cargo.items.map((e) => e.item) : [];
    const count = (t) => cargo.filter((i) => i && i.type === t).length;
    return {
      gen: this.genState().state, genIn: cargo.some((i) => i && i.id === GEN), bread: count("bread_crate"),
      chairsIn: count("folding_chair"), oilIn: count("lamp_oil") > 0, stoveIn: count("camp_stove") > 0,
      legs: c.ctx.stock ? c.ctx.stock.count(LEGS_TYPE) : 0, ellis: c.st.store.ellis || "waiting",
    };
  }

  // Phone calls this chapter adds
  phone() {
    const st = this.camp.st;
    if (st.mission === "02.04" && st.objDone("02.04", "close") && st.objDone("02.04", "route") && !st.seen("02.04.B"))
      return { key: "use", label: "Call Bell's Bakery", run: () => this.camp.queue("02.04.B") };
    return null;
  }
  // The shutter closes again at the end of 02.04
  shutter() {
    const c = this.camp, st = c.st;
    if (st.mission === "02.04" && st.objDone("02.04", "ticket") && st.objDone("02.04", "stove") && !st.fact("shutter:closed"))
      return { key: "use", label: "Lower the shutter", hold: 1.6, run: () => { st.setFact("shutter", false); st.setFact("shutter:closed"); c.ctx.sfx("hood_close"); } };
    return null;
  }

  mapSites(out) {
    const st = this.camp.st, pl = this.camp.places, m = st.mission;
    if (m === "02.01" && st.objDone("02.01", "fix")) out.push(pl.bakery);
    if (m === "02.02") out.push(pl.hire, pl.camp);
    if (m === "02.04") { out.push(pl.camp, pl.ward); if (st.fact("ticket:logged")) out.push(pl.weigh); }
  }
  travel(cur) {
    const st = this.camp.st, pl = this.camp.places, m = st.mission;
    if (!cur) return null;
    const pick = { "02.01:diagnose": pl.garage, "02.01:deliver": pl.bakery, "02.01:bread": pl.bakery, "02.02:chairs": pl.hire, "02.02:stove": pl.camp, "02.02:oil": pl.camp,
      "02.02:unload": pl.motel, "02.04:lift": pl.ward, "02.04:stove": pl.camp, "02.04:ticket": pl.garage, "02.04:close": pl.garage }[m + ":" + cur.id];
    return pick || null;
  }
  marker(cur) {
    const st = this.camp.st, m = st.mission;
    if (!cur || !m.startsWith("02.")) return null;
    const k = m + ":" + cur.id, gen = this.camp.ctx.props.get && this.camp.ctx.props.get(GEN);
    const who = { "02.01:deliver": "lorna", "02.02:stove": "manny", "02.02:unload": "del2", "02.03:excerpt": "inez", "02.04:lift": st.store.ellis === "riding" ? null : "ellis",
      "02.04:stove": "manny" }[k];
    const obj = { "02.01:diagnose": "camp:gen", "02.01:fix": "camp:gen", "02.02:seating": "camp:supper", "02.03:serve": "camp:supper", "02.04:ticket": "camp:ledger",
      "02.04:close": "camp:shutter", "02.04:call": "camp:phone", "02.01:deliver": st.fact("gen:lifted") ? null : "camp:gen" }[k];
    if (k === "02.01:deliver" && !st.fact("gen:lifted")) return { obj };
    if (k === "02.03:talk") return { place: this.camp.places.motel, who: ["nico", "fern", "ellis"].find((id) => !st.fact("talk:" + id)) };
    return { place: this.travel(cur), who, obj };
  }
  noteMap() { const st = this.camp.st; if (st.mission === "02.04" && st.fact("ticket:logged")) st.setFact("map:weigh"); }
}
