// Physical-key ownership survives the input mode change when the drawer opens.
// A tap toggles; holding a newly opened drawer makes it a temporary peek.
export class InventoryGesture {
  constructor(holdMs = 300) { this.holdMs = holdMs; this.active = null; }
  down(code, now, isOpen) {
    if (this.active) return null;
    this.active = { code, at: now, opened: !isOpen };
    return isOpen ? "close" : "open";
  }
  up(code, now, isOpen) {
    const a = this.active;
    if (!a || a.code !== code) return null;
    this.active = null;
    return a.opened && isOpen && now - a.at >= this.holdMs ? "close" : null;
  }
  cancel(isOpen) {
    const close = this.active?.opened && isOpen;
    this.active = null;
    return close ? "close" : null;
  }
}

export function installInventoryGesture({ keys, canOpen, isOpen, open, close, surface = window }) {
  const gesture = new InventoryGesture();
  const at = e => Number.isFinite(e.timeStamp) ? e.timeStamp : performance.now();
  const act = a => { if (a === "open") open(); else if (a === "close") close(); };
  const stop = e => { e.preventDefault(); e.stopImmediatePropagation(); };
  const down = e => {
    const t = e.target;
    if (e.metaKey || e.ctrlKey || e.altKey || t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName || "")) return;
    if (!keys().includes(e.code) || (!canOpen() && !isOpen())) return;
    stop(e);
    if (!e.repeat) act(gesture.down(e.code, at(e), isOpen()));
  };
  const up = e => {
    if (gesture.active?.code !== e.code) return;
    stop(e);
    act(gesture.up(e.code, at(e), isOpen()));
  };
  // Keep the paused drawer on focus loss; closing it here would resume gameplay
  // in the background after main's blur/pause listener has already run.
  const blur = () => gesture.cancel(false);
  // Window capture precedes the menu's document capture handler. No second toggle
  // or lost keyup occurs when gameplay releases its normal held-action set.
  surface.addEventListener("keydown", down, true);
  surface.addEventListener("keyup", up, true);
  surface.addEventListener("blur", blur);
  return () => {
    surface.removeEventListener("keydown", down, true);
    surface.removeEventListener("keyup", up, true);
    surface.removeEventListener("blur", blur);
    gesture.cancel(false);
  };
}
