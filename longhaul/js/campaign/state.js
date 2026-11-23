// Long Haul – campaign progress (pure: no THREE, no DOM, runs in Node).
// The Return Trip is played on one authored road (CAMPAIGN_SEED) so every scripted place is always in the same spot.
// Progress is plain JSON saved with the campaign journey. Rules from the production bible:
//  - objectives latch: once done they stay done, whatever happens to the world afterwards
//  - a mission's flags and its move to the next mission are written before any scene, reward or item transfer
//  - scenes that still have to play are kept in `queue`, so a reload mid-scene plays them again instead of losing them
//  - nothing here is ever awarded twice
import { SCRIPT } from "./script.js";

export const CAMPAIGN_SEED = 19112112;   // chosen so Mercy Motel is 12 road km from the garage, as scripted
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// Kit arrives on a Monday: journey day 1 is a Monday
export const weekday = (day) => WEEKDAYS[(((day - 1) % 7) + 7) % 7];
// The first journey day on or after `day` that falls on `name`
export function nextWeekday(day, name) {
  const want = WEEKDAYS.indexOf(name);
  let d = day;
  while (WEEKDAYS.indexOf(weekday(d)) !== want) d++;
  return d;
}

const MISSIONS = SCRIPT.chapters.flatMap((c) => c.missions);
const SCENES = new Map();
for (const m of [...MISSIONS, ...SCRIPT.runtime]) for (const s of m.scenes) SCENES.set(s.key, s);
export const missionById = (id) => MISSIONS.find((m) => m.id === id) || null;
export const sceneByKey = (key) => SCENES.get(key) || null;
export const chapterOf = (id) => SCRIPT.chapters.find((c) => c.missions.some((m) => m.id === id)) || null;
export function nextMissionId(id) {
  const i = MISSIONS.findIndex((m) => m.id === id);
  return i >= 0 && i + 1 < MISSIONS.length ? MISSIONS[i + 1].id : null;
}

// Speaker codes in the script → names shown in subtitles
export const SPEAKERS = {
  KIT: "Kit", JUNE: "June", ALMA: "Alma", NICO: "Nico", ELLIS: "Ellis", INEZ: "Inez", DEL: "Del", LORNA: "Lorna",
  MARA: "Mara", OWEN: "Owen", SERA: "Sera", FERN: "Fern", WES: "Wes", EDIE: "Edie", MANNY: "Manny", ROSA: "Rosa",
  MATEO: "Mateo", LEN: "Len", ADA: "Ada", TOM: "Tom",
};

// Lines of a scene that play for this state: the chosen branch (lines of other branches are skipped) and only lines
// whose condition holds. A line's condition comes from its direction ("if PENCIL_PROTECTED; grateful").
// `conds` maps condition text to a test; anything else is read as a flag name.
export function sceneLines(scene, st, branch = null, conds = {}) {
  if (!scene) return [];
  return scene.lines.filter((l) => (!l.branch || l.branch === branch) && lineOk(l, st, conds));
}
// Whether a line's condition holds (lines without one always do)
export function lineOk(l, st, conds = {}) {
  if (!l.cond) return true;
  return l.cond.split("/").some((c) => {
    c = c.trim();
    return conds[c] ? !!conds[c](st) : !!st.flags[c];
  });
}

// Seconds a subtitle stays up: reading speed with a floor, so short lines are still readable
export const lineSeconds = (text) => Math.max(2.2, 1.1 + String(text).split(/\s+/).length * 0.36);

export class CampaignState {
  constructor(rec) { this.restore(rec); }
  restore(rec) {
    const r = rec && typeof rec === "object" ? rec : {};
    this.mission = typeof r.mission === "string" && missionById(r.mission) ? r.mission : MISSIONS[0].id;
    this.started = { ...(r.started || {}) };      // mission id → day it started
    this.done = { ...(r.done || {}) };            // mission id → day it was completed
    this.obj = JSON.parse(JSON.stringify(r.obj || {}));   // mission id → { objective id: true }
    this.flags = { ...(r.flags || {}) };          // story flags (GARAGE_OPEN, PENCIL_PROTECTED…)
    this.facts = { ...(r.facts || {}) };          // small world facts set by interactions (tag:generator, shutter…)
    this.scenes = { ...(r.scenes || {}) };        // scene key → times played to the end
    this.branch = { ...(r.branch || {}) };        // scene key → branch chosen
    this.queue = Array.isArray(r.queue) ? r.queue.filter((k) => SCENES.has(k)) : [];
    this.journal = Array.isArray(r.journal) ? r.journal.slice() : [];   // [{ mission, text, day }]
    this.tapes = Array.isArray(r.tapes) ? r.tapes.slice() : [];         // scene keys the player can replay
    this.help = !!r.help;                          // the player asked for hints on the current mission
    this.store = JSON.parse(JSON.stringify(r.store || {}));             // runtime records (people, places)
    this.ended = !!r.ended;                        // reached the end of what is playable in this build
    return this;
  }
  serialize() {
    return JSON.parse(JSON.stringify({
      v: 1, mission: this.mission, started: this.started, done: this.done, obj: this.obj, flags: this.flags, facts: this.facts,
      scenes: this.scenes, branch: this.branch, queue: this.queue, journal: this.journal, tapes: this.tapes, help: this.help,
      store: this.store, ended: this.ended,
    }));
  }
  fact(k) { return this.facts[k]; }
  setFact(k, v = true) { if (this.facts[k] === v) return false; this.facts[k] = v; return true; }
  count(prefix) { let n = 0; for (const k in this.facts) if (k.startsWith(prefix) && this.facts[k]) n++; return n; }
  seen(key) { return (this.scenes[key] || 0) > 0; }
  objDone(mission, id) { return !!(this.obj[mission] && this.obj[mission][id]); }
  queueScene(key) { if (SCENES.has(key) && !this.queue.includes(key)) this.queue.push(key); }
  scenePlayed(key) {
    this.scenes[key] = (this.scenes[key] || 0) + 1;
    const i = this.queue.indexOf(key);
    if (i >= 0) this.queue.splice(i, 1);
  }
  addJournal(mission, text, day) {
    if (!text || this.journal.some((j) => j.mission === mission && j.text === text)) return;
    this.journal.push({ mission, text, day });
  }
  addTape(key) { if (!this.tapes.includes(key)) this.tapes.push(key); }
}

