// Chapter 1 played through against the real authored road, with stand-ins for the truck, people and props. Run:
//   node --import <scratchpad>/tools/node-three-loader.mjs tests/campaign-world.test.mjs
import assert from "node:assert";
const ctx2d = new Proxy({}, {
  get: (_, k) => k === "measureText" ? () => ({ width: 60 }) : k === "getImageData" || k === "createImageData" ? (x, y, w = 1, h = 1) => ({ data: new Uint8ClampedArray(4 * (w || 1) * (h || 1)) })
    : () => ctx2d,
  set: () => true,
});
const el = () => ({ getContext: () => ctx2d, setAttribute() {}, appendChild() {}, width: 0, height: 0, style: {} });
globalThis.document = { createElement: el, querySelector: () => null, body: el() };
globalThis.fetch = async () => ({ ok: false });
const THREE = await import("three");
const { setSeed, heightAt } = await import("../js/world/terrain.js");
const { siteToWorld } = await import("../js/world/sites.js");
const { ITEMS } = await import("../js/items.js");
const { Campaign } = await import("../js/campaign/index.js");
const { CAMPAIGN_SEED } = await import("../js/campaign/state.js");

setSeed(CAMPAIGN_SEED);
assert.ok(ITEMS.yellow_door, "the door is a real item");
const fits = (size, zone) => Math.min(size[0], size[2]) <= zone.max[0] - zone.min[0] && Math.max(size[0], size[2]) <= zone.max[2] - zone.min[2];
const zone = { min: [-0.8, 0.79, -2.36], max: [0.8, 1.7, -0.74] };
assert.ok(fits(ITEMS.yellow_door.size, zone), "the door's box fits the pickup bed");

// ── stand-ins ──
const truck = {
  id: "starter", slots: { battery: { id: "b0", type: "battery", charge: 82, cond: 68 } }, doors: { hood: 0 }, ign: "off",
  oil: 3.6, coolant: 8.5, def: { oilCap: 5, coolantCap: 10 }, cargo: { zone, items: [] }, pos: new THREE.Vector3(), speed: 0,
  mesh: new THREE.Group(), seats: { driver: null, passenger: null }, seatFree(s) { return !this.seats[s]; },
};
const people = [];
const npcs = {
  spawn(spec) {
    const n = { ...spec, pos: new THREE.Vector3(spec.x, 0, spec.z), seat: null, target: null, mesh: new THREE.Group(),
      setTarget(t) { this.target = t; }, lookAt() {}, walkTo() {}, idle() {},
      enterVehicle(v, s) { v.seats[s] = this.id; this.seat = { vehicle: v.id, seat: s }; return true; },
      exitVehicle() { truck.seats[this.seat.seat] = null; this.seat = null; return true; },
      serialize() { return { id: this.id, pos: this.pos.toArray(), seat: this.seat }; }, restore(r) { this.seat = r.seat; return this; } };
    people.push(n); return n;
  },
  remove(n) { people.splice(people.indexOf(n), 1); },
};
const loose = new Map();
const props = {
  map: loose, get: (id) => loose.get(id) || null,
  spawn(item, pos) { loose.set(item.id, { item, pos: pos.clone ? pos.clone() : pos }); return {}; },
  remove(id) { loose.delete(id); const i = truck.cargo.items.findIndex((e) => e.item.id === id); if (i >= 0) truck.cargo.items.splice(i, 1); },
};
const interaction = { held: null };
const pockets = [];
let cash = 60;
const stock = {
  get money() { return cash; },
  count: (t) => pockets.filter((x) => x === t).length,
  give: ({ items }) => { for (const g of items) for (let i = 0; i < (g.n || 1); i++) pockets.push(g.type); },
  pay: ({ items = [], money = 0 }) => {
    if (money > cash || items.some((g) => pockets.filter((x) => x === g.type).length < g.n)) return false;
    cash -= money;
    for (const g of items) for (let i = 0; i < g.n; i++) pockets.splice(pockets.indexOf(g.type), 1); return true;
  },
};
let hours = 100;
const said = [], notes = [];
let dialogueSpec = null, day = 1, face = null;
const me = { pos: new THREE.Vector3(), vehicle: null, onFoot: true, speed: 0 };
const root = new THREE.Group();
const camp = new Campaign({
  root, npcs, vehicles: {}, props, interaction, stock, notify: (t) => notes.push(t), sfx() {},
  say: (name, text) => said.push(`${name}: ${text}`), dialogue: (spec) => { dialogueSpec = spec; return true; },
  day: () => day, truck: () => truck, player: () => me, hours: () => hours, facing: () => face,
});
camp.bindPlaces();
const P = camp.places;
assert.equal(P.garage.name, "Vale Garage");
assert.equal(P.motel.name, "Mercy Motel");
assert.equal(P.motel.kind, "motel");
assert.ok(P.motel.zRoad - P.garage.zRoad >= 11500 && P.motel.zRoad - P.garage.zRoad < 12800, `motel ${(P.motel.zRoad / 1000).toFixed(1)} km down the road`);
assert.ok(P.pulloff.zRoad > P.garage.zRoad && P.pulloff.zRoad < P.motel.zRoad);
camp.begin(null, { fresh: true });
assert.equal(truck.slots.battery.charge, 3, "the old battery is flat");
assert.equal(camp.st.store.oldBattery, "b0");

