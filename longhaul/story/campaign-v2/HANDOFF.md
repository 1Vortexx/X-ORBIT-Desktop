# Long Haul campaign v2 - resume ledger

Edition: 2.0 / 22 November 2026. Status: prologue P01-P04 implemented on the local beta branch; chapters M01-M36 remain NOT_IMPLEMENTED.

## Last completed work

### Detailed buildings and reference HUD

- Beta only. `buildings.js`, `building-materials.js` and `furnishings.js` build 28 furnished interiors: school/history class/library, shops, diner, homes, guest rooms, service bays, radio offices, water offices and clinics. Windows are real glazed openings with frames/sills; homes have pitched roofs; public buildings have parapets, awnings, rainwater hardware and signs. Kitchens, bathrooms, desks/chairs, shelving, treatment beds and reception areas have distinct layouts.
- `doors.js` owns 82 real hinged leaves, including paired school/depot entries, room doors and the school map cabinet. Leaves and oriented collision move together. Doors stop before striking an occupant, resume when clear, play existing door sounds and save target/angle in `PrologueState.doors`. Seated P01 shots close the foyer leaf behind the window desks so it does not intrude between Cal and Grevyn. Detailed rails/glass/hardware are instanced within each moving hinge; global static batching must never absorb those hinges or interaction targets.
- `clues.js` attaches story interactions to recognizable books, photographs, phones, maps, terminals and furniture. Permanent evidence fixtures stay visible. Only the current interaction proxy becomes active; a requested hint can highlight it. The map cabinet must open before the papers inside are selectable.
- Authored interiors count as shelter and move a shared pair of indoor fill lights. Town street furniture and a working fuel purchase point supplement the building detail.
- HUD follows the supplied reference: charcoal glass, brass edges, ivory segmented needs, centered mission/objective, time/day/weather/money panel, lower-left objective card, centered interaction pills and dark minimap. Every displayed value comes from the normal runtime state.
- The bottom hotbar DOM is removed. Six real pockets appear only in the inventory drawer. Tap I (or Tab) to toggle; hold to peek until release. `ui/inventory-gesture.js` owns the physical release across the gameplay/menu mode change and uses event timestamps. Blur cancels the held gesture while leaving the paused drawer visible. Current remapped bindings, typing and OS shortcuts are respected. Touch uses its existing Inventory button.
- The drawer supports selection, consumable use, taking items into hands, stowing and dropping one item, with the existing vehicle/journey tabs. Number shortcuts remain available. Split/rotate controls are not shown because they are not pocket actions.
- Chrome verified native tap/toggle and hold/release, six-pocket rendering, selection/use/hands/stow/drop, all tabs, actual E interaction with the school double doors, the real window-seat action starting P01.A with inventory locked during film, and 390x844 / 1024x600 drawer bounds. Health/money were compared with the real model. No uncaught browser errors. Test screenshots freeze repeat 3D rendering while checking the paused overlay to avoid software-GPU queue delays; live door/room views render normally before capture.
- Current observed school view after door batching: approximately 2,800 draw calls including the expanded town population and classroom cast. The older 509-call observation below predates these additions. Target-device profiling and further character/world batching remain necessary; this is not a Chromebook performance certification.

### Opening and cinema refinement

- New-game opening is a saved, resumable 100-second continuous Westhaven camera move, timed to Prologue swell: walking sidewalk residents, existing creator/contributor credits, an 80-second logo entrance and a final fade before school control. `direction.js` is authoritative for timing.
- The first school scene requires the physical classroom-door interaction. Ordinary later scenes require their authored interaction objects. Merely standing within 45 m never starts a scene. Only closing beats already authorized by the player's preceding action can advance automatically after a short settling period.
- `direction.js` owns all twelve scene entry points, dates, local actor marks, safe camera compositions and actual walking paths. `cinematics.js` evaluates smooth absolute poses and conceals geographical cuts behind fades. It no longer snaps between a generic follow/object/wide view every four/seven seconds.
- `film.js` owns credits, letterbox, date/title cards and fade overlay. Dialogue has a quiet subtitle treatment. No camera mode is restored until the exit fade covers it. Chapter relocations occur under a separate three-second transition, with a persisted recovery flag.
- Residents keep walking during the opening. Town sidewalks/crossings are visible. Static buildings are instanced; physics colliders and raycast occluders remain separate and functional.
- Chrome verified moving residents, readable credits, intro completion, no radius auto-start, successful school-door action, first dialogue, skipped-scene completion, restored FOV 70 and unlocked input, with no uncaught runtime errors. Observed school-handoff frame: 509 draw calls / 201 geometries in software-rendered Chrome. This is not a hardware FPS guarantee.


