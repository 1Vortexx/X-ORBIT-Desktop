// Long Haul – Chapter 3 in the world: the Mercy Weigh Station (roofless shed, scale platform, generator, isolator,
// junction box, ticket printer, the roof on the platform, test weights), the scrap yard's pump engines, Wes's counter
// and his seized vice, June's copier and archive case in the office, Ellis's toolbox and Inez at Vega Tyre.
// The rules are in chapter3.js; this file writes facts and the world view (w.ch3) for them.
//
// Places on the authored road: the weigh station is the roadside spot chapter 2 named; the scrap yard is the first junk
// yard past Mercy Camp's turn; Wes's Builders' Merchant is the first roadside garage after Vale Garage; Vega Tyre (Basin
// Radio upstairs) is the first roadside garage past the weigh station.
import * as THREE from "three";
import { nextSiteAfter } from "../world/sites.js";
import { registerItems, makeItem } from "../items.js";
import { M, box } from "./mesh.js";
import { ChapterWorld, dist2 } from "./kit.js";

const TOOLBOX = "camp:toolbox", WEIGHTS = [1, 2, 3, 4].map((i) => "camp:weight" + i);
const PLAT = { x: 2.2, z: -1.2, hx: 1.8, hz: 3.8 };       // the scale platform, weigh-station local (long axis towards the road)
const PRICE = 40;                                          // Wes's belt, connector and paper

function weightMesh() {
  const g = new THREE.Group();
  box(g, 0.3, 0.16, 0.2, M("testw", 0x3b3f44, { m: 0.7, r: 0.4 }), 0, 0, 0);
  box(g, 0.12, 0.04, 0.03, M("testwh", 0x9aa0a6, { m: 0.8 }), 0, 0.1, 0);
  return g;
}
function toolboxMesh() {
  const g = new THREE.Group();
  box(g, 0.5, 0.22, 0.22, M("tbox", 0xb3261e, { r: 0.5, m: 0.3 }), 0, 0, 0);
  box(g, 0.3, 0.03, 0.03, M("tboxh", 0x2b2d31), 0, 0.14, 0);
  return g;
}
registerItems({
  pulley_belt: { name: "Pulley belt", icon: "➰", kind: "misc", mass: 0.4, size: [0.2, 0.03, 0.2], price: 0, pocket: true, stack: 1,
    desc: "A V-belt off an old pump engine. The right width for the weigh station's generator." },
  power_connector: { name: "Rated connector", icon: "🔌", kind: "misc", mass: 0.2, size: [0.08, 0.05, 0.06], price: 0, pocket: true, stack: 1,
    desc: "A connector rated for the generator's output. Not wire used as a structural material." },
  printer_paper: { name: "Continuous printer paper", icon: "🧻", kind: "misc", mass: 0.9, size: [0.24, 0.1, 0.24], price: 0, pocket: true, stack: 1,
    desc: "Tractor-feed paper. Wes hasn't sold any since the council bought screens." },
  test_weight: { name: "25 kg test weight", icon: "🏋", kind: "misc", mass: 25, size: [0.3, 0.16, 0.2], price: 0, pocket: false,
    desc: "One of the weigh station's calibration weights.", makeMesh: weightMesh },
  ellis_toolbox: { name: "Ellis's toolbox", icon: "🧰", kind: "misc", mass: 9, size: [0.5, 0.22, 0.22], price: 0, pocket: false,
    desc: "Ellis lent you this at the weigh station. He'll want it back.", makeMesh: toolboxMesh },
  evidence_copy: { name: "Ticket copy", icon: "📄", kind: "misc", mass: 0.02, size: [0.21, 0.002, 0.3], price: 0, pocket: true, stack: 4,
    desc: "A copy of the 13:42 weigh ticket and June's ledger stub. The originals are in the office archive." },
});

const ENGINES = [
  { lx: 6, lz: -4, name: "Seized irrigation pump", note: "Belt's fused to the pulley. No use to anyone." },
  { lx: 10, lz: -9, name: "Pump engine · MERCY WATER stencil", belt: true },
  { lx: 1, lz: -10, name: "Generator carcass", note: "Somebody's already had the belt off this one." },
];
const ENTRIES = [
  { id: "fuel", label: "11:05 · depot fuel · 14 gal", wrong: "That's diesel, Kit. The carbon says Mercy Cut." },
  { id: "mercy", label: "13:42 · Mercy Cut · net 1,860 lb · lot 41" },
  { id: "tow", label: "17:40 · recovery tow · E. Ward", wrong: "That's the tow. That's me, later. Look at the time on the carbon." },
];