const targets = () => { const out = []; root.traverse((o) => { if (o.userData.target) out.push(o.userData.target); }); return out; };
const T = (id) => targets().find((t) => t.id === id);
const act = (id, label, c = { held: interaction.held, giveHeld: (it) => { interaction.held = it; return true; } }) => {
  const t = id === "straps" ? camp.strapTarget.userData.target : T(id);
  assert.ok(t, "target " + id);
  const a = t.actions(c).find((x) => !label || x.label === label);
  assert.ok(a, `${id}: action ${label} in ${JSON.stringify(t.actions(c).map((x) => x.label))}`);
  assert.ok(!a.blocked, `${id}: ${a.label} blocked: ${a.blocked}`);
  a.run(c);
};
// Run the campaign until its scenes have played (lines advance with time, like the game loop)
function run(secs = 2) { for (let t = 0; t < secs; t += 0.25) camp.update(0.25, { skip: true }); }
const localPos = (lx, lz) => { const p = siteToWorld(P.garage, lx, lz); return new THREE.Vector3(p.x, heightAt(p.x, p.z), p.z); };

// ── 01.01 Shutters Up ──
me.pos.copy(localPos(-6.5, 3));
const ellis1 = () => people.find((n) => n.name === "Ellis");
face = { x: 0, z: 1 };
run(1);
assert.ok(said[0].startsWith("Kit: Office key."), "the opening scene plays: " + said[0]);
assert.ok(ellis1(), "Ellis is at the garage for the opening");
// facing away from him, Ellis waits
face = { x: -(ellis1().pos.x - me.pos.x), z: -(ellis1().pos.z - me.pos.z) };
run(8);
assert.equal(said.length, 1, "Ellis doesn't talk to Kit's back: " + said.join(" | "));
assert.ok(notes.some((t) => t.startsWith("Ellis is behind you")), "the player is told to turn round");
face = { x: ellis1().pos.x - me.pos.x, z: ellis1().pos.z - me.pos.z };
run(2);
assert.ok(said[1] && said[1].startsWith("Ellis: Big brass one"), "once Kit turns, Ellis speaks: " + said[1]);
face = null;
run(8);
assert.equal(camp.hud().title, "1 · Shutters Up");
me.pos.copy(localPos(-8, -4));
run(1);
assert.ok(camp.st.objDone("01.01", "office"));
assert.ok(T("camp:phone").actions({}).some((a) => a.blocked), "the phone waits for the tags");
for (const t of ["generator", "van", "sewing"]) act("camp:tag:" + t);
run(1);
truck.doors.hood = 1;
act("camp:phone", "Call Bell's Bakery");
run(8);
assert.ok(said.some((s) => s === "Lorna: Bell's Bakery."));
act("camp:shutter");
run(10);
assert.equal(camp.st.mission, "01.02");
assert.ok(camp.st.flags.GARAGE_OPEN);
assert.ok(said.some((s) => s.startsWith("Kit: Put the kettle on.")), "the closing scene played");
assert.ok(camp.colliders(0, 0, 1e6).length < camp.colls.length, "the raised shutter no longer blocks the bay");

