// Long Haul – Chapter 4 in the world: Fern's house and the ride to the sale barn (a door that sticks, the lot boards),
// Alma's photo box on Wes's second-hand shelf, Edie's workshop (the treadle, the hand machine and her needle tray),
// Manny holding things at Mercy Camp for the family, June's key board and the storage annex behind Vale Garage.
// The rules are in chapter4.js; this file writes facts and the world view (w.ch4) for them.
//
// Places on the authored road: Fern lives in the first house past Vega Tyre; the sale barn is a roadside spot further on;
// Edie's workshop is the first house past Bell's Bakery; the annex is a roadside spot just up the highway from the garage.
import * as THREE from "three";
import { nextSiteAfter } from "../world/sites.js";
import { registerItems, makeItem } from "../items.js";
import { M, box } from "./mesh.js";
import { ChapterWorld } from "./kit.js";

const PHOTO_BOX = "camp:photobox", TREADLE = "camp:treadle", BOX_PRICE = 25;
const LOTS = [
  { id: "38", text: "Lot 38 · Kitchen dresser, pine", note: "Fern's photograph: the same dresser, a calendar still pinned to its side." },
  { id: "40", text: "Lot 40 · Chairs, assorted (6)", note: "Six chairs in the photograph, five on the board. Fern says one broke on the trailer." },
  { id: "41", text: "Lot 41 · Mixed household timber", note: "The photograph is a stack of doors and frames. One is yellow." },
];
const BOXES = [
  { name: "Shoebox of photographs", note: "Blue corners. Wedding pictures, nobody you know." },
  { name: "Biscuit-tin of photographs", note: "Two red corners and a dog with a torn ear. On the lid, in a careful hand: 'Biscuit'. Then the family." , right: true },
  { name: "Album, cloth-bound", note: "Red corners, but no dog. School photographs from Calder." },
];
const NEEDLES = [
  { id: "dbx1", label: "DBx1 industrial needle", wrong: "Wrong system: the shank won't seat in a domestic clamp." },
  { id: "15x1", label: "15×1 needle, size 90/14" },
  { id: "twin", label: "Twin needle, 4 mm", wrong: "Edie, without looking up: “That machine's never seen a twin needle and it isn't starting now.”" },
];
const KEYS = [
  { id: "yard", label: "YARD · padlock", wrong: "The yard padlock. You opened that on the first day." },
  { id: "gen", label: "BELL GEN · spare", wrong: "Lorna's generator's spare key. June kept everybody's spares." },
  { id: "annex", label: "ANNEX · back track · DON'T LOSE" },
  { id: "dont", label: "DON'T", wrong: "Just the word, on a tag with no key. You put it back." },
];
const CRATES = [
  "TORRES · east tank road. Crossed out: Calder spur. Crossed out: Mercy Camp. Pencilled under it: 'motel? ask A.'",
  "REYES · kitchen · Alma's good skillet and a clock that doesn't",
  "MERCER, DEL · depot wall clock, the timetable frame",
  "BELL (mother) · bread tins, two proving baskets",
  "EDIE'S FATHER · hand plane, chisels in a roll. 'He asked twice.'",
  "NO NAME · child's shoes, size 2, and a torch. 'Ask Alma who.'",
];