export class Chapter3World extends ChapterWorld {
  bind() {
    const c = this.camp, pl = c.places;
    const wes = nextSiteAfter(pl.garage.zRoad + 200, "garage");
    wes.name = "Wes's Builders' Merchant"; wes.campaign = "wes";
    const scrap = nextSiteAfter(pl.camp.zRoad - 1500, "junkyard");
    scrap.name = "Basin Scrap"; scrap.campaign = "scrap";
    const radio = nextSiteAfter(pl.weigh.zRoad, "garage");
    radio.name = "Vega Tyre · Basin Radio"; radio.campaign = "radio";
    Object.assign(pl, { wes, scrap, radio });
  }

  begin() {
    this.built = {};
    this.buildOffice();
  }

  // ── Vale Garage office: June's copier and the archive case ──
  buildOffice() {
    const c = this.camp, st = c.st, g = c.places.garage, H = (x, z) => [-9 + x, -5 + z];
    const copier = new THREE.Group();
    box(copier, 0.6, 0.9, 0.5, M("copier", 0xd9d4c7, { r: 0.6 }), 0, 0.45, 0);
    box(copier, 0.5, 0.03, 0.36, M("copierlid", 0x5a5a5a), 0, 0.92, 0);
    this.thing(g, ...H(-4.3, -3.3), 0, copier, {
      id: "camp:copier", name: "June's copier", reach: 2.2, info: () => ({ note: st.mission === "03.04" ? `${Math.min(2, st.count("copy:"))} of 2 copies` : "Warms up slowly" }),
      actions: () => (st.mission !== "03.04" || st.count("copy:") >= 2 ? [] : [{ key: "use", label: "Copy the ticket and the stub", hold: 2.5, run: () => {
        st.setFact("copy:" + (st.count("copy:") + 1));
        this.hand("June's copier", [{ type: "evidence_copy", n: 1 }], "A warm copy slides out. In your pockets.");
      } }]),
    });
    const caseM = new THREE.Group();
    box(caseM, 0.7, 0.5, 0.45, M("archive", 0x6f767c, { m: 0.6, r: 0.4 }), 0, 0.25, 0);
    box(caseM, 0.12, 0.05, 0.03, M("brass", 0xc9a24a, { r: 0.3, m: 0.8 }), 0, 0.42, 0.23);
    this.thing(g, ...H(-4.3, 3.2), 0, caseM, {
      id: "camp:archive", name: "Office archive case", reach: 2.2,
      info: () => ({ note: st.fact("archive:ticket") ? "Originals inside, locked" : "Dry, fireproof, June's" }),
      actions: () => (st.mission !== "03.04" || st.fact("archive:ticket") ? [] : [{ key: "use", label: "Lock the originals inside", hold: 1.5,
        blocked: st.count("copy:") < 2 ? "Make your two copies first" : undefined, run: () => { st.setFact("archive:ticket"); c.ctx.sfx("hood_close"); } }]),
    });
  }

