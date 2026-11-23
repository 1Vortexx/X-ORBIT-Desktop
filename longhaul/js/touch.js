// Long Haul – on-screen touch controls (phones and tablets).
// Everything goes through the action names of input.js (touchDown / touchUp / stick / touchLook), so the game never
// knows whether a key, a mouse or a thumb pressed it. Shown while the input mode is drive / foot / photo and the last
// input was a touch; a key press or a mouse click hides it again (tablets with keyboards, touchscreen laptops).
//   left 45 % of the lower screen : floating stick (walk / fly; steering only while driving)
//   anywhere else                 : drag to look
//   buttons                       : built per mode from main's view (context actions come from the HUD action list)
import { touchDown, touchUp, touchLook, stick, currentMode, setLabels } from "./input.js";

const STICK_R = 56;                 // CSS px from the centre to full deflection
const LOOK_GAIN = 1.6;              // touch drags turn faster than the mouse at the same sensitivity
const ACTION_OF_KEY = { E: "use", F: "alt", LMB: "grab", RMB: "throw" };   // HUD action rows carry key labels

let root = null, layer = null, stickEl = null, knob = null, clusters = {};
let on = false, shown = false, lastMode = "none", lastSig = "";
let stickId = null, stickO = { x: 0, y: 0 }, steerOnly = false;
const looks = new Map();             // pointerId → last { x, y }
const toggled = new Set();           // ids of latched buttons (crouch)
const pressing = new Map();         // pointerId → id of the button it holds (survives a re-render under the finger)
let more = false, lastW = 0, lastH = 0;

// Button labels by action, used by bindingLabel() in touch mode so prompts name the button to tap
export const TOUCH_LABELS = {
  ignition: "Key", recover: "Recover", exit: "Exit", talk: "Talk", use: "Use", alt: "Alt", grab: "Grab", camera: "Cam",
  sleep: "Sleep", lights: "Lights", handbrake: "Handbrake", photoExit: "Done", photoShot: "Shot", journal: "Journal",
  inventory: "Bag", map: "Map", pause: "Menu", jump: "Jump", crouch: "Crouch", throw: "Throw", stow: "Pocket",
  rotate: "Rotate", horn: "Horn", parkingBrake: "Park", gearMode: "Gearbox", radioNext: "Radio", consume: "Use item",
  flashlight: "Use item", shiftUp: "Gear +", shiftDown: "Gear −", skipLine: "Skip", throttle: "Gas", brake: "Brake",
  photo: "Photo", fwd: "Stick", back: "Stick", left: "Stick", right: "Stick", sprint: "Stick (push to the edge)",
};

export const touch = {
  get active() { return on; },

  init() {
    if (root) return;
    root = document.getElementById("touch") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "touch" }));
    root.setAttribute("aria-hidden", "true");
    root.hidden = true;
    root.innerHTML = `
      <div class="t-layer"></div>
      <div class="t-stick rest"><i></i></div>
      <div class="t-top"></div>
      <div class="t-ctx"></div>
      <div class="t-pad"></div>
      <div class="t-more" hidden></div>
      <div class="t-rotate"><p>Turn your phone sideways to play.</p><button type="button" data-dismiss>Play anyway</button></div>`;
    layer = root.querySelector(".t-layer");
    stickEl = root.querySelector(".t-stick"); knob = stickEl.firstElementChild;
    clusters = { top: root.querySelector(".t-top"), ctx: root.querySelector(".t-ctx"), pad: root.querySelector(".t-pad"), more: root.querySelector(".t-more") };
    root.querySelector("[data-dismiss]").addEventListener("click", () => document.documentElement.classList.add("lh-rotate-ok"));

    layer.addEventListener("pointerdown", layerDown);
    layer.addEventListener("pointermove", layerMove);
    layer.addEventListener("pointerup", layerUp);
    layer.addEventListener("pointercancel", layerUp);
    for (const c of Object.values(clusters)) {
      c.addEventListener("pointerdown", btnDown);
      c.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    addEventListener("pointerup", btnUp, true);
    addEventListener("pointercancel", btnUp, true);
    // Last input wins
    addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") { setOn(true); goFullscreen(e); }
      else if (e.pointerType === "mouse") setOn(false);
    }, true);
    addEventListener("keydown", (e) => { if (!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || "") && e.key !== "Unidentified") setOn(false); }, true);
    setOn(matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints > 0 && matchMedia("(hover: none)").matches));
  },

  // Once per frame. view: { actions, held, armed, slots, selected, journal, talk, manual, riding, sleeping, needRecover }
  update(view = {}) {
    if (!root) return;
    const mode = currentMode();
    const play = on && (mode === "drive" || mode === "foot" || mode === "photo");
    if (play !== shown) {
      shown = play; root.hidden = !play;
      document.documentElement.classList.toggle("lh-touch-play", play);
      if (!play) resetPointers();
    }
    if (mode !== lastMode) { lastMode = mode; toggled.clear(); more = false; resetPointers(); }
    if (stickId === null && (innerWidth !== lastW || innerHeight !== lastH)) { lastW = innerWidth; lastH = innerHeight; restStick(); }
    if (!play) return;
    const bs = buttons(mode, view);
    const sig = JSON.stringify(bs) + more;
    if (sig !== lastSig) { lastSig = sig; render(bs); }
  },
};