function photoBoxMesh() {
  const g = new THREE.Group();
  box(g, 0.34, 0.12, 0.24, M("tin", 0xb3261e, { r: 0.5, m: 0.4 }), 0, 0, 0);
  box(g, 0.35, 0.02, 0.25, M("tinlid", 0x8f1f18, { r: 0.4, m: 0.5 }), 0, 0.07, 0);
  return g;
}
function treadleMesh() {
  const g = new THREE.Group();
  box(g, 0.8, 0.05, 0.45, M("wood", 0x6b4a2b), 0, 0.3, 0);
  for (const x of [-0.35, 0.35]) box(g, 0.05, 0.6, 0.4, M("iron", 0x2b2d31, { m: 0.6 }), x, 0, 0);
  box(g, 0.35, 0.2, 0.12, M("machine", 0x1b1c1e, { r: 0.3, m: 0.5 }), 0, 0.42, 0);
  return g;
}
registerItems({
  photo_box: { name: "Alma's photo tin", icon: "🖼", kind: "misc", mass: 2.5, size: [0.34, 0.14, 0.24], price: 0, pocket: false,
    desc: "A biscuit tin of photographs: two red corners, a dog with a torn ear, her sister's handwriting.", makeMesh: photoBoxMesh },
  treadle_machine: { name: "Treadle sewing machine", icon: "🧵", kind: "misc", mass: 32, size: [0.8, 0.65, 0.45], price: 0, pocket: false,
    desc: "Edie's treadle, on loan to its first family until next winter. In writing.", makeMesh: treadleMesh },
  lot_copies: { name: "Lot book copies", icon: "📒", kind: "misc", mass: 0.05, size: [0.21, 0.004, 0.3], price: 0, pocket: true, stack: 1,
    desc: "Fern's authorised copies of the lot book: lots 38, 40 and 41. She kept the book." },
  ownership_note: { name: "Ownership note", icon: "📝", kind: "misc", mass: 0.01, size: [0.15, 0.002, 0.2], price: 0, pocket: true, stack: 1,
    desc: "Edie's note: bought at Mercy's sale, the family asked to keep the maker's plate on record. Needs their signature." },
  signed_note: { name: "Signed ownership note", icon: "📝", kind: "misc", mass: 0.01, size: [0.15, 0.002, 0.2], price: 0, pocket: true, stack: 1,
    desc: "Signed at Mercy Camp. Return declined; a copy of the maker's plate requested." },
  annex_key: { name: "Annex key", icon: "🗝", kind: "misc", mass: 0.03, size: [0.06, 0.01, 0.02], price: 0, pocket: true, stack: 1,
    desc: "From June's key board. The tag says DON'T LOSE." },
});

export class Chapter4World extends ChapterWorld {
  bind() {
    const c = this.camp, pl = c.places;
    const fern = nextSiteAfter(pl.radio.zRoad, "home");
    fern.name = "Fern's house"; fern.campaign = "fern";
    const edie = nextSiteAfter(pl.bakery.zRoad, "home");
    edie.name = "Edie's workshop"; edie.campaign = "edie";
    pl.fern = fern; pl.edie = edie;
    pl.barn = c.roadSpot(fern.zRoad + 2500, 1, "Mercy Sale Barn", "barn", 10);
    pl.annex = c.roadSpot(pl.garage.zRoad + 700, -1, "Storage annex", "annex", 6);
  }

  begin() {
    this.built = {};
    this.buildKeyBoard();
  }

  // ── Vale Garage office: June's key board ──
  buildKeyBoard() {
    const c = this.camp, st = c.st, g = c.places.garage, H = (x, z) => [-9 + x, -5 + z];
    const board = new THREE.Group();
    box(board, 0.7, 0.5, 0.03, M("cork", 0x9c7a4a, { r: 0.95 }), 0, 0, 0);
    for (let i = 0; i < 8; i++) box(board, 0.05, 0.08, 0.01, M("tag", 0xf3ead2), -0.28 + (i % 4) * 0.18, 0.12 - Math.floor(i / 4) * 0.2, 0.02);
    this.thing(g, ...H(1.2, -4.35), 1.4, board, {
      id: "camp:keyboard", name: "June's key board", reach: 2.4, info: () => ({ note: st.fact("key:got") ? "One hook empty" : "Every key tagged" }),
      actions: () => (st.mission !== "04.04" || st.fact("key:got") ? [] : [{ key: "use", label: "Read the tags", run: () => this.pickKey() }]),
    });
  }
  pickKey() {
    const c = this.camp, st = this.st;
    if (c.playing) return;
    c.ctx.dialogue({
      speaker: "June's key board", role: "Vale Garage office", lines: ["June's handwriting on every tag. Some of them are instructions."],
      choices: KEYS.map((k) => ({ id: k.id, label: k.label })),
      onChoose: (id) => {
        const k = KEYS.find((x) => x.id === id);
        if (k.wrong) { c.ctx.notify(k.wrong, { icon: "🗝", key: "camp-key" }); return; }
        st.setFact("key:got");
        this.hand("the key board", [{ type: "annex_key", n: 1 }], "The annex key. In your pockets.");
      },
    });
  }

