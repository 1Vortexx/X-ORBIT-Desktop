import assert from "node:assert";
import { readFileSync } from "node:fs";
import { SCRIPT } from "../js/campaign/script.js";
import { parseCampaign } from "../tools/build-campaign.mjs";
import { CampaignState, stepMissions, sceneLines, successFlags, missionView, weekday, nextWeekday, sceneByKey, lineSeconds } from "../js/campaign/state.js";
import { CHAPTER1, CONDS } from "../js/campaign/chapter1.js";
import { CHAPTER2, CONDS2 } from "../js/campaign/chapter2.js";

// The generated script is current and complete: 10 chapters × 4 missions, every recorded line once
const fresh = parseCampaign(readFileSync(new URL("../story/campaign/Long_Haul_Full_Campaign.md", import.meta.url), "utf8"));
assert.deepEqual(JSON.parse(JSON.stringify(fresh)), SCRIPT, "js/campaign/script.js is stale: run node tools/build-campaign.mjs");
assert.equal(SCRIPT.chapters.length, 10);
assert.ok(SCRIPT.chapters.every((c) => c.missions.length === 4));
const all = [...SCRIPT.chapters.flatMap((c) => c.missions), ...SCRIPT.runtime].flatMap((m) => m.scenes);
assert.equal(all.length, 104, "104 scenes, as in the recording package");
const ids = all.flatMap((s) => s.lines.map((l) => l.id));
assert.equal(ids.length, 827);
assert.equal(new Set(ids).size, 827, "line ids are unique");
assert.equal(SCRIPT.chapters.reduce((n, c) => n + c.missions.reduce((k, m) => k + m.target, 0), 0), 2520, "42 hours of planned play");

// Every scene chapter 1 refers to exists
for (const [id, def] of Object.entries({ ...CHAPTER1, ...CHAPTER2 })) {
  for (const k of [...(def.start || []), def.finish && def.finish.scene].filter(Boolean)) assert.ok(sceneByKey(k), `${id}: scene ${k}`);
}

// Chapter 2's conditional lines resolve both ways
const setup = sceneByKey("02.02.B");
assert.ok(sceneLines(setup, new CampaignState(), null, CONDS2).some((l) => l.text.startsWith("Try sitting in it")));
assert.ok(sceneLines(setup, new CampaignState({ flags: { ACCESSIBLE_TABLE: true } }), null, CONDS2).some((l) => l.text.startsWith("I left a straight path")));

// Calendar: day 1 is Monday; the chapter exit lands on the next Friday
assert.equal(weekday(1), "Monday");
assert.equal(weekday(8), "Monday");
assert.equal(nextWeekday(2, "Friday"), 5);
assert.equal(nextWeekday(5, "Friday"), 5);
assert.ok(lineSeconds("Yeah?") >= 2.2);

assert.deepEqual(successFlags("GARAGE_OPEN. The customer agrees to collection after the repair. Exit to 01.02."), ["GARAGE_OPEN"]);
assert.deepEqual(successFlags("BAKERY_HELPED; FLOUR_CONTACT. Repair is measured by a sustained load test."), ["BAKERY_HELPED", "FLOUR_CONTACT"]);
assert.deepEqual(successFlags("DOOR_LOADED. Optional PENCIL_PROTECTED if no cleaning product is applied to the jamb."), ["DOOR_LOADED"]);

// Branches and conditions
const st = new CampaignState();
const del = sceneByKey("01.04.A");
assert.deepEqual(sceneLines(del, st, "DRIVE").map((l) => l.id.slice(-3)), ["001", "002", "003", "004", "005", "006", "007", "008"]);
assert.deepEqual(sceneLines(del, st, "CALL").map((l) => l.id.slice(-3)), ["001", "002", "003", "004", "005", "009", "010"]);
const jamb = sceneByKey("01.04.B");
assert.ok(!sceneLines(jamb, st, null, CONDS).some((l) => l.id.endsWith("-007")));
assert.ok(sceneLines(jamb, st, null, CONDS).some((l) => l.id.endsWith("-008")));
st.flags.PENCIL_PROTECTED = true;
assert.ok(sceneLines(jamb, st, null, CONDS).some((l) => l.id.endsWith("-007")));
assert.ok(!sceneLines(jamb, st, null, CONDS).some((l) => l.id.endsWith("-008")));