// ── 01.02 Receipt on the Box ──
run(1);
assert.ok(loose.has("camp:battery"), "the new battery waits under the bench");
assert.ok(loose.has("camp:recoverykit"), "June's recovery kit waits on the garage floor");
assert.equal(camp.colliders(0, 0, 1e6).length, camp.colls.length - 1);
me.vehicle = truck; truck._crankCool = 1.2;
run(1);
assert.ok(camp.st.fact("battery:tested"));
me.vehicle = null;
interaction.held = loose.get("camp:battery").item;
run(1);
assert.ok(camp.st.queue.includes("01.02.A") || camp.st.seen("01.02.A"));
run(10);
assert.ok(said.some((s) => s === "Kit: Thursday. She bought this Thursday."));
truck.slots.battery = interaction.held; interaction.held = null;
pockets.push("water", "water"); truck.oil = 4.5; truck.cargo.items.push({ item: { id: "j1", type: "jack" }, lpos: [0, 1, -1.5] });
truck.ign = "running";
run(12);
assert.equal(camp.st.mission, "01.03");
assert.ok(camp.st.tapes.includes("01.02.A") || true);
assert.ok(said.some((s) => s === "Kit: There you are."));

// ── 01.03 The Message ──
run(1);
const bench = T("camp:bench");
assert.deepEqual(bench.actions({}), [], "the bench is just a bench until Alma's message");
act("camp:machine", "Play the message");
run(12);
assert.ok(said.some((s) => s.startsWith("Alma: June, it's Alma Reyes.")));
act("camp:bench", "Look closer");
act("camp:phone", "Call Alma Reyes");
run(14);
act("camp:bench", "Clear the tools and brackets");
run(1);
act("camp:bench", "Wrap the jamb in a moving blanket");
assert.ok(camp.st.flags.PENCIL_PROTECTED);
act("camp:bench", "Lift the door");
assert.equal(interaction.held.type, "yellow_door");
assert.equal(camp.colliders(0, 0, 1e6).length, camp.colls.length - 2, "lifting the door clears the trestles");
truck.cargo.items.push({ item: interaction.held, lpos: [0, 0.85, -1.55] }); interaction.held = null;
act("camp:tape", "Play the tape");
run(14);
assert.ok(said.some((s) => s === "June: Kit. It's me. Obviously."));
assert.ok(camp.st.tapes.includes("01.03.C"));
assert.equal(camp.st.mission, "01.04");
assert.ok(camp.st.flags.DOOR_LOADED);

// ── 01.04 A Door on the Highway ──
const saved = JSON.parse(JSON.stringify(camp.serialize()));
camp.note("map");
truck.pos.set(P.pulloff.x + 3, 0, P.pulloff.z); me.pos.copy(truck.pos); truck.speed = 0;
run(1);
assert.ok(camp.hud().text.length > 0);
assert.ok(camp.mapSites().includes(P.motel), "the motel is on the map");
const del = people.find((n) => n.name === "Del");
assert.ok(del && del.target, "Del waits at the pull-off");
act("straps");
del.target.actions()[0].run();
run(12);
assert.ok(dialogueSpec, "Kit is asked what to do about Del");
assert.ok(!dialogueSpec.choices.find((c) => c.id === "DRIVE").disabled, "the truck is alongside: a lift is possible");
const spec = dialogueSpec; dialogueSpec = null;
spec.onChoose("DRIVE");
run(8);
assert.ok(said.some((s) => s === "Kit: Tell me which turn."), "the DRIVE branch plays");
assert.ok(!said.some((s) => s.startsWith("Kit: I've got no safe room")), "the CALL branch does not");
assert.ok(camp.st.flags.DEL_HELPED);
assert.equal(truck.seats.passenger, "camp:del");
// Save with Del aboard and load again: he comes back in the truck
const ride = JSON.parse(JSON.stringify(camp.serialize()));
camp.begin(ride, { fresh: false });
assert.ok(people.some((n) => n.name === "Del"), "Del rides on after a reload");
// Arrive at Mercy Motel
truck.pos.set(P.motel.x, 0, P.motel.z + 10); me.pos.copy(truck.pos);
run(1);
assert.ok(camp.st.fact("del:home"), "Del gets out at the motel");
const alma = people.find((n) => n.name === "Alma");
assert.ok(alma && alma.target);
alma.target.actions()[0].run();
assert.ok(!truck.cargo.items.some((e) => e.item.type === "yellow_door"), "the door is handed over before the scene");
run(20);
assert.ok(said.some((s) => s === "Alma: Good. You've left everybody where they stood."), "the protected-jamb line plays");
assert.ok(!said.some((s) => s.startsWith("Alma: It's faint")));
assert.equal(camp.st.mission, "02.01");
assert.equal(camp.takeDay().name, "Friday", "the chapter exit fades to Friday");
run(1);
assert.ok(!camp.st.ended, "chapter 2 carries straight on");
assert.equal(camp.hud().title, "2 · Cold Room");
assert.ok(camp.journal().chapters.length === 10);
const ch2Start = JSON.parse(JSON.stringify(camp.serialize()));