  // ── the sale barn ──
  buildBarn() {
    const c = this.camp, st = c.st, s = c.places.barn;
    this.built.barn = true;
    this.shed(s, 0, -4.5, 8, 9, 4.2, { color: 0x7a3b2a, sign: 0xd8c9a8 });
    // the front: two fixed panels and the sliding door between them
    const front = new THREE.Group(), mat = M("shed0x7a3b2a", 0x7a3b2a, { m: 0.3, r: 0.7 });
    for (const x of [-3, 3]) box(front, 2, 4.2, 0.1, mat, x, 2.1, 0);
    c.placeAt(front, s, 0, 0);
    for (const x of [-3, 3]) c.solidAt(s, x, 0, 2, 0.2, 4.2);
    const door = new THREE.Group();
    box(door, 4, 3.4, 0.08, M("barndoor", 0x8a4a33, { r: 0.8 }), 0, 1.7, 0);
    for (const y of [0.8, 2.6]) box(door, 4, 0.12, 0.1, M("barnrail", 0x5a2e1f), 0, y, 0.04);
    this.barnDoor = this.thing(s, 0, 0.12, 0, door, {
      id: "camp:barndoor", name: "Barn door", reach: 3, info: () => ({ note: st.fact("barn:open") ? "Open" : st.fact("barn:tried") ? "Swollen in its runner" : "Shut" }),
      actions: () => (st.fact("barn:open") || st.mission !== "04.01" || st.store.fern !== "dropped" ? [] : [{ key: "use", label: "Haul the door open", hold: 1.5, run: () => {
        st.setFact("barn:tried");
        c.ctx.notify("It moves a hand's width and jams. Swollen in the runner. There's a lever on the wall to the right.", { icon: "🚪", ms: 6000 });
      } }]),
    });
    c.solidAt(s, 0, 0.12, 4, 0.2, 3.4, 0, () => !st.fact("barn:open"));
    const lever = new THREE.Group();
    box(lever, 0.2, 0.4, 0.1, M("iso", 0x5a6066, { m: 0.5 }), 0, 1.3, 0);
    this.leverArm = box(lever, 0.05, 0.5, 0.05, M("lever", 0xb3261e), 0, 1.6, 0.08);
    this.thing(s, 2.4, 0.4, 0, lever, {
      id: "camp:barnlever", name: "Door lever", reach: 2.2,
      actions: () => (st.fact("barn:open") || !st.fact("barn:tried") ? [] : [{ key: "use", label: "Lean on the lever", hold: 2.5, run: () => {
        st.setFact("barn:open"); c.ctx.sfx("hood_open"); this.refresh();
      } }]),
    });
    LOTS.forEach((l, i) => {
      const b = new THREE.Group();
      box(b, 0.9, 0.6, 0.04, M("lotboard", 0x2b2d31), 0, 0, 0);
      box(b, 0.7, 0.12, 0.01, M("tag", 0xf3ead2), 0, 0.15, 0.025);
      this.thing(s, -2.6 + i * 2.6, -8.7, 1.6, b, {
        id: "camp:lot" + l.id, name: l.text, reach: 2.6, info: () => ({ note: st.fact("lot:" + l.id) ? "Matched" : "Fern's photographs" }),
        actions: () => (st.mission !== "04.01" || st.fact("lot:" + l.id) || !st.fact("barn:open") ? [] : [{ key: "use", label: "Compare with the photographs", hold: 1.5, run: () => {
          st.setFact("lot:" + l.id); c.ctx.notify(l.note, { icon: "📷", ms: 6000 });
        } }]),
      });
    });
    this.refresh();
  }
  refresh() {
    const st = this.st;
    if (this.barnDoor) this.barnDoor.visible = !st.fact("barn:open");
    if (this.leverArm) this.leverArm.rotation.x = st.fact("barn:open") ? 1.1 : 0;
    if (this.annexDoor) this.annexDoor.visible = !st.fact("annex:open");
    if (this.paper) this.paper.visible = !st.seen("04.04.B");
  }
  talkFern() {
    const c = this.camp, st = this.st;
    if (c.playing) return;
    const f = st.store.fern || "waiting", h = st.store.fernHome || "waiting";
    if (f === "waiting") { if (!st.seen("04.01.A")) c.queue("04.01.A"); else this.offerRide("fern", "fern4", "Fern"); return; }
    if (f === "dropped" && !st.seen("04.01.B")) {
      if (st.count("lot:") < 3) { c.ctx.say("Fern", st.fact("barn:open") ? "Boards first. Then my book." : "That door's been sticking since my father's day.", 3.5); return; }
      c.queue("04.01.B");
      return;
    }
    if (st.seen("04.01.B") && h === "waiting") this.offerRide("fernHome", "fern4", "Fern");
  }

