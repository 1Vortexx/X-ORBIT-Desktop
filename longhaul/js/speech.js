// Long Haul – character voices: the browser's own text-to-speech (Web Speech API), one consistent voice per person.
// A recorded take (audio/voice/<line id>.mp3) always wins; this is for every line that hasn't been recorded yet.
// Each character gets a voice of their gender from what the system offers (better "Enhanced"/"Premium" voices first),
// spread so two people rarely share one, with pitch and pace from their age and the line's acting direction.
import { castOf } from "./cast.js";

// Known system voices by gender (macOS, Windows, Chrome), matched on the voice's own first name. Men are listed deepest
// first, so the lower voices go to the men of the cast before the lighter ones.
const MEN = ["daniel", "arthur", "gordon", "aaron", "ralph", "reed", "rocko", "tom", "evan", "nathan", "oliver", "lee", "rishi",
  "david", "mark", "guy", "christopher", "roger", "brian", "eric", "andrew", "steffan", "ryan", "george", "thomas", "james", "eddy", "alex", "fred"];
const WOMEN = ["samantha", "karen", "moira", "tessa", "fiona", "allison", "ava", "susan", "victoria", "kate", "serena", "martha",
  "catherine", "zoe", "nicky", "joelle", "veena", "kathy", "vicki", "flo", "sandy", "shelley", "zira", "hazel", "aria", "jenny",
  "michelle", "emma", "libby", "sonia", "natasha", "clara", "sonia", "jessa", "ana"].filter((n) => n !== "ana");   // (Ana is a child's voice)
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|grandma|grandpa|junior/i;
// "Microsoft David - English (United States)", "Daniel (Enhanced)", "Google UK English Female" → "m" | "f" | null
function genderOf(v) {
  const n = v.name.toLowerCase();
  if (/google/.test(n)) return /female/.test(n) ? "f" : /\bmale/.test(n) ? "m" : /us english/.test(n) ? "f" : null;
  const first = n.replace(/^(microsoft|apple)\s+/, "").split(/[\s(\-]/)[0];
  return MEN.includes(first) ? "m" : WOMEN.includes(first) ? "f" : null;
}
const depth = (v) => { const i = MEN.indexOf(v.name.toLowerCase().replace(/^(microsoft|apple)\s+/, "").split(/[\s(\-]/)[0]); return i < 0 ? MEN.length : i; };
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };

export class Speech {
  // getVolume(): 0..1 (master × character voices; 0 = silent)
  constructor(getVolume) {
    this.getVolume = getVolume;
    this.synth = typeof speechSynthesis !== "undefined" ? speechSynthesis : null;
    this.pool = { f: [], m: [] };
    this.assigned = new Map();
    this.current = null;
    if (!this.synth) return;
    const load = () => this.loadVoices();
    load();
    this.synth.addEventListener?.("voiceschanged", load);
  }
  get available() { return !!this.synth && (this.pool.f.length + this.pool.m.length) > 0; }
  loadVoices() {
    const all = this.synth.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang) && !NOVELTY.test(v.name));
    const quality = (v) => (/premium/i.test(v.name) ? 0 : /enhanced|natural|neural|online/i.test(v.name) ? 1 : 2);
    const f = all.filter((v) => genderOf(v) === "f").sort((x, y) => quality(x) - quality(y));
    // men: better quality first, and within that the deeper voices
    const m = all.filter((v) => genderOf(v) === "m").sort((x, y) => quality(x) - quality(y) || depth(x) - depth(y));
    // A missing gender borrows an unclassified voice and makes up the difference with pitch (see voiceFor)
    const rest = all.filter((v) => !genderOf(v));
    this.pool = { f: f.length ? f : rest, m: m.length ? m : rest };
    this.borrowed = { f: !f.length, m: !m.length };
    this.assigned.clear();
  }
  // The same voice and timbre for a person every time they speak
  voiceFor(name) {
    let a = this.assigned.get(name);
    if (a) return a;
    const c = castOf(name), pool = this.pool[c.g] || [];
    // the best few voices go round the cast first; a hash keeps the choice stable between sessions
    const best = pool.slice(0, Math.max(1, Math.min(pool.length, 4)));
    const used = [...this.assigned.values()].filter((x) => x.g === c.g).map((x) => x.voice);
    const free = best.filter((v) => !used.includes(v));
    const h = hash(name);
    const voice = (free.length ? free : best)[h % (free.length || best.length || 1)] || null;
    const old = Math.max(0, (c.age - 50) / 30);
    const jitter = ((h >>> 8) % 100) / 100 - 0.5;            // two people on the same voice still sound different
    const borrowed = this.borrowed && this.borrowed[c.g];
    a = {
      g: c.g, voice,
      // men pitched down into a deeper register, women kept clear of it
      pitch: c.g === "m" ? (borrowed ? 0.62 : 0.8) + jitter * 0.1 - old * 0.08 : (borrowed ? 1.3 : 1.08) + jitter * 0.1 - old * 0.06,
      rate: 1.0 + ((h >>> 16) % 100) / 100 * 0.1 - 0.05 - old * 0.12 - (c.g === "m" ? 0.03 : 0),
    };
    this.assigned.set(name, a);
    return a;
  }
  // dir: the script's acting direction ("quiet", "firm; angry"…) nudges pace, pitch and loudness
  speak(name, text, dir = "") {
    if (!this.synth) return false;
    const vol = this.getVolume();
    this.stop();
    if (vol <= 0 || !this.available) return false;
    const a = this.voiceFor(name), u = new SpeechSynthesisUtterance(String(text).replace(/—/g, ", ").replace(/–/g, ", "));
    let rate = a.rate, pitch = a.pitch, loud = 1;
    const d = String(dir).toLowerCase();
    if (/quiet|soft|low|gentle|whisper|ashamed|wounded|after a pause|tentative/.test(d)) { rate *= 0.92; loud = 0.75; pitch *= 0.98; }
    if (/firm|angry|anger|shout|urgent|insistent|hard|frustrated/.test(d)) { rate *= 1.07; pitch *= 1.03; }
    if (/dry|deadpan|plain|flat|matter-of-fact/.test(d)) pitch *= 0.97;
    if (/delighted|laugh|light|amused|warm|grinning/.test(d)) pitch *= 1.04;
    if (a.voice) { u.voice = a.voice; u.lang = a.voice.lang; }
    u.rate = Math.max(0.6, Math.min(1.4, rate)); u.pitch = Math.max(0.5, Math.min(1.6, pitch)); u.volume = Math.min(1, vol * loud);
    const me = { u, done: false };
    u.onend = u.onerror = () => { me.done = true; };
    this.current = me;
    this.synth.speak(u);
    return true;
  }
  get speaking() { return !!this.current && !this.current.done; }
  stop() {
    if (this.current) this.current.done = true;
    this.current = null;
    if (this.synth && (this.synth.speaking || this.synth.pending)) this.synth.cancel();
  }
}