  // ── the weigh station ──
  buildStation() {
    const c = this.camp, st = c.st, s = c.places.weigh;
    this.built.station = true;
    // the platform: a steel deck the pickup drives onto
    const deck = new THREE.Group();
    box(deck, PLAT.hx * 2, 0.08, PLAT.hz * 2, M("deck", 0x6e7276, { m: 0.6, r: 0.5 }), 0, 0.04, 0);
    for (const sx of [-1, 1]) box(deck, 0.12, 0.1, PLAT.hz * 2, M("deckrail", 0xe0b21b, { r: 0.6 }), sx * (PLAT.hx - 0.06), 0.05, 0);
    this.thing(s, PLAT.x, PLAT.z, 0, deck, {
      id: "camp:platform", name: "Scale platform", reach: 4, info: () => ({ note: st.fact("insp:platform") ? (st.count("debris:") >= 4 ? "Clear" : "Roof sheets on it") : "Look it over" }),
      actions: () => (st.mission === "03.01" && st.seen("03.01.A") && !st.fact("insp:platform") ? [{ key: "use", label: "Inspect the platform", hold: 1.5, run: () => {
        st.setFact("insp:platform");
        c.ctx.notify("Load cells look sound. The roof is the problem: most of it is lying on the deck.", { icon: "⚖", ms: 6000 });
      } }] : []),
    });
    // the roof, on the platform
    this.debris = [];
    for (let i = 0; i < 4; i++) {
      const sheet = new THREE.Group();
      box(sheet, 1.4, 0.03, 1.1, M("roofsheet", 0x9aa3a8, { m: 0.5, r: 0.6 }), 0, 0.12 + i * 0.02, 0).rotation.z = 0.08 * (i % 2 ? 1 : -1);
      const lz = PLAT.z - 2.6 + i * 1.7, lx = PLAT.x + (i % 2 ? 0.4 : -0.5);
      this.thing(s, lx, lz, 0, sheet, {
        id: "camp:debris" + i, name: "Fallen roof sheet", reach: 2.4,
        actions: () => (st.fact("debris:" + i) ? [] : [{ key: "use", label: "Drag it clear", hold: 2, blocked: st.fact("ws:isolated") ? undefined : "Isolate the supply first: there's cable under it",
          run: () => { st.setFact("debris:" + i); c.ctx.sfx("ratchet"); this.refresh(); } }]),
      }, 0.3 * i);
      this.debris.push(sheet);
    }
    // the roofless shed with the desk and printer
    this.shed(s, -6, -3, 4, 3, 2.4, { roof: false, color: 0xa39b8b });
    const desk = new THREE.Group();
    box(desk, 1.4, 0.05, 0.6, M("trestle", 0x6b4a2b), 0, 0.74, 0);
    for (const x of [-0.65, 0.65]) box(desk, 0.05, 0.74, 0.55, M("trestle", 0x6b4a2b), x, 0.37, 0);
    box(desk, 0.42, 0.16, 0.3, M("printer", 0xcfc8b8, { r: 0.6 }), 0.3, 0.85, 0);
    const paper = box(desk, 0.36, 0.04, 0.2, M("tag", 0xf3ead2), 0.3, 0.95, 0.12);
    box(desk, 0.3, 0.02, 0.22, M("ledger", 0x5a2e1f), -0.35, 0.77, 0);
    this.paperMesh = paper;
    this.thing(s, -6, -3.6, 0, desk, { id: "camp:printer", name: "Ticket printer", reach: 2.4, info: () => ({ note: this.printerNote() }), actions: () => this.printerActions() });
    c.solidAt(s, -6, -3.6, 1.4, 0.6, 0.8);
    // generator on its skid, with the junction box on a post beside it
    const gen = new THREE.Group();
    box(gen, 1.1, 0.12, 0.7, M("genframe", 0x2b2d31, { m: 0.5 }), 0, 0.06, 0);
    box(gen, 0.9, 0.55, 0.55, M("wsgen", 0x3e6b4f, { r: 0.5, m: 0.3 }), 0, 0.4, 0);
    box(gen, 0.16, 0.16, 0.1, M("pulley", 0x1b1c1e, { m: 0.6 }), 0.5, 0.45, 0);
    this.thing(s, -2.8, -4.8, 0, gen, { id: "camp:wsgen", name: "Station generator", reach: 2.4, info: () => ({ note: this.genNote() }), actions: () => this.genActions() });
    c.solidAt(s, -2.8, -4.8, 1.1, 0.7, 0.7);
    const jb = new THREE.Group();
    box(jb, 0.08, 1.3, 0.08, M("post", 0x8a9398, { m: 0.5 }), 0, 0.65, 0);
    box(jb, 0.4, 0.5, 0.18, M("jbox", 0x8f969c, { m: 0.5, r: 0.5 }), 0, 1.25, 0.1);
    this.thing(s, -1.3, -3.4, 0, jb, {
      id: "camp:junction", name: "Junction box", reach: 2.2, info: () => ({ note: st.fact("insp:junction") ? "Connector scorched" : "Live until isolated" }),
      actions: () => (st.mission === "03.01" && st.seen("03.01.A") && !st.fact("insp:junction") ? [{ key: "use", label: "Open the junction box", hold: 1.5,
        blocked: st.fact("ws:isolated") ? undefined : "Isolate supply first", run: () => {
          st.setFact("insp:junction"); c.ctx.sfx("hood_open");
          c.ctx.notify("Dead, as Ellis promised, and now proven. The connector's scorched black and held together with wire.", { icon: "🔌", ms: 7000 });
        } }] : []),
    });
    const iso = new THREE.Group();
    box(iso, 0.1, 1.8, 0.1, M("post", 0x8a9398, { m: 0.5 }), 0, 0.9, 0);
    box(iso, 0.3, 0.36, 0.16, M("iso", 0x5a6066, { m: 0.5 }), 0, 1.4, 0.1);
    this.isoLever = box(iso, 0.05, 0.16, 0.05, M("lever", 0xb3261e), 0.1, 1.45, 0.2);
    this.thing(s, -8.8, -0.6, 0, iso, { id: "camp:isolator", name: "Main isolator", reach: 2.2, info: () => ({ note: st.fact("ws:restored") ? "ON" : st.fact("ws:isolated") ? "OFF · isolated" : "ON" }),
      actions: () => this.isoActions() });
    this.refresh();
  }
  refresh() {
    const st = this.st;
    if (this.debris) this.debris.forEach((d, i) => { d.visible = !st.fact("debris:" + i); });
    if (this.paperMesh) this.paperMesh.visible = !!st.fact("ws:paper");
    if (this.isoLever) this.isoLever.rotation.z = st.fact("ws:isolated") && !st.fact("ws:restored") ? 1.2 : 0;
  }
  genNote() {
    const st = this.st;
    if (st.fact("ws:fitted")) return "New belt, rated connector";
    return st.fact("insp:gen") ? "Belt split, connector scorched" : "Look it over";
  }
  genActions() {
    const c = this.camp, st = this.st;
    if (st.mission === "03.01" && st.seen("03.01.A") && !st.fact("insp:gen")) return [{ key: "use", label: "Look the generator over", hold: 1.5, run: () => {
      st.setFact("insp:gen"); c.ctx.sfx("hood_open");
      c.ctx.notify("The belt's glazed and split. One more start and it goes. The engine itself turns over by hand: sound.", { icon: "⚙", ms: 7000 });
    } }];
    if (st.mission === "03.03" && !st.fact("ws:fitted")) {
      const has = this.carried("pulley_belt") > 0 && this.carried("power_connector") > 0;
      return [{ key: "use", label: "Fit the belt and the rated connector", hold: 3, blocked: has ? undefined : "You need the belt and the connector in your pockets", run: () => {
        if (!this.takeFromPockets("pulley_belt") || !this.takeFromPockets("power_connector")) return;
        st.setFact("ws:fitted"); c.ctx.sfx("ratchet");
        c.ctx.notify("Belt tensioned, connector seated. Its rating matches the plate.", { icon: "⚙", level: "good" });
      } }];
    }
    return [];
  }
  isoActions() {
    const c = this.camp, st = this.st;
    if (st.mission === "03.01" && st.seen("03.01.A") && !st.fact("ws:isolated")) return [{ key: "use", label: "Isolate the supply", hold: 1, run: () => {
      st.setFact("ws:isolated"); c.ctx.sfx("hood_close"); this.refresh();
      c.ctx.notify("Isolated. You test the junction box terminals: dead. Now you can work.", { icon: "🔒", level: "good" });
    } }];
    if (st.mission === "03.03" && !st.fact("ws:restored")) {
      const ready = st.fact("ws:fitted") && st.fact("ws:paper");
      return [{ key: "use", label: "Restore the supply", hold: 1, blocked: ready ? undefined : "Fit the parts and load the paper first", run: () => {
        st.setFact("ws:restored"); c.ctx.sfx("hood_open"); this.refresh();
      } }];
    }
    return [];
  }
  printerNote() {
    const st = this.st;
    if (st.fact("ws:weighed")) return "Ticket printed";
    return st.fact("ws:paper") ? "Paper loaded" : "No paper";
  }
  printerActions() {
    const c = this.camp, st = this.st;
    if (st.mission === "03.01" && st.count("insp:") >= 3 && st.count("debris:") >= 4 && !st.seen("03.01.B")) return [{ key: "use", label: "Check the printer", run: () => {
      if (!c.playing) c.queue("03.01.B");
    } }];
    if (st.mission === "03.03" && !st.fact("ws:paper")) return [{ key: "use", label: "Load the paper", hold: 1.5,
      blocked: this.carried("printer_paper") ? undefined : "You need the paper from Wes", run: () => {
        if (!this.takeFromPockets("printer_paper")) return;
        st.setFact("ws:paper"); c.ctx.sfx("pickup"); this.refresh();
      } }];
    if (st.mission === "03.03" && st.fact("ws:weighed") && !st.seen("03.03.B") && !st.queue.includes("03.03.B")) return [{ key: "use", label: "Compare the ticket, the carbon and the stub", run: () => this.compare() }];
    return [];
  }
  compare() {
    const c = this.camp, st = this.st;
    if (c.playing) return;
    c.ctx.dialogue({
      speaker: "June's ledger", role: "Clearance day · the carbon reads 13:42",
      lines: ["Three stubs from that day sit beside the carbon. Photograph only the one that matches; the rest is other people's business."],
      choices: ENTRIES.map((e) => ({ id: e.id, label: e.label })),
      onChoose: (id) => {
        const e = ENTRIES.find((x) => x.id === id);
        if (e.wrong) { c.ctx.say("Ellis", e.wrong, 4); return; }
        st.setFact("photo:stub");
        c.queue("03.03.B");
      },
    });
  }
  // Test weights lying loose on the platform, and whether they're spread out
  weights() {
    const c = this.camp, s = c.places.weigh, map = c.ctx.props.map;
    let n = 0, sz = 0;
    if (map) for (const pr of map.values()) {
      if (!pr.item || pr.item.type !== "test_weight" || pr.held || pr.secured) continue;
      const l = c.local(s, pr.pos);
      if (Math.abs(l.x - PLAT.x) < PLAT.hx && Math.abs(l.z - PLAT.z) < PLAT.hz) { n++; sz += l.z - PLAT.z; }
    }
    return { n, balanced: n > 0 && Math.abs(sz / n) < 1.4 };
  }
  truckOnScale() {
    const c = this.camp, v = c.ctx.truck();
    if (!v || Math.abs(v.speed) > 0.4) return false;
    const l = c.local(c.places.weigh, v.pos);
    return Math.abs(l.x - PLAT.x) < PLAT.hx - 0.7 && Math.abs(l.z - PLAT.z) < PLAT.hz - 2.2;
  }