  // ── Wes's second-hand shelf ──
  buildShelf() {
    const c = this.camp, st = c.st, s = c.places.wes;
    this.built.shelf = true;
    const shelf = new THREE.Group();
    for (const y of [0.5, 1.1]) box(shelf, 1.6, 0.04, 0.45, M("shelf", 0x7a5a3a), 0, y, 0);
    for (const x of [-0.78, 0.78]) box(shelf, 0.04, 1.5, 0.45, M("shelf", 0x7a5a3a), x, 0.75, 0);
    this.sag = box(shelf, 1.5, 0.04, 0.4, M("shelf", 0x7a5a3a), 0, 1.5, 0);
    this.thing(s, -2.8, 3.0, 0, shelf, {
      id: "camp:shelf", name: "Wes's second-hand shelf", reach: 2.6, info: () => ({ note: st.flags.TRADE_WES_BOX ? "Re-hung, level" : "The top shelf sags" }),
      actions: () => (st.mission === "04.02" && st.store.shelfTrade && !st.flags.TRADE_WES_BOX ? [{ key: "use", label: "Re-hang the sagging shelf", hold: 4, run: () => {
        st.flags.TRADE_WES_BOX = true; c.ctx.sfx("ratchet"); this.sag.rotation.z = 0; c.queue("04.02.A");
      } }] : []),
    });
    this.sag.rotation.z = st.flags.TRADE_WES_BOX ? 0 : 0.06;
    c.solidAt(s, -2.8, 3.0, 1.6, 0.45, 1.5);
    BOXES.forEach((b, i) => {
      const m = b.right ? photoBoxMesh() : (() => { const g = new THREE.Group(); box(g, 0.32, 0.12, 0.22, M("pbox" + i, i ? 0x5a2e1f : 0x3d5a80, { r: 0.8 }), 0, 0, 0); return g; })();
      this.thing(s, -3.3 + i * 0.5, 3.0, 0.6 + 0.07, m, {
        id: "camp:pbox" + i, name: b.name, reach: 2.4, info: () => ({ note: st.fact("box:found") && b.right ? "Alma's" : "Second-hand stock" }),
        actions: () => (st.mission !== "04.02" || st.fact("box:found") || !st.fact("alma:details") ? [] : [{ key: "use", label: "Look through it", hold: 1.2, run: () => {
          c.ctx.notify(b.note, { icon: "🖼", ms: 6000 });
          if (b.right) { st.setFact("box:found"); c.ctx.notify("This is it. Talk to Wes about it.", { icon: "✓", level: "good", key: "camp-box" }); }
        } }]),
      }, 0.1 * (i - 1));
      if (b.right) this.rightBox = m;
    });
    this.refreshShelf();
  }
  refreshShelf() { if (this.rightBox) this.rightBox.visible = !this.st.seen("04.02.A"); }
  talkWes() {
    const c = this.camp, st = this.st;
    if (c.playing || st.seen("04.02.A")) return;
    if (!st.fact("box:found")) { c.ctx.say("Wes", st.fact("alma:details") ? "Second-hand's on the shelf by the counter. Help yourself to looking." : "Back again. What are we looking for this time?", 3.5); return; }
    if (st.store.shelfTrade) { c.ctx.say("Wes", "Shelf's where it's always been. Slightly lower.", 3); return; }
    const money = c.ctx.stock ? c.ctx.stock.money : 0;
    c.ctx.dialogue({
      speaker: "Wes", role: "Builders' merchant", lines: ["Wes turns the tin over. “Came over with the store stock. I paid for it, as stock. I didn't know it was anybody's.”"],
      choices: [
        { id: "pay", label: `Cover his stock cost ($${BOX_PRICE})`, disabled: money < BOX_PRICE ? `You have $${Math.floor(money)}` : undefined },
        { id: "fix", label: "Fix his sagging shelf instead", detail: "Labour against the stock cost." },
      ],
      onChoose: (id) => {
        if (id === "pay") { if (!c.ctx.stock.pay({ money: BOX_PRICE })) return; st.flags.PAY_WES_BOX = true; c.queue("04.02.A"); }
        else st.store.shelfTrade = true;
      },
    });
  }
  talkAlma() {
    const c = this.camp, st = this.st;
    if (c.playing) return;
    if (!st.fact("alma:details")) {
      c.ctx.dialogue({
        speaker: "Alma Reyes", role: "Mercy Motel", lines: ["“A biscuit tin, not a box. Two of the photo corners are red: my sister ran out of black.",
          "There's a dog with a torn ear. And my sister's handwriting on the lid. She labelled the dog first.”"],
        choices: [{ id: "ok", label: "Two red corners, a dog with a torn ear, her sister's writing" }],
        onChoose: () => { st.setFact("alma:details"); },
      });
      return;
    }
    if (!st.seen("04.02.A")) { c.ctx.say("Alma", "Wes's place. If it's anywhere, it's there.", 3); return; }
    if (st.branch["04.02.B"] || st.queue.includes("04.02.B")) return;
    if (!this.brought(PHOTO_BOX)) { c.ctx.notify("Bring the photo tin in the bed or in your hands.", { key: "camp-alma", icon: "🖼" }); return; }
    c.ctx.props.remove(PHOTO_BOX);
    st.setFact("box:returned");
    c.queue("04.02.B");
  }