function setOn(v) {
  if (v === on) return;
  on = v;
  document.documentElement.classList.toggle("lh-touch", on);
  setLabels(on ? TOUCH_LABELS : null);
  if (!on && shown) { shown = false; root.hidden = true; document.documentElement.classList.remove("lh-touch-play"); resetPointers(); }
}

let fsTried = false;
function goFullscreen(e) {
  if (fsTried || document.fullscreenElement || matchMedia("(display-mode: standalone)").matches) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || "")) return;
  fsTried = true;                    // once: after that the Settings switch decides
  const el = document.documentElement;
  if (!el.requestFullscreen) return;
  el.requestFullscreen({ navigationUI: "hide" }).then(() => screen.orientation?.lock?.("landscape").catch(() => {})).catch(() => {});
}

// ── buttons ────────────────────────────────────────────────────────────────────────────────────────────────────
// b(id, action, label, opts): opts.cls (size / style), opts.latch (stays down until tapped again), opts.note, opts.off
const b = (id, action, label, o = {}) => ({ id, action, label, ...o });

function buttons(mode, v) {
  const top = [b("pause", "pause", "☰", { cls: "sq", title: "Menu" }), b("inv", "inventory", "Bag", { cls: "sq" }), b("map", "map", "Map", { cls: "sq" })];
  if (v.journal) top.push(b("journal", "journal", "Journal", { cls: "sq" }));
  if (mode !== "photo") top.push(b("photo", "photo", "Photo", { cls: "sq" }));
  const ctx = [], pad = [], extra = [];

  if (mode === "photo") {
    top.length = 0;
    top.push(b("photoExit", "photoExit", "Done", { cls: "sq" }));
    pad.push(b("photoShot", "photoShot", "Shot", { cls: "big" }), b("up", "up", "Up"), b("down", "down", "Down"), b("fast", "fast", "Fast"));
  } else if (mode === "drive" && v.sleeping) {
    pad.push(b("sleep", "sleep", "Get up", { cls: "big" }));
  } else if (mode === "drive") {
    if (!v.riding) {
      pad.push(b("gas", "throttle", "Gas", { cls: "pedal gas" }), b("brake", "brake", "Brake", { cls: "pedal" }), b("hb", "handbrake", "Handbrake", { cls: "wide" }));
      if (v.manual) pad.push(b("su", "shiftUp", "Gear +"), b("sd", "shiftDown", "Gear −"));
      ctx.push(b("ign", "ignition", "Key"), b("lights", "lights", "Lights"), b("horn", "horn", "Horn"));
      if (v.needRecover) ctx.unshift(b("recover", "recover", "Recover", { cls: "hot" }));
      if (v.talk) ctx.unshift(b("talk", "talk", "Talk", { cls: "hot" }));
    }
    ctx.push(b("exit", "exit", v.riding ? "Get out" : "Exit"), b("cam", "camera", "Cam"));
    if (!v.riding) {
      ctx.push(b("more", null, more ? "×" : "⋯", { cls: "sq" }));
      extra.push(b("park", "parkingBrake", "Park brake"), b("sleep", "sleep", "Sleep"), b("rec2", "recover", "Recover"), b("gear", "gearMode", "Gearbox"),
        b("radio", "radioNext", "Radio"), b("zin", "camZoomIn", "Zoom +"), b("zout", "camZoomOut", "Zoom −"));
    }
  } else if (mode === "foot") {
    // context actions: one button per key, the first unblocked action of it (blocked ones still tap through for the reason)
    const seen = new Set();
    for (const a of v.actions || []) {
      const action = ACTION_OF_KEY[a.key] || (/^[a-z]/.test(String(a.key)) ? a.key : null);
      if (!action || seen.has(action)) continue;
      const best = (v.actions || []).find((x) => (ACTION_OF_KEY[x.key] || x.key) === action && !x.blocked) || a;
      seen.add(action);
      ctx.push(b("a_" + action, action, best.label, { cls: best.blocked ? "act off" : "act", note: best.blocked || "" }));
    }
    if (v.held) {
      if (v.armed) { if (!seen.has("grab")) ctx.push(b("fire", "grab", "Fire", { cls: "act hot" })); ctx.push(b("reload", "rotate", "Reload")); }
      else {
        if (!seen.has("grab")) ctx.push(b("drop", "grab", "Drop"));
        ctx.push(b("throw", "throw", "Throw"), b("rotate", "rotate", "Rotate"));
      }
      ctx.push(b("stow", "stow", "Pocket"));
    }
    if (v.talk && !seen.has("use")) ctx.unshift(b("talk", "use", "Talk", { cls: "act hot" }));
    // Use item: the selected pocket (or the torch in your hands, which it switches on and off)
    const sel = v.slots && v.slots[v.selected];
    if (v.heldType === "flashlight" || (!v.held && sel && sel.type === "flashlight")) ctx.push(b("consume", "flashlight", "Use item"));
    else if (sel && !v.held) ctx.push(b("consume", "consume", "Use item"));
    pad.push(b("jump", "jump", "Jump", { cls: "big" }), b("crouch", "crouch", "Crouch", { latch: true }));
  }
  return { top, ctx, pad, extra };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function html(list) {
  return list.map((x) => `<button type="button" tabindex="-1" class="t-b ${x.cls || ""}${toggled.has(x.id) || [...pressing.values()].includes(x.id) ? " down" : ""}" data-id="${x.id}"${x.action ? ` data-action="${x.action}"` : ""}${x.latch ? " data-latch" : ""}>`
    + `<span>${esc(x.label)}</span>${x.note ? `<small>${esc(x.note)}</small>` : ""}</button>`).join("");
}
function render(bs) {
  clusters.top.innerHTML = html(bs.top);
  clusters.ctx.innerHTML = html(bs.ctx);
  clusters.pad.innerHTML = html(bs.pad);
  clusters.more.innerHTML = html(bs.extra);
  clusters.more.hidden = !more || !bs.extra.length;
  root.dataset.mode = lastMode;
}

const tid = (id) => "Touch:" + id;
function tap(action) { touchDown(tid("tap:" + action), action); setTimeout(() => touchUp(tid("tap:" + action)), 60); }

function btnDown(e) {
  const el = e.target.closest(".t-b");
  if (!el) return;
  e.preventDefault(); e.stopPropagation();
  const id = el.dataset.id, action = el.dataset.action;
  if (id === "more") { more = !more; lastSig = ""; return; }
  if (!action) return;
  if (el.hasAttribute("data-latch")) {
    if (toggled.has(id)) { toggled.delete(id); touchUp(tid(id)); el.classList.remove("down"); }
    else { toggled.add(id); touchDown(tid(id), action); el.classList.add("down"); }
    return;
  }
  el.classList.add("down");
  pressing.set(e.pointerId, id);
  touchDown(tid(id), action);
  if (el.closest(".t-more")) { more = false; lastSig = ""; }
}
function btnUp(e) {
  const id = pressing.get(e.pointerId);
  if (id === undefined) return;
  pressing.delete(e.pointerId);
  touchUp(tid(id));
  root.querySelector(`.t-b[data-id="${id}"]`)?.classList.remove("down");
}

// ── stick and look ─────────────────────────────────────────────────────────────────────────────────────────────
// Pocket controls live in the inventory drawer. Subtitles can still be tapped through this layer.
function hudTap(x, y) {
  const inside = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
  const sub = document.querySelector("#hud .subt:not([hidden])");
  if (sub && inside(sub)) { tap("skipLine"); return true; }
  return false;
}

function layerDown(e) {
  e.preventDefault();
  if (hudTap(e.clientX, e.clientY)) return;
  try { layer.setPointerCapture(e.pointerId); } catch {}
  const w = innerWidth, h = innerHeight;
  if (stickId === null && e.clientX < w * 0.45 && e.clientY > h * 0.35) {
    stickId = e.pointerId; stickO = { x: e.clientX, y: e.clientY };
    steerOnly = lastMode === "drive";
    stickEl.classList.remove("rest");
    stickEl.classList.toggle("steer", steerOnly);
    stickEl.style.transform = `translate(${stickO.x}px, ${stickO.y}px)`;
    knob.style.transform = "";
    return;
  }
  looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
}
function layerMove(e) {
  if (e.pointerId === stickId) {
    let dx = e.clientX - stickO.x, dy = steerOnly ? 0 : e.clientY - stickO.y;
    const len = Math.hypot(dx, dy);
    if (len > STICK_R) { dx *= STICK_R / len; dy *= STICK_R / len; }
    const dead = 0.12;
    const nx = dx / STICK_R, ny = dy / STICK_R, n = Math.hypot(nx, ny);
    const k = n < dead ? 0 : (n - dead) / (1 - dead) / n;
    stick.x = nx * k; stick.y = ny * k;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    return;
  }
  const p = looks.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  touchLook(dx * LOOK_GAIN, dy * LOOK_GAIN);
}
function layerUp(e) {
  if (e.pointerId === stickId) { stickId = null; stick.x = 0; stick.y = 0; restStick(); return; }
  looks.delete(e.pointerId);
}
// Where the stick waits between touches (bottom-left, inside the area that grabs it)
function restStick() {
  stickEl.classList.add("rest");
  stickEl.classList.toggle("steer", lastMode === "drive");
  const sl = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sl")) || 0;
  stickEl.style.transform = `translate(${sl + Math.max(90, innerWidth * 0.14)}px, ${innerHeight - Math.max(90, innerHeight * 0.24)}px)`;
  knob.style.transform = "";
}
function resetPointers() {
  stickId = null; stick.x = 0; stick.y = 0; looks.clear();
  for (const id of pressing.values()) touchUp(tid(id));
  pressing.clear();
  if (stickEl) restStick();
  if (!root) return;
  for (const el of root.querySelectorAll(".t-b.down")) if (!el.hasAttribute("data-latch")) el.classList.remove("down");
}