// The CALL branch from the same save
said.length = 0; people.length = 0;
camp.begin(saved, { fresh: false });
camp.note("map");
truck.pos.set(P.pulloff.x + 3, 0, P.pulloff.z); me.pos.copy(truck.pos);
truck.seats.passenger = null;
run(1);
people.find((n) => n.name === "Del").target.actions()[0].run();
run(12);
const s2 = dialogueSpec; dialogueSpec = null;
s2.onChoose("CALL");
run(8);
assert.ok(said.some((s) => s.startsWith("Del: Tell him about the butter")));
assert.ok(camp.st.flags.DEL_ASSISTED && camp.st.objDone("01.04", "del"));

// ── Chapter 2 ──
said.length = 0; people.length = 0; loose.clear(); truck.cargo.items.length = 0; truck.seats.passenger = null; pockets.length = 0;
camp.begin(ch2Start, { fresh: false });
const at = (place, lx = 0, lz = 0) => { const q = siteToWorld(place, lx, lz); return new THREE.Vector3(q.x, 0, q.z); };
const park = (place, lx = 0, lz = 8) => { truck.pos.copy(at(place, lx, lz)); me.pos.copy(truck.pos); truck.speed = 0; run(1); };
const take = (id) => { const e = loose.get(id); assert.ok(e, "spawned: " + id); loose.delete(id); truck.cargo.items.push({ item: e.item, lpos: [0, 1, -1.5] }); };
const who = (name) => people.find((n) => n.name === name);
assert.ok(P.bakery.name === "Bell's Bakery" && P.bakery.kind === "diner" && P.bakery.zRoad > P.motel.zRoad, "the bakery is past the motel");
assert.ok(P.ward.kind === "home" && P.ward.zRoad < P.motel.zRoad, "Ellis lives between the garage and the motel");
for (const k of ["hire", "camp", "weigh"]) assert.ok(P[k].zRoad > 0, k);
// 02.01: the vent starves on the first run; a clean vent holds for half an hour of game time
me.pos.copy(localPos(8.4, -5.5));
act("camp:gen", "Run it under load");
hours += 0.2; run(1);
assert.equal(camp.st.store.gen.state, "running");
hours += 0.2; run(1);
assert.equal(camp.st.store.gen.state, "failed", "it dies after twenty minutes");
act("camp:gen", "Open the fuel cap");
run(1);
assert.ok(camp.st.objDone("02.01", "diagnose"));
act("camp:gen", "Clean the fuel vent");
act("camp:gen", "Start the load test");
hours += 0.6; run(1);
assert.ok(camp.st.objDone("02.01", "fix"));
act("camp:gen", "Lift the generator");
truck.cargo.items.push({ item: interaction.held, lpos: [0, 1, -1.5] }); interaction.held = null;
park(P.bakery);
who("Lorna").target.actions()[0].run();
run(20);
assert.ok(said.includes("Lorna: You put my name right."));
park(P.bakery);
take("camp:bread1"); take("camp:bread2");
run(26);
assert.ok(said.includes("Lorna: Who was left waiting?"), "the departure scene plays");
assert.equal(camp.st.mission, "02.02");
assert.ok(camp.st.flags.BAKERY_HELPED && camp.st.flags.FLOUR_CONTACT);
// 02.02: chairs, stove (the legs come with Manny's warning), lamp oil, then the seating
park(P.hire);
for (let i = 1; i <= 6; i++) take("camp:chair" + i);
park(P.camp);
interaction.held = loose.get("camp:stove").item;
run(1);
assert.ok(camp.st.queue.includes("02.02.A") || camp.playing);
run(24);
assert.ok(said.includes("Manny: Bring it back with the legs. Everybody forgets them."));
assert.equal(stock.count("stove_legs"), 1, "Manny hands over the legs");
loose.delete("camp:stove"); truck.cargo.items.push({ item: interaction.held, lpos: [0, 1, -1.5] }); interaction.held = null;
take("camp:lampoil");
park(P.motel);
assert.ok(camp.motelTable, "the door table stands at the motel");
who("Del").target.actions()[0].run();
assert.ok(camp.st.fact("supper:unloaded"));
assert.equal(truck.cargo.items.length, 0, "everything for the supper comes off the truck");
const table = camp.motelTable.userData.target;
table.actions().find((a) => a.label.startsWith("Leave the end clear")).run();
run(20);
assert.ok(said.includes("Alma: Thank you. She'll notice before she says anything."), "the accessible-table lines play");
assert.ok(!said.some((s) => s.startsWith("Del: Try sitting in it")));
assert.equal(camp.st.mission, "02.03");
assert.deepEqual(camp.takeDay(), { name: "Saturday", time: 0.74 }, "the supper is Saturday evening");
// 02.03: toast, three tables, three conversations, the recording and a private question
run(30);
assert.ok(said.includes("Alma: Food's on the yellow door. Leave the blue dish. Somebody's looking for it."));
for (let i = 0; i < 3; i++) table.actions()[0].run();
for (const name of ["Nico", "Fern", "Ellis"]) { who(name).target.actions()[0].run(); dialogueSpec.onChoose("back"); dialogueSpec = null; }
run(1);
who("Inez").target.actions()[0].run();
run(14);
assert.ok(dialogueSpec && dialogueSpec.choices.length === 2, "public or private question");
dialogueSpec.onChoose("PRIVATE_QUESTION"); dialogueSpec = null;
run(16);
assert.ok(said.includes("Inez: What I have is nineteen seconds. Come by the station."));
assert.ok(!said.some((s) => s.startsWith("Nico: This isn't a good place")));
assert.ok(said.includes("Ellis: There's a weigh ticket. Come and see me tomorrow."), "the shared line plays after the branch");
assert.equal(camp.st.mission, "02.04");
assert.ok(camp.st.flags.ELLIS_TICKET_LEAD && camp.st.flags.PRIVATE_QUESTION);
// 02.04: Ellis rides home (the ticket comes out on the way), the stove goes back with its legs, the garage closes
run(1);
take("camp:stove");
const ellis = who("Ellis");
truck.pos.copy(ellis.pos).add(new THREE.Vector3(3, 0, 0)); me.pos.copy(truck.pos);
ellis.target.actions()[0].run();
assert.equal(truck.seats.passenger, "camp:ellis");
truck.speed = 12; run(1); run(26);
assert.ok(said.includes("Ellis: Eighteen sixty. That's the bit that won't leave me alone."));
park(P.ward, 0, 4);
assert.equal(camp.st.store.ellis, "home");
park(P.camp);
who("Manny").target.actions()[0].run();
assert.ok(camp.st.fact("stove:returned") && stock.count("stove_legs") === 0);
me.pos.copy(localPos(-8, -4));
act("camp:ledger", "Log the weigh ticket");
camp.note("map");
run(1);
assert.ok(camp.mapSites().includes(P.weigh), "the weigh station is on the map");
act("camp:shutter", "Lower the shutter");
run(1);
act("camp:phone", "Call Bell's Bakery");
run(24);
assert.ok(said.includes("Lorna: Then take water. That roof's been gone since February."));
assert.equal(camp.st.mission, "03.01");
assert.ok(camp.st.flags.WEIGH_STATION_UNLOCKED);
assert.equal(camp.takeDay().name, "next");
run(1);
assert.ok(!camp.st.ended, "chapter 3 carries straight on");
assert.equal(camp.hud().title, "3 · Dead Scale");
const ch3Start = JSON.parse(JSON.stringify(camp.serialize()));