  // ── Edie's workshop ──
  buildEdie() {
    const c = this.camp, st = c.st, s = c.places.edie;
    this.built.edie = true;
    const bench = new THREE.Group();
    box(bench, 1.8, 0.05, 0.7, M("trestle", 0x6b4a2b), 0, 0.78, 0);
    for (const x of [-0.85, 0.85]) box(bench, 0.05, 0.78, 0.65, M("trestle", 0x6b4a2b), x, 0.39, 0);
    box(bench, 0.4, 0.25, 0.18, M("handmach", 0x2b2d31, { r: 0.3, m: 0.5 }), -0.4, 0.93, 0);
    box(bench, 0.3, 0.04, 0.2, M("tray", 0x9aa0a6, { m: 0.7 }), 0.5, 0.82, 0.1);
    this.thing(s, -0.5, 2.6, 0, bench, {
      id: "camp:handmachine", name: "Edie's hand machine", reach: 2.4, info: () => ({ note: st.fact("hand:fixed") ? "Holds tension" : st.fact("hand:needle") ? "Needle fitted · belt slack" : "Slack tension, bent needle" }),
      actions: () => this.handActions(),
    });
    c.solidAt(s, -0.5, 2.6, 1.8, 0.7, 0.8);
  }
  handActions() {
    const c = this.camp, st = this.st;
    if (st.mission !== "04.03" || st.branch["04.03.B"] !== "MACHINE_RETURNED" || st.fact("hand:fixed")) return [];
    if (!st.fact("hand:needle")) return [{ key: "use", label: "Pick a needle from Edie's tray", run: () => {
      c.ctx.dialogue({ speaker: "Edie's tray", role: "Needles, belts, bobbins", lines: ["The bent needle is a domestic 15×1. The tray has a bit of everything."],
        choices: NEEDLES.map((n) => ({ id: n.id, label: n.label })),
        onChoose: (id) => {
          const n = NEEDLES.find((x) => x.id === id);
          if (n.wrong) { c.ctx.notify(n.wrong, { icon: "🪡", key: "camp-needle" }); return; }
          st.setFact("hand:needle"); c.ctx.sfx("pickup");
        } });
    } }];
    return [{ key: "use", label: "Fit a new round belt and set the tension", hold: 3, run: () => {
      st.setFact("hand:fixed"); c.ctx.sfx("ratchet");
      c.ctx.notify("Twenty stitches on scrap: even, tight, no skips.", { icon: "🧵", level: "good" });
      this.spawnOnce("treadle:spawned", [[makeItem("treadle_machine", { id: TREADLE }), c.spotPos(c.places.edie, 1.6, 3.4, 0.4), c.places.edie.yaw]]);
    } }];
  }
  talkEdie() {
    const c = this.camp, st = this.st;
    if (c.playing) return;
    if (!st.seen("04.03.A")) { c.queue("04.03.A"); return; }
    const b = st.branch["04.03.B"];
    if (!b) {
      c.ctx.dialogue({
        speaker: "Edie", role: "Sewing worker", lines: ["“It came from a Mercy house. I paid for it. Both of those are true. So what are you asking me for?”"],
        choices: [
          { id: "MACHINE_RETURNED", label: "Lend it back: I'll get your hand machine working first", detail: "The treadle goes to its family as a loan until next winter." },
          { id: "MACHINE_RETAINED", label: "Keep it: I'll take a signed note to the family", detail: "They record the maker's plate; you record that return was declined." },
        ],
        onChoose: (id) => {
          st.branch["04.03.B"] = id; st.flags[id] = true;
          if (id === "MACHINE_RETAINED") this.hand("Edie", [{ type: "ownership_note", n: 1 }], "Edie writes the note out twice and hands you one. In your pockets.");
        },
      });
      return;
    }
    if (b === "MACHINE_RETURNED" && !st.fact("treadle:delivered")) { c.ctx.say("Edie", st.fact("hand:fixed") ? "Treadle's by the door. Mind the pedal on the tailgate." : "Tray's on the bench. Don't bend another one.", 3.5); return; }
    if (b === "MACHINE_RETAINED" && !st.fact("note:signed")) { c.ctx.say("Edie", "Bring it back signed. Then we both know.", 3); return; }
    if (b === "MACHINE_RETAINED" && !st.fact("note:back")) { if (!this.takeFromPockets("signed_note")) { c.ctx.say("Edie", "Where's the signed one?", 2.5); return; } st.setFact("note:back"); }
    if (!st.seen("04.03.B")) c.queue("04.03.B");
  }
  talkManny() {
    const c = this.camp, st = this.st, b = st.branch["04.03.B"];
    if (c.playing) return;
    if (b === "MACHINE_RETURNED" && !st.fact("treadle:delivered")) {
      if (!st.fact("hand:fixed")) { c.ctx.say("Manny", "They'd love it back. Edie needs something to sew on first, mind.", 3.5); return; }
      if (!this.brought(TREADLE)) { c.ctx.notify("Bring the treadle in the bed.", { key: "camp-manny", icon: "🧵" }); return; }
      c.ctx.props.remove(TREADLE); st.setFact("treadle:delivered");
      c.ctx.say("Manny", "They're out at work. I'll sign for it, and they'll write to Edie. Until next winter, it says. Good.", 5);
      return;
    }
    if (b === "MACHINE_RETAINED" && !st.fact("note:signed")) {
      if (!this.takeFromPockets("ownership_note")) { c.ctx.say("Manny", "Edie's note? You've not got it on you.", 3); return; }
      st.setFact("note:signed");
      this.hand("Manny", [{ type: "signed_note", n: 1 }], "Manny gets it signed in the tent and brings it back. “They want a photo of the plate. And of her, if she'll let them.”");
      return;
    }
    c.ctx.say("Manny", "Stove's still got all its legs, if you were wondering.", 3);
  }

