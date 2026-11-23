# Long Haul - The Way Back: campaign implementation and handoff

Edition 2.0 / 22 November 2026. Status: P01-P04 first playable implementation complete on local beta; M01-M36 remain design-only. See story/campaign-v2/HANDOFF.md for verified behavior and production limitations. All coordinates, new module names, lighting values, score requests and balance values below are implementation specifications, not claims about the current build. Use the handoff ledger to record verified implementation as work proceeds.

## Start here when resuming

Read this guide, `ARCHITECTURE.md` sections 2, 3, 15 and 16, `story/campaign-v2/00-production-bible.md`, the mission being implemented and the matching dialogue JSON. Check the current working tree before editing. It contains unrelated work and playable legacy campaign modules. Do not reset, overwrite or stage unrelated files. Work in beta; production and main are outside this request. Publishing, regenerating the old runtime script and migrating existing saves are separate implementation tasks, not done by this documentation delivery.

The editable narrative source is `source/campaign_source.py` in the script package; the repository mirror has the generated master, cast, recording manifest and `campaign_data.json`. The package generator is deterministic and rebuilds PDFs, TXT, CSV and this guide from one source. Change the source, rebuild, validate and copy the mirror together. Freeze a recording edition before changing locked dialogue. See `HANDOFF.md` for the last verified state and first implementation task.

## Verified existing integration points

- `js/main.js` owns boot, the play state, fixed 1/120 s simulation, campaign creation, updates, checkpoint events and camera selection. It creates `Campaign` with world, people, vehicles, props, interaction, say/dialogue, fade, time and player hooks. Extend the context deliberately; never run two camera writers in one frame.
- `js/campaign/index.js` currently plays The Return Trip, importing legacy `SCRIPT` and chapter rules/worlds 1-4. It has `Campaign.target()` and an objective `Marker`. `kit.js` supplies ChapterWorld helpers for presence, rides, handoffs, targets and chapter hooks. These are reusable patterns, not the new story already implemented.
- `js/campaign/state.js` is pure progress state. Existing objectives latch, rewards and flags commit before queued closing scenes, and queue state survives reload. Preserve these properties in a new schema.
- `tools/build-campaign.mjs` parses the old Markdown syntax and generates old `js/campaign/script.js`. LH2 IDs and the new JSON are deliberately separate. Do not feed the replacement master into this old parser or replace SCRIPT until a v2 runtime exists.
- `js/camera.js` has cab, chase, foot and menu handling. It has no dedicated campaign cinematic track manager. A new sequencer and sole-writer arbitration are required.
- `js/music.js` currently loads `audio/music/manifest.json` and has menu/radio playlists with a 1.4 s fade. A campaign score bus/stem controller does not exist. The cue list below is an asset request.
- `js/sky.js` uses `sky.time` (day fraction), a 1,200-second day, sun/hemi lighting and fog/environment generation. A scene-lighting override stack is proposed below. Do not assign a new independent sun in each mission.
- `js/core/origin.js`, terrain `heightAt`, core colliders/targets, NPC rigs/pose, vehicle physics and seat management remain shared engine contracts. All simulation positions are absolute doubles; camera under worldRoot also takes absolute positions. Render-space ray hits require `toWorld()`.
- Existing campaign speech has subtitle/recorded-take fallback and browser speech through `js/speech.js`/`js/cast.js`. Add new cast and IDs only with edition-aware routing; old recorded files remain valid for old SCRIPT.

## Runtime modules to add, in this order

1. `js/campaign/v2/data.js`: validated loading/lookup of the mirrored JSON, no DOM. Validate 40 unique missions, scene/line uniqueness, known speakers and conditions.
2. `js/campaign/v2/state.js`: schema 2; pure stage predicates, transactional item/evidence rewards, queued scenes, route consent and persistent outcome. Unit test this before constructing meshes.
3. `js/campaign/v2/sites.js`: deterministic authored anchors, flattened terrain patches, colliders, ramps and protected mission props. Do not reuse random settlement IDs.
4. `js/campaign/v2/cinematics.js`: shot evaluation, focus targets, safe scene gating, skip summaries and camera ownership. Connect through a new explicit main/CameraRig handoff.
5. `js/campaign/v2/hints.js`: evidence-aware, visible-object hints with cooldowns and settings. Existing beam markers should be replaced or limited for these missions.
6. `js/campaign/v2/lighting.js` and `score.js`: reversible environment overrides and local score transport; include silence fallback until approved audio is supplied.
7. `js/campaign/v2/worlds/prologue.js`, `act1.js` through `act11.js`: local geometry/people and interactions, reporting facts to pure rules. Start with P01-P04; deliver one complete vertical slice before extending all chapters.
8. `js/campaign/v2/index.js`: adapter used by main only after P01-M03 can be started, saved, reloaded, skipped and completed end to end. Gate v2 behind a separate menu label while legacy remains available.

Do not create forty independent loops, scene-wide light managers or one-off save keys. Keep mission content data-driven; per-mission special handlers are allowed for the fixed shot, staged capture, cell breach, levitation and severing.

## Save and progress contract

New storage keys: `longhaul-campaign-v2`, `longhaul-campaign-v2-checkpoint`. Never read v1 as v2 or overwrite free-roam. Add a copy/export option for legacy saves. Save header: `{schema:2, edition:'2.0', seed:19112112, missionId, stageId, absoluteTime, world, crew, story}`. The old seed is a proposed reuse for engine consistency, not proof the proposed sites already fit its terrain.

`story` contains `done`, `facts`, `evidence`, `queue`, `sceneSeen`, `transactions`, `choices`, `readiness`, `consent`, `reserve`, `capacitors`, `emergencyDraw`, `outcome`. Scene queue entries have stable IDs and phase cursors. Evidence entries preserve source, version, timestamp and custody. Private notes and victim names are separate from broadcastable facts. A fact never becomes true merely because an audience-only shot showed it.

Mission stages are `MISSION.s1`, `.s2`, `.s3`; each can be not_started, active or complete. Stages latch. Completing a stage writes facts, next-stage pointer and transaction ID atomically before reward or queued presentation. Repeat load cannot duplicate cargo, charge reserve, kill Riped again or draw survival again. Save at safe site arrival, each stage completion, capture, extraction, before final consent and immediately after outcome resolution. On reload, restore world and cast before starting any queued shot.

For ordinary missions, A is entry at a safe interaction, B follows s1 completion, C follows s2 completion, and C plus s3 completion finishes the mission. Gate each to safe speed and no active incoming damage. Special scene gates override this rule: M30 A release, B confession, C death, D fall/lucid interval, E renewed control; M35 A consent, B procedure, then exactly one of C survival/D transfer/E failure; M36 A/B audience aftermath, C only survivors' conversation, then D together/E separate/F Cal memorial/G Grevyn memorial. The remaining branch-only scenes are marked skipped_by_condition, never left blocking the queue.

Branch labels in directions are editorial predicates, not existing JavaScript. Normalize to an explicit condition AST before gameplay integration. ANSWER/HELP, REPAIR/PAY/DETOUR, PERSONAL/defer, FULL/FAST, COMPLETE/INCOMPLETE, FORGIVE/COOPERATE/DISTRUST, PREPARED/UNPREPARED, EMERGENCY, TRANSFER, SURVIVE, FAILURE, TOGETHER and SEPARATE have distinct meanings. `SURVIVE` is either prepared or emergency survival. `TRANSFER` is Grevyn alive, Cal dead. `FAILURE` is emergency failure. Never play both choice alternatives as consecutive Cal lines. Slash/or conditions are OR, not new branch keys. Actor scripts include all alternatives for recording.

## Readiness and ending algorithm

Initial Road Force reserve = 6. Mandatory catalyst activation costs 2, once on success. Optional physical interventions cost 1 each after explicit approval; reserve may never fall below 1 before final severing. Decline and offer a mechanical route if the charge would cross that floor. The dialogue-only signal relay has no physical-intervention charge. Meter values persist, and contextual descriptions weaken with reserve. Three salvageable/tested reserve capacitors each add 1 effective capacity without restoring the entity itself.

Planned readiness = corrected research complete AND Sable review AND verified Golghis AND stable body support AND tested containment AND effective capacity at least 4 AND informed Grevyn consent. Effective capacity = reserve + tested capacitors. Full preparation always makes both survive. No affinity score, hidden trauma check, dialogue tone or early resource choice overrides this.

If incomplete, list each unmet condition and a recovery task. The final room never closes recovery routes. Emergency attempt requires stable minimum bodily support, functional containment, living Road Force and explicit risk consent; missing knowledge/verification is what makes it risky. Proposed chance = 0.65. Display and speak it before selection. Draw a secure/random value once only after committing EMERGENCY and save it with the route; survival iff draw < 0.65. Test with injected draws, never by rerunning a live save. Do not reroll when a QTE fails: there are no fatal QTEs.

TRANSFER requires stable body support and an explicit separate fatality confirmation from Cal after alternatives are visible. It deterministically saves Grevyn, kills Cal and consumes Road Force. Decline/cancel returns to readiness. If body support is missing, repair it first; do not offer an allegedly saving sacrifice that secretly kills both. All completed severings consume Road Force; emergency failure kills Grevyn despite breaking the bond. The failing route's medical collapse, not an avoidable button error, is the cause stated by Sable.

Post-survival conversation determines TOGETHER or SEPARATE by Cal's chosen honest answer after Grevyn states her own wishes. It is not a romance/approval calculation. Persist outcome before credits. Cal-death postgame is a clearly labelled pre-finale checkpoint or a future explicitly implemented alternate protagonist; never silently resurrect him.

## Opening and scene-entry implementation

The prologue now begins with the 100-second continuous `openingShots()` move in `js/campaign/v2/direction.js`, showing Westhaven's sidewalks, storefronts and walking residents before reaching the school. Verified credits come from the existing game credits: X-ORBIT Studios, 1Vortexx, Michael Lester, ZeeAnimate and $GlitzerX$. `openingSeen`/`openingTime` persist; later/completed saves do not replay the opening. The logo arrives at 80 seconds; the closing fade begins at 90 seconds. Reduced-motion holds composed still views. `direction.js` owns the exact timing.

Use `SCENE_ENTRIES`, not proximity-radius auto-start. P01.A starts only through the classroom-door target. Later regular scenes begin through the listed inspection/conversation target; closing beats tagged automatic require the prior deliberate player action plus a settling interval. Do not restore the old radius-based behavior. Camera/actor blocking and actual walk paths are per scene in `sceneDirection()`.

`Cinematics.beginTrack()` samples smooth poses, including FOV and aim, independent of frame rate. Film fades mask geographical cuts and staged actor relocations; entry titles precede dialogue by 2.8 seconds; exit fade precedes control restoration. Mission changes have a three-second fade/title/arrival sequence. `transitionPending` protects reloads during relocation. `FilmPresentation` owns letterbox/credits/cards/subtitles; the normal HUD is hidden only while the film is visible.

Buildings are instanced in local batches while their existing physics colliders stay authoritative. Merged visible meshes are registered as raycast occluders, and interactive props plus the mutable blockade stay separate. Keep this separation when adding town art. Dynamic door hinges and interactive furniture must stay separate from world-level static batches. Batch the details within a hinge only; its local transforms and live oriented collision must remain aligned. The school has real double entries, a foyer, Room 9, a library and an opening map cabinet. `doors.js` persists each leaf in the schema-2 `doors` map and checks the swing area before advancing. The normal scene gate depends on the appropriate room-door action and the window-seat target; do not restore a proximity auto-start or replace a door with a sign.

Detailed layout is authoritative in `buildings.js` / `furnishings.js` / `clues.js`: 28 interiors with real window openings, type-specific furniture and retained evidence fixtures. Keep a walkable path to every current object. Story targets use small active proxies; permanent geometry remains after inspection. Cabinet contents are not selectable through a closed leaf. The collision/camera/object checks in `buildings-v2.test.mjs` and `campaign-v2-world.test.mjs` must pass after any layout change.

Gameplay presentation follows the approved charcoal/gold HUD reference. Keep the screen's lower center clear of inventory slots. I opens the inventory drawer: tap toggles, hold peeks until release. Use real `Pockets` data/actions and current binding labels; touch opens the same drawer. Test a tap, hold/release, Escape, focus loss and the item controls after changing overlay/input code. During authored film the normal HUD remains hidden.

## Implemented prologue override

P01-P04 use `js/campaign/v2/sites.js` makePlan(): Westhaven at z=200, service depot z=1100, Drywell z=2600, clinic z=2850. Town centres are roadX(z)+420; Highway 9 is roadX(z)+280. Four connectors join the original highway to Highway 9 and town streets. This compact prologue overrides the preliminary negative-kilometre anchors below. Later chapter coordinates remain proposals. Ground grading is opt-in through world/authored.js and disabled outside v2. Roads are instanced in local 400 m batches; ambient drivers spawn in real seats offscreen; parked/entering traffic waits for its NPC driver before moving.

## Authored world and physical layout

Use a separate campaign-v2 site namespace, proposed seed 19112112. Define route origin `z0 = startSite().zRoad` at new-game binding; save z0. At each route kilometre k below, road centre is `roadX(z0 + k*1000)`. Resolve a local frame from `roadDir` and a signed shoulder offset. Local z points along the road and local x to its left, matching vehicle +z forward/+x left. Transform with the road tangent; do not assume the road is axis-aligned. Coordinates below are local metres, with y resolved from flattened site ground. Do a seed/terrain survey before locking distances. If moved for buildability, update the shared site definition, guide and marker together.

Flatten a 46 x 38 m patch for indoor sites, transition shoulder over at least 12 m, and validate vehicle grade below 8 degrees. Generic single-storey interior spans x=-12..12, z=-8..12, height 3.4 m; public entrance at (0,-8), 1.8 m clear width; rear service door at (8,12), 2 m width. No invisible second floor. Floor y = heightAt at site anchor. Register wall colliders, leave doorway gaps, and provide 1.2 m clear walking aisles/2 m stretcher paths. No floor-based prop floats or multiple ground-height functions. Workbench at (-6,3), evidence table at (0,6), radio desk at (6,3), exit marker at (8,14), parked pickup at (0,-18), medical van at (5,-18). Critical vehicles keep a 4 m approach corridor.

Local scene A assembly point (0,-3), scene B (0,4), scene C (0,8). Speaker marks distribute at 1.6 m spacing across x, facing the interaction point. Cal remains the player unless the shot temporarily stages a safe movement; never duplicate his rig. Live presence lists below are by mission, with multiple sites or scene states hiding people until appropriate. Historical/recorded/radio actors are audio only, regardless of membership; Riped is confined/offscreen in M19 and absent after M30 death; Grevyn is historical/recorded before reunion. Road/Dominion use field emitters, not generic pedestrian rigs. M36's Grandpa scene uses its own offsite audience layer.

Exception layouts:
- School: desks at x=-6,-2,2,6 and z=-2,2,6; west window at (-12,3); map cabinet (-10,8), 1.3 m high; corridor along z=-12 with timetable at (-4,-10). The memory transition curtain is a marked interaction, not a hidden teleport.
- Drywell: main checkpoint on access z=-28; service approach to west canopy x=14, z=6; destroyed span is a separate route segment 700 m away, never the route the player is meant to cross. Wound cover at (10,-4), rescue van at (15,-12).
- Ford: 22 m traversable water crossing bounded by bank markers; sample water depth/terrain first. Authored plates and collision surface replace any impassable seeded ford. Autonomous convoy stops if any vehicle occupies the next crossing block.
- Holding: public intake (0,-5), service corridor x=8 z=-4..16, Cal cell (-5,3), Riped cell (-5,9), Sable clinic (4,10), property cage (4,2), service exit (8,16). Breach opens Riped cell west wall after release. Mask removal is a saved world change, not random explosion physics.
- Reconstruction hall: 36 x 30 m, entrances (0,-15) and (14,0); Cal at (0,-9), evidence table (0,-4), Riped (-3,1), Grevyn (0,7). West/service/dais isolators at (12,-7),(-12,-1),(8,10), each behind 2.2 m grounded cover. Signs duplicate field colors. Levitation origin is Grevyn mark, max height 3 m, 5 m exclusion radius. Severe-fall injury landing (0,5) is a fixed authored event. Use deterministic animation and cut away on Riped impact; do not use comedic NPC ragdoll recovery.
- First prison: 30 x 26 m single-storey hall, 2 m ramp at (0,-13); medical platform (0,2), medical controls (-5,2), guidance desk (5,2), manual release (1,1), clamps (-4,5),(4,5),(0,-2), capacitors (-8,8),(-8,10),(-8,12). Stretcher can pass from entrance to platform with 2 m clearance. Remove lock meshes/colliders, not just their interaction label.