// One step of the mission rules. defs: { [missionId]: MissionDef }, w: the world view (see chapter1.js).
// MissionDef = { start?: [sceneKey], objectives: [{ id, text, hint?, optional?, after?: [ids], when?(st), done(w, st) }],
//               finish?: { scene?, flags?: [..], journal?, day?: "Friday" }, next?: id | null }
// `when` limits an objective to one branch of a choice: while it is false the objective is neither shown nor required.
// Returns events for the runtime: { type: "start"|"objective"|"complete"|"end", mission, id?, text? }
export function stepMissions(st, defs, w) {
  const out = [];
  if (st.ended) return out;
  const id = st.mission, def = defs[id];
  if (!def) {
    // Not playable in this build yet: the campaign waits here with the script readable in the journal
    if (!st.ended) { st.ended = true; out.push({ type: "end", mission: id }); }
    return out;
  }
  if (!st.started[id]) {
    st.started[id] = w.day;
    for (const k of def.start || []) st.queueScene(k);
    out.push({ type: "start", mission: id });
  }
  const got = st.obj[id] || (st.obj[id] = {});
  for (const o of def.objectives) {
    if (got[o.id] || !applies(o, st)) continue;
    if (o.after && !o.after.every((a) => got[a])) continue;
    if (o.done(w, st)) { got[o.id] = true; out.push({ type: "objective", mission: id, id: o.id, text: objText(o, w, st) }); }
  }
  if (def.objectives.every((o) => o.optional || got[o.id] || !applies(o, st))) out.push(...completeMission(st, defs, w));
  return out;
}

// Flags, journal and the next mission are written first; the closing scene is queued to play afterwards.
export function completeMission(st, defs, w) {
  const id = st.mission, def = defs[id] || {}, fin = def.finish || {};
  if (st.done[id]) return [];
  st.done[id] = w.day;
  const m = missionById(id);
  for (const f of [m && m.success ? successFlags(m.success) : [], fin.flags || []].flat()) st.flags[f] = true;
  const closing = fin.scene ? sceneByKey(fin.scene) : null;
  st.addJournal(id, fin.journal || (closing && closing.journal) || "", w.day);
  if (fin.scene) st.queueScene(fin.scene);
  st.mission = def.next !== undefined ? def.next || id : nextMissionId(id) || id;
  st.help = false;
  // day: a weekday name the story moves on to, or "next" (the following morning); time: 0..1 of that day
  const out = [{ type: "complete", mission: id, next: st.mission, day: fin.day || null, time: fin.time ?? null }];
  if (st.mission === id) { st.ended = true; out.push({ type: "end", mission: id }); }
  return out;
}

// "GARAGE_OPEN. The customer agrees…" → ["GARAGE_OPEN"]; "BAKERY_HELPED; FLOUR_CONTACT." → both
export function successFlags(text) {
  const head = String(text).split(/\.\s/)[0];
  return head.split(/[;,]/).map((s) => s.trim().replace(/\.$/, "")).filter((s) => /^[A-Z][A-Z0-9_]+$/.test(s));
}

const applies = (o, st) => !o.when || !!o.when(st);
export const objText = (o, w, st) => (typeof o.text === "function" ? o.text(w, st) : o.text);

// What the HUD plate and the journal show for the current mission
export function missionView(st, defs, w) {
  const id = st.mission, m = missionById(id), def = defs[id], got = st.obj[id] || {};
  const ch = chapterOf(id);
  if (!def || !m) return { id, title: m ? m.title : id, chapter: ch, playable: false, objectives: [], current: null };
  const objectives = def.objectives
    .filter((o) => applies(o, st) && (!o.after || o.after.every((a) => got[a] || !applies(def.objectives.find((x) => x.id === a) || {}, st)) || got[o.id]))
    .map((o) => ({ id: o.id, text: objText(o, w, st), done: !!got[o.id], optional: !!o.optional, hint: st.help && !got[o.id] ? o.hint || "" : "" }));
  const current = objectives.find((o) => !o.done && !o.optional) || null;
  return { id, title: m.title, chapter: ch, playable: true, objectives, current };
}