  // ── the storage annex ──
  buildAnnex() {
    const c = this.camp, st = c.st, s = c.places.annex;
    this.built.annex = true;
    this.shed(s, 0, -2.4, 5, 4.6, 2.6, { color: 0xa8a397 });
    const front = new THREE.Group(), mat = M("shed0xa8a397", 0xa8a397, { m: 0.3, r: 0.7 });
    for (const x of [-1.85, 1.85]) box(front, 1.3, 2.6, 0.1, mat, x, 1.3, 0);
    c.placeAt(front, s, 0, -0.1);
    for (const x of [-1.85, 1.85]) c.solidAt(s, x, -0.1, 1.3, 0.2, 2.6);
    const door = new THREE.Group();
    box(door, 2.4, 2.4, 0.06, M("annexdoor", 0x55606a, { m: 0.5, r: 0.5 }), 0, 1.2, 0);
    this.annexDoor = this.thing(s, 0, -0.05, 0, door, {
      id: "camp:annexdoor", name: "Annex door", reach: 2.8, info: () => ({ note: st.fact("annex:open") ? "Open" : "Locked" }),
      actions: () => (st.mission !== "04.04" || st.fact("annex:open") ? [] : [{ key: "use", label: "Unlock the annex", hold: 1.2,
        blocked: this.carried("annex_key") ? undefined : "You need the key from June's board", run: () => {
          st.setFact("annex:open"); c.ctx.sfx("hood_open"); this.refresh(); c.queue("04.04.A");
        } }]),
    });
    c.solidAt(s, 0, -0.05, 2.4, 0.2, 2.4, 0, () => !st.fact("annex:open"));
    CRATES.forEach((label, i) => {
      const g = new THREE.Group();
      box(g, 0.8, 0.5, 0.6, M("crate", 0x8a6a3e), 0, 0.25, 0);
      box(g, 0.3, 0.12, 0.01, M("tag", 0xf3ead2), 0, 0.32, 0.31);
      const lx = -1.6 + (i % 3) * 1.6, lz = -1.6 - Math.floor(i / 3) * 1.5;
      this.thing(s, lx, lz, 0, g, {
        id: "camp:crate" + i, name: "Labelled crate", reach: 2.2, info: () => ({ note: st.fact("crate:" + i) ? label.split(" · ")[0] : "June's labels" }),
        actions: () => (st.mission !== "04.04" || !st.seen("04.04.A") || st.fact("crate:" + i) ? [] : [{ key: "use", label: "Read the label", hold: 1, run: () => {
          st.setFact("crate:" + i); c.ctx.notify(label, { icon: "📦", ms: 7000 });
        } }]),
      });
      c.solidAt(s, lx, lz, 0.8, 0.6, 0.5);
    });
    const shelf = new THREE.Group();
    box(shelf, 1.6, 0.04, 0.4, M("shelf", 0x7a5a3a), 0, 1.0, 0);
    this.paper = box(shelf, 0.9, 0.12, 0.35, M("wrap", 0xc9b48a, { r: 0.95 }), 0, 1.08, 0);
    this.thing(s, 1.6, -4.4, 0, shelf, {
      id: "camp:wrapping", name: "Wrapping paper", reach: 2.4,
      actions: () => (st.mission === "04.04" && st.count("crate:") >= 6 && !st.seen("04.04.B") && !st.queue.includes("04.04.B") ? [{ key: "use", label: "Lift the wrapping paper", run: () => {
        if (!c.playing) c.queue("04.04.B");
      } }] : []),
    });
    this.refresh();
  }
  talkEllisAnnex() {
    const c = this.camp, st = this.st;
    if (c.playing) return;
    if (!st.seen("04.04.B")) { c.ctx.say("Ellis", st.fact("annex:open") ? "Read them all. She'd want them read." : "Key's on her board. The tag says don't lose it. She lost it twice.", 3.5); return; }
    const picked = st.store.deliveries || [];
    if (picked.length >= 2) return;
    const left = CRATES.map((l, i) => ({ i, l })).filter((x) => !picked.includes(x.i));
    c.ctx.dialogue({
      speaker: "Ellis", role: "Storage annex", lines: [picked.length ? "“And the second?”" : "“Two on the truck first. Which ones?”"],
      choices: left.map(({ i, l }) => ({ id: String(i), label: l.split(" · ")[0], detail: l.split(" · ").slice(1).join(" · ") })),
      onChoose: (id) => {
        st.store.deliveries = [...(st.store.deliveries || []), Number(id)];
        if (st.store.deliveries.length < 2) this.pendingPick = true;
      },
    });
  }