Protect critical sites, evidence and supply recoveries from the Digimap ruin filter, random destruction, trader purchase and generic encounter spawning. Never delete an essential item because a streaming chunk unloads. Save world modifications; reconstruct colliders and target IDs before restoring pending objectives. Stream/pin the local cinematic neighbourhood for the shot, release after; do not keep all twenty-one sites resident.

## Camera tracks, object focus and hints

New proposed API: `beginSequence({id, anchors, shots, inputPolicy, onComplete})`, `updateSequence(dt)`, `cancelSequence(reason)`. This is a design interface, not a currently callable engine function. Main checks cinematic ownership before cab/chase/foot updates. Always release ownership in finally/abort/death/reload/menu paths. Store and restore gameplay mode, FOV, look yaw/pitch, chase zoom, pointer-lock desire and motion preference. Reset chase smoothing on release so it cannot spring through the vehicle.

Shots use absolute positions under worldRoot and a yaw-relative target offset. Default on-foot FOLLOW: target Cal root + (0,1.2,0), camera offset (2.2,1.7,-3.6), FOV 50, max speed 2 m/s, 0.7 s blend. Vehicle FOLLOW: target vehicle + (0,1.1,0), offset (3,2.7,-7), FOV 52, 0.9 s blend. INTERVIEW: camera (2,1.65,-3) relative to selected speaker, look at chest +1.4, FOV 42. OBJECT: camera target + (0.65,0.45,-0.8), look at object, FOV 38, 3-4 s; inspectable text also opens accessible large-print panel. WIDE: local (8,4,-10) looking at scene centre +1.2, FOV 55. These are defaults overridden by narrative stage notes; collision and subject visibility always win.

Cast a sphere of radius 0.25 m along camera travel against world/props, excluding subject; keep 0.2 m surface clearance and y at least ground+0.45. If blocked, use nearest authored safe static shot, never clip through walls to preserve a shot. Use exponential smoothing with dt, no fixed per-frame lerp. Convert raycast hits to absolute coordinates before anchor comparisons. Handle missing/despawned target by holding safe wide then returning control. Frame for 16:9, 21:9 and 4:3, safe areas 8% horizontal/12% bottom for subtitles. Avoid shoulders hiding mandatory evidence.

Each scene's stage text below is the authoritative shot order. Durations are minimum holds; spoken lines finish before the next narrative beat. Pin objects and people before starting the shot. Following shots follow actual rig/vehicle movement along a safe path; they are not a teleport disguised by camera motion. No forced camera pan during active driving, combat or an untimed choice. Gate at speed <0.2 m/s, brake on if driving, no hostile hit in last 5 s. In M31 and M33, optional focus is offered only in safe windows; default gameplay camera stays available.

Skip: hold the bound skip action 0.6 s (keyboard/gamepad/touch equivalent). Line advance is distinct from whole-scene skip. Whole-scene skip stops VO, shows a concise factual summary, commits only already-authored required facts, and returns to any unresolved choice. It cannot choose consent, spend reserve or select a fatal route. Release all held movement/interaction inputs; require a fresh press after return. Pause freezes shot/voice scheduling and gameplay threat clocks consistently. Do not reuse the menu's press-any-key/loading logic for cinematics.

Hints: begin with a readable label, plausible light contrast and one composition cue. After 45 s of active searching within 25 m with no relevant progress, offer the mission's voiced hint once. After another 45 s, offer an optional target outline on request. Pause, menus, dialogue, travel and time outside the search zone do not accrue search time. No hint during a choice. Reset inactivity on examining any relevant clue; do not repeat at every frame.

Object outlines require active objective, discovered room, unobstructed line of sight and distance <12 m; hide behind walls and never mark secret evidence before its prerequisite. Accessibility mode can mark already-discovered objectives directly. Range text on map points to known site, never exact unseen culprit location. Interaction cone 35 degrees, range 2.2 m on foot, readable reticle label and controller focus equivalent. An insert/hint never auto-picks an object or writes its evidence flag. Manual camera focus is cancelable and returns to previous view.

## Lighting, sound and performance implementation

Use the lighting preset table below for staged scenes; outside staging, retain the regular day cycle. Stage time transitions through safe fade/arrival beats rather than teleporting the sun during a chase. Snapshot sky/weather/fog/exposure on push; restore on pop, including aborted sequences and reload. Color values are sRGB intent; convert correctly for the renderer's linear working space. Do not paste hex values into a linear tuple without conversion. Preset intensities are starting points for visual tuning under the actual ACES configuration.

Budget: one shadow-casting directional sun, shared hemisphere light, maximum two local nonshadow practical lights in the active interior on default/Chromebook quality. Use emissive meshes/baked-looking vertex gradients for other fixtures. Shadow camera follows local focus. Low quality disables particles and dynamic arcs, retains labels and face fill. No full-screen strobing; electrical events use steady ribbons with at most slow brightness variation, and reduced-flash removes modulation entirely. Player can disable shake, bob, motion blur-like warping and tinnitus effects without losing clues. Test paper/label readability at brightness extremes.

Score cues are original commissions/owner-supplied files, NOT existing assets. Request one loop plus optional tension/action/quiet stems per listed cue, and 2-4 s tails. Recommended deliverables WAV masters 48 kHz and web OGG/MP3, credit/license recorded per asset. Match source names to `LH2_<cue>_<stem>`. Composer request must say where a cue starts/stops, duration range and intensity. The owner can supply alternate tracks; do not silently use menu music under campaign cutscenes. Missing music must produce silence and a development warning, never block a mission. No new outbound request is authorized by this document.

Add campaign score context to audio routing with exclusive music ownership. Crossfade 1.4 s by default, 0.4 s when dropping to silence for evidence or dialogue. Duck music 12 dB beneath voice over 0.15 s, recover over 0.8 s; duck engines/ambience 4 dB and retain route safety cues. Separate dialogue, music, ambience, vehicle, UI and SFX settings. Pause/suspend handling works before browser audio unlock. Keep speech intelligible in mono speakers; no directional-only clue. Subtitles identify recorded audio, radio, current speaker and important nonverbal sounds.

Mission SFX use a new documented event namespace, e.g. `campaign:paper`, `campaign:receiver`, `campaign:relay`, and map it to real/synthesized asset handlers before use. These names are proposals, not existing bus handlers. Reuse existing door, steps, ignition and collision audio where supported after inspecting `audio.js`; do not emit invented names assuming sound exists. Foley priorities: footsteps by surface, map/paper handling, locker/shutter latches, typing and seal clicks, cargo straps, stretcher locks, steady machinery, radio key/static, warning tones, vehicle approach, grounded field arcs and fall/impact. Riped's death uses one low non-graphic impact, no comedic bounce. Avoid music swells over consent, confession, death confirmation and final answer.

## Validation and completion gates

For each mission: test a clean start, each permitted solution, reload at every stage boundary, skip at every scene beat, pause/resume, absent audio, unavailable browser speech, chunk unload/reload, missing nonessential cargo and keyboard/gamepad/touch selection. A stage may complete only after its three concrete checks below, never from watching a shot. Ensure no actor teleports into an occupied vehicle seat or blocks a doorway. Essential cargo restitution is transactional. Test floating-origin shift while following actor/vehicle and while focused on an object.

Branch tests: six preparation combinations including lowest reserve with three capacitors; deterministic prepared survival across repeated injected RNG values; emergency success/failure at boundary draws 0.6499/0.65; saved draw unchanged on reload; transfer with support succeeds and without support is unavailable with repair route; together/separate both offered after survival; dead Cal never appears in his memorial; dead Grevyn never appears in later live crew; Riped absent after death. Audience-only Grandpa shot cannot add Cal-known facts early. Medical injuries persist through all outcomes.

Visual review: capture each site at day/night and staged preset, review 128 scene starts/finishes, inspect text on low graphics and small displays, run reduced-motion/reduced-flash, check camera wall clearance and chase restore. Profile at target Chromebook resolution with frame-time and draw-call capture before approving final light/particle budgets. Record measured performance, not guessed FPS.

Record real playtest duration per mission, excluding pause and replayed cutscenes; compare to the 43-hour budget. If short, add meaningful route work, settlement dilemmas and explorable evidence rather than idle waits. Do not advertise a guaranteed 40+ hours until representative end-to-end tests support it.

## Handoff ledger contract

Use `HANDOFF.md`: edition/hash, current branch, last verified mission, implemented modules, tests run, known deviations, next exact task and deferred asset requests. Every mission below starts NOT_IMPLEMENTED. Change that only with a linked implementation commit/file and observed test result. Suggested progress states: NOT_IMPLEMENTED, BUILT_UNTESTED, VERIFIED, BLOCKED_WITH_REASON. A script/PDF being complete does not mean a mission is playable. Before ending any implementation session, update this ledger and leave the game in a loadable state.


## Authored site registry

Offsets are proposals requiring terrain survey; all distances are road-frame offsets from saved z0.

| ID | Road km | Shoulder m (+left) | Site | Archetype |
|---|---:|---:|---|---|
| lh2:school | -30 | 48 | Former high school | classroom |
| lh2:depot | -24 | -55 | Service depot | depot |
| lh2:drywell | -12 | 65 | Drywell Pump Station | checkpoint |
| lh2:home | 0 | 45 | Crew garage and medical depot | settlement |
| lh2:relay | 8 | -60 | East relay and Orin's records shelter | relay |
| lh2:crossing | 18 | 60 | Community ford and repair yard | crossing |
| lh2:junction | 24 | -60 | Pump junction and toll | junction |
| lh2:market | 34 | 70 | Freight market | settlement |
| lh2:archive | 42 | -70 | Southern public archive | archive |
| lh2:workshop | 55 | 55 | Recovery workshop | workshop |
| lh2:refuge | 71 | -80 | Former resistance refuge | lab |
| lh2:fieldlab | 87 | 65 | Mobile field-lab bay | lab |
| lh2:supply | 110 | -60 | Community cold store | clinic |
| lh2:ridge | 124 | 75 | Ridge passive relay | relay |
| lh2:government | 146 | -90 | Government records building | archive |
| lh2:holding | 152 | 100 | Holding facility twelve | prison |
| lh2:catalyst | 168 | -90 | Field research station | anomaly |
| lh2:firstprison | 186 | 100 | First containment site | containment |
| lh2:returnroad | 202 | 65 | Marked return-road turnout | road |
| lh2:citadel | 215 | -110 | Reconstruction complex | regime |
| lh2:extraction | 217 | -65 | Protected medical loading bay | clinic |

## Scene lighting presets

Hour is a staged local time; divide by 24 for sky.time. Key/hemi are proposed intensities. Near/far are fog metres.

| Preset | Time | Key color / intensity | Fill color / intensity | Fog | Notes |
|---|---|---|---|---|---|
| SCHOOL | 10:00 | #F4DEB4 / 2.7 | #97B8CC / 0.85 | 250-1500 | Clear; west-window area proxy, warm desk practicals. Avoid a high-contrast face silhouette. |
| SERVICE | 11:30 | #E5EDF0 / 3.0 | #A8BCC7 / 0.9 | 180-1100 | Dry haze; institutional 4300 K practicals at desks, no flicker. |
| ARCHIVE | 16:00 | #EACDA9 / 2.2 | #8CA0AD / 0.7 | 120-650 | Dusty clear; 3200 K reading lamp at 1.7 m, 1.2 intensity, 5 m radius. |
| EVAC | 18:30 | #D59572 / 1.1 | #667D99 / 0.75 | 70-380 | Authored smoke with traversable sightlines; amber static emergency lamps, reduced flash by default. |
| HOME | 07:15 | #F3CB94 / 2.0 | #9CBCCA / 0.85 | 220-1400 | Warm clear; faces toward shaded fill. Evening variants interpolate to 18:00 over a marked time transition. |
| ROAD_DAY | 13:30 | #FFF0D8 / 3.3 | #9FC4DD / 1.0 | 300-1800 | Clear; high sun, readable sand and route silhouettes. Normal day cycle between staged scenes. |
| ROAD_DUSK | 18:10 | #E5A46A / 1.4 | #718CAC / 0.8 | 170-1000 | Thin haze; steady amber receiver practical, never full-screen color grading. |
| REFUGE | 15:15 | #D8C8B0 / 1.7 | #8A9C9F / 0.7 | 130-700 | Overcast outside; reused 3000 K communal lamps versus 4700 K closed laboratory wing. |
| LAB | 15:30 | #D9E3E4 / 1.8 | #8DA8B3 / 0.75 | 100-600 | Neutral diffuse fill; steady teal equipment emissive #67B4AD; 4300 K reading practicals. |
| LAB_WARM | 17:00 | #ECC9A6 / 1.6 | #94AEB7 / 0.85 | 160-1000 | Warm workbench, neutral paper whites; support chart lighting remains readable with effects off. |
| PRISON | 21:00 | #7485B5 / 0.0 | #647A91 / 0.48 | 55-250 | Night; 4000 K corridor practicals 2.4 m high, 7 m apart, intensity 1.4, radius 8 m; cell fill 0.6. |
| STORM | 17:40 | #B7B7CE / 0.8 | #738BA1 / 0.85 | 90-500 | Overcast with distant thunder. No lightning navigation dependency; rain optional on low quality. |
| CONTAINMENT | 17:30 | #D8B08A / 1.5 | #8EA9B8 / 0.85 | 150-900 | Readable neutral treatment platform; amber guidance #D9A766, blue support #85B9C8, all labelled. |
| REGIME | 16:40 | #DDC9B5 / 2.0 | #8298A5 / 0.75 | 140-850 | Severe architectural shadows; white insignia readable, never use darkness to hide mandatory doors. |
| STORM_INTERIOR | 18:00 | #B4B5CF / 0.7 | #899AB5 / 0.9 | 85-450 | Audience hall cold field #9AB8EC; warm faces retain fill. Electrical arcs optional, no strobing. |
| SEVERING | 19:00 | #A7A3C0 / 0.2 | #93A7BF / 0.85 | 150-850 | Keep platform at neutral exposure. Amber field fades over 8 s; no sudden white exposure wash. |
| AFTERMATH | 08:00 | #E9D4AF / 2.0 | #A7C0C9 / 0.95 | 240-1600 | Clear soft daylight for every ending. Do not grade separation or grief as moral failure. |

## Original score request list

None of these cue files is supplied or claimed licensed. Obtain owner/composer-approved audio and credits before shipping. Tempo 0 means beatless. Loopable travel versions: 3-5 minutes; scene versions follow dialogue length with a tail and clean loop points.

