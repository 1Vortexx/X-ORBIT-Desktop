import assert from 'node:assert/strict';
import { InventoryGesture, installInventoryGesture } from '../js/ui/inventory-gesture.js';
const g = new InventoryGesture();
assert.equal(g.down('KeyI', 0, false), 'open');
assert.equal(g.down('KeyI', 50, true), null, 'repeat must not toggle');
assert.equal(g.up('KeyI', 100, true), null, 'tap leaves drawer open');
assert.equal(g.down('KeyI', 200, true), 'close');
assert.equal(g.up('KeyI', 900, false), null, 'holding a close never reopens');
assert.equal(g.down('KeyI', 1000, false), 'open');
assert.equal(g.up('KeyQ', 1350, true), null, 'unrelated keyup leaves ownership intact');
assert.equal(g.up('KeyI', 1400, true), 'close', 'hold closes on physical release');
g.down('KeyI', 2000, false);
assert.equal(g.up('KeyI', 2500, false), null, 'Escape may already have closed it');
g.down('KeyI', 3000, false);
assert.equal(g.cancel(true), 'close', 'blur cancels a peek');
assert.equal(g.active, null);

// The integration must handle the same keyup even after opening changes the input mode.
const listeners = new Map(), surface = {
  addEventListener: (n, f) => listeners.set(n, f),
  removeEventListener: n => listeners.delete(n),
};
let open = false, allowed = true, opens = 0, closes = 0, key = 'KeyI';
const uninstall = installInventoryGesture({ surface, keys: () => [key], canOpen: () => allowed,
  isOpen: () => open, open: () => { open = true; allowed = false; opens++; },
  close: () => { open = false; allowed = true; closes++; },
});
const event = (code, extra = {}) => ({ code, target: {tagName: 'CANVAS'}, preventDefault() {this.stopped = true;}, stopImmediatePropagation() {}, ...extra });
let e = event('KeyI', {ctrlKey: true}); listeners.get('keydown')(e); assert(!e.stopped);
e = event('KeyI', {target: {tagName: 'TEXTAREA'}}); listeners.get('keydown')(e); assert(!e.stopped);
e = event('KeyI'); listeners.get('keydown')(e); assert(e.stopped && open);
listeners.get('keyup')(event('KeyI')); assert(open, 'tap survives mode clearing');
listeners.get('keydown')(event('KeyI')); assert(!open);
listeners.get('keyup')(event('KeyI')); assert.equal(closes, 1);
key = 'KeyB'; listeners.get('keydown')(event('KeyI')); assert(!open, 'respects current bindings');
listeners.get('keydown')(event('KeyB')); assert(open);
listeners.get('blur')(); assert(open, 'focus loss leaves the paused drawer visible instead of resuming in the background'); assert.equal(opens, 2);
listeners.get('keyup')(event('KeyB')); assert(open, 'stale release after focus loss cannot close it');
uninstall(); assert.equal(listeners.size, 0);
console.log('inventory gesture: toggle, hold/release, repeats, mode changes, Escape, blur, typing, modifiers and remapped bindings pass');