- Separate Play → The Way Back → Start/Continue prologue. Existing The Return Trip and free-roam saves are retained.
- P01-P04: 26 physical inspectable objectives, twelve scripted scenes and complete prologue dialogue from the edition-2 master.
- Authored per-scene camera tracks, visible Cal body, actor blocking, input ownership/restore, line advance, held skip, mouse/touch buttons, reduced-motion views and reversible scene times.
- Journal/HUD, 45-second active-search hints, on-request visible paper highlight, transactional evidence, per-stage/scene checkpoints and versioned v2 saves.
- Off-highway Westhaven and Drywell: street grids, twelve public/residential buildings each, enterable interiors, supply counters, residents and signs. Highway 9 runs alongside the original highway and has four connecting roads.
- Up to four local civilian cars on both highway corridors. Normal vehicle physics, real NPCs already seated at offscreen spawn, obstacle braking, bounded spawn/despawn, transient traffic excluded from saves. Instanced road surfaces reduce draw calls.

## Verification

- `node tests/inventory-gesture.test.mjs`: tap/hold/release, repeats, mode changes, Escape, focus loss, typing/modifiers and remapped bindings.
- `node --experimental-loader ./tools/three-loader.mjs tests/buildings-v2.test.mjs`: all building types, door open/closed clearance, live hinge batching, occupant safety, sounds, save/restore and cleanup.
- `node tests/campaign-v2.test.mjs`: all four missions, all twelve scene gates, reload after every action, hint timing/visibility, legacy/free-roam save isolation.
- `node --experimental-loader ./tools/three-loader.mjs tests/campaign-v2-world.test.mjs`: all 26 real world inspection callbacks, readable dialogs, complete prologue, cleanup, camera follow/FOV restoration, town colliders and traffic braking.
- `node --experimental-loader ./tools/three-loader.mjs tests/traffic-v2.test.mjs`: civilian sedan travels more than 80 m on a curved route and stops for an obstacle using real physics; all four ambient drivers retain real seats on both highways and clean up correctly.
- Existing save, vehicle (19 cases), world, NPC, legacy campaign state and legacy campaign world tests passed.
- Headless Chrome: actual Play menu/start, all 26 inspection dialogs, P01-P04 completion and save/resume, moving camera/player trace, highway cars running and moving, no runtime errors. Test-only relocation was used between objective locations; this is not an end-to-end manual driving-duration measurement.

## Scope and known production work

- The prologue uses a compact approximately 3.2 km authored road region instead of the guide's proposed negative-kilometre anchors. Westhaven school is at route z=200, depot z=1100, Drywell z=2600 and clinic z=2850. `makePlan()` is authoritative for this chapter. Other chapters are still design-only.
- Buildings now have detailed procedural architecture and room-specific furnishings; they are still stylized procedural art rather than final authored art assets. All twelve scenes now have individual compositions and blocking; final character art, bespoke gestures and some rescue animation beats remain production work. The shot/injury beats use existing animation, dialogue and a safe scripted health change; bespoke drag/rescue animations and final evacuation effects remain production work.
- Original campaign score files and recorded actors are not supplied. Browser speech/subtitles provide dialogue; campaign music falls back to silence. No menu tracks are silently reused as campaign score.
- Test machine used software-rendered headless Chrome; do not treat its FPS as Chromebook certification. Road surfaces have been instanced (891 draw calls / 287 geometries in the observed test frame, down from 1,421 / 1,100 before road batching); further town/terrain performance and a manual keyboard/gamepad/touch playthrough are still needed before a release-quality claim.
- No main/production files were edited. No deployment or push was performed.

## Next exact task

1. Manually play the prologue from the Play menu, including the two highway choices and final-call route; record usability and target-device performance.
2. Refine bespoke prologue shots/acting and final art as assets arrive, without changing stable dialogue IDs.
3. Implement Chapter 1 M01-M03 using these v2 state, scene, hint and road contracts. Add stage rules and objects explicitly; do not unlock further chapters from a timer or mark them verified because the scripts exist.
4. Extend the road graph and settlements for the next chapter rather than regenerating or relocating existing prologue sites/saves.

## Decisions supplied by this draft, review before recording lock

- Campaign subtitle The Way Back; Dominion working name for evil force.
- Supporting role names and voice casting, suggested pronunciations.
- Emergency survival value 65%, reserve 6, activation cost 2, threshold 4, three optional capacitor recoveries.
- Authored site distances/layouts, route budget 43 hours and all original cue titles.

Established relationship, betrayal, regime, Paste and ending canon must remain consistent with the production bible. These production choices can be tuned without changing that canon; update dialogue if the spoken emergency percentage changes.