| Cue ID | Working title | BPM | Arrangement request |
|---|---|---:|---|
| WINDOW | Window Seat | 72 | Felt piano, dry guitar harmonic, five-note friendship motif; no romantic strings. |
| UNIFORM | A Road to Serve | 88 | Restrained mechanical pulse, clipped percussion; public optimism with one unresolved bass note. |
| WINDOW_DARK | The Same Room | 68 | Sparse friendship motif, paper sounds and low bowed texture; silence during private details. |
| SECOND_ROAD | West Approach | 100 | Muted low drums in travel; drop percussion completely for wound and last call. |
| HOME | Bread and Coffee | 78 | Small guitar, warm organ, unpolished room tone; ordinary crew life. |
| SIGNAL | Carrier / Cal | 0 | Beatless radio texture, one sustained interval; silence before Grevyn says the name. |
| CONVOY | A Road We Make | 92 | Steady traveling bass and brushed percussion; practical forward motion, not military triumph. |
| TOLL | What Passage Costs | 76 | Plucked wood and low piano, unresolved loop with a warmer repair resolution. |
| DOUBT | Three Dates | 70 | Separated piano notes, subtle ticking that is not a countdown. |
| PAPER | Margins | 66 | Dry strings, sparse low piano; turn down while dates and names are spoken. |
| CUT_TAPE | The Space Between Words | 0 | Beatless noise floor, no score under evidence audio comparison. |
| SECOND_ROAD_SOFT | Where They Found Him | 60 | Sparse reprise of West Approach; gentle room tone, no sentimental swell over injury. |
| REFUGE | No Safe Category | 64 | Worn harmonium and metal resonance; humane public room, colder laboratory stem. |
| PASTE | Support / Compliance | 0 | Two dissonant sustained layers that separate as three functions are understood. |
| BLUE_PAGES | Her Corrections | 74 | Friendship motif on detuned upright and dry hand percussion; intelligence and effort. |
| MISSING | Someone Still Inside | 82 | Low pulse with distant relay clicks; no voice imitation. |
| ROAD_FORCE | A Measure Left | 0 | Beatless amber harmonic texture, thinner stem with declining reserve. |
| HOLDING | No Unscheduled Contact | 84 | Low ventilation rhythm and muted pulse; never drown footsteps or patrol cues. |
| EMPTY_CELL | An Opened Wall | 0 | Sparse sustained bass; no villain-reveal sting before evidence earns it. |
| EXTRACTION | Bring Someone | 108 | Steady restrained drums; drop to engine and breaths during medical loading. |
| CATALYST | Posts in the Sand | 0 | Granular glass and low chord, stable marker tone outside the score bus. |
| GOLGHIS | Finish Her Work | 76 | Measured piano and warm strings, incomplete cadence until three checks pass. |
| FIRST_PRISON | The Inside Handle | 58 | Low resonant strings and empty-room texture; no sacred framing. |
| CONFESSION | The Price of Freedom | 0 | Almost silence; no beauty cue absolving the Road Force. |
| TERMS | Room to Choose | 62 | Sparse piano; no heroic swell under sacrifice explanation or consent. |
| REGIME | One Road / One People | 96 | Diegetic rigid march in public spaces, non-diegetic low countertexture in command rooms. |
| REUNION | You Were Not There | 0 | Friendship motif in incomplete single notes; hold silence between evidence exhibits. |
| INFORMER | What He Knew | 0 | No score during confession. Low field tone into lightning; silence after Riped impact. |
| BREAK | Not Her | 112 | Pulsed action stems with safe-window drops; avoid triumphant violence accent. |
| PASSENGER | Keep Telling Me | 68 | Warm single-note guitar and engine bed; no cure cadence. |
| LONG_DRIVE | A Road Outside | 104 | Action stems for pursuit, then beatless friendship fragments for quiet kilometer. |
| SEVERING | No More Bargains | 0 | Three sustained guidance layers; outcome stingers delayed until clear medical result. |
| AFTER | A Next Day | 72 | Four equal-length variants: together, separate, Cal memorial, Grevyn memorial. Shared motif, different space. |

## Mission build sheets

Prologue status is recorded in HANDOFF.md; later missions remain NOT_IMPLEMENTED. Use exact JSON IDs for dialogue; the handwritten descriptions below do not authorize replacing missing rules with an auto-complete timer.

### P01 - The Window Seat