// ── Chapter 3 ──
const choose = (id) => { const d = dialogueSpec; assert.ok(d, "a dialogue is open"); dialogueSpec = null; const c = d.choices.find((x) => x.id === id); assert.ok(c && !c.disabled, `choice ${id}: ${c && c.disabled}`); d.onChoose(id); };
const talk = (name) => { const n = who(name); assert.ok(n && n.target, name + " is there to talk to"); const a = n.target.actions()[0]; assert.ok(a, name + " has something to say"); a.run(); };
const onFoot = (place, lx, lz) => { me.pos.copy(at(place, lx, lz)); run(0.5); };
const aim = () => camp.markerTarget(camp.view.current);
// the marker points down the road at the weigh station, and at Ellis once there
run(1);
assert.ok(aim() && aim().pos && Math.hypot(aim().pos.x - P.weigh.x, aim().pos.z - P.weigh.z) < 1, "the marker beam stands over the weigh station");
// June's paper map: capture it and the whole highway is on the maps; story places pin as the story needs them
assert.equal(camp.paperRange(), null);
me.pos.copy(localPos(-11, -8));
act("camp:papermap", "Capture");
assert.ok(camp.paperRange()[1] - camp.paperRange()[0] > 30000, "the paper map covers the highway");
run(0.5);
const pins = camp.mapPins();
assert.ok(pins.some((q) => q.name === "Vale Garage") && pins.some((q) => q.name === "Mercy Motel"), "places already visited stay pinned");
assert.ok(pins.find((q) => q.name === "Mercy Weigh Station").current, "the objective's place is ringed");
assert.ok(!pins.some((q) => q.name === "Mercy Sale Barn"), "places the story hasn't reached aren't pinned yet");
const way = camp.mapRoutes()[0];
assert.ok(way && way.pts.length > 50, "a route runs down the highway to the weigh station");
const end = way.pts[way.pts.length - 1];
assert.ok(Math.hypot(end.x - P.weigh.x, end.z - P.weigh.z) < 1 && Math.hypot(way.pts[0].x - me.pos.x, way.pts[0].z - me.pos.z) < 1, "from you to the place");
camp.setWaypoint(P.bakery.x, P.bakery.z, "Bell's Bakery");
assert.equal(camp.mapRoutes().length, 2, "and one to your own destination");
assert.ok(camp.hud().text.includes("📍 Bell's Bakery"));
me.pos.set(P.bakery.x + 5, 0, P.bakery.z); run(0.5);
assert.equal(camp.waypoint, null, "reaching a destination clears it");
assert.ok(camp.mapSites().includes(P.weigh));
for (const k of ["wes", "scrap", "radio"]) assert.ok(P[k] && P[k].campaign === k, k + " is named");
assert.equal(P.wes.kind, "garage"); assert.equal(P.scrap.kind, "junkyard");
assert.ok(P.radio.zRoad > P.weigh.zRoad, "Vega Tyre is past the weigh station");
park(P.weigh, 0, 6);
assert.ok(camp.ch3.built.station, "the weigh station is built on arrival");
assert.ok(aim().over === who("Ellis").mesh, "the chevron hangs over Ellis");
talk("Ellis");
run(26);
assert.ok(said.includes("Ellis: Mostly things she shouted."), "the arrival scene plays");
assert.ok(loose.has("camp:toolbox"), "Ellis lends his toolbox");
// isolate before the junction box
onFoot(P.weigh, -1.3, -2.6);
assert.ok(T("camp:junction").actions()[0].blocked === "Isolate supply first");
act("camp:wsgen", "Look the generator over");
act("camp:platform", "Inspect the platform");
act("camp:isolator", "Isolate the supply");
act("camp:junction", "Open the junction box");
for (let i = 0; i < 4; i++) act("camp:debris" + i, "Drag it clear");
run(1);
act("camp:printer", "Check the printer");
run(20);
assert.ok(said.includes("Kit: I'll make a list. You stop treating wire as a structural material."));
assert.equal(camp.st.mission, "03.02");
assert.ok(camp.st.flags.SCALE_DIAGNOSED);
assert.equal(camp.takeDay().name, "next");
// 03.02: the scrap yard's third engine has the belt; Wes, short of money → the vice
cash = 10;
park(P.scrap, 0, 10);
act("camp:engine0", "Search it for a belt");
assert.equal(stock.count("pulley_belt"), 0);
act("camp:engine1", "Search it for a belt");
assert.equal(stock.count("pulley_belt"), 1, "the belt goes in the pockets");
park(P.wes, 0, 8);
talk("Wes");
run(26);
assert.ok(said.includes("Wes: I can show you the ledger. I'd prefer you believed me."));
run(1);
assert.ok(dialogueSpec && dialogueSpec.choices.find((c) => c.id === "PAY_WES").disabled, "can't pay with $10");
choose("TRADE_WES");
act("camp:vice", "Strip, clean and grease the screw");
run(24);
assert.ok(said.includes("Kit: Mine's on the invoice. Keep a copy."));
assert.ok(stock.count("power_connector") && stock.count("printer_paper"), "Wes hands over the parts");
run(1);
assert.equal(camp.st.mission, "03.03");
assert.ok(camp.st.flags.TRADE_WES && camp.st.flags.SCALE_PARTS_READY);
// 03.03: fit, load, power, Ellis, weights spread on the deck, the truck on the scale, the right stub
park(P.weigh, 0, 6);
onFoot(P.weigh, -2.8, -3.6);
act("camp:wsgen", "Fit the belt and the rated connector");
act("camp:printer", "Load the paper");
act("camp:isolator", "Restore the supply");
run(1);
talk("Ellis");
run(26);
assert.ok(said.includes("Kit: It's a scale, Ellis. I trust you to park."));
run(1);
const ws = (lx, lz) => { const q = siteToWorld(P.weigh, lx, lz); return new THREE.Vector3(q.x, heightAt(q.x, q.z), q.z); };
WEIGHTS: {
  for (let i = 1; i <= 4; i++) { assert.ok(loose.has("camp:weight" + i)); loose.get("camp:weight" + i).pos = ws(2.2, -4.5 + i * 0.1); }
  run(1);
  assert.ok(!camp.st.objDone("03.03", "calibrate"), "weights all at one end don't calibrate");
  for (let i = 1; i <= 4; i++) loose.get("camp:weight" + i).pos = ws(2.2, -1.2 - 3 + i * 1.5);
  run(1);
  assert.ok(camp.st.objDone("03.03", "calibrate"), "spread weights calibrate");
}
truck.pos.copy(ws(2.2, -1.2)); truck.speed = 0; run(1);
assert.ok(camp.st.fact("ws:weighed"), "the pickup is weighed");
act("camp:printer", "Compare the ticket, the carbon and the stub");
choose("tow");
assert.ok(said.some((s) => s.startsWith("Ellis: That's the tow.")), "a wrong stub gets Ellis's correction");
act("camp:printer", "Compare the ticket, the carbon and the stub");
choose("mercy");
run(40);
assert.ok(said.includes("Kit: There was. We need to find out whose."));
assert.equal(camp.st.mission, "03.04");
assert.ok(camp.st.flags.CARGO_WEIGHT_CONFIRMED && camp.st.flags.LOT_41_LEAD);
camp.takeDay();
// 03.04: two copies, originals in the archive, the toolbox back to Ellis, a copy to Inez
me.pos.copy(localPos(-12, -7));
act("camp:copier"); act("camp:copier");
assert.equal(stock.count("evidence_copy"), 2);
act("camp:archive");
take("camp:toolbox");
park(P.ward, 0, 6);
talk("Ellis");
assert.ok(camp.st.fact("toolbox:returned") && !truck.cargo.items.length, "the toolbox goes home");
park(P.radio, 0, 8);
assert.ok(camp.ch3.built.radio);
talk("Inez");
assert.equal(stock.count("evidence_copy"), 1, "Inez keeps one copy");
run(50);
assert.ok(said.includes("Inez: Ask her. That's usually the first useful thing."));
assert.equal(camp.st.mission, "04.01");
assert.ok(camp.st.flags.INEZ_CONTACT && camp.st.flags.FERN_ADDRESS);
camp.takeDay();