// Mission 01.01 from start to finish
const truck = { hood: 0, newBattery: false, running: false, oil: 0.72, coolant: 0.85, cargo: new Set(), door: false };
const w = { day: 1, inOffice: false, water: 0, truck };
const c = new CampaignState();
let ev = stepMissions(c, CHAPTER1, w);
assert.deepEqual(ev.map((e) => e.type), ["start"]);
assert.deepEqual(c.queue, ["01.01.A"], "the opening scene is queued");
assert.equal(missionView(c, CHAPTER1, w).current.id, "office");
assert.ok(!missionView(c, CHAPTER1, w).objectives.some((o) => o.id === "phone"), "the call shows up after the tags are read");
w.inOffice = true;
ev = stepMissions(c, CHAPTER1, w);
assert.deepEqual(ev.map((e) => e.id), ["office"]);
w.inOffice = false;
stepMissions(c, CHAPTER1, w);
assert.ok(c.objDone("01.01", "office"), "objectives latch");
c.setFact("tag:generator"); c.setFact("tag:sedan"); c.setFact("tag:fridge");
truck.hood = 1;
c.scenePlayed("01.01.B");
ev = stepMissions(c, CHAPTER1, w);
assert.deepEqual(ev.map((e) => e.id || e.type), ["tags", "truck", "phone"], "a call made early counts once the tags are read");
c.setFact("shutter");
ev = stepMissions(c, CHAPTER1, w);
assert.deepEqual(ev.map((e) => e.type), ["objective", "complete"]);
assert.equal(c.mission, "01.02");
assert.ok(c.flags.GARAGE_OPEN);
assert.ok(c.queue.includes("01.01.C"));
assert.equal(c.journal[0].text, "Open work is still work. Start with the truck.");
assert.deepEqual(stepMissions(c, CHAPTER1, w).map((e) => e.type), ["start"], "next mission starts; nothing repeats");

// A save mid-mission restores exactly, and does not complete anything twice
const saved = JSON.parse(JSON.stringify(c.serialize()));
const r = new CampaignState(saved);
assert.deepEqual(r.serialize(), c.serialize());
assert.deepEqual(stepMissions(r, CHAPTER1, w), []);

// 01.02: the engine has to start on the new battery
r.setFact("battery:tested"); r.setFact("battery:found");
truck.running = true;
w.water = 2;
truck.oil = 0.9;
truck.cargo.add("jack");
ev = stepMissions(r, CHAPTER1, w);
assert.ok(!ev.some((e) => e.id === "start"), "running on the old battery does not count");
truck.newBattery = true;
ev = stepMissions(r, CHAPTER1, w);
assert.deepEqual(ev.map((e) => e.id || e.type), ["install", "start", "complete"]);
assert.equal(r.mission, "01.03");
assert.ok(r.flags.TRUCK_READY);

// 01.03 → 01.04 → the end of what is playable
r.scenePlayed("01.03.A"); r.setFact("bench:seen"); r.scenePlayed("01.03.B"); r.setFact("door:cleared"); r.setFact("door:wrapped");
truck.door = true;
stepMissions(r, CHAPTER1, w);
ev = stepMissions(r, CHAPTER1, w);
assert.equal(r.mission, "01.04", "the optional cassette does not hold the mission up");
assert.ok(r.flags.DOOR_LOADED);
r.setFact("map:opened"); r.setFact("straps"); r.flags.DEL_ASSISTED = true; r.scenePlayed("01.04.B");
ev = stepMissions(r, CHAPTER1, w);
const done = ev.find((e) => e.type === "complete");
assert.equal(done.day, "Friday");
assert.equal(r.mission, "02.01");
ev = stepMissions(r, CHAPTER1, w);
assert.deepEqual(ev.map((e) => e.type), ["end"], "chapter 2 is not playable yet: the campaign says so once");
assert.deepEqual(stepMissions(r, CHAPTER1, w), []);
assert.equal(missionView(r, CHAPTER1, w).playable, false);

// A damaged record never throws and starts at the beginning
assert.equal(new CampaignState({ mission: "99.99", queue: ["nope"], journal: "x" }).mission, "01.01");
assert.deepEqual(new CampaignState({ queue: ["nope", "01.01.A"] }).queue, ["01.01.A"]);

console.log("campaign ok");