- Status: IMPLEMENTED, automated flow verified; see HANDOFF.md for art/shot and manual-test limitations. Chapter: Prologue - Before the Dust. Unlock: new_game complete.
- Purpose: Meet Grevyn in ninth-grade history; establish the whole friendship group through playable school memories.
- Target: 35 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:school; frame/layout from registry. In-person scene candidates: CAL GREVYN TAY TAYJ RIPED ORIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: SCHOOL. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: WINDOW (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:P01:timetable` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The room number is on the board beside the stairs." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**P01.s1 - Find the classroom.** Read the timetable and sit beside the west window. Implementation: Timetable text choice opens classroom; desk sit target advances only after player confirms west-window chair. Completion predicate is the conjunction of these authored checks. Emit `lh2:P01:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**P01.s2 - Build the friendship.** Sort a disputed history source with Grevyn; leave class together. Implementation: Two source cards: choose omitted name and compare accounts; all answers receive explanatory feedback and can be revised. Completion predicate is the conjunction of these authored checks. Emit `lh2:P01:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**P01.s3 - Keep a place.** Play the end-of-freshman and start-of-sophomore courtyard meetings. Implementation: Walk through two marked memory transitions; speak to Tay and TayJ and inspect class photo before departure. Completion predicate is the conjunction of these authored checks. Emit `lh2:P01:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Choose whether Cal first admits being lost or jokes about the map. Both establish friendship; no romance score.

**Failure and recovery.** Missed school interactions remain in the memory journal; no timed dialogue failure.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `P01.A` / An empty chair: 2085. Track fifteen-year-old Cal at walking speed down a sunlit corridor, 4 seconds, then cut over his shoulder to the timetable for 3 seconds. Return control before he chooses the desk. No school-age flirting. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `P01.B` / Near the end of freshman year: Late spring 2086, school courtyard. Follow the pair along the shaded wall. Frame Tay and TayJ in the same wide shot, not as introductions through a menu. Riped enters from behind Cal and talks over him. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `P01.C` / Sophomore morning: 2086 autumn. Repeat the classroom composition with older clothes and cooler daylight. An optional look at the class photograph names the five friends. Hold Grevyn and Cal in a plain two-shot; this is friendship, not romantic visual shorthand. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `P01` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### P02 - In Service

- Status: IMPLEMENTED, automated flow verified; see HANDOFF.md for art/shot and manual-test limitations. Chapter: Prologue - Before the Dust. Unlock: P01 complete or explicit chapter-test fixture.
- Purpose: Play graduation in 2089 and service in 2091; establish Cal's aroace identity and the trio's complicity.
- Target: 50 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:depot; frame/layout from registry. In-person scene candidates: CAL GREVYN RIPED VOSS LIO JESS; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: SERVICE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: UNIFORM (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:P02:ledger` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The transport numbers do not match the public order." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**P02.s1 - Sign on.** Leave graduation, inspect the recruitment contract, enter the two-year service transition. Implementation: Interact with graduation photo, read contract and explicitly accept two-year time transition; no literal waiting. Completion predicate is the conjunction of these authored checks. Emit `lh2:P02:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**P02.s2 - Follow the assignment.** Escort a civilian transport; notice the discrepancy between its label and prisoners. Implementation: Escort transport for a 4 km tutorial loop; stop at two checkpoints and inspect missing medical-officer field. Completion predicate is the conjunction of these authored checks. Emit `lh2:P02:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**P02.s3 - Keep the record.** Copy the unredacted transfer ledger rather than destroy it. Implementation: Copy ledger and original transfer reference; report challenge changes Voss line, never deletes signature evidence. Completion predicate is the conjunction of these authored checks. Emit `lh2:P02:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Cal can initially comply or challenge Voss; both leave responsibility for his earlier work, and the ledger is mandatory evidence.

**Failure and recovery.** A civilian escort cannot be harmed for rewards; if a transport jams, restore its last safe stop.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `P02.A` / After graduation: 2089. Graduation group photograph becomes a matched cut to service badges in 2091. Dolly behind Cal, Grevyn and Riped through depot gates for 5 seconds. Stop on a detention van without lingering on suffering. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `P02.B` / A clear answer: 2091. Adult staff canteen between assignments. Gameplay conversation with Lio, then Jess at the supply window. Cal is approximately twenty-one; both NPCs are adults. No rejection gag, negative relationship point or romance unlock. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `P02.C` / What we signed: Service archive. Focus on Cal's signature, then the changed detention destination. No forced confession choice: player handles the ledger and sees his role directly. A rear tracking shot follows Grevyn shutting the office door. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `P02` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### P03 - Save Me the Window Seat

- Status: IMPLEMENTED, automated flow verified; see HANDOFF.md for art/shot and manual-test limitations. Chapter: Prologue - Before the Dust. Unlock: P02 complete or explicit chapter-test fixture.
- Purpose: Help Grevyn secure whistleblower evidence; establish every private detail later used to frame Cal.
- Target: 40 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:school; frame/layout from registry. In-person scene candidates: CAL GREVYN RIPED; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ARCHIVE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: WINDOW_DARK (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:P03:cabinet_panel` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The map frame sits farther out from the wall on the left." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**P03.s1 - Secure originals.** Place the torture and unlawful detention evidence behind the classroom map cabinet. Implementation: Place originals in cabinet compartment; latch panel and create a second protected copy in journal. Completion predicate is the conjunction of these authored checks. Emit `lh2:P03:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**P03.s2 - Arrange extraction.** Mark Drywell Pump Station's western loading canopy and service-road approach. Implementation: Mark west canopy and service road on paper map; player confirms both visible labels, no memory test. Completion predicate is the conjunction of these authored checks. Emit `lh2:P03:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**P03.s3 - Leave separately.** Send a legitimate protective transport request and preserve its carbon copy. Implementation: Send protective request, take carbon copy, exit terminal zone and receive coded call; Riped access is audience-only. Completion predicate is the conjunction of these authored checks. Emit `lh2:P03:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Choose compassionate or practical reassurance. The dangerous information is overheard in the same conversation in both paths.

**Failure and recovery.** Do not display Riped's report to Cal in 2091; an audience-only shot establishes access without revealing the entire conspiracy.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `P03.A` / Behind the map: 2091, after hours. Follow Grevyn from corridor to map cabinet at 1.2 m/s for 6 seconds. Cut to her lifting its back panel, then to Cal's hand holding the originals. Riped's silhouette is visible beyond frosted glass only after the key details. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `P03.B` / The western canopy: Insert Grevyn's finger following the service road on a paper plan, 4 seconds, with Drywell's west canopy legible. Return to the doorway in a wide shot: Riped hears this in the same continuous encounter. No omniscient journal entry. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `P03.C` / Borrowed authority: Cal completes the genuine protective request at a shared service terminal, signs out, and exits. Follow him to the vehicle; cut back for 3 seconds to Riped beside the still-unlocked radio identity token. An existing handwritten civilian pickup note is on the desk. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `P03` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### P04 - The Second Road

- Status: IMPLEMENTED, automated flow verified; see HANDOFF.md for art/shot and manual-test limitations. Chapter: Prologue - Before the Dust. Unlock: P03 complete or explicit chapter-test fixture.
- Purpose: Attempt both rescue routes during the 2091 collapse, survive the gunshot and play the final broken call.
- Target: 55 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:drywell; frame/layout from registry. In-person scene candidates: CAL GREVYN RIPED TAY TAYJ VOSS; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: EVAC. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: SECOND_ROAD (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:P04:service_turn` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The western canopy is reached by the narrow service lane, not the gate." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**P04.s1 - Try the first route.** Reach Riped's pickup approach; inspect the destroyed span and turn back. Implementation: Reach broken span at less than 8 m/s; brake zone begins 100 m before hazard; inspect slip and span. Completion predicate is the conjunction of these authored checks. Emit `lh2:P04:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**P04.s2 - Try the actual service road.** Reach the blockade on the correct western approach; take the scripted wound and crawl to cover. Implementation: Drive to correct west approach; on-foot boundary starts authored capture-safe wound sequence, not normal bullet damage. Completion predicate is the conjunction of these authored checks. Emit `lh2:P04:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**P04.s3 - Survive and answer.** Let Tay and TayJ extract Cal; play the last call and departure. Implementation: Tay and TayJ extraction commits route log, treatment card and gear; seated radio interaction runs unskippable facts but skippable presentation. Completion predicate is the conjunction of these authored checks. Emit `lh2:P04:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Tactical approach changes dialogue, never whether Cal tried. The scripted shot cannot be prevented by a reflex test.

**Failure and recovery.** Checkpoint before blockade; cinematic shot cannot cause a free-roam death. Restore full controls only after rescue; archive wound evidence automatically.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `P04.A` / No crossing: Smoke, distant civilian vehicles, failing lights. Track the pickup from rear-left for 5 seconds as the first bridge comes into view. A 3-second insert shows the broken span and Riped's erroneous route slip. Gameplay resumes at a safe braking distance. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `P04.B` / The wound: Follow Cal on foot from cover to barrier for 4 seconds; Voss's order breaks the quiet. Cut to his face at the shot, not a graphic impact. Tay drags him into cover. TayJ reverses the rescue vehicle in. Show a treatment card and damaged uniform later in a sober still insert. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `P04.C` / Stop calling: Workshop refuge. The wounded Cal stays seated; camera slowly follows Tay leaving him privacy but remains in a shared space, not isolating him visually. Cross-cut to Grevyn's guarded face in custody. This is their actual last call, not a false memory. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `P04` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M01 - Another Delivery

- Status: NOT_IMPLEMENTED. Chapter: Chapter 1 - A Voice on the Road. Unlock: P04 complete or explicit chapter-test fixture.
- Purpose: Introduce the 2096 crew through a supply run, maintenance and ordinary shared decisions.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:home; frame/layout from registry. In-person scene candidates: CAL TAY TAYJ RIPED DAIN NESS; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: HOME. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: HOME (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M01:medical_crate` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The delivery crate has a cloth handle beside the tailgate." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M01.s1 - Ready the pickup.** Check fuel, tires, water and a medical crate with Dain. Implementation: Check all four vehicle points, eat or pack food, load one protected clinic crate. Completion predicate is the conjunction of these authored checks. Emit `lh2:M01:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M01.s2 - Deliver to the depot.** Drive the local loop and unload supplies with Tay. Implementation: Travel 6 km local loop; hand crate to depot target; two latches and unloading state prevent duplicate deliveries. Completion predicate is the conjunction of these authored checks. Emit `lh2:M01:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M01.s3 - Return for the night.** Check in with TayJ and choose a sleeping place. Implementation: Radio check-in plus selected rest target establishes crew routine; no timed depression meter. Completion predicate is the conjunction of these authored checks. Emit `lh2:M01:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Let Tay ride or coordinate by radio; both count as maintaining contact, neither is a hidden mental-health score.

**Failure and recovery.** Mandatory delivery goods respawn at the last safe depot if lost; repairing the truck is a playable task, not a restart.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M01.A` / Five years later: 2096. At a warm workshop dawn, track Cal opening the pickup and checking the tire. Keep Tay visible packing her own clinic bag. A 3-second rack focus moves from a patched uniform folded away to civilian work gloves. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M01.B` / People still need things: Gameplay unloading at the medical depot. Follow Cal's hands placing the crate, then widen to the waiting settlement. No quest completion confetti over the conversation. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M01.C` / A place at the table: Optional evening crew scene becomes mandatory only for the first introduction. Follow Cal sitting beside the others. Leave a vacant chair in the composition without ominous highlighting. Save before the first distant radio interference. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M01` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M02 - Cal

- Status: NOT_IMPLEMENTED. Chapter: Chapter 1 - A Voice on the Road. Unlock: M01 complete or explicit chapter-test fixture.
- Purpose: Receive a genuine fragment of Grevyn's voice relayed by the road force; safely investigate the transmission.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:relay; frame/layout from registry. In-person scene candidates: CAL RIPED; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ROAD_DUSK. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: SIGNAL (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M02:receiver_feed` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The receiver lamp is dark; trace the cable back to the fuse box." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M02.s1 - Reach the relay.** Repair the receiver feed and tune three marked bands. Implementation: Replace receiver fuse, connect ground and choose three labelled bands; accessible tune buttons match dial function. Completion predicate is the conjunction of these authored checks. Emit `lh2:M02:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M02.s2 - Pull over.** Stop the truck safely after hearing the message; choose grounding or a crew call. Implementation: At real voice trigger, request a safe stop; cinematic starts only when brake set and speed below 0.2 m/s. Completion predicate is the conjunction of these authored checks. Emit `lh2:M02:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M02.s3 - Record the source.** Save the full transmission and its impossible bearing. Implementation: Record full 45-second in-world transmission without requiring 45 seconds idle; playback can be skipped with transcript retained. Completion predicate is the conjunction of these authored checks. Emit `lh2:M02:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Player chooses how to handle anxiety; no driving skill penalty or forced crash. Asking for help is never punished.

**Failure and recovery.** Replay the message from the recorder; missed words do not lock progress. No deadline while grounding.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M02.A` / The name: Drive approach remains player-controlled. Once safely parked and tuned, cut to the receiver for 3 seconds, then hold on Cal hearing his name. Tiny radio hiss; no jump-scare volume spike. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M02.B` / Not an answer yet: Camera follows Cal stepping outside only if chosen. A static alternative frames the parked cab for reduced motion. Road Force speaks from the roadside radio field; Grevyn's voice is not its imitation. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M02.C` / A bearing through rock: Three-second insert on receiver needle pointing toward a blocked ridge, then back to gameplay. Cal and TayJ mark uncertainty, not a magical destination pin. Riped arrives after the full recording is saved. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M02` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M03 - Check the Source

- Status: NOT_IMPLEMENTED. Chapter: Chapter 1 - A Voice on the Road. Unlock: M02 complete or explicit chapter-test fixture.
- Purpose: Corroborate the voice through independent timing, a witness and a present-day facility signal.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:relay; frame/layout from registry. In-person scene candidates: CAL TAY RIPED ORIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ARCHIVE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: SIGNAL (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M03:traffic_log` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The new entry is under the receiver's current date stamp." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M03.s1 - Compare recordings.** Match the school phrase to the old call without treating voice similarity as proof of life. Implementation: Compare original call, current carrier stamp and voice fragment as three distinct journal facts. Completion predicate is the conjunction of these authored checks. Emit `lh2:M03:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M03.s2 - Contact the relay witness.** Drive to Orin's archive shelter and inspect recent monitored traffic. Implementation: Visit records shelter at relay local east annex; inspect current transfer entry and Orin testimony. Completion predicate is the conjunction of these authored checks. Emit `lh2:M03:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M03.s3 - Choose the search.** Agree a route and crew contact plan. Implementation: Choose ANSWER or HELP, select relay check-in itinerary and load evidence case into secured storage. Completion predicate is the conjunction of these authored checks. Emit `lh2:M03:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Cal may say he wants answers or wants to help; both begin the journey without forcing forgiveness.

**Failure and recovery.** All proof is journaled in separate facts: genuine voice, current carrier, survival unconfirmed until corroborated.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M03.A` / The date on the carrier: At the relay desk, dolly behind TayJ sorting paper logs for 4 seconds. Object-focus shot points to a current-date carrier stamp, not an automatic answer. Player aligns recordings with an accessible button alternative to waveform dragging. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M03.B` / A teacher still asking: Orin's single-storey archive shelter. Follow him slowly between filing shelves; his body remains in sight when he hands over a recent Trooper frequency list. Warm desk light separates him from cold exterior haze. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M03.C` / A search with limits: Crew route planning around the hood. A low, slow follow travels from Cal to TayJ's paper route. Camera returns before the player chooses his stated reason. No romantic framing in close-ups of Grevyn's photograph. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M03` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M04 - Safe Passage

- Status: NOT_IMPLEMENTED. Chapter: Chapter 2 - The Cost of a Road. Unlock: M03 complete or explicit chapter-test fixture.
- Purpose: Repair a community crossing and escort a mixed convoy; earn trust through useful work.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:crossing; frame/layout from registry. In-person scene candidates: CAL RIPED DAIN NESS; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ROAD_DAY. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: CONVOY (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M04:support_plate` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The usable plate is beneath the blue tarp by the maintenance truck." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M04.s1 - Survey the crossing.** Walk the bank with Dain; mark the stable service ford. Implementation: Walk both bank survey nodes and measure ford depth using an abstract safe-range gauge. Completion predicate is the conjunction of these authored checks. Emit `lh2:M04:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M04.s2 - Repair access.** Move debris with a winch and fit two support plates. Implementation: Collect two plates from yard, repair winch, brace two marked bank points; verify rig tension before moving convoy. Completion predicate is the conjunction of these authored checks. Emit `lh2:M04:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M04.s3 - Escort the convoy.** Lead three vehicles through, then return a stranded driver's supplies. Implementation: Escort three autonomous vehicles over stable ford; recover stalled driver crate; success after all vehicles reach safe turnout. Completion predicate is the conjunction of these authored checks. Emit `lh2:M04:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Donate a repair kit for faster access or collect salvage for a longer repair. Both remain viable and aid the settlement.

**Failure and recovery.** Convoy vehicles stop before hazards; recover overturned essential cargo at the nearby yard. No fragile-NPC instant fail.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M04.A` / A road belongs to somebody: Follow Dain and Cal along the bank with the convoy stationary behind them. Hold a wide shot showing the ford and flooded bridge together. A work-light glint suggests a support plate when the survey objective is active. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M04.B` / Work before promises: Gameplay labor. At the final brace placement, use a 5-second lateral tracking shot following Cal's handoff to Dain, showing safe rigging rather than a quick-time event. Do not play dialogue over loud winch effects. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M04.C` / The last vehicle: Camera follows the last convoy vehicle onto firm ground, then returns to Cal at the stalled driver. Success includes the driver's returned crate. No victory sting until the community vehicles have stopped safely. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M04` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M05 - The Price of Help

- Status: NOT_IMPLEMENTED. Chapter: Chapter 2 - The Cost of a Road. Unlock: M04 complete or explicit chapter-test fixture.
- Purpose: Negotiate passage without treating settlement residents as expendable; learn how faction support changes routes.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:junction; frame/layout from registry. In-person scene candidates: CAL TAY RIPED DAIN NESS; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: HOME. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: TOLL (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M05:pump_valve` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The pressure gauge beside the pump is stuck at zero." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M05.s1 - Hear the demands.** Meet Ness and the junction toll crew in daylight. Implementation: Hear pump demand; inspect posted toll and water service state before seeing exchange UI. Completion predicate is the conjunction of these authored checks. Emit `lh2:M05:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M05.s2 - Choose a workable exchange.** Deliver filters, repair the pump or pay from noncritical funds. Implementation: Choose REPAIR, PAY or DETOUR; repair uses nonmedical gasket and wrench, pay uses displayed 80 scrap credits, detour adds 7 km. Completion predicate is the conjunction of these authored checks. Emit `lh2:M05:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M05.s3 - Reopen the shared road.** Test the pump or verify payment and witness civilian passage. Implementation: REPAIR/PAY opens gate for first civilian before Cal; DETOUR logs continued closure and arrival at opposite marker. Completion predicate is the conjunction of these authored checks. Emit `lh2:M05:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Three valid solutions. Display costs before selection. Never silently consume medical supplies reserved for Grevyn.

**Failure and recovery.** If funds are insufficient, the repair route stays available; a hostile response diverts to a longer safe road, not a softlock.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M05.A` / A hefty price: At junction barriers, follow Cal stepping away from the truck with empty hands. Keep enforcers and exit visible in the wide shot. A small red lamp on the dry pump establishes the practical problem. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M05.B` / What can be spared: Gameplay inspection, then player-facing itemized exchange screen. Camera may focus on the damaged gasket for 3 seconds after examination, never before entering the pump shelter. Choices use explicit quantity and travel-time previews. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M05.C` / A posted agreement: Follow Ness pinning the agreement to the barrier and opening it for a civilian vehicle before Cal's truck. If alternate route chosen, use radio confirmation instead; do not falsely show an unpaid toll opening. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M05` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M06 - The Wrong Story

- Status: NOT_IMPLEMENTED. Chapter: Chapter 2 - The Cost of a Road. Unlock: M05 complete or explicit chapter-test fixture.
- Purpose: Collect conflicting accounts of Grevyn and separate firsthand sighting from propaganda.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:market; frame/layout from registry. In-person scene candidates: CAL TAY RIPED NESS; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ROAD_DUSK. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: DOUBT (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M06:convoy_receipt` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "There is a date on the back, below the freight stamp." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M06.s1 - Interview witnesses.** Hear Ness's supply contact, Dain's road account and a regime broadcast. Implementation: Talk to Ness at freight stall, inspect Dain road receipt and voluntarily play regime monitor clip. Completion predicate is the conjunction of these authored checks. Emit `lh2:M06:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M06.s2 - Compare dates.** Pin each source to an independently verified convoy date. Implementation: Place three dated records in order with revision allowed; comparison reveals contradictions, not truth-by-vote. Completion predicate is the conjunction of these authored checks. Emit `lh2:M06:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M06.s3 - Follow the consistent lead.** Mark the government archive without declaring all rumors true. Implementation: Mark southern archive route, preserve Riped contradiction and make next relay check-in. Completion predicate is the conjunction of these authored checks. Emit `lh2:M06:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Cal can challenge Riped now or hold questions. TayJ keeps discrepancies either way; no early forced villain reveal.

**Failure and recovery.** Witness audio and receipts remain replayable. Hostile market encounter relocates interviews to the public radio booth.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M06.A` / A woman at the checkpoint: Track Cal and Ness through the market at walking speed, no fast orbit. End on a freight receipt, after the witness account. Reused supporting performers must keep new roles distinct; here Ness recounts her own direct contact. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M06.B` / The face in the broadcast: A public monitor shows Grevyn still, conditioned and calm beside regime insignia. Cut from Cal to the screen once, then hold for the full statement. Do not show supernatural possession as proof of voluntary loyalty. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M06.C` / Three dates: At a quiet roadside table, move over the evidence board only after the player places receipts. The current-day broadcast and pre-collapse informant account cannot be merged into one date. TayJ preserves Riped's contradiction as a question. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M06` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M07 - His Name on the Page

- Status: NOT_IMPLEMENTED. Chapter: Chapter 3 - Who Signed It. Unlock: M06 complete or explicit chapter-test fixture.
- Purpose: Discover the denunciation attributed to Cal and recover the unedited protective request.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:archive; frame/layout from registry. In-person scene candidates: CAL TAY RIPED ORIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ARCHIVE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: PAPER (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M07:request_carbon` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The transfer ledger has a thin carbon page folded into its rear cover." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M07.s1 - Enter the archive.** Use local access earned at the crossing or restore its public generator. Implementation: Use community access token or repair archive generator with one free recoverable belt. Completion predicate is the conjunction of these authored checks. Emit `lh2:M07:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M07.s2 - Find both versions.** Compare the protective request carbon with the detention order. Implementation: Collect filed order and original carbon; compare purpose, named subject and time as three labelled differences. Completion predicate is the conjunction of these authored checks. Emit `lh2:M07:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M07.s3 - Secure provenance.** Record terminal timestamps, token use and document custody. Implementation: Photograph custody marks and shared-session token log; secure originals and copy to private journal. Completion predicate is the conjunction of these authored checks. Emit `lh2:M07:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Tell Tay the shame immediately or ask for a private moment; evidence reaches both friends before the next chapter.

**Failure and recovery.** Never destroy originals as a progression action. Scanned copies survive cargo loss with retrieval of originals optional for presentation.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M07.A` / A signature is not a history: Slow follow behind Cal through archive aisle. A close shot reveals his service identity on the detention order only when he opens the folder. Hold his reaction without a dramatic camera shake. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M07.B` / Protective transport: Object hint highlights the raised carbon edge only after Cal examines the ledger. A 4-second split composition frames protective pickup on one page and detention on the other. Player confirms three differences with a readable text option. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M07.C` / Who had access: Evidence desk. Follow Tay photographing the terminal custody sheet, then a short insert of the shared-session token number. No name is revealed as culprit yet: access is a lead, not conviction. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M07` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M08 - What the Recording Says

- Status: NOT_IMPLEMENTED. Chapter: Chapter 3 - Who Signed It. Unlock: M07 complete or explicit chapter-test fixture.
- Purpose: Recover full radio traffic and expose the edits used to manufacture Cal's agreement to the arrest.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:relay; frame/layout from registry. In-person scene candidates: CAL TAY TAYJ RIPED; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: SERVICE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: CUT_TAPE (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M08:raw_drive` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The sealed drive is in the recorder base, below the empty cassette slot." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M08.s1 - Restore the relay recorder.** Fit a replacement drive and recover the intact transport channel. Implementation: Fit salvage recorder drive; power from isolated workbench battery and read raw index. Completion predicate is the conjunction of these authored checks. Emit `lh2:M08:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M08.s2 - Compare three cuts.** Match phrase boundaries, ambient noise and transmission time. Implementation: Use timeline button or transcript list to compare three edit seams; restore note patient sheet. Completion predicate is the conjunction of these authored checks. Emit `lh2:M08:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M08.s3 - Preserve the raw stream.** Make an offline duplicate and deliver one to the archive. Implementation: Seal raw stream duplicate and deliver archive copy; evidence-custody flag commits once, no inventory duplicates. Completion predicate is the conjunction of these authored checks. Emit `lh2:M08:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Confront the lie or ask Riped to explain technical access. He evades; no route allows him to delete earned proof.

**Failure and recovery.** Accessible transcript comparison replaces audio puzzle. Lost drive can be recovered from archive mirror after first verification.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M08.A` / A convenient sentence: Relay workbench, player-controlled repair. Once the drive spins, cut to a static medium shot of the crew listening. Edited speech is tagged as evidence playback in subtitles so actors do not perform it as a new confession. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M08.B` / A rescue note: Insert the real handwritten note Cal retrieves from a civilian transport packet. The same words were attached to Grevyn's detention file. Follow Cal carrying both documents to the table; no floating text substitutes for a physical prop. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M08.C` / Not enough to name him: Camera follows TayJ sealing an offline duplicate. A 3-second focus on the transfer hash and date reinforces provenance. Leave Cal and Riped in the same frame with physical distance growing between them. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M08` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M09 - Where They Found Him

- Status: NOT_IMPLEMENTED. Chapter: Chapter 3 - Who Signed It. Unlock: M08 complete or explicit chapter-test fixture.
- Purpose: Return to the 2091 rescue site and assemble independently dated evidence of Cal's attempted return.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:workshop; frame/layout from registry. In-person scene candidates: CAL TAY TAYJ RIPED; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: HOME. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: SECOND_ROAD_SOFT (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M09:treatment_box` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "Tay put the old treatment cards above the dry storage shelf." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M09.s1 - Reach the old workshop.** Retrieve Tay's treatment card and TayJ's rescue route record. Implementation: Collect treatment card from upper dry shelf and rescue trip record from wall tin. Completion predicate is the conjunction of these authored checks. Emit `lh2:M09:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M09.s2 - Survey the approaches.** Inspect the destroyed crossing and marked blockade remains. Implementation: Visit both legacy route landmarks using explicit prologue-return transition; survey span and blockade remains, no subjective vision proof. Completion predicate is the conjunction of these authored checks. Emit `lh2:M09:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M09.s3 - Build the chronology.** Align injury, travel and intercepted-call times. Implementation: Align times, treatment and false voucher account; optional scar display uses consent, never substitutes for records. Completion predicate is the conjunction of these authored checks. Emit `lh2:M09:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Cal chooses whether to show the scar now; final reveal uses consent again. Scar alone never proves betrayal or attacker identity.

**Failure and recovery.** No replayed injury damage. Trauma scenes allow static camera, subtitles and a pause without changing outcome.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M09.A` / The room they borrowed: Track Cal entering the preserved workshop. Match the P04 rescue composition without a jump cut to the gunshot. Tay opens the treatment box only when asked. TayJ keeps the vehicle route chart within reach. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M09.B` / Both roads: Wide follows at each route separately. Player inspects span damage and a service-road barrier mount. Ghostly memory overlays are optional, labelled subjective; objective journal evidence comes from documents and dated rescue travel, not visions. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M09.C` / A body is not the whole proof: Sheltered table, static camera. Cal may uncover the healed scar briefly without sensational close-up, then cover it. Show the complete chronology next to it. The falsified payment entry is contradicted by a duplicated account number and recovery records. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M09` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M10 - Refuge

- Status: NOT_IMPLEMENTED. Chapter: Chapter 4 - The Cure She Hid. Unlock: M09 complete or explicit chapter-test fixture.
- Purpose: Find the former resistance shelter and learn how protection became coercion.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:refuge; frame/layout from registry. In-person scene candidates: CAL TAY RIPED MERRIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: REFUGE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: REFUGE (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M10:intake_folder` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The intake card is filed under arrivals, not detainees." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M10.s1 - Earn entry.** Repair the shelter water line and meet Merrin under civilian oversight. Implementation: Repair shelter water joint with free service kit; obtain supervised entry regardless of whether Merrin is forgiven. Completion predicate is the conjunction of these authored checks. Emit `lh2:M10:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M10.s2 - Find admission records.** Locate Grevyn's voluntary refuge request and later confinement order. Implementation: Find refuge application and confinement reclassification; preserve signed nonconsent evidence. Completion predicate is the conjunction of these authored checks. Emit `lh2:M10:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M10.s3 - Open the laboratory wing.** Restore a manual door mechanism and preserve its contents. Implementation: Repair manual shutter wheel and enter lab; victim records remain private and cannot be sold. Completion predicate is the conjunction of these authored checks. Emit `lh2:M10:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Offer Merrin public testimony protection or insist on supervised custody; neither absolves her or destroys her research.

**Failure and recovery.** Evidence is mandatory and cannot be traded for passage. Locked-wing bypass remains available if Merrin refuses cooperation.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M10.A` / They promised protection: Track Merrin leading Cal through the shelter's communal room, 6 seconds; pass an old resistance banner repurposed as a curtain. End at a locked clinic door. Civilians continue ordinary activity rather than staring as a hostile crowd. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M10.B` / A change of category: Player reads Grevyn's refuge application beside a later restricted-subject order. Camera hints at mismatched staples after the first examination. The documents explicitly separate resistance origin, corruption and subsequent regime partnership. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M10.C` / A voice in the margin: Laboratory entrance. Follow Cal opening the manual shutter; focus for 3 seconds on tiny handwriting behind a maintenance label. Do not reveal the formula yet. Road Force avoids answering a question; Cal notices. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M10` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M11 - Treatment

- Status: NOT_IMPLEMENTED. Chapter: Chapter 4 - The Cure She Hid. Unlock: M10 complete or explicit chapter-test fixture.
- Purpose: Discover Gucki Paste's three linked functions and why sudden deprivation would endanger Grevyn.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:refuge; frame/layout from registry. In-person scene candidates: CAL TAY RIPED MERRIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: LAB. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: PASTE (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M11:dose_log` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "Three columns repeat on every page: body, field and compliance." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M11.s1 - Audit the dosing station.** Read administration logs without dispensing anything to a person. Implementation: Read three dosing channels and dated chart; apparatus is locked against dispensing to anyone. Completion predicate is the conjunction of these authored checks. Emit `lh2:M11:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M11.s2 - Recover observation films.** Compare lucidity, instability and physical decline across dated sessions. Implementation: Sort three sessions: reduced control, unstable residual field, bodily decline; revision allowed with captions. Completion predicate is the conjunction of these authored checks. Emit `lh2:M11:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M11.s3 - Plan a substitute.** Mark the medical support system and locate a stabilizer research reference. Implementation: Identify separate support feed and substitute research reference; journal states no hidden exploration countdown. Completion predicate is the conjunction of these authored checks. Emit `lh2:M11:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Acknowledge that withholding Paste is not a rescue plan. No option administers or withholds real treatment by guesswork.

**Failure and recovery.** All research is fictional. Puzzle uses inventory seals and document ordering, not a real chemical recipe.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M11.A` / Three things at once: Follow Tay through the dosing bay. Close focus on three labelled channels in a fictional apparatus: somatic support, field regulation, compliance. Avoid syringes in close-up; environmental restraint marks convey abuse without spectacle. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M11.B` / The lucid interval: Projection of Grevyn's own lab recording, visibly dated. Frame the screen in a neutral room, not as an apparition. Her speech is exhausted but exact. Cut to the player-controlled notebook after the entire recording. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M11.C` / Do not make it a countdown: At the workbench, Tay marks unknowns on a fictional treatment chart. The guide for players explicitly says exploration is not running down an unseen biological timer. Road Force confirms residual energy can still threaten them. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M11` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M12 - Something She Hid

- Status: NOT_IMPLEMENTED. Chapter: Chapter 4 - The Cure She Hid. Unlock: M11 complete or explicit chapter-test fixture.
- Purpose: Recover Grevyn's first hidden Golghis research and her testimony during lucid captivity.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:refuge; frame/layout from registry. In-person scene candidates: CAL TAY RIPED; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ARCHIVE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: BLUE_PAGES (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M12:false_shelf` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The shelf depth changes beneath the blue maintenance mark." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M12.s1 - Read the maintenance trail.** Match three harmless-seeming repair requests to room positions. Implementation: Collect three repair slips; translate bay numbers using maintenance board rather than memorized code. Completion predicate is the conjunction of these authored checks. Emit `lh2:M12:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M12.s2 - Open the false shelf.** Use Grevyn's map-cabinet habit to find her notebook compartment. Implementation: Inspect shelf depth and open blue-marked false compartment after examining cabinet method in journal. Completion predicate is the conjunction of these authored checks. Emit `lh2:M12:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M12.s3 - Recover her voice.** Play her warning and preserve the notebook separately from its copy. Implementation: Copy clinical notebook; choose PERSONAL playback or defer it without losing formula facts. Completion predicate is the conjunction of these authored checks. Emit `lh2:M12:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Cal can hear a personal note now or later. The clinical findings are mandatory and her intimate recording is never public currency.

**Failure and recovery.** No memory trivia lock: the prologue journal recalls the cabinet method. All clue objects remain available after discovery.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M12.A` / Repairs she did not need: Track Cal counting shelf bays while TayJ reads maintenance requests over radio. At the false shelf, use a 3-second oblique view revealing a depth mismatch. The hint activates only after two legitimate searches. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M12.B` / For whoever finds this: Notebook found. Static medium shot while Grevyn's recorded voice plays; do not animate a hallucinated Grevyn speaking to Cal. Her research owns the scene. Object close-up shows the name Golghis, not an invented real medical formula. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M12.C` / A note he can leave closed: Player choice before personal recording. If declined, it stays in private journal for later. Camera stays at respectful distance; no forced tears. The research copy is sealed before departure. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M12` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M13 - Golghis

- Status: NOT_IMPLEMENTED. Chapter: Chapter 4 - The Cure She Hid. Unlock: M12 complete or explicit chapter-test fixture.
- Purpose: Establish the viable treatment path and a transparent rescue preparation checklist.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:workshop; frame/layout from registry. In-person scene candidates: CAL TAY RIPED DAIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: HOME. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: BLUE_PAGES (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M13:corrected_index` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The west-facing map symbol marks Grevyn's corrected pages." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M13.s1 - Reconstruct the index.** Separate lucid corrections from compromised notebook pages. Implementation: Sort corrected west-symbol pages from retained failed drafts; error feedback points to Grevyn warning. Completion predicate is the conjunction of these authored checks. Emit `lh2:M13:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M13.s2 - Consult the specialist trail.** Identify Dr. Sable Nadir's annotations and captivity location. Implementation: Read Sable margin initials and current holding transfer code; add rescue objective rather than claim she is present. Completion predicate is the conjunction of these authored checks. Emit `lh2:M13:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M13.s3 - Make a rescue ledger.** List missing pages, support medium, sealed carrier and catalyst activation. Implementation: Create visible four-part preparation ledger and FULL/FAST intent; mark every recovery objective. Completion predicate is the conjunction of these authored checks. Emit `lh2:M13:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Commit to the full investigation or mark a provisional faster route. Both remain reversible until final consent.

**Failure and recovery.** Checklist always shows known, missing and replaceable components. It does not call incomplete Paste safe.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M13.A` / A plan with missing pieces: At a workshop board, follow Cal pinning Grevyn's handwritten index beside Tay's support chart. Player sorts page symbols; accessible list selection does the same task. Camera never auto-solves the order. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M13.B` / What preparation buys: UI checklist comes after the spoken explanation. Each item has an explicit effect: complete formula, verified support, activated catalyst, working containment, enough force reserve or replacement capacitors. No percentage promise yet. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M13.C` / Who gets to decide: Crew discussion at camp. Follow Tay stepping away to her own clinic radio call before returning, showing her life beyond Cal. Cal may disagree without relationship-score punishment. Save the chosen plan as intent, not outcome. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M13` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M14 - The Missing Work

- Status: NOT_IMPLEMENTED. Chapter: Chapter 5 - A Way to Keep Her Here. Unlock: M13 complete or explicit chapter-test fixture.
- Purpose: Recover Grevyn's corrected research from a mobile laboratory route.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:fieldlab; frame/layout from registry. In-person scene candidates: CAL RIPED DAIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: LAB. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: BLUE_PAGES (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M14:maintenance_locker` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The locker label uses the same west-facing map symbol." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M14.s1 - Trace the field lab.** Follow dated service receipts to a deserted mobile-lab bay. Implementation: Visit trailer service receipt at field-lab yard; find side entrance without cutting through solid wall. Completion predicate is the conjunction of these authored checks. Emit `lh2:M14:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M14.s2 - Recover three corrections.** Search the desk, cold store and maintenance locker using the index. Implementation: Recover corrections from desk, cold-store sleeve and maintenance locker; each flag latches separately. Completion predicate is the conjunction of these authored checks. Emit `lh2:M14:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M14.s3 - Verify the sequence.** Send page identifiers to Tay and preserve the redacted experiment victims list. Implementation: Match page identifiers on index; protected victim ledger custody choice remains private. Completion predicate is the conjunction of these authored checks. Emit `lh2:M14:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Release victim names privately to families or retain them with an independent archive; never broadcast them over open radio.

**Failure and recovery.** Each research page is separately journaled. Missing cargo can be replaced from the verified scan at the relay.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M14.A` / A lab on wheels: Follow Cal alongside the abandoned trailer, avoiding its blocked front door; a wide shot shows a viable side entrance. Small reflection on a service receipt suggests the trail without a giant beam through walls. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M14.B` / The corrected sequence: After collection, player aligns page identifiers with Grevyn's audio. Camera pushes only to the crossed-out field, not a readable real chemical process. Warnings distinguish deliberately false notes from her recovered corrections. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M14.C` / Names are people: Cal finds victim records tucked with the corrections. Hold a quiet static shot, no collectible jingle. The choice concerns protected custody, not whether to keep evidence. Dain begins constructing the cargo cradle nearby. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M14` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M15 - Someone Who Can Read It

- Status: NOT_IMPLEMENTED. Chapter: Chapter 5 - A Way to Keep Her Here. Unlock: M14 complete or explicit chapter-test fixture.
- Purpose: Find Sable's current detention route and secure help without trading away other prisoners.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:junction; frame/layout from registry. In-person scene candidates: CAL RIPED NESS TAY DAIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ROAD_DAY. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: MISSING (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M15:transfer_slip` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "Look for Sable's clinic code beneath the freight number, not her full name." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M15.s1 - Visit the transfer market.** Compare three route slips with Ness's supply ledger. Implementation: Compare three delivery slips with current clinic code; choose correct recent holding route, feedback permits correction. Completion predicate is the conjunction of these authored checks. Emit `lh2:M15:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M15.s2 - Trace the convoy.** Follow abandoned tire marks to the holding-facility service district. Implementation: Follow three physical road markers to service-district overlook; do not expose interior prison layout. Completion predicate is the conjunction of these authored checks. Emit `lh2:M15:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M15.s3 - Arrange extraction.** Prepare a clinic vehicle and an independent civilian evacuation line. Implementation: Prepare clinic van, clear quiet bypass and/or support civilian route; flags change M21 approach only. Completion predicate is the conjunction of these authored checks. Emit `lh2:M15:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Assist displaced civilians for a safer extraction route or repair the service bypass for a quieter one. Both can be completed.

**Failure and recovery.** The prison visit occurs later in M18-M21. This mission provides intelligence, not a fake rescue already completed.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M15.A` / A route is not a warrant: Public records stall. Track Ness bringing Cal a supply ledger; keep refugees in the scene as autonomous people. Player must compare dates before a route pin appears. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M15.B` / An extraction for more than one: At the service district overlook, camera follows Dain positioning the clinic van behind cover, then returns before player selects a bypass. No hostile base map reveals unexplored interior rooms. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M15.C` / A voice on a test channel: Sable's short intercepted message confirms survival and a medical transfer list. Speaker is offscreen, physically elsewhere. Camera stays on the receiver and Cal's notes, no impossible cut to a place the crew has not seen. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M15` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M16 - Cargo Worth Taking

- Status: NOT_IMPLEMENTED. Chapter: Chapter 5 - A Way to Keep Her Here. Unlock: M15 complete or explicit chapter-test fixture.
- Purpose: Collect fictional sealed medical support components and transport them without harming local care.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:supply; frame/layout from registry. In-person scene candidates: CAL TAY RIPED DAIN NESS; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ROAD_DAY. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: CONVOY (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M16:case_latches` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The case is not secured until both orange cradle straps are fastened." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M16.s1 - Source the components.** Obtain a sealed support cartridge, inert carrier gel and insulated transport case. Implementation: Inventory sealed support cartridge, inert carrier and case; protected clinic last-stock cannot be looted. Completion predicate is the conjunction of these authored checks. Emit `lh2:M16:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M16.s2 - Earn replacements.** Restore a community refrigeration unit or make a reciprocal supply run. Implementation: Repair compressor mounting and belt or complete a 10 km reciprocal run; either creates surplus stock. Completion predicate is the conjunction of these authored checks. Emit `lh2:M16:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M16.s3 - Protect the shipment.** Secure the cradle, cool it at two checkpoints and deliver to the workshop. Implementation: Fit cradle, secure two straps and complete two leg-based cooling checks; explicit damage opens replacement run. Completion predicate is the conjunction of these authored checks. Emit `lh2:M16:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Raid abandoned stock or earn clinic surplus; taking clinic essentials is explicitly blocked. Cargo damage opens replacement work.

**Failure and recovery.** Temperature uses leg-based checks, not a hidden real-time timer while paused or exploring. Guaranteed replacement mission remains before M35.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M16.A` / Not their last box: Clinic store, warm daylight and a working fan. Follow Tay examining seals while Cal reads the stock card. No threatening music for a supply negotiation. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M16.B` / The cradle: Playable repair and loading. A 4-second tracking insert follows the case into Dain's cradle, ending on two unfastened straps as an interaction hint. Camera releases before fastening; no auto-completion. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M16.C` / A choice that is visible: At a threatened supply detour, slow the action into an explicit route decision before any cargo loss. Show resource preview and replacement location. The player can protect cargo, rescue stranded civilians with a detour, or do both with extra work. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M16` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M17 - The Warning

- Status: NOT_IMPLEMENTED. Chapter: Chapter 5 - A Way to Keep Her Here. Unlock: M16 complete or explicit chapter-test fixture.
- Purpose: Learn the cost of the road force's help and prepare for a government-building evidence search.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:ridge; frame/layout from registry. In-person scene candidates: CAL RIPED TAY TAYJ; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ROAD_DUSK. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: ROAD_FORCE (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M17:passive_repeater` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The relay can carry the message if its ground cable is reconnected." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M17.s1 - Reach the ridge relay.** Repair a passive repeater instead of requesting an immediate intervention. Implementation: Reconnect passive repeater ground or authorize one-reserve gate lift; repair is always available. Completion predicate is the conjunction of these authored checks. Emit `lh2:M17:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M17.s2 - Test the warning.** Observe a small controlled physical intervention and its measurable depletion. Implementation: Read meter before and after controlled event; no physical effect charges twice on reload. Completion predicate is the conjunction of these authored checks. Emit `lh2:M17:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M17.s3 - Plan the archive entry.** Agree check-ins, exit signals and a missing-contact response. Implementation: Give paired recorder, enable second transmitter, acknowledge two-check-in response plan before archive entry. Completion predicate is the conjunction of these authored checks. Emit `lh2:M17:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Ask for physical help or do the repair; the cost is shown first. Restoration options later prevent a hidden early-choice bad ending.

**Failure and recovery.** No intervention spends unconfirmed reserve. A minimum narrative display can be free; physical work costs persistent reserve.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M17.A` / Something moves: At a ridge maintenance hut, follow Cal to a fallen gate. Road Force offers to lift it; the player may repair the winch instead. Its spectral field is sparse amber dust following road seams, distinct from Dominion's cold electrical geometry. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M17.B` / What it will not say: Static shot of the receiver's depleted or preserved field display. Road Force acknowledges the need for equipment but withholds its past involvement; stage a short silence and let Cal react. No fake objective suggests its whole story is known. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M17.C` / Check in before going in: At camp, follow TayJ handing Cal a paired recorder while Tay checks his old injury. Riped watches the exit code being agreed. Cal and Riped will search the archive while Tay and TayJ maintain the outside contact route. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M17` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M18 - Abandoned

- Status: NOT_IMPLEMENTED. Chapter: Chapter 6 - The Empty Cell. Unlock: M17 complete or explicit chapter-test fixture.
- Purpose: Search an allegedly abandoned government building with Riped and suffer a staged ambush.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:government; frame/layout from registry. In-person scene candidates: CAL RIPED VOSS; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ARCHIVE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: HOLDING (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M18:warm_terminal` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The terminal fan is running beneath the dusty counter." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M18.s1 - Search the public offices.** Recover a current transfer index and signs of recent occupation. Implementation: Inspect fresh footprints and running terminal; optional equipment retreat before secure-wing commit. Completion predicate is the conjunction of these authored checks. Emit `lh2:M18:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M18.s2 - Reach the secure wing.** Open a manual archive gate after a warning about active defenses. Implementation: Recover current transfer index and Grandpa authorization; ambush begins after evidence copy commits. Completion predicate is the conjunction of these authored checks. Emit `lh2:M18:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M18.s3 - Survive the ambush.** Retreat toward cover; scripted capture follows without pretending it was avoidable. Implementation: Short retreat ends in authored restraint; cannot win capture away; keep recovered document copies and transition to holding. Completion predicate is the conjunction of these authored checks. Emit `lh2:M18:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Stealth or cautious entry changes recovered supplies. This is a clearly staged capture sequence, not punishment for choosing the wrong route.

**Failure and recovery.** Save before entry and after capture. Preserve all evidence in journal; confiscated physical gear is recoverable in M20.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M18.A` / Dust with footprints: Follow Cal and Riped through the lobby, 6 seconds, framing fresh boot marks crossing dust. A 3-second focus on the running terminal fan hints that the building is occupied. Player can retreat to check equipment before committing. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M18.B` / The living index: Secure archive. Player photographs a present-day Grevyn transfer record and Grandpa's conditioning authorization. A camera follow tracks Cal returning toward the exit, not deeper into an invisible trigger. Door movement and footfalls warn of the ambush. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M18.C` / Capture: Gameplay offers a short, survivable retreat to cover; capture is the authored endpoint. Voss orders nonlethal restraint. Cut from Cal reaching a blocked exit to an intake table with a clear time transition. Do not force a long unwinnable shootout. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M18` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M19 - Intake

- Status: NOT_IMPLEMENTED. Chapter: Chapter 6 - The Empty Cell. Unlock: M18 complete or explicit chapter-test fixture.
- Purpose: Observe detention routines, retain evidence and start an escape without knowing Riped was released.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:holding; frame/layout from registry. In-person scene candidates: CAL RIPED VOSS SABLE; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: PRISON. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: HOLDING (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M19:service_hatch` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "Cool air comes through the lower maintenance grille." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M19.s1 - Learn the routine.** Inspect cell, service hatch and guard-change sounds. Implementation: Inspect cell grille, bed fastener and guard-route sound cue; actions advance time without idle waiting. Completion predicate is the conjunction of these authored checks. Emit `lh2:M19:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M19.s2 - Contact Riped.** Speak through the wall before his covert removal. Implementation: Speak through wall, receive paired signal; Riped removal remains unseen and locks his later presence. Completion predicate is the conjunction of these authored checks. Emit `lh2:M19:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M19.s3 - Reach the service corridor.** Use a maintenance access during a power interruption. Implementation: Open vent mechanically or authorize one-reserve latch break; reach corridor and speak with Sable behind door. Completion predicate is the conjunction of these authored checks. Emit `lh2:M19:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Cal can request Road Force help after seeing its cost or use the mechanical route. Both keep a later recovery path.

**Failure and recovery.** No real-time solitary wait. Interactions advance routines. Captured evidence is copied, not deleted; later item restitution is idempotent.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M19.A` / Two cells: Camera follows Cal into a ground-level cell, never through locked walls. Riped is heard in an adjacent cell. A tray scrape and distant transformer identify the mechanical escape route. No audience-only release scene yet. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M19.B` / A quieter offer: Receiver recovered from a gap in intake wiring carries the Road Force. Player can instead use a metal bed fastener to open the grille. The camera hints at moving dust near the vent only after Cal examines airflow. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M19.C` / The corridor: After the hatch opens, track Cal crouching into the service corridor for 5 seconds, ending before a junction decision. An empty stretcher and disconnected camera lead toward confiscated property. Far off, a controlled blast masks Riped's staged cell breach. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M19` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M20 - The Hole in the Wall

- Status: NOT_IMPLEMENTED. Chapter: Chapter 6 - The Empty Cell. Unlock: M19 complete or explicit chapter-test fixture.
- Purpose: Recover gear and find Riped's apparently blasted-open cell, mistaking a staged release for escape.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:holding; frame/layout from registry. In-person scene candidates: CAL SABLE; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: PRISON. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: EMPTY_CELL (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M20:riped_cell` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "Dust on the floor changes near the service wing; follow the numbered cell signs." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M20.s1 - Recover confiscated items.** Open property storage and reconcile every essential item. Implementation: Reconcile property ledger with protected inventory; recovered item transaction uses mission key. Completion predicate is the conjunction of these authored checks. Emit `lh2:M20:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M20.s2 - Reach Riped's cell.** Inspect the empty room and outward-blown wall. Implementation: Photograph Riped cell breach and intact latch; journal records possible escape, not false certainty. Completion predicate is the conjunction of these authored checks. Emit `lh2:M20:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M20.s3 - Commit to extraction.** Leave a rendezvous mark and return for Sable and the other prisoners. Implementation: Leave paired-channel rendezvous strip then return to Sable; do not require finding microscopic blast evidence. Completion predicate is the conjunction of these authored checks. Emit `lh2:M20:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Cal may notice the unusual blast but lacks enough proof yet. He reasonably assumes Riped escaped; do not make him ignore obvious evidence.

**Failure and recovery.** Essential inventory ledger restores each item once. Cell evidence can be revisited in final disclosure; no hidden inspection requirement for a good ending.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M20.A` / Everything they took: Follow Cal opening the property cage, then insert the stamped seizure list beside his kit. Player checks essential cargo and recorder. Archived scans remain intact even if a noncritical item is absent. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M20.B` / An exit made for one: Camera follows Cal to Riped's cell, 5 seconds; widen to reveal the broken wall. No suspicious dossier conveniently explains everything. Blast residue and undamaged latch can be examined but are marked ambiguous until later release documents. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M20.C` / Not waiting for a ghost: Cal places the crew's rendezvous strip outside the breach; camera follows his hand back to the escape corridor, returning control before enemy patrols resume. No objective suggests Riped actually died or genuinely escaped. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M20` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M21 - Bring Someone With You

- Status: NOT_IMPLEMENTED. Chapter: Chapter 6 - The Empty Cell. Unlock: M20 complete or explicit chapter-test fixture.
- Purpose: Free Sable and other detainees, evacuate with the crew and discover enough release evidence to suspect Riped.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:holding; frame/layout from registry. In-person scene candidates: CAL TAY DAIN SABLE; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: EVAC. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: EXTRACTION (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M21:lock_feed` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The clinic locks share the labelled service breaker, separate from life support." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M21.s1 - Free the clinic wing.** Open the service locks and move injured detainees to cover. Implementation: Isolate labelled lock breaker only; open all reachable clinic rooms and register four protected evacuees. Completion predicate is the conjunction of these authored checks. Emit `lh2:M21:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M21.s2 - Reach the extraction.** Use either prepared road; escort without fragile-NPC fail states. Implementation: Escort to service exit; grounded cover and optional diversion prevent fragile-NPC instant failure. Completion predicate is the conjunction of these authored checks. Emit `lh2:M21:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M21.s3 - Treat and debrief.** Stabilize escapees, verify research and decode a partial release entry. Implementation: Treat at clinic, review partial release timestamp and verify Sable recognizes corrected research. Completion predicate is the conjunction of these authored checks. Emit `lh2:M21:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Quiet release or public diversion affects pursuit pressure. Both save all reachable captives; no reward for abandoning an injured prisoner.

**Failure and recovery.** Downed allies receive assisted movement; rescue checkpoint preserves evacuee count. Replacements for lost Paste supplies are offered explicitly.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M21.A` / Not an experiment: Follow Sable leaving her room at normal speed, stopping to assist another detainee. Player disconnects only labelled lock power. A shot along the corridor shows both cover and the service exit before pursuit starts. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M21.B` / The van: Track the stretcher from behind at walking pace for 6 seconds while Dain and Tay load it. No camera hijack during active fire: this shot begins only after the doors and smoke screen secure the loading bay. Gameplay then controls the escape drive. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M21.C` / A release, not a breach: Safe clinic debrief. A partially recovered release ledger marks Riped's cell cleared before the blast; not yet a full confession. Camera focuses on the two timestamps only after decoding. Sable recognizes Grevyn's corrections and supports a real plan. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M21` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M22 - The Catalyst

- Status: NOT_IMPLEMENTED. Chapter: Chapter 7 - What the Road Remembers. Unlock: M21 complete or explicit chapter-test fixture.
- Purpose: Retrieve a fictional field catalyst from a contaminated road research station.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:catalyst; frame/layout from registry. In-person scene candidates: CAL; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: STORM. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: CATALYST (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M22:inert_core` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "Only the socket with the unlit outer ring is safe to open." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M22.s1 - Survey the station.** Read the hazard chart and isolate a safe path using portable sensors. Implementation: Read hazard chart and measure three stable marker posts; portable sensor uses text and tone. Completion predicate is the conjunction of these authored checks. Emit `lh2:M22:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M22.s2 - Recover the inert core.** Disable two field relays, then transport the catalyst in its shielded case. Implementation: Isolate west and service field relays; retrieve inert core from unlit-ring socket with labelled safety confirmation. Completion predicate is the conjunction of these authored checks. Emit `lh2:M22:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M22.s3 - Exit without exposure.** Navigate a displaced-road anomaly with TayJ's physical landmarks. Implementation: Follow cable to truck and stable exit; optional passive repair grants one of three reserve capacitors. Completion predicate is the conjunction of these authored checks. Emit `lh2:M22:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Restore a passive bypass or request a priced Road Force intervention. Grevyn's survival never depends on an unannounced early test.

**Failure and recovery.** Anomaly resets move the truck to the last stable turnout, preserving cargo. No flashing navigation dependency; labels and tones duplicate color.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M22.A` / Roads that disagree: Track the crew stopping before an impossible road split. The wide shot shows one physical barrier and two inconsistent horizons. On-foot sensors reveal stable ground; the camera never points the player into an active lethal zone. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M22.B` / An inert piece of a bargain: Follow Cal carrying the shielded case from station entrance to workbench at 1 m/s; insert the unlit ring only after he reads the socket instructions. The catalyst is invented supernatural material, never described as a real extract or chemical. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M22.C` / The way back is marked: A short rear vehicle follow shows Dain's cable and marker posts, then returns full drive control. Optional rescue of trapped scavengers costs route time only; passive repair earns a stored capacitor that can later replace depleted reserve. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M22` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M23 - What the Road Gives

- Status: NOT_IMPLEMENTED. Chapter: Chapter 7 - What the Road Remembers. Unlock: M22 complete or explicit chapter-test fixture.
- Purpose: Activate the catalyst with informed consent and establish concrete reserve recovery options.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:ridge; frame/layout from registry. In-person scene candidates: CAL TAY TAYJ SABLE; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ROAD_DUSK. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: ROAD_FORCE (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M23:field_meter` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The meter is connected only when both labelled leads are seated." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M23.s1 - Prepare the test rig.** Install a receiver, shield and field meter. Implementation: Connect isolated field meter and two labelled leads; show cost before activation button becomes active. Completion predicate is the conjunction of these authored checks. Emit `lh2:M23:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M23.s2 - Authorize activation.** See the reserve cost, then activate or first rebuild capacitor support. Implementation: Confirm two-reserve cost once; optional rebuild adds capacitor capacity, activation success charges once. Completion predicate is the conjunction of these authored checks. Emit `lh2:M23:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M23.s3 - Store the result.** Verify field polarity, seal the core and record the remaining reserve. Implementation: Verify corrected polarity, latch core case and record both remaining reserve and equivalent capacitor capacity. Completion predicate is the conjunction of these authored checks. Emit `lh2:M23:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Activation costs two reserve units. Optional capacitors add equivalent severing capacity, not life to the Road Force. Restore enough before final consent.

**Failure and recovery.** The essential catalyst cannot be permanently destroyed. Failed housing checks return it inert for a safe repeat without double-charging reserve.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M23.A` / Before the meter moves: Ridge workbench at dusk. Track TayJ fitting the meter, then hold a wide showing Road Force's amber field separate from the blue sealed catalyst. Player sees the exact cost panel before choosing. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M23.B` / Activation: Six-second still-wide transformation, then 4-second close view of catalyst bands stabilizing. Amber filaments pass into the core; receiver reserve falls by exactly two once success commits. Reduced-flash option substitutes steady illumination and a low tone. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M23.C` / A debt made visible: Follow Cal putting the catalyst into the secured cradle. If reserve is below final threshold, TayJ points to an explicit capacitor rebuild task before travel resumes. No invented successful asset or audio claim: these are screenplay cues for future production. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M23` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M24 - Finish Her Work

- Status: NOT_IMPLEMENTED. Chapter: Chapter 7 - What the Road Remembers. Unlock: M23 complete or explicit chapter-test fixture.
- Purpose: Prepare verified Golghis Paste and give explicit opportunities to replace anything lost or skipped.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:workshop; frame/layout from registry. In-person scene candidates: CAL TAY DAIN SABLE; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: LAB_WARM. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: GOLGHIS (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M24:verification_tray` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The blank verification cards are beside Grevyn's corrected index." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M24.s1 - Audit missing work.** Compare corrections, stock seals, catalyst and specialist review in a four-part ledger. Implementation: Evaluate all research, Sable, stock, catalyst and support flags; enumerate concrete missing IDs in UI. Completion predicate is the conjunction of these authored checks. Emit `lh2:M24:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M24.s2 - Recover gaps.** Complete any missing-page, replacement-stock or capacitor salvage tasks. Implementation: Replacement work revisits field-lab, supply and salvage routes without despawning evidence or excluding survivors. Completion predicate is the conjunction of these authored checks. Emit `lh2:M24:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M24.s3 - Prepare and verify.** Let Sable and Tay run Grevyn's fictional three-check process and seal doses. Implementation: Run three fictional labelled checks; all pass creates VERIFIED, otherwise labelled PROVISIONAL; no real chemical instruction. Completion predicate is the conjunction of these authored checks. Emit `lh2:M24:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** A planned batch requires all checks. An incomplete batch is labelled emergency-only, with a later final repair opportunity.

**Failure and recovery.** No irreversible commit here. Missing Sable is resolved by returning to the service route; in this linear story her rescue is mandatory.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M24.A` / Everything on the bench: Slow lateral follow along supplies to Grevyn's notebook, ending on the empty verification cards. UI explicitly lists each missing prerequisite and exact recovery objective. No vague readiness percentage. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M24.B` / Golghis: Preparation montage follows hands, labels and verification lights, not a real actionable recipe. Three brief inserts are separated by playable equipment checks. Grevyn's recorded words guide the work. The music is warm but unresolved. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M24.C` / Not a cure for everything: After the batch is sealed, follow Cal taking a meal with the crew. He may ask to sit with Tay, call TayJ or rest alone with a scheduled check-in. These are characterization choices, not an approval test. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M24` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M25 - The First Prison

- Status: NOT_IMPLEMENTED. Chapter: Chapter 8 - The Road's Bargain. Unlock: M24 complete or explicit chapter-test fixture.
- Purpose: Survey the original Road Force containment site and prepare it for voluntary severing instead of imprisonment.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:firstprison; frame/layout from registry. In-person scene candidates: CAL TAY TAYJ SABLE DAIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: CONTAINMENT. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: FIRST_PRISON (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M25:manual_bypass` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The release wheel is painted on both sides; it was built to turn from inside as well." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M25.s1 - Reach the site.** Drive the service access and verify a stable medical vehicle route. Implementation: Survey medical vehicle access and treatment-room exit; use firstprison local ramp, no stairs. Completion predicate is the conjunction of these authored checks. Emit `lh2:M25:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M25.s2 - Survey the equipment.** Inspect three field clamps, the manual bypass and accessible treatment platform. Implementation: Inspect three clamps, bypass wheel and platform power; source equipment roles labelled separately. Completion predicate is the conjunction of these authored checks. Emit `lh2:M25:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M25.s3 - Make it usable.** Repair floor access, lighting and reserve capacitor mounts. Implementation: Remove coercive locks, repair ramp and capacitor mounts; stretcher route test must pass before staging flag. Completion predicate is the conjunction of these authored checks. Emit `lh2:M25:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Dismantle coercive locks while retaining field guidance. Never present rebuilding a prison as morally neutral treatment.

**Failure and recovery.** Site geometry is single-storey to match current engine constraints. All critical paths have accessible ramps and redundant manual releases.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M25.A` / The place it remembers: Wide approach from the truck, then follow Cal and TayJ through a ground-level service door. The camera pauses at inside-facing manual release markings. Amber Road Force presence is thin here, not triumphant. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M25.B` / A room with exits: Playable repairs. A 5-second tracking shot follows Dain pushing a stretcher along the complete entrance-to-platform route, demonstrating usable clearance. A 3-second insert hints at a broken capacitor mount only after the system survey. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M25.C` / The old recording: Player opens a sealed historical recorder. It identifies the Road Force's bargain but stops before its full confession; next mission provides corroboration. Camera follows Cal taking the recorder outside for a crew conversation, not a surprise jump scare. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M25` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M26 - The Bargain

- Status: NOT_IMPLEMENTED. Chapter: Chapter 8 - The Road's Bargain. Unlock: M25 complete or explicit chapter-test fixture.
- Purpose: Expose the Road Force's responsibility and independently verify its failed intervention.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:firstprison; frame/layout from registry. In-person scene candidates: CAL TAY SABLE; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: ARCHIVE. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: CONFESSION (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M26:damage_log` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The attempted shutdown is dated after the first exposure, before Grevyn's transfer." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M26.s1 - Hear the full admission.** Listen with the crew and ask direct follow-up questions. Implementation: Play original bargain recorder with full transcript; Road Force answers four mandatory direct questions. Completion predicate is the conjunction of these authored checks. Emit `lh2:M26:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M26.s2 - Corroborate the history.** Compare resistance logs, containment damage and experiment dates. Implementation: Compare experiment start, attempted shutdown and transfer dates; fused relay is corroboration, not sole proof. Completion predicate is the conjunction of these authored checks. Emit `lh2:M26:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M26.s3 - Decide working trust.** Set explicit consent and disclosure terms for continued cooperation. Implementation: Choose FORGIVE, COOPERATE or DISTRUST; consent compact records cost/risk/alternatives disclosure requirement. Completion predicate is the conjunction of these authored checks. Emit `lh2:M26:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Forgive, cooperate without forgiveness or remain openly distrustful. All retain the rescue route; forgiveness is not a survival key.

**Failure and recovery.** No irreversible decision until the confession and corroboration are in the journal. Skipping the cinematic preserves a full readable summary.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M26.A` / What freedom cost: Static group composition in the dismantled containment room. The Road Force speaks without a beautiful visual distraction. Camera holds on listeners between lines. Its explanation does not claim it intended the experiments. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M26.B` / An attempt that did not erase it: Player compares three independent logs. A brief object-focused shot shows fused relay contacts corresponding to a documented shutdown attempt. Road Force's failure is true and does not undo its initiating bargain. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M26.C` / Work without absolution: Player chooses Cal's response. Camera remains at eye level and returns before selection. Crew support is not withdrawn for anger. A working compact is written beside the rescue checklist. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M26` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M27 - Terms of the Rescue

- Status: NOT_IMPLEMENTED. Chapter: Chapter 8 - The Road's Bargain. Unlock: M26 complete or explicit chapter-test fixture.
- Purpose: Rehearse severing, disclose the sacrifice cost and verify a guaranteed preparation route remains open.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:firstprison; frame/layout from registry. In-person scene candidates: CAL TAY TAYJ SABLE DAIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: CONTAINMENT. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: TERMS (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M27:test_dummy` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The weighted test cradle is for equipment checks, not a person." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M27.s1 - Run a dry test.** Test support and containment separately without a person on the platform. Implementation: Run empty weighted cradle through support isolation, guidance and manual-release tests. Completion predicate is the conjunction of these authored checks. Emit `lh2:M27:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M27.s2 - Learn all three routes.** Review prepared severing, emergency treatment and fatal transfer. Implementation: Review three routes and explicit fatal costs; knowledge flags record comprehension, not agreement to die. Completion predicate is the conjunction of these authored checks. Emit `lh2:M27:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M27.s3 - Finish staging.** Place a spare vehicle, medical support and power reserve; leave a recovery itinerary. Implementation: Stage return fuel, spare battery and capacitor itinerary; all gaps retain recovery markers for M34. Completion predicate is the conjunction of these authored checks. Emit `lh2:M27:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Choose an intended plan now, revisable at M35. Explain that transfer kills Cal, and successful severing consumes the Road Force.

**Failure and recovery.** Display unmet conditions and routes to fix them. Do not permit a ceremonial yes to silently lock a later sacrifice.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M27.A` / The empty platform: Follow Cal wheeling a test cradle into position, then step out to a wide view of clear exits and manual releases. Run no live field against a person. Each indicator has a text label and sound distinct from an alarm. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M27.B` / The choice nobody owes: Static table conversation. Explicit fatal-sacrifice explanation, no heroic swell urging selection. Player can ask again. The supernatural transfer mechanism is stated as a voluntary channel, not a blood ritual or real-world method. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M27.C` / Leave a way back: Follow TayJ placing the recovery itinerary on the truck dashboard. Player stages fuel, replacement parts and a second receiver. No hidden force-reserve requirement remains after this inspection. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M27` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M28 - The Regime's Future

- Status: NOT_IMPLEMENTED. Chapter: Chapter 9 - Someone She Trusted. Unlock: M27 complete or explicit chapter-test fixture.
- Purpose: Enter the reconstruction complex and expose Grandpa Gucki's bargain with the Dominion.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:citadel; frame/layout from registry. In-person scene candidates: CAL; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: REGIME. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: REGIME (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M28:command_record` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The signed authorization is in the command desk's locked side drawer." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M28.s1 - Approach with faction support.** Use earned civilian routes or complete a local service bypass. Implementation: Use community access or build service bypass; legacy random encounters excluded within authored perimeter. Completion predicate is the conjunction of these authored checks. Emit `lh2:M28:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M28.s2 - Collect the command record.** Recover Grandpa's knowing authorization and current conditioning orders. Implementation: Unlock command side drawer through found desk key; record willing bargain and protect victim identities. Completion predicate is the conjunction of these authored checks. Emit `lh2:M28:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M28.s3 - Reach the audience wing.** Disable the perimeter relay without cutting medical support. Implementation: Cut perimeter relay, not medical feed; reach audience-wing safe room and hear Riped before entering. Completion predicate is the conjunction of these authored checks. Emit `lh2:M28:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Publicly release regime orders with protected victim identities or deliver them to independent settlements. Both preserve accountability.

**Failure and recovery.** No forced combat loadout. Support, stealth and vehicle diversion routes reach the same protected rendezvous.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M28.A` / A government rebuilding itself: Wide shows the complex's flags and restored power grid. Follow Cal moving past a truck checkpoint using the chosen route; never reveal a free-roam roadblock as this fixed authored site. Propaganda music is diegetic and can be muted separately. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M28.B` / A willing bargain: Command records and a recent recorded confrontation reveal both parties. Shot over Cal's shoulder keeps the document readable; cut to the screen only when he chooses playback. Grandpa is not an innocent possessed leader. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M28.C` / The friend already inside: Audience-wing door. Riped's voice is audible ahead, calling Cal dangerous. Follow Cal to the doorway for 4 seconds; stop before he can see Grevyn. Return control for the final medical and evidence check. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M28` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M29 - You Never Came Back

- Status: NOT_IMPLEMENTED. Chapter: Chapter 9 - Someone She Trusted. Unlock: M28 complete or explicit chapter-test fixture.
- Purpose: Meet the living, changed Grevyn; present the frame-up evidence while respecting her distance and disbelief.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:citadel; frame/layout from registry. In-person scene candidates: CAL GREVYN RIPED; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: STORM_INTERIOR. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: REUNION (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M29:evidence_table` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The clear table is outside Grevyn's reach line; set the case there." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M29.s1 - Approach without force.** Place weapons outside the room and remain behind Grevyn's marked distance. Implementation: Stow weapons in protected locker and approach evidence table behind marked personal-space line. Completion predicate is the conjunction of these authored checks. Emit `lh2:M29:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M29.s2 - Present a full chronology.** Offer originals, unedited audio, false voucher and treatment records. Implementation: Present all six evidence records in order; Grevyn questions them and receives custody facts. Completion predicate is the conjunction of these authored checks. Emit `lh2:M29:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M29.s3 - Make room for truth.** Show Cal's scar only with consent and let Grevyn question both men. Implementation: Ask before showing scar, display optional image or text alternative; combine with rescue chronology and release audio. Completion predicate is the conjunction of these authored checks. Emit `lh2:M29:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Cal can be hurt, angry or measured; no exact phrase makes her magically trust him. All corroborated evidence reaches her.

**Failure and recovery.** Dialogue selection is untimed. A tense camera is not a QTE. If skipped, required facts still display before the next authored scene.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M29.A` / Cal: Grevyn stands at the far end of a damaged audience hall. Slowly track behind Cal entering, then settle into a wide with Riped between them. Her use of Cal triggers his anxiety; the camera steadies instead of simulating dizziness without permission. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M29.B` / Everything except a verdict: Object-by-object evidence sequence. Cal walks only to the agreed table. Inserts show paired documents and full audio; camera returns to Grevyn between exhibits, allowing her to react and ask. No friendship montage substitutes for proof. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M29.C` / Where he was hit: Cal asks before showing the healed gunshot scar. Brief neutral framing, then dress restored. The treatment card and rescue route remain visible; the script explicitly does not treat a scar as proof of who framed him. Riped feels his explanation slipping. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M29` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M30 - The Informer

- Status: NOT_IMPLEMENTED. Chapter: Chapter 9 - Someone She Trusted. Unlock: M29 complete or explicit chapter-test fixture.
- Purpose: Expose Riped's betrayal; stage Grevyn's lethal rage, injurious fall, brief lucid reunion and renewed control.
- Target: 80 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:citadel; frame/layout from registry. In-person scene candidates: CAL GREVYN RIPED TAY; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: STORM_INTERIOR. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: INFORMER (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M30:release_audio` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The restored release entry arrives on the paired receiver; play it at the table." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M30.s1 - Corroborate the release.** Let TayJ deliver the restored prison release authorization. Implementation: TayJ restored Voss release order commits informer proof; field partition creates safe conversation space. Completion predicate is the conjunction of these authored checks. Emit `lh2:M30:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M30.s2 - Hear the confession.** Riped reveals the private details and jealousy while believing Grevyn cannot hear. Implementation: Riped confesses private details, token, edit and motive; Grevyn overhears, rises, kills him and falls in fixed sequence. Completion predicate is the conjunction of these authored checks. Emit `lh2:M30:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M30.s3 - Reach Grevyn after the fall.** Allow Tay to stabilize her after she kills Riped and loses consciousness. Implementation: Tay stabilizes severe injuries; lucid exchange followed by renewed control; checkpoint before nonlethal confrontation. Completion predicate is the conjunction of these authored checks. Emit `lh2:M30:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** No kill-or-spare Riped choice: his death is fixed canon. Cal can protest or freeze, neither is graded as consent.

**Failure and recovery.** Checkpoint before confession and after stabilization. Non-graphic fatal impact. Grevyn's severe injuries persist through every later mission.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M30.A` / A wall opened for him: A brief power surge partitions the hall with translucent field geometry. Grevyn appears withdrawn; Riped believes she cannot hear. Keep sightlines intelligible in a wide. TayJ plays Voss's release order before Riped speaks. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M30.B` / The detail only one friend should know: Tight two-shot Cal and Riped, then reveal Grevyn listening beyond the field. Riped names every private detail he overheard and the planted evidence; not a magical truth spell. His jealousy explains motive without excusing it. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M30.C` / Lightning: Wide camera follows Grevyn rising 3 m, staying outside a 5 m electrical safety radius. Cold arcs circle her; reduced-flash mode uses continuous ribbons and bass tremor. She grabs Riped with the field and slams him once to the floor. Cut to Cal at contact; Riped dies instantly, no gore or ragdoll comedy. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M30.D` / A minute of her own: She loses consciousness and falls onto broken floor, severely injuring her torso and leg. Cal reaches her only after arcs cease. Tay enters from the cleared side with Sable's remote guidance. Use a 6-second floor-level follow of the stretcher team, then static faces. Do not let Cal catch her and erase the injury. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M30.E` / Not finished: A low continuous field tone rises; Grevyn recognizes its return before losing control. The force moves her injured body unnaturally, never healing it. Gameplay resumes in a clear cover position with nonlethal objectives. No further click dismisses the entire confrontation. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M30` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M31 - Break the Connection

- Status: NOT_IMPLEMENTED. Chapter: Chapter 10 - The Passenger. Unlock: M30 complete or explicit chapter-test fixture.
- Purpose: Survive the controlled Grevyn's attack without attacking her; disable the local reinforcement relays.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:citadel; frame/layout from registry. In-person scene candidates: CAL GREVYN TAY; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: STORM_INTERIOR. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: BREAK (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M31:relay_isolator` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "Follow the floor cable to the labelled isolation handle, not the medical line." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M31.s1 - Reach cover.** Move Tay and the injured Grevyn's support equipment behind grounded screens. Implementation: Reach grounded cover; move support cart only in safe field window; no camera steal during threat. Completion predicate is the conjunction of these authored checks. Emit `lh2:M31:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M31.s2 - Disable three relays.** Use mechanical isolation at west, service and dais feeds while avoiding field sweeps. Implementation: Isolate west, service and dais reinforcement feeds with 4-second telegraphs and untimed accessible windows. Completion predicate is the conjunction of these authored checks. Emit `lh2:M31:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M31.s3 - Open extraction.** Let Road Force guide a safe corridor after capacity cost or use the installed screens. Implementation: Choose screen route or priced one-reserve shield; stretcher exit opens after third feed and threat suspension. Completion predicate is the conjunction of these authored checks. Emit `lh2:M31:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Physical Road Force shielding costs one reserve unit after warning; manual grounding preserves reserve. Neither requires shooting Grevyn.

**Failure and recovery.** Attacks telegraph with steady light, tone and floor trace. Downing resets to the room checkpoint, never permanently injures allies or rerolls the ending.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M31.A` / Her warning matters: Gameplay starts behind grounded cover. A 4-second low follow along the floor cable shows the first isolator only after Grevyn's initial sweep stops. Cinematic does not take camera control while danger is active. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M31.B` / The things around her: Player shuts down relays one at a time. Between safe windows, follow Cal from cover to handle for no more than 3 seconds if cinematic assistance is enabled; otherwise maintain gameplay camera. Grevyn's involuntary motion slows with each feed. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M31.C` / Out of the room: When threat pauses, a 6-second follow tracks Tay, Cal and the stretcher through the grounded corridor. No triumphant Grevyn standing animation. Her grip loosens and the field subsides, leaving her severely injured and conscious enough to consent to moving. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M31` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M32 - The Passenger

- Status: NOT_IMPLEMENTED. Chapter: Chapter 10 - The Passenger. Unlock: M31 complete or explicit chapter-test fixture.
- Purpose: Stabilize Grevyn, begin appropriate support and evacuate with ongoing consent where possible.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:extraction; frame/layout from registry. In-person scene candidates: CAL GREVYN TAY DAIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: EVAC. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: PASSENGER (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M32:stretcher_mount` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "Both locking pins must show seated before the vehicle can move." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M32.s1 - Prepare transport.** Secure stretcher, injury supports, support monitor and spare power. Implementation: Fit stretcher rails, two locking pins, independent support power and injury supports. Completion predicate is the conjunction of these authored checks. Emit `lh2:M32:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M32.s2 - Explain the substitute.** Tell Grevyn what Golghis does and what remains unknown; obtain consent in a lucid interval. Implementation: Explain verified versus provisional Golghis; Grevyn consents to available support while lucid. Completion predicate is the conjunction of these authored checks. Emit `lh2:M32:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M32.s3 - Leave the complex.** Load the medical vehicle and depart along the prepared route. Implementation: Load van, monitor stable support and leave only after Tay confirms; escort choice changes player seat, not treatment quality. Completion predicate is the conjunction of these authored checks. Emit `lh2:M32:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Verified Golghis starts planned support; provisional stock remains explicitly emergency-only. If she cannot respond, use the least restrictive stabilization until she can.

**Failure and recovery.** No case opening under gunfire. Support consumables are abstract fictional units; no real dosing or medical instructions.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M32.A` / Ask her: Sheltered loading bay. Static eye-level framing between Tay and Grevyn; Cal remains visible without dominating the conversation. No camera angle makes an injured woman an exhibit. Sable explains through an identified radio channel. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M32.B` / A place in the van: Follow the stretcher rails into the medical vehicle over 5 seconds, ending on a locking pin. Return control for both lock checks. Tay takes the treatment seat, Cal can drive the escort truck or ride briefly while Dain drives. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M32.C` / Not fine: As vehicles idle safely, Grevyn calls Cal by his nickname; he names the anxiety without blaming her for using it. Camera stays steady. Their friendship is unresolved and neither promises immediate reconciliation. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M32` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M33 - The Longest Drive

- Status: NOT_IMPLEMENTED. Chapter: Chapter 10 - The Passenger. Unlock: M32 complete or explicit chapter-test fixture.
- Purpose: Bring Grevyn to the prepared site through pursuit, forced-memory anomalies and quiet intervals.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:returnroad; frame/layout from registry. In-person scene candidates: CAL GREVYN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: STORM. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: LONG_DRIVE (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M33:ground_marker` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The striped post is real; the repeated school doorway is a memory intrusion." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M33.s1 - Clear the pursuit.** Use prepared civilian diversion routes or disable pursuer vehicles without involving civilians. Implementation: Break line of sight for 30 simulated seconds after disabling ridge tracking feed; civilian routes remain protected. Completion predicate is the conjunction of these authored checks. Emit `lh2:M33:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M33.s2 - Anchor the real road.** Navigate field intrusions using TayJ's physical markers and vehicle telemetry. Implementation: Use three-post physical landmarks and telemetry through memory intrusion; pause effects never pauses steering by surprise. Completion predicate is the conjunction of these authored checks. Emit `lh2:M33:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M33.s3 - Reach the first prison.** Make a safe support stop and complete the final approach. Implementation: At marked turnout, check support and hear conversation, then reach first-prison gate at safe speed. Completion predicate is the conjunction of these authored checks. Emit `lh2:M33:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Drive escort, medical van or a split-convoy segment at different stages. Crew travel changes naturally, preserving player vehicle choice when practical.

**Failure and recovery.** No endless chase requiring every vehicle killed. Authored break-contact conditions are distance plus disabled tracking feed; crashes are simulated safely away from civilians.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M33.A` / A road with company: Begin with a rear-left follow of the two vehicles only while safely stationary, then hand driving back before the first threat. Radio voices are clear over engines. Enemy collisions use existing vehicle simulation, not lethal cutscene rails through traffic. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M33.B` / The classroom in the road: Optional cinematic shows a school doorway reflected in the windshield, never replacing the physical road collider. Player retains steering. A brief safe-stop insert recalls the real striped marker. Reduced-effects setting uses subtitle and sound distortion instead of visual warping. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M33.C` / A quiet kilometer: After breaking contact, music loses percussion. Player may stop at a marked turnout without a biological countdown. Follow Cal walking from escort truck to van for 5 seconds, then return for a brief check-in. End at the containment-site gate. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M33` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M34 - Containment

- Status: NOT_IMPLEMENTED. Chapter: Chapter 11 - What We Choose. Unlock: M33 complete or explicit chapter-test fixture.
- Purpose: Give Grevyn the full truth, repair every known gap and obtain informed consent before final treatment.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:firstprison; frame/layout from registry. In-person scene candidates: CAL GREVYN TAY TAYJ SABLE DAIN; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: CONTAINMENT. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: TERMS (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M34:readiness_board` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The board beside the release wheel lists exactly what remains missing." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M34.s1 - Set the room.** Position the medical platform, release wheel and monitors; test three reserve capacitors as needed. Implementation: Test three guidance clamps, separate medical support, reachable release and up to three reserve capacitors. Completion predicate is the conjunction of these authored checks. Emit `lh2:M34:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M34.s2 - Tell the truth.** Explain Road Force's bargain, costs, all viable procedures and available recovery routes. Implementation: Grevyn hears full bargain and routes; Sable reviews board; player can choose any recovery task before consent. Completion predicate is the conjunction of these authored checks. Emit `lh2:M34:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M34.s3 - Choose readiness.** Review the explicit checklist; freely leave to repair gaps before sealing the consent record. Implementation: Grevyn consents after disclosure; save procedure-ready snapshot, never auto-select sacrifice or start procedure. Completion predicate is the conjunction of these authored checks. Emit `lh2:M34:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** All choices remain reversible here. Grevyn hears the Road Force's responsibility and may be angry while still consenting to treatment.

**Failure and recovery.** Emergency risk is displayed as a design probability before selection. Full preparation is deterministic, never a hidden dice roll.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M34.A` / The room is yours to inspect: Follow Grevyn's stretcher at eye height through the site, 6 seconds, then show the reachable release wheel from her actual viewpoint. Cal remains outside her personal space until invited. Visible readiness board identifies each missing condition. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M34.B` / No better words than the truth: Static full-crew conversation. Show the exact preparedness check after Sable's explanation. The emergency route is clearly marked 65% survival in this production design, subject to pre-release balance testing; no chance in the prepared route. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M34.C` / Consent is a conversation: Player may leave and return with repairs. On final confirmation Grevyn chooses severing without Cal selecting her answer for her; she has received all facts. Fatally transferring requires a separate later Cal confirmation, never this general consent. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M34` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M35 - The Severing

- Status: NOT_IMPLEMENTED. Chapter: Chapter 11 - What We Choose. Unlock: M34 complete or explicit chapter-test fixture.
- Purpose: Resolve the connection through prepared severing, a clearly risky emergency attempt or voluntary fatal transfer.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:firstprison; frame/layout from registry. In-person scene candidates: CAL GREVYN TAY TAYJ SABLE; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: SEVERING. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: SEVERING (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M35:guidance_handle` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The guidance control is the amber wheel; the medical support lever stays untouched." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M35.s1 - Confirm the route.** Choose repair and return, prepared severing, disclosed emergency risk or a separately confirmed fatal transfer. Implementation: Validate selected route; REPAIR returns to M34; TRANSFER requires body support and separate fatality confirmation. Completion predicate is the conjunction of these authored checks. Emit `lh2:M35:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M35.s2 - Run the procedure.** Operate TayJ's guidance sequence while Tay and Sable maintain support. Implementation: Three untimed guidance interactions advance labelled phases; input errors pause at safe phase, not kill someone. Completion predicate is the conjunction of these authored checks. Emit `lh2:M35:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M35.s3 - Commit the outcome.** Resolve once, persist result, consume the Road Force and continue to the appropriate aftermath. Implementation: Persist outcome once: PREPARED succeeds, EMERGENCY draws once at 65%, TRANSFER kills Cal and saves supported Grevyn; Road Force consumed. Completion predicate is the conjunction of these authored checks. Emit `lh2:M35:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Prepared route succeeds deterministically. Emergency uses one persisted 65% draw. Cal's fatal transfer saves Grevyn only with bodily support verified, so restore that first.

**Failure and recovery.** Procedure input failure pauses or resets to its last safe phase without randomizing survival. Fatal outcome commits before cutscene; reload cannot reroll emergency result.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M35.A` / One more chance to change course: Static readiness screen with spoken confirmation. Hold to confirm for fatal transfer after an explicit cancelable summary; no time pressure or preselected sacrifice. Emergency random result is stored at irreversible start before any animation. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M35.B` / Hold the line: Procedure gameplay uses three labelled guidance actions with no twitch requirement. Follow Cal from console to side rail for 4 seconds only during a safe phase. Grevyn stays supported. The Dominion appears as cold geometry pulling toward the ceiling; Road Force amber holds its edge, not a giant boss health bar. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M35.C` / Both alive: Only PREPARED or EMERGENCY_SUCCESS. Amber field dissolves steadily into the road seams. Grevyn remains injured on the platform; no sudden walking recovery. Hold a quiet wide after the bond breaks, then faces. Road Force dies completing the severing. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M35.D` / The transfer: Only TRANSFER. With bodily support verified, Cal willingly receives the supernatural connection through the field rig. No real-world self-injury mechanism. Static two-shot across the platform, warm amber then darkness. Road Force destroys the transferred bond; Cal dies. Do not frame his death as punishment for depression. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M35.E` / The attempt that fails: Only EMERGENCY_FAILURE. The Road Force completes the severing but Grevyn does not survive the physiological collapse. Sable and Tay attempt care off the dramatic beat; a respectful time transition makes the medical outcome clear. No player button is blamed for the random result. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M35` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.

### M36 - What Comes After

- Status: NOT_IMPLEMENTED. Chapter: Chapter 11 - What We Choose. Unlock: M35 complete or explicit chapter-test fixture.
- Purpose: Resolve all four endings, show Grandpa and the Dominion destroying each other, and establish aftermath without erasing losses.
- Target: 60 active minutes, including route, interaction, exploration and encounters; this is an untested budget.
- Primary site: lh2:home; frame/layout from registry. In-person scene candidates: CAL GREVYN TAY TAYJ SABLE DAIN NESS MERRIN ORIN GUCKI; recorded, remote and historical lines remain offsite/audio only.
- Stage lighting: AFTERMATH. Follow preset time/fog/key/fill and practical budget; restore normal cycle on departure.
- Score: AFTER (requested original cue); begin on safe arrival, quiet stem under conversation, stop at scene exit or mission handoff. Silence fallback if missing.
- Primary hint object: `lh2:M36:keepsake_box` at bench (-6,3) / y=1.05 unless the exception layout fixes its physical location; exterior objects use a visible safe survey point (6,-10). It is a real target and collider, not a marker-only proxy.
- Exact optional hint: "The personal case is on the bedside table; open it only if you want the private recording." Apply the 45/90-second active-search ladder and line-of-sight restrictions.

**M36.s1 - Allow time.** Play the medical recovery or grieving transition appropriate to the persisted outcome. Implementation: Load persisted outcome, play appropriate care or grief transition and audience-only Grandpa confrontation. Completion predicate is the conjunction of these authored checks. Emit `lh2:M36:s1:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M36.s2 - Speak honestly.** If both survive, let Grevyn state her needs and choose Cal's response: together or separate. Implementation: SURVIVE runs honest conversation then TOGETHER/SEPARATE choice; TRANSFER/FAILURE get their own memorial scenes. Completion predicate is the conjunction of these authored checks. Emit `lh2:M36:s2:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**M36.s3 - Witness the wider ending.** Show Grandpa's failed power grab, the Dominion's eventual death and the surviving communities. Implementation: Show days-long Dominion decline, save ending and credits; optional postgame uses labelled surviving-Cal world or pre-finale checkpoint. Completion predicate is the conjunction of these authored checks. Emit `lh2:M36:s3:complete` once and persist it before any queued scene. Do not use the presence of an item marker as completion.

**Choice and consequences.** Together is a platonic chosen future; separate is not failure. Death endings receive distinct aftermaths. Freeroam after Cal's death uses a labelled pre-finale save, never resurrection.

**Failure and recovery.** Ending choice saves before credits. Grand finale never reverses a committed death or removes regime remnants from later play.

**Scene tracks.** Ordinary A/B/C gates follow the common stage contract; use the explicit special gates for M30/M35/M36.

- `M36.A` / The man who wanted his state back: Audience-only cutscene after severing, explicitly intercut elsewhere. Grandpa escapes the broken reconstruction facility and reaches his field-control chamber. Follow him entering, 5 seconds; close view of a previously established emergency rupture control, then a wide of the confrontation. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M36.B` / What a dying force leaves: The Dominion kills Grandpa through the field as his rupture rig fatally damages it. No instant victory heals Grevyn retroactively. A time-lapse of failing cold grid lines over several days establishes the force dying out. Surviving Trooper units abandon some posts and retain others. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M36.C` / If both survive: the conversation: Weeks later, Grevyn in rehabilitation, Cal rested but still anxious. Static two-shot at a shaded roadside table with mobility support nearby. She may want connection without promising restored trust. Player sees together and separate as equal, explicit choices. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M36.D` / Together: Only TOGETHER. Months later, medical progress is modest and believable. Follow Cal and Grevyn walking a short distance to the crew vehicle; mobility aid remains as needed. TayJ calls from the relay, Tay packs for a clinic visit. No romantic kiss, coupling achievement or implied cure for Cal's mental health. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M36.E` / Separate: Only SEPARATE. At the crossing, Grevyn leaves with a rehabilitation convoy while Cal stays with his crew. Follow each departure in two equally lit shots, not a bleak-versus-golden moral contrast. A later letter confirms mutual voluntary contact. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M36.F` / If Cal died: Only TRANSFER. Weeks later Grevyn joins Tay and TayJ at a private memorial, still in treatment. A static wide gives all three equal space. Her future includes accountability and friendship, not a romantic bereavement identity. Cal's private recordings are shared only according to his stated wishes. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

- `M36.G` / If Grevyn died: Only FAILURE. Cal at a quiet community memorial; no solitary desert walk as a glamorous disappearance. Tay and TayJ stay nearby without speaking for him. Grevyn's work supports other survivors with attribution and privacy, not a cure-all. Dialogue follows JSON line order, filtered by explicit conditions. Voice completion extends minimum shot holds.

**Save and acceptance.** Checkpoint before entry, after each stage, before branch confirmation and after `M36` completion. Required smoke test: complete all three stages, reload before and after each, skip every presentation without skipping an unresolved choice, request the object hint with/without line of sight, and restore the previous camera and lighting. Confirm protected evidence and item transactions cannot duplicate. Capture one follow shot and one object/static shot in reduced-motion mode. Then run the branch cases specific to this sheet.
