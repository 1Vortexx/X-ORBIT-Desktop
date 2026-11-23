# Prologue implementation verification - 22 November 2026

Scope: local xorbit-beta working copy. No production/main changes or deployment.

## Automated tests passed

Run from longhaul directory:

```
node tests/campaign-v2.test.mjs
node --experimental-loader ./tools/three-loader.mjs tests/campaign-v2-world.test.mjs
node --experimental-loader ./tools/three-loader.mjs tests/traffic-v2.test.mjs
```

The data/state tests cover all four missions, all twelve scene gates, per-action reload, active-search hints and independent v1/v2/free-roam storage. World tests exercise all 26 physical inspection callbacks and their readable dialogs, completing the prologue through its real action handlers; camera follow/restoration, road ground, colliders, cleanup and braking are checked. The traffic test runs real vehicle physics for a curved route, obstacle stop and all four cars with real NPC seat ownership on both highway corridors.

Existing save, vehicle (19 tests), terrain/world, NPC, legacy campaign state and legacy campaign world suites also passed. Syntax and whitespace checks passed.

## Browser observations

Headless installed Chrome, 1200 x 800, low graphics, isolated temporary profile:

- Play → The Way Back → Start prologue starts P01 in campaign2, with 26 targets and an active cinematic.
- Cal moved from z=185.4117 to 185.8017 while the camera moved from z=175.4117 to 182.1097 during a follow track.
- All 26 readable object dialogs completed P01-P04; the resulting schema-2 save resumed with all four completion flags intact.
- No uncaught runtime errors were observed.
- Initial traffic test exposed a driver boarding issue. Ambient drivers now spawn already seated offscreen; the final integrated NPC/vehicle test verifies all four remain seated while driving and dispose cleanly.
- Road instancing reduced observed draw calls from 1,421 to 891 and geometries from 1,100 to 287 in the compared test area. Software-rendered FPS was 10; that is not a hardware/Chromebook performance certification.

Browser progression used test-only relocation between objective locations. A full manual driving, gamepad/touch and target-device playthrough remains required. No claim is made about three hours of actual prologue playtime or final bespoke cinematic animation/art. See HANDOFF.md for the remaining production work and next chapter.

## Opening/cinema refinement

`node --experimental-loader ./tools/three-loader.mjs tests/cinematics-v2.test.mjs` passes: storyboard duration, verified credits, equivalent poses at 30/120 Hz, concealed geographical cuts, reduced-motion stillness, fade-out completion, FOV restoration and saved opening position.

Updated world test passes all 26 mission checks plus the separate physical school-door gate, verifies no radius auto-start, plays all twelve scene gates with exit/arrival fades, and completes every prologue mission. Traffic and state suites remain passing.

Chrome inspection of the revised opening verified walking residents, credits, school arrival, `NO_AUTOSTART true`, `ENTER true`, first classroom dialogue, no uncaught errors, FOV 70 and input unlocked after skip. Fresh startup/explicit restart shows the montage; existing completed progress is retained. Selected scene keyframes were sought for visual review; this is not a manual performance certification or an assertion about final bespoke character animation.