  // ── Basin Scrap ──
  buildScrap() {
    const c = this.camp, st = c.st, s = c.places.scrap;
    this.built.scrap = true;
    ENGINES.forEach((e, i) => {
      const g = new THREE.Group();
      box(g, 1.2, 0.7, 0.8, M("rust" + i, [0x7a4a2a, 0x5f5a4f, 0x6b3f24][i], { r: 0.9, m: 0.3 }), 0, 0.35, 0);
      box(g, 0.25, 0.25, 0.12, M("pulley", 0x1b1c1e, { m: 0.6 }), 0.65, 0.5, 0);
      if (e.belt) box(g, 0.5, 0.3, 0.02, M("stencil", 0xd8c9a8), 0, 0.45, 0.41);
      this.thing(s, e.lx, e.lz, 0, g, {
        id: "camp:engine" + i, name: e.name, reach: 2.4, info: () => ({ note: st.fact("scrap:" + i) ? "Searched" : "Old machinery" }),
        actions: () => (st.mission !== "03.02" || st.fact("scrap:" + i) || st.fact("belt:got") ? [] : [{ key: "use", label: "Search it for a belt", hold: 3, run: () => {
          st.setFact("scrap:" + i); c.ctx.sfx("ratchet");
          if (!e.belt) { c.ctx.notify(e.note, { icon: "🔩" }); return; }
          st.setFact("belt:got");
          this.hand("the pump engine", [{ type: "pulley_belt", n: 1 }], "Under the guard: a pulley belt, dry but sound, the right width. In your pockets.");
        } }]),
      }, i * 0.7);
      c.solidAt(s, e.lx, e.lz, 1.2, 0.8, 0.7, i * 0.7);
    });
  }

