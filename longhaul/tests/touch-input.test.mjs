// Touch → action plumbing in input.js (the on-screen controls of js/touch.js go through these). Run: node tests/touch-input.test.mjs
import assert from "node:assert";

const noop = () => {};
globalThis.document = { documentElement: { dataset: {} }, addEventListener: noop, pointerLockElement: null };
globalThis.addEventListener = noop;
const { initInput, drive, foot, took, isDown, endFrame, stick, touchDown, touchUp, touchLook, look, setLabels, bindingLabel } = await import("../js/input.js");

let mode = "drive";
initInput({ addEventListener: noop }, () => mode);

// stick: y up = throttle, x right = steer right (steer +1 is left)
stick.x = 0.5; stick.y = -1;
let d = drive();
assert.equal(d.throttle, 1); assert.equal(d.steer, -0.5);
// buttons hold actions and release exactly like keys; the axes stay in -1..1
touchDown("Touch:gas", "throttle");
assert.equal(drive().throttle, 1, "stick + pedal clamps");
touchUp("Touch:gas"); stick.x = stick.y = 0;
touchDown("Touch:brake", "brake");
assert.equal(drive().throttle, -1);
touchUp("Touch:brake");
assert.equal(drive().throttle, 0);

// a tap is an edge even if it is released before the frame reads it
touchDown("Touch:ign", "ignition"); touchUp("Touch:ign");
assert.equal(took("ignition"), true); assert.equal(took("ignition"), false);

// on foot: the stick walks, pushed to the edge it sprints
mode = "foot"; foot();
stick.x = 0; stick.y = -0.5;
let f = foot();
assert.equal(f.fwd, 0.5); assert.equal(f.sprint, false);
stick.y = -1;
assert.equal(foot().sprint, true);
stick.y = 0;
touchDown("Touch:a_use", "use");
assert.ok(foot().held.has("use") && isDown("use"));
touchUp("Touch:a_use"); endFrame();
assert.ok(!isDown("use"));

// drag to look turns the view; a mode change releases everything
const yaw = look.yaw;
touchLook(100, 0);
assert.ok(look.yaw < yaw);
touchDown("Touch:crouch", "crouch");
mode = "overlay"; endFrame();
mode = "foot";
assert.ok(!isDown("crouch"));
touchDown("Touch:x", "jump"); mode = "none"; assert.equal(took("jump"), false);

// prompts name the touch buttons while they show
setLabels({ ignition: "Key" });
assert.equal(bindingLabel("ignition"), "Key");
setLabels(null);
assert.equal(bindingLabel("ignition"), "K");
console.log("touch input ok");