## Asset requests still open

Approved original campaign score/stems; dry actor recordings; final field/electrical/medical Foley where procedural audio is insufficient; authored character likenesses and final site art. No new audio has been requested from anyone or downloaded by this task.

## Session log

| Date | Scope | Verification | Next step |
|---|---|---|---|
| 2026-11-22 | Prologue runtime, towns, second highway, traffic | State/world/physics tests and Chrome flow | Manual prologue review, then Chapter 1 |
| 2026-11-22 | Detailed interiors/doors/evidence and reference HUD with I drawer | Building/state/world/camera/traffic/input/item/save tests; Chrome UI/actions/doors/seat gate and responsive bounds | Target-device performance and full manual prologue review |

## Mission implementation ledger

| ID | Mission | State | Implementation reference / actual test result |
|---|---|---|---|
| P01 | The Window Seat | VERIFIED (automated flow) | js/campaign/v2; state/world/browser checks; production caveats above |
| P02 | In Service | VERIFIED (automated flow) | js/campaign/v2; state/world/browser checks; production caveats above |
| P03 | Save Me the Window Seat | VERIFIED (automated flow) | js/campaign/v2; state/world/browser checks; production caveats above |
| P04 | The Second Road | VERIFIED (automated flow) | js/campaign/v2; state/world/browser checks; production caveats above |
| M01 | Another Delivery | NOT_IMPLEMENTED | No v2 runtime yet |
| M02 | Cal | NOT_IMPLEMENTED | No v2 runtime yet |
| M03 | Check the Source | NOT_IMPLEMENTED | No v2 runtime yet |
| M04 | Safe Passage | NOT_IMPLEMENTED | No v2 runtime yet |
| M05 | The Price of Help | NOT_IMPLEMENTED | No v2 runtime yet |
| M06 | The Wrong Story | NOT_IMPLEMENTED | No v2 runtime yet |
| M07 | His Name on the Page | NOT_IMPLEMENTED | No v2 runtime yet |
| M08 | What the Recording Says | NOT_IMPLEMENTED | No v2 runtime yet |
| M09 | Where They Found Him | NOT_IMPLEMENTED | No v2 runtime yet |
| M10 | Refuge | NOT_IMPLEMENTED | No v2 runtime yet |
| M11 | Treatment | NOT_IMPLEMENTED | No v2 runtime yet |
| M12 | Something She Hid | NOT_IMPLEMENTED | No v2 runtime yet |
| M13 | Golghis | NOT_IMPLEMENTED | No v2 runtime yet |
| M14 | The Missing Work | NOT_IMPLEMENTED | No v2 runtime yet |
| M15 | Someone Who Can Read It | NOT_IMPLEMENTED | No v2 runtime yet |
| M16 | Cargo Worth Taking | NOT_IMPLEMENTED | No v2 runtime yet |
| M17 | The Warning | NOT_IMPLEMENTED | No v2 runtime yet |
| M18 | Abandoned | NOT_IMPLEMENTED | No v2 runtime yet |
| M19 | Intake | NOT_IMPLEMENTED | No v2 runtime yet |
| M20 | The Hole in the Wall | NOT_IMPLEMENTED | No v2 runtime yet |
| M21 | Bring Someone With You | NOT_IMPLEMENTED | No v2 runtime yet |
| M22 | The Catalyst | NOT_IMPLEMENTED | No v2 runtime yet |
| M23 | What the Road Gives | NOT_IMPLEMENTED | No v2 runtime yet |
| M24 | Finish Her Work | NOT_IMPLEMENTED | No v2 runtime yet |
| M25 | The First Prison | NOT_IMPLEMENTED | No v2 runtime yet |
| M26 | The Bargain | NOT_IMPLEMENTED | No v2 runtime yet |
| M27 | Terms of the Rescue | NOT_IMPLEMENTED | No v2 runtime yet |
| M28 | The Regime's Future | NOT_IMPLEMENTED | No v2 runtime yet |
| M29 | You Never Came Back | NOT_IMPLEMENTED | No v2 runtime yet |
| M30 | The Informer | NOT_IMPLEMENTED | No v2 runtime yet |
| M31 | Break the Connection | NOT_IMPLEMENTED | No v2 runtime yet |
| M32 | The Passenger | NOT_IMPLEMENTED | No v2 runtime yet |
| M33 | The Longest Drive | NOT_IMPLEMENTED | No v2 runtime yet |
| M34 | Containment | NOT_IMPLEMENTED | No v2 runtime yet |
| M35 | The Severing | NOT_IMPLEMENTED | No v2 runtime yet |
| M36 | What Comes After | NOT_IMPLEMENTED | No v2 runtime yet |