  // ── Wes's Builders' Merchant: an outdoor counter under the awning ──
  buildWes() {
    const c = this.camp, st = c.st, s = c.places.wes;
    this.built.wes = true;
    const counter = new THREE.Group();
    box(counter, 2.4, 0.06, 0.7, M("counter", 0x7a5a3a), 0, 0.95, 0);
    box(counter, 2.4, 0.92, 0.06, M("counter", 0x7a5a3a), 0, 0.46, -0.32);
    box(counter, 2.6, 0.08, 1.6, M("shedroof", 0x6d7377, { m: 0.4 }), 0, 2.5, -0.3);
    for (const x of [-1.25, 1.25]) box(counter, 0.08, 2.5, 0.08, M("post", 0x8a9398, { m: 0.5 }), x, 1.25, 0.4);
    box(counter, 1.6, 0.4, 0.04, M("signgreen", 0x2f5d3a, { r: 0.5 }), 0, 2.2, 0.5);
    this.vice = box(counter, 0.3, 0.14, 0.14, M("vice", 0x3d5a80, { r: 0.4, m: 0.6 }), 0.8, 1.05, 0.1);
    this.thing(s, 0, 3.2, 0, counter, null);
    c.solidAt(s, 0, 3.2, 2.4, 0.7, 1.0);
    this.camp.target(this.vice, {
      id: "camp:vice", name: "Wes's seized vice", reach: 2.4, info: () => ({ note: st.flags.TRADE_WES ? "Runs smooth" : "Binds halfway" }),
      actions: () => (st.mission === "03.02" && st.store.wesTrade && !st.seen("03.02.B") && !st.queue.includes("03.02.B") ? [{ key: "use", label: "Strip, clean and grease the screw", hold: 4,
        run: () => { c.ctx.sfx("ratchet"); c.queue("03.02.B"); } }] : []),
    });
  }
  talkWes() {
    const c = this.camp, st = this.st;
    if (c.playing) return;
    if (!st.seen("03.02.A")) { c.queue("03.02.A"); return; }
    if (!st.flags.PAY_WES && !st.flags.TRADE_WES) {
      if (st.store.wesTrade) { c.ctx.say("Wes", "The vice is on the end of the counter. It isn't going anywhere. That's the problem.", 4); return; }
      this.settle();
      return;
    }
    c.ctx.say("Wes", "Belt, connector, paper. In that order. Go on.", 3);
  }
  settle() {
    const c = this.camp, st = this.st, money = c.ctx.stock ? c.ctx.stock.money : 0;
    return c.ctx.dialogue({
      speaker: "Wes", role: "Builders' merchant", lines: [`“Connector and a box of paper. $${PRICE}${st.fact("belt:got") ? "" : ", and I'll find you a belt"}.”`],
      choices: [
        { id: "PAY_WES", label: `Pay Wes $${PRICE}`, disabled: money < PRICE ? `You have $${Math.floor(money)}` : undefined },
        { id: "TRADE_WES", label: "Work it off at his counter", detail: "He's got a vice that binds halfway." },
      ],
      onChoose: (id) => {
        if (id === "PAY_WES") {
          if (!c.ctx.stock.pay({ money: PRICE })) return;
          st.flags.PAY_WES = true;
          this.wesHands();
        } else st.store.wesTrade = true;
      },
    });
  }
  wesHands() {
    const st = this.st, items = [{ type: "power_connector", n: 1 }, { type: "printer_paper", n: 1 }];
    if (!st.fact("belt:got")) { items.push({ type: "pulley_belt", n: 1 }); st.setFact("belt:got"); }
    this.hand("Wes", items, `Wes puts ${items.length > 2 ? "a belt, " : ""}the connector and a box of paper on the counter. In your pockets.`);
  }