  update(p) {
    const c = this.camp, st = c.st, pl = c.places, m = st.mission;
    if (m < "04.") return;
    if (this.pendingPick && !c.playing) { this.pendingPick = false; this.talkEllisAnnex(); }
    if (!this.built.barn && this.near(pl.barn, 900)) this.buildBarn();
    if (!this.built.shelf && c.ch3.built.wes && this.near(pl.wes, 900)) this.buildShelf();
    if (!this.built.edie && this.near(pl.edie, 900)) this.buildEdie();
    if (!this.built.annex && this.near(pl.annex, 900)) this.buildAnnex();
    this.refresh(); this.refreshShelf();
    // 04.01 Fern: at her window, riding, at the barn, riding home
    const f = st.store.fern || "waiting", h = st.store.fernHome || "waiting";
    const fernAt = f === "waiting" ? pl.fern : f === "dropped" && h === "waiting" ? pl.barn : h === "dropped" ? pl.fern : null;
    if (fernAt) this.presence("fern4", "Fern", 3307, fernAt, fernAt === pl.barn ? -1.5 : 0.4, fernAt === pl.barn ? 2.4 : 1.6, m === "04.01" || (h === "dropped" && this.near(pl.fern, 60)),
      () => this.talkFern(), "Called the auctions");
    this.ride("fern", "fern4", "Fern", 3307, pl.barn, { walk: [-1.5, 2.4] });
    this.ride("fernHome", "fern4", "Fern", 3307, pl.fern, { walk: [0.4, 1.6] });
    // 04.02 Alma, Wes
    this.presence("alma4", "Alma", 6812, pl.motel, -9, 1.6, m === "04.02", () => this.talkAlma(), "Mercy Motel");
    this.presence("wes4", "Wes", 6001, pl.wes, 0.6, 2.4, m === "04.02", () => this.talkWes(), "Builders' merchant");
    if (m === "04.02" && st.seen("04.02.A") && this.near(pl.wes, 200))
      this.spawnOnce("photobox:spawned", [[makeItem("photo_box", { id: PHOTO_BOX }), c.spotPos(pl.wes, -0.5, 3.2, 1.05), pl.wes.yaw]]);
    // 04.03 Edie, Manny
    this.presence("edie", "Edie", 4702, pl.edie, 0.8, 2.0, m === "04.03", () => this.talkEdie(), "Sewing worker");
    this.presence("manny4", "Manny", 4410, pl.camp, 0.6, 1.4, m === "04.03" && !!st.branch["04.03.B"], () => this.talkManny(), "Holding things for the families");
    // 04.04 Ellis at the annex
    this.presence("ellis4", "Ellis", 2929, pl.annex, -3, 1.2, m === "04.04", () => this.talkEllisAnnex(), "Storage annex");
  }