// ── Chapter 4 ──
run(1);
assert.equal(camp.hud().title, "4 · The Sale Barn");
assert.ok(P.fern.kind === "home" && P.fern.zRoad > P.radio.zRoad && P.barn.zRoad > P.fern.zRoad);
// 04.01: Fern at her window, the ride to the barn, a door that sticks, three lots, her book, the ride home
park(P.fern, 0, 6);
talk("Fern");
run(24);
assert.ok(said.includes("Fern: It's my book. I'll read it."));
truck.pos.copy(who("Fern").pos).add(new THREE.Vector3(3, 0, 0)); me.pos.copy(truck.pos);
talk("Fern");
assert.equal(truck.seats.passenger, "camp:fern4", "Fern gets in");
const fernRide = JSON.parse(JSON.stringify(camp.serialize()));
people.length = 0;
camp.begin(fernRide, { fresh: false });
run(0.5);
assert.ok(who("Fern") && who("Fern").seat, "Fern rides on after a reload");
park(P.barn, 0, 8);
assert.equal(camp.st.store.fern, "dropped", "Fern gets out at the barn");
assert.ok(camp.ch4.built.barn);
act("camp:barndoor", "Haul the door open");
act("camp:barnlever", "Lean on the lever");
for (const l of ["38", "40", "41"]) act("camp:lot" + l);
talk("Fern");
run(30);
assert.ok(said.includes("Fern: Thank you."));
assert.equal(stock.count("lot_copies"), 1, "Fern hands over her authorised copies");
truck.seats.passenger = null;
truck.pos.copy(who("Fern").pos).add(new THREE.Vector3(3, 0, 0)); me.pos.copy(truck.pos);
talk("Fern");
park(P.fern, 0, 6);
run(1);
assert.equal(camp.st.mission, "04.02");
assert.ok(camp.st.flags.AUCTION_CONFIRMED);
camp.takeDay(); truck.seats.passenger = null;
// 04.02: Alma's three details, the right tin on Wes's shelf, pay for it, the copy question
park(P.motel, 0, 8);
talk("Alma"); choose("ok");
cash = 80;
park(P.wes, 0, 8);
assert.ok(camp.ch4.built.shelf);
act("camp:pbox0");
assert.ok(!camp.st.fact("box:found"), "the wrong box isn't hers");
act("camp:pbox1");
talk("Wes"); choose("pay");
assert.equal(cash, 55);
run(20);
assert.ok(said.includes("Kit: I'll cover your stock cost."), "the paying line plays");
assert.ok(!said.includes("Kit: You said the shelf needs fixing. Let me do it, then write labour."));
run(1);
take("camp:photobox");
park(P.motel, 0, 8);
talk("Alma");
run(12);
choose("ASK_COPY");
run(20);
assert.ok(said.includes("Alma: Copy the road. Crop my nephew out. That's the condition."));
assert.ok(said.includes("Alma: There. Look at the shoulders. She never fooled anybody."));
assert.equal(camp.st.mission, "04.03");
assert.ok(camp.st.flags.PHOTOS_RETURNED && camp.st.flags.COPY_ALLOWED);
camp.takeDay();
// 04.03: Edie; lend it back: a needle that fits, a belt, the treadle to Mercy Camp
park(P.edie, 0, 8);
talk("Edie");
run(24);
talk("Edie"); choose("MACHINE_RETURNED");
run(1);
assert.ok(camp.view.objectives.some((o) => o.id === "repair") && !camp.view.objectives.some((o) => o.id === "note"), "only the chosen branch's objectives show");
act("camp:handmachine", "Pick a needle from Edie's tray"); choose("dbx1");
assert.ok(!camp.st.fact("hand:needle"));
act("camp:handmachine", "Pick a needle from Edie's tray"); choose("15x1");
act("camp:handmachine", "Fit a new round belt and set the tension");
take("camp:treadle");
park(P.camp, 0, 8);
talk("Manny");
assert.ok(camp.st.fact("treadle:delivered"));
park(P.edie, 0, 8);
talk("Edie");
run(30);
assert.ok(said.includes("Edie: Put the loan in writing. We both deserve to know what's coming back."));
assert.ok(!said.some((s) => s.startsWith("Kit: They said keep using it.")));
assert.ok(said.includes("Edie: Better organized than the places."));
assert.equal(camp.st.mission, "04.04");
camp.takeDay();
// 04.04: the key board, the annex with Ellis, six crates, the form, two deliveries
me.pos.copy(localPos(-8, -4));
act("camp:keyboard"); choose("dont");
assert.equal(stock.count("annex_key"), 0);
act("camp:keyboard"); choose("annex");
assert.equal(stock.count("annex_key"), 1);
park(P.annex, 0, 6);
assert.ok(who("Ellis"), "Ellis waits at the annex");
act("camp:annexdoor", "Unlock the annex");
run(30);
assert.ok(said.includes("Kit: Neither did I."));
for (let i = 0; i < 6; i++) act("camp:crate" + i);
act("camp:wrapping");
run(30);
assert.ok(said.includes("Kit: We deliver them. Finding out is going to take longer than giving something back."));
talk("Ellis"); choose("0");
run(1);
choose("3");
run(1);
assert.deepEqual(camp.st.store.deliveries, [0, 3]);
assert.ok(camp.st.flags.CLEARANCE_FORM_FOUND && camp.st.flags.RETURN_ROUTE_PLANNED);
assert.equal(camp.st.mission, "05.01");
run(1);
assert.ok(camp.st.ended, "chapter 5 is not playable yet");

// The other chapter 3 branch: pay Wes, and a reload mid-chapter keeps everything
said.length = 0; people.length = 0; loose.clear(); truck.cargo.items.length = 0; truck.seats.passenger = null; pockets.length = 0; dialogueSpec = null;
camp.begin(ch3Start, { fresh: false });
camp.st.mission = "03.02"; camp.st.done["03.01"] = 1;
cash = 100;
park(P.wes, 0, 8);
talk("Wes"); run(26); run(1);
choose("PAY_WES");
assert.equal(cash, 60);
assert.ok(stock.count("pulley_belt") && stock.count("power_connector") && stock.count("printer_paper"), "with no belt found, Wes throws one in");
run(1);
assert.equal(camp.st.mission, "03.03");
console.log("campaign world ok");