  // ── Vega Tyre ──
  buildRadio() {
    const c = this.camp, s = c.places.radio;
    this.built.radio = true;
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) box(g, 0.9, 0.18, 0.18, M("stair", 0x6b6f73, { m: 0.4 }), 0, 0.15 + i * 0.3, -i * 0.3);
    box(g, 2.2, 0.5, 0.05, M("signred", 0xa3281d, { r: 0.5 }), 1.8, 2.6, 0.2);
    box(g, 1.6, 0.3, 0.05, M("signblue", 0x1f4e8c, { r: 0.5 }), 1.8, 2.1, 0.2);
    box(g, 0.06, 2.9, 0.06, M("post", 0x8a9398, { m: 0.5 }), 3, 1.45, 0.2);
    for (let i = 0; i < 3; i++) box(g, 0.25, 0.7, 0.7, M("tyre", 0x1b1c1e, { r: 0.9 }), -1.2 - i * 0.3, 0.35, 0.6);
    c.placeAt(g, s, 4, 3.4);
  }
  talkInez() {
    const c = this.camp, st = this.st;
    if (c.playing || st.seen("03.04.A")) return;
    if (!st.fact("archive:ticket")) { c.ctx.notify("Make your copies and lock the originals away before you show anyone.", { key: "camp-inez", icon: "📄" }); return; }
    if (!this.takeFromPockets("evidence_copy")) { c.ctx.notify("You haven't got a copy on you. They're from June's copier.", { key: "camp-inez", icon: "📄" }); return; }
    c.ctx.notify("You hand Inez a copy of the ticket and the stub.", { icon: "📄" });
    c.queue("03.04.A"); c.queue("03.04.B");
  }

  // ── Ellis: weigh station (03.01, 03.03), home (03.04) ──
  talkEllisStation() {
    const c = this.camp, st = this.st;
    if (c.playing) return;
    if (st.mission === "03.01" && !st.seen("03.01.A")) { c.queue("03.01.A"); return; }
    if (st.mission === "03.03" && st.fact("ws:restored") && !st.seen("03.03.A")) { c.queue("03.03.A"); return; }
    if (st.mission === "03.03" && !st.fact("ws:restored")) { c.ctx.say("Ellis", "Parts in, paper in, power on. Then I'll start it.", 3.5); return; }
    c.ctx.say("Ellis", "Isolate. Test. Work.", 2.5);
  }
  talkEllisHome() {
    const c = this.camp, st = this.st;
    if (c.playing || st.fact("toolbox:returned")) return;
    const pr = c.ctx.props.get && c.ctx.props.get(TOOLBOX);
    const back = this.brought(TOOLBOX);
    if (back || !pr) {
      if (back) c.ctx.props.remove(TOOLBOX);
      st.setFact("toolbox:returned");
      c.ctx.say("Ellis", back ? "All of it, and clean. She never brought anything back clean." : "Lost it? I've got two more. Don't tell anyone.", 4);
      return;
    }
    c.ctx.notify("Bring the toolbox in the bed or in your hands.", { key: "camp-ellis", icon: "🧰" });
  }

  update(p) {
    const c = this.camp, st = c.st, pl = c.places, m = st.mission;
    if (m < "03.") return;
    this.tick();
    if (!this.built.station && this.near(pl.weigh, 900)) this.buildStation();
    if (!this.built.scrap && m === "03.02" && this.near(pl.scrap, 900)) this.buildScrap();
    if (!this.built.wes && this.near(pl.wes, 900) && (m === "03.02" || m >= "04.")) this.buildWes();
    if (!this.built.radio && this.near(pl.radio, 900) && m >= "03.04") this.buildRadio();
    this.refresh();
    const atStation = m === "03.01" || m === "03.03";
    this.presence("ellis3", "Ellis", 2929, pl.weigh, -2.2, 0.6, atStation, () => this.talkEllisStation(), "At the weigh station");
    this.presence("wes", "Wes", 6001, pl.wes, 0.6, 2.4, m === "03.02", () => this.talkWes(), "Builders' merchant");
    this.presence("inez3", "Inez", 8820, pl.radio, 2.6, 2.6, m === "03.04" && !st.done["03.04"], () => this.talkInez(), "Basin Radio, upstairs");
    this.presence("ellis3h", "Ellis", 2929, pl.ward, 1.6, 2.2, m === "03.04" && !st.fact("toolbox:returned"), () => this.talkEllisHome(), "Wants his toolbox back");
    if (m === "03.03" && st.seen("03.03.A") && this.near(pl.weigh, 300)) {
      this.spawnOnce("weights:spawned", WEIGHTS.map((id, i) => [makeItem("test_weight", { id }), c.spotPos(pl.weigh, -3.6 + (i % 2) * 0.4, 1.4 + Math.floor(i / 2) * 0.4, 0.1), pl.weigh.yaw]));
    }
    if (m === "03.03") {
      const wt = this.weights();
      if (wt.n >= 4 && !wt.balanced && st.setFact("calib:warned")) c.ctx.notify("The display settles on 97.6 kg. All the weight's at one end: spread them along the deck.", { icon: "⚖", level: "warn", ms: 6000 });
      if (wt.n >= 4 && wt.balanced && st.setFact("calib:done")) c.ctx.notify("100.0 kg. Calibrated. Ellis whistles.", { icon: "⚖", level: "good" });
      if (st.objDone("03.03", "calibrate") && !st.fact("ws:weighed") && this.truckOnScale()) {
        st.setFact("ws:weighed"); c.ctx.sfx("discover");
        c.ctx.notify("The printer chatters. GROSS, TARE, NET, in the same columns as June's carbon.", { icon: "🧾", ms: 6000 });
      }
    }
  }

  sceneDone(key) {
    const c = this.camp, st = c.st, pl = c.places;
    if (key === "03.01.A") {
      this.spawnOnce("toolbox:spawned", [[makeItem("ellis_toolbox", { id: TOOLBOX }), c.spotPos(pl.weigh, -3.2, 1.6, 0.15), pl.weigh.yaw]]);
      c.ctx.notify("Ellis sets his toolbox down by your feet. “Borrow it. Bring it back.”", { icon: "🧰", ms: 5000 });
    }
    if (key === "03.02.A" && !st.flags.PAY_WES && !st.flags.TRADE_WES) this.pendingSettle = true;
    if (key === "03.02.B" && !st.flags.TRADE_WES) { st.flags.TRADE_WES = true; this.wesHands(); }
  }
  // Wes's question opens as soon as the scene that leads to it has finished
  tick() {
    if (this.pendingSettle && !this.camp.playing && this.settle()) this.pendingSettle = false;
  }

  view() {
    const st = this.st, wt = this.built.station ? this.weights() : { n: 0, balanced: false };
    return {
      weights: wt.n, balanced: wt.balanced,
      belt: this.carried("pulley_belt") > 0 || !!st.fact("ws:fitted"),
      connector: this.carried("power_connector") > 0 || !!st.fact("ws:fitted"),
      paper: this.carried("printer_paper") > 0 || !!st.fact("ws:paper"),
    };
  }

  mapSites(out) {
    const m = this.st.mission, pl = this.camp.places;
    if (m === "03.01" || m === "03.03") out.push(pl.weigh);
    if (m === "03.02") out.push(pl.scrap, pl.wes);
    if (m === "03.04") out.push(pl.radio, pl.ward);
  }
  travel(cur) {
    const m = this.st.mission, pl = this.camp.places;
    if (!cur || !m.startsWith("03.")) return null;
    if (m === "03.01" || m === "03.03") return pl.weigh;
    if (m === "03.02") return { belt: pl.scrap, wes: pl.wes, settle: pl.wes, parts: pl.wes }[cur.id] || null;
    return { copies: pl.garage, archive: pl.garage, tools: pl.ward, inez: pl.radio, lead: pl.radio }[cur.id] || null;
  }
  // What the objective marker hangs over
  marker(cur) {
    const m = this.st.mission, st = this.st;
    if (!cur || !m.startsWith("03.")) return null;
    const k = m + ":" + cur.id;
    const who = { "03.01:arrive": "ellis3", "03.03:start": "ellis3", "03.02:wes": "wes", "03.02:settle": st.store.wesTrade ? null : "wes", "03.02:parts": "wes",
      "03.04:tools": "ellis3h", "03.04:inez": "inez3", "03.04:lead": "inez3" }[k];
    const obj = { "03.01:isolate": "camp:isolator", "03.01:printer": "camp:printer", "03.03:install": "camp:wsgen", "03.03:paper": "camp:printer",
      "03.03:restore": "camp:isolator", "03.03:compare": "camp:printer", "03.04:copies": "camp:copier", "03.04:archive": "camp:archive",
      "03.02:settle": st.store.wesTrade ? "camp:vice" : null, "03.03:weigh": "camp:platform", "03.03:calibrate": "camp:platform" }[k];
    return { place: this.travel(cur), who, obj };
  }
}