  // Scene branch questions this chapter asks
  choose(key) {
    const c = this.camp, st = this.st;
    if (key !== "04.02.B") return undefined;
    return c.ctx.dialogue({
      speaker: "Alma", role: "Mercy Motel", lines: ["“What will you use it for?”"],
      choices: [
        { id: "ASK_COPY", label: "Ask to copy the photograph of the road", detail: "To work out where the truck could get through." },
        { id: "LEAVE_PRIVATE", label: "Leave the photographs private", detail: "Mark the bend from memory instead." },
      ],
      onChoose: (id) => { st.branch[key] = id; st.flags[id === "ASK_COPY" ? "COPY_ALLOWED" : "NO_COPY"] = true; c.branchChosen(id); },
    });
  }
  sceneDone(key) {
    const st = this.st;
    if (key === "04.01.B" && st.setFact("lotcopies:given")) this.hand("Fern", [{ type: "lot_copies", n: 1 }], "Fern copies the three lot entries out for you and signs the bottom. She keeps the book.");
    if (key === "04.02.A") this.refreshShelf();
  }

  view() {
    const st = this.st;
    return {
      fern: st.store.fern || "waiting", fernHome: st.store.fernHome || "waiting",
      box: this.brought(PHOTO_BOX), treadle: this.brought(TREADLE),
      note: st.fact("note:signed") ? "signed" : this.carried("ownership_note") ? "unsigned" : "none",
      key: !!st.fact("key:got"),
    };
  }
  mapSites(out) {
    const m = this.st.mission, pl = this.camp.places;
    if (m === "04.01") out.push(pl.fern, pl.barn);
    if (m === "04.02") out.push(pl.wes);
    if (m === "04.03") out.push(pl.edie, pl.camp);
    if (m === "04.04") out.push(pl.annex);
  }
  travel(cur) {
    const st = this.st, m = st.mission, pl = this.camp.places;
    if (!cur || !m.startsWith("04.")) return null;
    if (m === "04.01") return { fern: pl.fern, barn: pl.barn, door: pl.barn, lots: pl.barn, book: pl.barn, home: st.store.fernHome === "riding" ? pl.fern : pl.barn }[cur.id] || null;
    if (m === "04.02") return { ask: pl.motel, find: pl.wes, settle: pl.wes, deliver: pl.motel, after: pl.motel }[cur.id] || null;
    if (m === "04.03") return { edie: pl.edie, choose: pl.edie, repair: pl.edie, carry: pl.camp, note: st.fact("note:signed") ? pl.edie : pl.camp, back: pl.edie }[cur.id] || null;
    return { key: pl.garage, open: pl.annex, crates: pl.annex, form: pl.annex, plan: pl.annex }[cur.id] || null;
  }
  marker(cur) {
    const st = this.st, m = st.mission;
    if (!cur || !m.startsWith("04.")) return null;
    const k = m + ":" + cur.id;
    const fernRiding = st.store.fern === "riding" || st.store.fernHome === "riding";
    const who = { "04.01:fern": "fern4", "04.01:book": "fern4", "04.01:home": fernRiding ? null : "fern4", "04.02:ask": "alma4", "04.02:settle": st.store.shelfTrade ? null : "wes4",
      "04.02:deliver": "alma4", "04.03:edie": "edie", "04.03:choose": "edie", "04.03:back": "edie", "04.03:carry": st.fact("hand:fixed") ? "manny4" : null,
      "04.03:note": st.fact("note:signed") ? "edie" : "manny4", "04.04:plan": "ellis4" }[k];
    const obj = { "04.01:door": st.fact("barn:tried") ? "camp:barnlever" : "camp:barndoor", "04.02:find": "camp:pbox1", "04.02:settle": st.store.shelfTrade ? "camp:shelf" : null,
      "04.03:repair": "camp:handmachine", "04.04:key": "camp:keyboard", "04.04:open": "camp:annexdoor", "04.04:form": "camp:wrapping" }[k];
    return { place: this.travel(cur), who, obj };
  }
}
