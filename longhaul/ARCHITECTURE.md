# Long Haul – architecture and shared contracts

Static browser game. No build step, and nothing needs a server to play. The one exception is optional: `js/career.js`
keeps lifetime totals and achievements on the browser, and `js/online.js` mirrors them to the player's X-ORBIT account
and the global leaderboard (Supabase, `supabase/longhaul-career-setup.sql`) when they've signed in on the Account screen (never X-ORBIT's own session), along
with a cloud copy of the journey (`supabase/longhaul-cloud-saves.sql`). `js/convoy.js` is multiplayer: players on the
same seed share only their positions over a Supabase Realtime broadcast channel (`js/net/realtime.js`) and draw each
other as ghosts; every world stays private. Ghost trucks take part in vehicle collisions (`Vehicles.step`'s `extra`), and a player can ride in another's truck (the driver's game holds the seat as `"convoy:<id>"`, never saved). `js/map.js` draws the minimap and the full map from what the player has
seen (saved as `map` in the journey); the Digimap's catch turns some fuel and service sites into ruins through
`setSiteFilter` in `js/world/index.js`, decided once per site and saved as a `fate:<id>` world flag. Every network call fails quietly; the game never waits on one. `index.html` loads ES modules; Three.js 0.170 is vendored in
`vendor/three/` and mapped by the import map (`three`, `three/addons/`). Only the addons already in
`vendor/three/addons/` may be imported; if you need another one, copy it there from the same Three.js version.

Everything is procedural (geometry, canvas textures, synthesized audio). No downloaded art assets.

## 1. Ownership

| Area | Files | Owner |
|---|---|---|
| Boot, loop, state machine, camera, saves, audio, music, X-ORBIT | `js/main.js`, `js/camera.js`, `js/save.js`, `js/perf.js`, `js/audio.js`, `js/music.js`, `js/survival.js`, `js/core/*`, `audio/`, `tests/` (shared), docs | **lead** |
| Vehicles | `js/vehicles/*`, `dev/vehicle.html`, `tests/vehicle*.test.mjs` | **vehicle agent** |
| World | `js/world/*`, `js/sky.js`, `js/weather.js`, `dev/world.html`, `tests/world*.test.mjs` | **world agent** |
| On-foot play | `js/player.js`, `js/interact.js`, `js/items.js`, `js/props.js`, `js/pockets.js`, `dev/interact.html`, `tests/items*.test.mjs` | **interaction agent** |
| Interface | `index.html`, `css/*`, `js/input.js`, `js/ui/*`, `dev/ui.html` | **interface agent** |

Do not edit files you do not own. If a contract here is wrong or missing something, implement against your best
reading and list the deviation in your final report – the lead reconciles in `main.js`.
The old flat modules (`js/car.js`, `js/parts.js`, `js/world.js`, `js/stations.js`, old `js/items.js`, …) are the
starting point for their new owners: move/rewrite them into your files and delete the old ones you replace.

## 2. Units, axes, coordinates

- Metres, seconds, kilograms, litres, °C, radians. y is up. The road heads towards +z. A vehicle's forward is its local +z,
  its left is local +x (existing convention – keep it).
- Simulation positions are **absolute world coordinates** in JS doubles. Never store render-space positions.
- **Floating origin** (`js/core/origin.js`): every world object – chunks, vehicles, props, the camera, lights, sky dome,
  weather particles – is a descendant of `worldRoot` and is positioned with absolute coordinates. `worldRoot` is offset by
  `−origin`, so GPU values stay small. Keep vertex data and instance matrices local to a parent within ~500 m.
  Raycaster hits / `getWorldPosition()` are render space: convert with `toWorld()`.
- Fixed physics step 1/120 s (main owns the accumulator). Anything stepped must be frame-rate independent.
- Game time: `sky.time` 0..1 of a day; main owns day count.

## 3. Shared kernel (`js/core`, written by the lead – read the source)

- `bus.js`: `on(type, fn)`, `emit(type, data)`, `notify(text, {level, icon, key})`, `sfx(name, opts)`.
  Events used across modules: `chunk:load` (chunk), `chunk:unload` (chunk), `notify`, `sfx`, `discover` ({site}).
- `collide.js`: collider shapes (`circle`, `box` with yaw, optional `y0/y1`, `solid`), `resolveCircle`, `circleFree`, `pathBlocked`.
  This is the only collision system for walls, doors, scenery, vehicles vs world, player and props. No physics library:
  the vehicle keeps its custom raycast-suspension model (deliberate: static deploy, deterministic, cheap on Chromebooks).
- `targets.js`: interaction registry and raycast (§6).
- `worldstate.js`: `ws` – persistence of world changes (§8).
- `origin.js`: floating origin.

Ground height is always `heightAt(x, z)` from `js/world/terrain.js`. Building floors are flush with the (flattened)
terrain, so there is one ground function for wheels, feet and props. Single storey only.

## 4. Items and components

```js
// Definition (static). ITEMS in js/items.js; vehicle parts are defined in js/vehicles/components.js as
// COMPONENT_ITEMS (same shape) and merged into ITEMS by items.js.
ItemDef = {
  name, icon,                    // icon: emoji / short glyph for UI
  kind: "food"|"drink"|"med"|"tool"|"fluid"|"part"|"misc"|"weapon"|"ammo",
  weapon?: { kind: "melee"|"gun", dmg, range, rate, auto?, big?, ammo?, spread? },   // js/combat.js; guns use cap/qty for rounds
  unitMass?,                     // kg per unit of qty (ammo, rounds); fluids use their density
  mass, size: [x, y, z],         // kg, metres (prop collision box)
  price,                         // shop price, 0/undefined = not sold
  pocket: bool,                  // fits in a quick slot; otherwise it is carried in the hands / loaded as cargo
  cap, unit, fluid,              // containers: capacity, "L", and "fuel"|"oil"|"coolant"|"water"
  slot, fits,                    // parts: "engine"|"battery"|"radiator"|"wheel", fits: ["pickup","sedan"]
  use(ctx, item) -> string,      // optional; throw a string to refuse. Called for hand/pocket use.
  makeMesh(item) -> Object3D,    // origin at the centre of `size`
}
// Instance (plain JSON, saved as is)
ItemInstance = { id, type, qty?, cond?, flat?, ... }   // qty in def.unit, cond 0..100
```

Stable ids: seeded loot `"<siteId>:<n>"` (world agent), created in play `ws.newId()`.

Fixed item type ids (all agents may reference these):

- Supplies: `water` (0.5 L bottle), `waterjug` (4 L, qty), `beans`, `jerky`, `chips`, `soda`, `coffee`, `medkit`, `bandage`
- Fluids: `fuelcan` (10 L, qty), `jerrycan` (20 L, qty), `oil` (1 L bottle, qty), `oiljug` (4 L, qty), `coolant` (4 L jug, qty)
- Tools: `wrench` (needed to remove/install engine, battery, radiator), `jack` (jack + lug wrench, needed for wheels), `repairkit` (consumable, restores body/engine condition), `flashlight` (optional)
- Parts: `engine_i6` (fits pickup + sedan), `engine_v8` (pickup only), `engine_i4` (sedan only), `battery` (universal),
  `radiator` (universal), `wheel_16` (pickup), `wheel_14` (sedan)

Vehicle type ids: `pickup` (starter, recoverable), `poopmobile` (the pickup chassis with a photo skin from
`textures/poopmobile/`, takes pickup parts via `def.fitsAs`; replaces the starter for 1 journey seed in 1000) and `sedan`
(old four-door, recoverable).

## 5. Vehicles (vehicle agent provides)

```js
// js/vehicles/index.js
export async function prepare(report)            // build textures/geometry in slices; report(pct 0..1, label)
export class Vehicles {
  constructor({ root /* worldRoot */, getColliders /* (x, z, r) => static colliders */ })
  list                                            // loaded Vehicle[]
  get(id)
  spawnStarter(spawn /* {x, z, yaw} */) -> Vehicle  // worn but usable pickup, id "starter"
  // Loads/unloads vehicles: seeded spawns from loaded chunks (unless ws.vehicles has that id), plus ws.vehicles records
  // within range of any focus point. Unloading writes the record to ws.vehicles when the vehicle differs from its seed.
  sync(focusPoints /* Vector3[] */)
  step(dt, driven /* Vehicle|null */, input, env)  // fixed step: full physics for driven + moving vehicles, parked ones sleep
  update(dt, env)                                   // per frame: mesh sync, animations (doors, gauges, wheels)
  flush()                                           // write every loaded, modified vehicle to ws.vehicles (before saving)
  dispose()
}
// input: { throttle -1..1, steer -1..1, handbrake bool, shiftUp bool(edge), shiftDown bool(edge) }
// env:   { ambient °C, wet 0..1, sand 0..1, wear (difficulty multiplier), night bool }

Vehicle = {
  id, type, def,                       // def.name, def.tank, def.oilCap, def.coolantCap, def.mass …
  pos, quat, vel, speed,               // absolute; speed = signed forward m/s
  mesh,                                // Object3D under worldRoot
  slots: { engine, battery, radiator, wheelFL, wheelFR, wheelRL, wheelRR },   // ItemInstance | null
  fuel, oil, coolant,                  // litres
  doors: { driver, passenger, hood, tailgate /* or trunk */ },                // 0..1 open amount, animated
  cargo,                               // { items: [...] } secured cargo, see §7
  occupied,                            // set by main when the player is seated
  toggleIgnition(), setLights(mode), toggleParkingBrake(), setGearMode("auto"|"manual"), horn(bool),
  telemetry() -> Telemetry,            // one fresh object per call is fine
  inspect() -> [{ slot, label, item, cond, note }],   // for the component screen
  seatEye(out) -> Vector3,             // absolute eye position of the driver; cabQuat = vehicle quat
  camMotion,                           // { x, y, z, roll } small offsets (m, rad) from suspension + engine vibration
  exitSpots() -> [{x, z}],             // candidate standing spots, best first (driver door, passenger door, rear)
  colliders() -> Collider[],           // boxes with y0/y1 for player/props/other vehicles (closed doors only)
  placeOnRoad(z), recover(),           // un-stick helpers
  serialize() -> VehicleRecord, restore(record)
}

Telemetry = {
  speed, rpm, redline, gear /* "P","R","N","D","1".. */, gearMode, ignition /* "off"|"on"|"cranking"|"running" */,
  throttle, load /* 0..1 */, slip /* 0..1 */, surface, grounded,
  fuel, tank, temp, overheating, oil, oilCap, coolant, coolantCap, battery /* 0..100 */, charging,
  engineCond, bodyCond, tyres: [{ cond, flat, missing } ×4 FL FR RL RR],
  parkingBrake, lights /* bool */, odometer /* m */,
  warnings: [{ id: "fuel"|"temp"|"oil"|"coolant"|"battery"|"tyre"|"engine"|"body", level: "warn"|"crit", text }],
  impact /* crash severity since last telemetry call, for driver injury + camera shake */
}
```

Vehicle parts register their own interaction targets (§6): doors (open/close, “Get in”), hood, tailgate/trunk,
fuel filler (pour from held fuel container), oil filler + dipstick, radiator cap, each wheel (remove/install with `jack`),
engine / battery / radiator (remove/install with `wrench`, hood open), cargo bed/trunk floor (§7).
Removing a part puts the ItemInstance in the player's hands (`ctx.giveHeld`); installing consumes the held item
(`ctx.consumeHeld`) after checking `def.slot` and `def.fits`. A vehicle with a missing/dead engine, battery or wheel must
not drive; fitting good parts must restore it. Seeded recoverable vehicles spawn with deterministic defects.

## 6. Interaction (interaction agent provides the system; everyone registers targets)

One raycast from the camera each frame (`raycastTargets`). Whoever builds an interactive mesh registers it:

```js
addTarget(object3D, {
  id, name /* string | () => string */,
  info?: () => ({ cond?, qty?, note? }),      // shown under the name in the HUD
  reach?: 2.6,                                // metres
  item?: ItemInstance,                        // only for loose props
  actions: (ctx) => Action[],                 // only the actions that make sense right now
});
Action = {
  key: "use" | "alt" | "grab",                // E, F, left mouse
  label,                                      // "Open hood", "Pour fuel", "Remove wheel"
  blocked?: "Needs a jack",                   // shown but not runnable
  hold?: seconds,                             // timed action with a progress ring, then run()
  run?(ctx),                                  // instant / after hold
  tick?(ctx, dt) -> number | false,           // continuous while the key is held (pouring): return 0..1 progress, false to stop
}
ctx = {                                       // built by interact.js
  held,                                       // ItemInstance in the hands or null
  consumeHeld() -> ItemInstance,              // remove it from the game (installed / used up)
  giveHeld(item) -> bool,                     // put an instance in the hands; false when hands are full
  dropItem(item, pos, vel?),                  // spawn as a loose prop at an absolute position
  pocketAdd(item) -> bool,
  player,                                     // Player
  enterVehicle(vehicle),                      // main hook
  openShop(site), sleep(where), wallet /* { money } */,
  notify, sfx,
}
```

Static geometry that should block the ray (walls, vehicle bodies) is registered with `addOccluder`.
On dispose call `removeAllUnder(root)`.

Input ownership (interface agent's `input.js`; action names are the contract):

- Always: `pause` (Esc/P), `inventory` (Tab/I), `mute` (M), `radioNext` (N)
- Driving: `throttle`/`brake` (W/S), `left`/`right` (A/D), `handbrake` (Space, hold), `parkingBrake` (B), `ignition` (I is inventory → use `K`),
  `shiftUp`/`shiftDown` (Shift / Ctrl, manual mode), `gearMode` (G), `lights` (L), `horn` (H), `camera` (C), `exit` (F),
  `sleep` (Z), `recover` (R)
- On foot: `fwd/back/left/right` (WASD), `sprint` (Shift), `jump` (Space), `crouch` (Ctrl or C), `use` (E), `alt` (F),
  `grab` (LMB: pick up / drop held), `throw` (RMB), `rotate` (R held + mouse), `stow` (Q: held ↔ pocket), `slot1..slot6` (1–6),
  `consume` (X: use selected pocket item), `flashlight` (T)

Modes: `"drive" | "foot" | "overlay" | "none"`. Keys must not leak between modes; everything is released on blur,
pointer-lock loss and mode change.

## 7. Props and cargo (interaction agent)

- Every scavenged supply is a physical prop (mesh from `ItemDef.makeMesh`) under `worldRoot`, registered as a target.
- Loose props use a small custom body: gravity, ground = `heightAt`, static colliders, friction, sleep. No tunnelling,
  no falling through the world (clamp to ground), props never get deleted by physics.
- Carrying: one item in the hands, held in front of the camera, collides softly with the world, can be rotated, dropped, thrown.
- **Cargo securing** (deliberate, communicated in the HUD): aiming a held item at a vehicle's cargo target shows a ghost;
  placing it parents the prop to the vehicle (`vehicle.cargo`), where it rides without physics. Picking it up frees it.
  `vehicle.cargo = { zone: {min:[x,y,z], max:[x,y,z]} /* vehicle-local box */, items: [{ item, lpos:[x,y,z], lyaw }] }`
  The vehicle agent creates the zone and the cargo target (`target.cargoOf = vehicle`); the interaction agent owns the
  placement logic and the prop meshes parented to `vehicle.mesh`.
- Pockets (`pockets.js`): 6 quick slots for `pocket: true` items (stacks of identical stateless items, or one stateful item).

## 8. World (world agent provides)

```js
// js/world/terrain.js – pure math, importable in Node (no DOM, no THREE objects created at import)
setSeed(n), getSeed(), rng(seed), hashStr(str) -> uint32
CHUNK = 200, ROAD_HALF
roadX(z), roadY(z), roadDir(z) -> {x, z}
heightAt(x, z), normalAt(x, z, out)
surfaceAt(x, z) -> "asphalt"|"gravel"|"dirt"|"sand"|"rock"|"concrete"|"wood"   // grip, tyre noise, footsteps
onRoad(x, z), regionAt(x, z) -> { id, name }                                    // dunes, flats, rocky, …

// js/world/sites.js – deterministic points of interest
startSite() -> { id, kind, x, z, yaw, playerSpawn: {x, z, yaw}, vehicleSpawn: {x, z, yaw} }   // small garage/home near z≈60
sitesBetween(z0, z1) -> Site[]          // { id, kind: "station"|"home"|"garage"|"diner"|"motel"|"junkyard"|"wreck", x, z, yaw, name }
nextSiteAfter(z, kind?) -> Site

// js/world/index.js
export async function prepare(report)
export class World {
  constructor({ root /* worldRoot */ })
  setOptions({ lite, ahead, behind })     // render cost only – never changes placement, loot or colliders
  update(focusPoints /* Vector3[] */, force) // stream chunks around every focus point; emits chunk:load / chunk:unload
  collidersNear(x, z, radius, out = []) -> Collider[]   // static + door colliders
  chunks                                   // Map k → Chunk
  clear(), dispose()
}
Chunk = {
  k, z0, group, colliders,
  spawns: [{ id, type, qty?, cond?, pos: [x, y, z], yaw }],               // seeded loot (props agent instantiates)
  vehicleSpawns: [{ id, type, pos: [x, y, z], yaw, seed }],               // seeded recoverable vehicles
}
```

World-owned interactive things register their own targets and persist through `ws.flags`:
doors (`door:<id>`; a door is a box collider whose `solid` follows its state), containers/fridges/lockers/trunks
(their lid is a target and an occluder; contents are ordinary spawns placed inside), beds (`ctx.sleep`), shop counters
(`ctx.openShop(site)`), fuel pumps (hold E: fills the nearest parked vehicle's tank within 6 m or the held fuel container,
charging `ctx.wallet.money`). Decorative burnt-out wrecks are scenery; recoverable vehicles are `vehicleSpawns`.

`js/sky.js` (`Sky`: sun/moon light + shadows following the focus, sky dome, `scene.environment`, `time`, `night`, `clock()`)
and `js/weather.js` (`Weather`: clear / dusty / storm / rain, fog, particles, `ambient(time)`, `wet`, `p`, `label`,
`serialize/restore/advance`) keep their current public API; add `setQuality`.

## 9. Persistence (lead)

- Save key `longhaul-save-v3`. Older v2 saves are migrated (seed, day, needs, money, difficulty, distance; the truck is
  placed at the nearest safe road position). Corrupt saves are kept under a backup key and reported, never silently wiped.
- Save = `{ v, at, seed, time, day, diff, stats, needs, wallet, weather, player, interact (held + pockets), drivenId,
  world: ws.serialize(), prefs are separate }`.
- `ws` rules: a seeded prop that is picked up, moved, consumed or stowed gets its id added to `ws.removed`; wherever it
  now rests is a record in `ws.props`:
  `{ item, at: "world", pos, quat }` | `{ item, at: "cargo", vehicle, lpos, lyaw }`. Held/pocket items live in the
  interaction save. Props in unloaded chunks exist only as records; they are re-instantiated on `chunk:load`
  (records are matched to chunks by `Math.floor(pos[2] / CHUNK)`).
- Vehicles: `ws.vehicles` record = `vehicle.serialize()` (includes slots, fluids, cargo, pos/quat, doors, odometer).

## 10. HUD and menus (interface agent provides; main feeds real state)

```js
// js/ui/hud.js
hud.init({ prefs }), hud.applyPrefs(prefs), hud.setVisible(bool), hud.dim(bool)
hud.update({
  mode: "drive" | "foot",
  units: "km" | "mi",
  tel,                         // Telemetry or null (on foot)
  vehicleName,
  needs: { health, hunger, thirst, energy },      // 0..100
  stamina, sprinting,                             // 0..1
  day, clock, weather, tempC, money, trip /* m */,
  target: { name, cond, qty, note } | null,
  actions: [{ key: "E"|"F"|"LMB"|..., label, blocked, progress /* 0..1 | null */ }],
  held: { name, qty, hints: ["LMB drop", "RMB throw", …] } | null,
  cargoHint: string | null,                       // "Release to secure in the bed"
  slots: [{ icon, name, count, qty } | null ×6], selected,
  progress: { label, pct } | null,                // refuelling, repairs, timed actions
  lite, music: { title, artist } | null,
})
// Notifications arrive through bus "notify"; the HUD queues and prioritises them itself.

// js/ui/menus.js
menus.init({ prefs, handlers })     // handlers: onContinue(), onNewJourney({difficulty, seed}), onResume(), onSaveAndMenu(),
                                    // onPrefs(prefs) (called on every change), onReturnToHost(), onUseSlot(i), onDropSlot(i), onBuy(typeId)
menus.show(name, data)              // "loading" {pct,label} | "main" {save: preview|null, saveError, hostAvailable} | "pause" {summary}
                                    // | "gameover" {cause, stats} | "inventory" {slots, held, needs, vehicle: inspect()|null, stats}
                                    // | "shop" {site, stock:[{type, price}], money} | "sleep" {text}
menus.hide(), menus.current         // name or null
```

`prefs` (owned by `save.js`, persisted under `longhaul-prefs`):

```js
{ quality: "auto"|"high"|"lite", fov: 70, camMotion: 1, camera: "cab"|"chase", sens: 1, invertY: false,
  units: "km"|"mi", gearbox: "auto"|"manual",
  vol: { master: 0.8, music: 0.6, sfx: 0.8, ambience: 0.7 }, muted: false, radio: true,
  hud: { scale: 1, opacity: 1, show: "full"|"minimal"|"off", critical: true, help: true },
  a11y: { reduceMotion: false, highContrast: false } }
```

## 11. Audio (lead)

`audio.js` owns one AudioContext with buses master → music / sfx / ambience. Modules never touch WebAudio; they call
`sfx(name)` from the bus. Names: `ui_click, ui_back, door_open, door_close, hood_open, hood_close, pickup, drop, throw,
thud, pour_start, pour_stop, ratchet, wheel_fit, eat, drink, cash, container, footstep` (opts.surface), `land, error,
discover`. Engine, tyres, wind, rain and interior filtering are driven every frame from `Telemetry` by main.

## 12. Quality

`setOptions({ lite })` / `setQuality` may change pixel ratio, shadow resolution/distance, draw distance of *decorative*
instances, texture size and particle counts. It must not change terrain height, collider lists, spawns or sites.

Auto picks Lite for weak devices (`perf.js`: Chromebooks, ≤4 GB, ≤2 cores, phones and tablets), when X-ORBIT asks,
and for the rest of the session once a journey has run below 28 fps for 6 s in a row (`watchFrameRate` in main).

### Touch (`js/touch.js`)

On-screen controls for phones and tablets. They only ever call `input.js` (`touchDown(id, action)` / `touchUp(id)`,
the analog `stick` {x, y} that `drive()` / `foot()` add to the keys, `touchLook(dx, dy)`), so nothing else knows a
thumb pressed it. Shown while the input mode is drive / foot / photo and the last input was a touch (a key or mouse
click hides them). Main feeds `touch.update(touchView())` every frame; foot context buttons come from the HUD action
list (one per key, labelled with the action). While they show, `bindingLabel()` returns button names ("Key",
"Recover") so prompts name what to tap. `css/touch.css` hides keyboard help and moves the HUD corners the thumbs cover.

## 13. Dev pages and tests

Each agent keeps a small harness page in `dev/` that exercises its modules in isolation (mock what you do not own) and
Node tests in `tests/` for pure logic. The game must stay loadable: never leave a module that throws at import.

## 14. Strangers: NPCs, hitchhikers, roadblocks, pursuit (V2.1)

### 14.1 Ownership

| Area | Files | Owner |
|---|---|---|
| Schedule, persistence slot, inventory facade, main loop glue, saves | `js/core/encgen.js`, `js/core/worldstate.js` (`ws.enc`), `js/stock.js`, `js/main.js`, `js/save.js`, `js/survival.js` | **lead** |
| People | `js/npc/*`, `dev/npc.html`, `tests/npc*.test.mjs` | **npc agent** |
| Roadblocks, demands, pursuit orchestration, capture | `js/encounters/*`, `tests/encounter*.test.mjs` | **encounter agent** |
| NPC driving + vehicle hooks | `js/pursuit/*`, `js/vehicles/*`, `tests/pursuit*.test.mjs`, `tests/vehicle*.test.mjs` | **pursuit agent** |
| Dialogue, HUD, sound, input | `js/ui/*`, `css/*`, `index.html`, `js/input.js`, `js/audio.js`, `dev/ui.html` | **ui agent** |

Same rules as §1: do not edit files you do not own; code against the contract below and list deviations in your report.
There is uncommitted work by the user in `js/audio.js`, `js/vehicles/*`, `js/items.js`, `js/player.js`: keep it.
Everything stays procedural (no downloaded assets), static deploy, importable without throwing. Pure logic must import
in Node (`node --import <three loader> tests/x.test.mjs`); keep THREE/DOM out of rule, generation and state-machine files
or guard them (`typeof document`).

### 14.2 Schedule and random streams (lead, `js/core/encgen.js`, done)

`encountersBetween(z0, z1) -> [{ id, kind: "roadblock"|"hitch", slot, z, x, side, yaw, seed }]`, `encounterById(id)`,
`encRng(key)`, `encSeed(key)`. Ids: `rb<slot>`, `hh<slot>`. All randomness for encounters and NPCs comes from
`encRng("<encounter id>:<purpose>")` (or an `rng(seed)` derived from the encounter seed) – never `Math.random()` for
anything that is an outcome (type, demands, betrayal, capture result, rewards). Each outcome is rolled once, at the
transition that needs it, and written to the record before anything acts on it.

### 14.3 Persistence (`ws.enc`, lead owns the map; owners own their records)

`ws.enc: Map<id, record>` – plain JSON, saved with the world. A record exists from the moment an encounter is first
instantiated; from then on the record, not the seed, is the truth. Owners write their record on every state transition
and in `flush()` (called before each save, every 5 s). Vehicles that belong to an encounter are ordinary `ws.vehicles`
records with ids `<encounter id>:v<n>`; people are `<encounter id>:p<n>` and live inside the encounter record
(`people: [npc.serialize()]`). Save version is 4; v3 saves load with an empty `ws.enc`.

### 14.4 People (npc agent, `js/npc/index.js`)

```js
export async function prepare(report)
export const HITCH_RULES                              // tunables: see hitchhikers below
export class Npcs {
  constructor({ root, getColliders /* (x, z, r) static + vehicle colliders */, getVehicle /* id -> Vehicle|null */ })
  list, get(id)
  spawn({ id, role, name?, seed, x, z, yaw }) -> Npc  // look (build, clothes, skin, hair, hat) derives from seed
  remove(npc)
  update(dt, { playerPos, playerVehicle, lite, night })   // staggered thinking, animation LOD by distance
  colliders(x, z, r, out = []) -> circle colliders of people standing/walking (for the player and props)
  setQuality({ lite }), clear(), dispose()
}
Npc = {
  id, role /* "hitchhiker"|"leader"|"guard" */, name, seed, pos /* Vector3 absolute, feet */, yaw, health /* 0..100 */,
  state,          // "idle"|"walk"|"talk"|"enter"|"sit"|"exit"|"threaten"|"flee"|"pursue"|"strike"|"down"
  seat,           // null | { vehicle: id, seat: name }
  hostile,        // bool, set by the owner; drives posture + HUD role text
  mesh,           // Object3D under worldRoot (or under the vehicle mesh while seated)
  // Orders – each replaces the previous one. Movement uses collide.js, slows for obstacles, never walks through
  // walls or vehicles, and steps out of the way of moving vehicles.
  idle(), lookAt(Vector3 | null),
  walkTo(x, z, { run?, arrive? /* m */ }) ,          // npc.arrived becomes true; emits "npc:arrived" { npc }
  follow(getPos /* () => Vector3 */, { run?, keep? /* m */ }),   // pursue on foot
  flee(from /* Vector3 */),
  threaten(on),                                      // menacing stance (raised bat/arm), audible warning once
  strike() -> Promise                                 // one swing; resolves at the moment of impact (owner applies damage)
  enterVehicle(vehicle, seat) -> bool                 // claims the seat first (see 14.5); false if taken. Walks to that
                                                      // door, opens it, sits, closes it. emits "npc:seated" { npc }
  exitVehicle() -> bool                               // only when |vehicle.speed| < 1; frees the seat, stands at a free
                                                      // exit spot. emits "npc:exited" { npc }
  setTarget(def | null),                              // interaction target (§6) on the body: { name, info, actions }
  say(text, ms?),                                     // emits "npc:say" { npc, name, text, ms } → HUD subtitle + blip
  serialize() -> rec, restore(rec)                    // incl. state, seat, health, orders needed to resume
}
```

Bus events from people: `npc:arrived`, `npc:seated`, `npc:exited`, `npc:say`, `npc:hit { npc, speed, vehicle }` (struck by
a vehicle faster than 3 m/s: goes `down`, loses health; the owner decides what that means), `npc:step` is internal –
footsteps go through `sfx("npc_step", { pos, surface })`.

Seated people are parented to the vehicle mesh at `vehicle.seatPos(name)`. A restore of a seated NPC waits until its
vehicle is loaded; if the seat is unexpectedly taken or the vehicle is gone, the NPC is placed standing at a free spot
beside the saved position – never inside another occupant, never deleted silently.

**Hitchhikers** (npc agent, `js/npc/hitch.js`, `export class Hitchhikers`): constructor gets the same `ctx` as
Encounters (14.6). Instantiates `kind: "hitch"` schedule entries within ~350 m, standing on the shoulder on `side`,
thumb out, watching the player. States: `waiting → talking → riding → arrived | declined | left | threat → resolved`.
Stop within 8 m (or walk up and use the Talk action) to talk. The dialogue shows who they are, where they want to go
(a real site further along the road from `nextSiteAfter`, 3–12 km away, by name and distance) and what they offer, with
explicit **Offer a ride** / **Decline** choices. Riding: the passenger takes a real free seat (not the driver's seat;
refuse politely if none), stays through vehicle exit/entry by the player, and gets out at the destination (within 120 m
of the site and stopped), or on request (Talk → "This is where you get out"), or if left behind in another vehicle the
player abandons >300 m away. Reward on arrival is rolled when the ride is accepted and shown truthfully: money and/or a
supply and/or a tip about what is ahead (next station distance, a roadblock ahead and its kind). A modest share
(`HITCH_RULES.betray`: easy 0, normal 0.12, hard 0.2; 0 when `ctx.hostile()` is false) turn threatening mid-ride: warning
signs first (nervous lines via `say`, at least two, 20+ s apart), then a demand when the vehicle is slow or stopped
(dialogue: hand over cash / refuse / stop and order them out). Refusing can cost a struck blow (`ctx.needs.hurt`,
`HITCH_RULES.blow` range) before they run. Never while the player is driving fast. Peaceful rides must stay the norm.

### 14.5 Vehicle hooks (pursuit agent, `js/vehicles/*`)

```js
def.seats = { driver: { pos: [x, y, z] /* vehicle-local hip point */, door: "driver" }, passenger: {…, door: "passenger"},
              rearL?, rearR? /* sedan */ }
vehicle.seats = { driver: null | occupantId, … }        // "player" for the player; serialized and restored
vehicle.seatFree(name), vehicle.claimSeat(name, who) -> bool, vehicle.releaseSeat(name), vehicle.seatOf(who) -> name|null
vehicle.seatPos(name, out) -> absolute Vector3; vehicle.doorSpot(name) -> { x, z } standing spot outside that seat's door
vehicle.ai = null | input            // input object like the player's; used by Vehicles.step when the vehicle is not `driven`
vehicle.pinned = bool                // never unloaded by Vehicles.sync while true (active pursuers)
vehicle.disabledReason() -> null | "engine" | "wheels" | "rolled" | "fuel" | "battery"   // physical inability to drive
```

`vehicle.occupied` stays "someone is at the wheel" (player or NPC driver). Collider hook for breakable obstacles: a
collider may carry `hit(vehicle, closingSpeed) -> number` (0..1). When a vehicle contacts it, the vehicle calls `hit`
once per contact and scales the collision response *and* its own impact damage by the returned factor; the owner may
set `solid = false` in that call (barricade smashed, barrel knocked away). A collider without `hit` behaves as before.
Vehicle-vs-vehicle collisions must damage both (engine/body/wheels by closing speed and where they were hit).

NPC driving (`js/pursuit/index.js`):

```js
export const PURSUIT_RULES                         // tunables (reaction, top aggression by difficulty, mistakes, stuck timing)
export function disableCheck(vehicle, history) -> null | reason   // pure; incl. "stuck" (no progress under throttle ≥ N s) and "wrecked"
export class Pursuer {
  constructor({ id, vehicle, seed, diff, getColliders, getVehicles, terrain? })
  setTarget(() => ({ pos, vel, vehicle | null }) | null)
  update(dt)            // per frame: sense (staggered), plan, write vehicle.ai. Real controls only – no forces, no teleport.
  state                 // "idle"|"chasing"|"closing"|"holding" (boxing a stopped target)|"recovering"|"disabled"
  disabledReason        // null | "engine"|"wheels"|"rolled"|"fuel"|"stuck"|"wrecked"
  canContinue           // false once disabled for good
  serialize(), restore(rec)
}
```
Bus: `pursuer:crash { id, severity }` (a real impact, not a tap), `pursuer:recovering { id }`, `pursuer:recovered { id }`,
`pursuer:disabled { id, reason }`. Pursuers follow the road when the target is on it, cut across open ground when that
is drivable, steer around colliders and each other, brake for bends and obstacles, make occasional seeded mistakes
(late braking, wide lines) scaled by difficulty, reverse out when nose-in against something, and give up for good only
through `disableCheck`.

### 14.6 Roadblocks and capture (encounter agent, `js/encounters/index.js`)

```js
export const RULES            // every probability, demand table, damage range – documented in the file header
export class Encounters {
  constructor(ctx)
  update(dt, { talk /* bool: the Talk key was pressed this frame */ })
  colliders(x, z, r, out = []) -> barricade / barrel colliders (with `hit`, see 14.5)
  focusPoints(out = []) -> Vector3[]   // things that must stay streamed (active pursuers, max 3)
  hud() -> null | { title, text, level: "info"|"warn"|"crit", pursuers: { able, total } | null, prompt: string | null }
  active -> null | { id, state }       // at most one hostile encounter is ever live
  flush(), clear(), dispose()
  dev                                   // scenario controls, only used behind ?dev=1
}
ctx = {                                  // built by main; also given to Hitchhikers
  root, npcs, vehicles, world, getColliders,
  player: () => ({ pos, vel, speed, vehicle /* Vehicle|null */, onFoot, health }),
  stock,                                 // 14.7
  needs,                                 // needs.hurt(amount, cause), needs.health
  diff: () => "easy"|"normal"|"hard", hostile: () => bool /* false = peaceful journey: no robbery, pursuit or betrayal */,
  progress: () => ({ km, day, money }),
  dialogue(spec) ,                       // opens the dialogue overlay; spec.onChoose(id) is called once; simulation is
                                         // paused while it is open. spec: { speaker, role, lines: [], note?, choices:
                                         // [{ id, label, detail?, cost? /* exact text: "$45 + 2 food" */, disabled? /* reason */, danger? }] }
  ejectPlayer() -> bool,                 // pull the player out of the vehicle (capture)
  releasePlayer({ x, z }),               // put the player on foot at a safe spot near there, give control back
  kill(cause /* short */, summary /* [[label, value]] */),
  now: () => seconds of play time (monotonic, saved),
  notify, sfx,
}
```

Roadblock states: `unseen → spotted → challenged → negotiating → paid | complied | refused → …` and
`challenged/refused → bypassed → mobilizing → pursuing → escaped | captured → released | dead`; `backedOff` returns to
`spotted`. Type (`"robbery" | "toll"`, exactly 50/50 from `encRng(id + ":type")`), people, vehicles, layout and the
demand are rolled at creation and stored. Layout: two parked vehicles and barrels/barricades across the lanes with the
shoulders and desert passable on at least one side (verify with `heightAt`/colliders), warning signs/flares from 250 m,
a leader who steps forward and guards who stand by the cars. Challenge = the player comes within the guarded zone
(~45 m before the line) – the leader signals stop. Nothing hostile happens for looking, passing by far off-road before
being challenged, or reversing away. Crossing the guarded line (ramming through or going around within the guarded
radius) after a challenge, or refusing and then crossing, makes it `bypassed` → `mobilizing` (visible: people run to the
cars, doors, engines; ≥ 4 s) → `pursuing` with real `Pursuer`s. Paying a toll / satisfying a robbery = `paid`/`complied`:
people stand down, barricade opened, crossing is safe forever, no later punishment. Pursuit ends only when every
pursuer is `canContinue === false`; a pursuer lost for technical reasons is re-instantiated from its record when
streamed again, never counted as beaten. Capture needs the player slower than 2 m/s (or on foot) with a hostile person
on foot within 3 m and line of sight; then the outcome (`RULES.capture[diff]`: killed / robbed / ransom / beaten) is
rolled once from `encRng(id + ":capture")`, stored, applied exactly once, and the player is released with a grace
period (`RULES.releaseGrace` seconds, saved) during which that group does nothing.

### 14.7 Inventory facade (lead, `js/stock.js`)

```js
stock.money                                   // getter
stock.list() -> [{ type, name, kind, count }] // pockets + hands + cargo secured in the vehicle the player is using / standing by (≤ 25 m)
stock.count(type), stock.countKind("food"|"drink"|…)
stock.check({ money?, items?: [{ type? | kind?, n }] }) -> null | "You only have $12" …
stock.pay({ money?, items? }) -> bool         // atomic: verifies everything, then removes exactly that; false = nothing changed
stock.strip({ money: fraction, kinds: […], max }) -> { money, items: [{ type, n }] }   // robbery; returns what was taken
stock.give({ money?, items?: [{ type, n }] }) // rewards: pockets first, else dropped at the player's feet
```

### 14.8 UI and sound (ui agent)

- `menus.show("dialogue", { speaker, role, lines, note, choices })` + `handlers.onDialogueChoice(id)`; keyboard (↑↓/Enter,
  1–9) and mouse; Esc picks the choice with `id: "back"` when there is one, otherwise does nothing. Costs are shown
  exactly as given. `disabled` choices show their reason and cannot be picked.
- `hud.update({ …, encounter: { title, text, level, pursuers: { able, total } | null } | null, subtitle: { name, text } | null,
  prompt })` – an encounter plate (threat/pursuit/surrender/escape states, "2 of 3 still chasing"), subtitles for `say`.
- Input: drive action `talk` (KeyE, "Talk / respond"). New-journey screen: toggle "Hostile encounters" → `onNewJourney({ …, hostile })`
  (default on; off = peaceful strangers only).
- Sound: all through `sfx(name, { pos, vol })`. `audio.setListener(pos)` is called by main every frame; any sfx with
  `opts.pos` is attenuated by distance (inaudible beyond ~120 m). New names: `npc_step` (opts.surface), `npc_talk`,
  `threat`, `pursuit_alert`, `pursuit_end`, `barricade_hit`, `barrel_hit`, `punch`, `pay`, `npc_horn`, `tyre_skid`;
  existing `door_open/door_close/crank/engine_catch/engine_stop/crash` accept `pos`. `audio.update` additionally takes
  `others: [{ tel, dist }]` (≤ 2) for the engines of nearby NPC-driven vehicles.

## 15. Existing campaign runtime: The Return Trip (legacy story)

**Edition status, 22 November 2026:** the code described in this section still runs the previous story.
The intended replacement is **The Way Back**, specified in section 16 and `CAMPAIGN_IMPLEMENTATION.md`.
Its prologue P01-P04 now has a separate playable v2 runtime; later chapters remain design-only.
Keep old scripts, recorded takes and campaign-v1 saves separate until an explicit versioned migration exists.

Story mode, played on one authored road (`CAMPAIGN_SEED` in `js/campaign/state.js`, chosen so Mercy Motel is 12 road km
from the garage, as scripted). Saved in its own slot (`longhaul-campaign-v1`, plus `longhaul-campaign-checkpoint` written
at safe moments) so it never replaces a free-roam journey. A campaign death goes back to the checkpoint.

| File | What it does |
|---|---|
| `story/campaign/Long_Haul_Full_Campaign.md` | Legacy runtime master (40 missions, 104 scenes, 827 line ids); not the replacement campaign canon |
| `tools/build-campaign.mjs` | Master → `js/campaign/script.js` (generated: edit the master, run `node tools/build-campaign.mjs`) |
| `js/campaign/state.js` | Pure progress: `CampaignState`, `stepMissions`, `completeMission`, `sceneLines`, calendar (day 1 = Monday) |
| `js/campaign/chapter1.js` | Pure mission rules for chapter 1: objectives read a world view `w` and the state's facts |
| `js/campaign/chapter2.js` | Pure mission rules for chapter 2 (world view additions under `w.ch2`) |
| `js/campaign/index.js` | The world side: authored places, chapter 1's objects and people, scene playback, branch choices, HUD plate, journal data |
| `js/campaign/world2.js` | Chapter 2's world: the generator load test (game clock), bakery, hire shed, camp, supper, Ellis's ride; hooks into index.js for phone, shutter, choices, map and travel hints |
| `js/campaign/chapter3.js`, `world3.js` | Chapter 3: the weigh station (isolate, clear, fit, calibrate with test weights, weigh the pickup, pick the stub), Basin Scrap, Wes's counter (pay or free his vice), the office copier and archive case, Inez at Vega Tyre |
| `js/campaign/chapter4.js`, `world4.js` | Chapter 4: Fern's ride to the sale barn and back, Alma's photo tin on Wes's shelf, Edie's machine (lend it back or a signed note), June's key board and the storage annex with Ellis |
| `js/campaign/kit.js` | `ChapterWorld`, the base every chapter world extends: people at places (`presence`), passengers (`offerRide`/`ride`), handing things over (`hand`, `takeFromPockets`), "parked here / in the bed / in my hands" checks, `thing` and `shed`. Lists the hooks index.js calls |
| `js/campaign/marker.js` | The objective marker: a beam of light over the place to drive to and a chevron over the person or thing to use |
| `js/campaign/mesh.js` | Shared box/material helpers for story objects |

Rules: objectives latch; a mission's flags and the move to the next mission are written before its closing scene, reward
or item transfer; scenes still to play stay in `st.queue` so a reload replays them. A new chapter is a new
`chapterN.js` merged into `DEFS` in `index.js`, plus a `worldN.js` extending `ChapterWorld` (kit.js), added to
`Campaign.worlds` (chapters 3 and 4 are the pattern: `bind` names places, `update` runs every quarter second, `view` feeds
the rules as `w.chN`, `choose(sceneKey)` asks a scene's branch question, `travel`/`marker` say where the objective marker
points). Story happens in person: the player drives to a place, walks up to someone and talks; scenes play with the people
present facing whoever speaks. An objective with `when(st)` belongs to one branch of a choice and is hidden otherwise.
Targets made with `Campaign.target()` can be pointed at by id. People who stand at places get a fresh spot each visit;
when they stop being needed they leave once the player is 60 m away. Branch choices can also be named at the head of a line's
direction in the master (`[ASK_COPY]`). Places that aren't generated sites are built with `roadSpot()` (a site-like local frame by the road). A mission
without rules ends the playable campaign with a message (the journal still lists the whole script).
June's paper map on the office wall (Capture) puts the highway from the garage to 32 km on the maps (`paperRange()`); story places pin as the story needs them (`st.store.pins`, `mapPins()`, the current objective's ringed); a click on the full map sets a destination (`st.store.waypoint`: blue pin, blue beam, HUD distance; right-click clears).
People are animated from js/npc/pose.js (gait tied to ground covered, breathing, weight shift, gestures) through model.js `animate()`, with idle habits (looking round, arms crossed, hands on hips, checking a watch…), age (stoop, shorter stride, grey hair; spawn spec `age`, campaign ages from the character directory) and injuries (limp, hunch). `walkSpeed(rig, health, run)` sets their pace.
People (js/npc) have cartoon faces that blink and talk (`talkFor(secs)`), are thrown by cars (`knock`: tumble, bounce, slide) and get up again after a few seconds unless hostile or badly hurt; slow bumps just shove them (`shove`).
Unrecorded lines are spoken by the browser's text-to-speech (js/speech.js): one stable voice per character by gender (js/cast.js), pitch and pace from age and the line's direction, volume from Settings → Audio → Character voices; a scene waits for a line to finish. Nobody on foot speaks to Kit's back: a scene holds before its first non-Kit line until the camera faces that speaker (`attending`).
Lines play as subtitles; a recorded take plays instead when `audio/voice/index.json` lists its line id
(`audio/voice/<LH-…>.mp3`, ids as in the recording manifest). Keys: `journal` (J), `skipLine` (Enter).

## 16. Replacement campaign specification: The Way Back (edition 2)

The current replacement design follows Callum Reed (Cal), Grevyn, Tayla (Tay), TayJay (TayJ) and Riped.
Graduation is 2089, collapse is 2091, main story is 2096. Cal is approximately 26, male and aroace;
his bond with Grevyn is platonic. The Scatterballasian Regime is led by Grandpa Gucki and enforced by
Gucki Troopers. Two distinct supernatural entities are involved: the culpable, guiding Road Force and
the predatory evil force (working production name Dominion). Gucki Paste sustains Grevyn's damaged
body while reinforcing control; her own Golghis research enables support without the same bond.
Do not mix the previous campaign's characters, yellow-door plot or recordings into this edition.

### Sources and implementation status

| Source | Authority / use |
|---|---|
| `story/campaign-v2/00-production-bible.md` | Canon, timeline, relationships, exact frame-up, treatment rules, endings and recording constraints |
| `story/campaign-v2/Long_Haul_Full_Campaign.md` | Complete principal narrative, 40 missions, 128 scenes, every spoken LH2 line and all ending branches |
| `story/campaign-v2/campaign_data.json` | Structured mirror of that edition; not imported by the legacy runtime |
| `story/campaign-v2/Dialogue_Recording_Manifest.csv` | Recording IDs, speakers, branch conditions, text, preceding cues and scene context |
| `CAMPAIGN_IMPLEMENTATION.md` | Mission-by-mission build sheets, site layouts, stage predicates, camera tracks, object hints, lighting, score requests, save/recovery rules and acceptance checks |
| `story/campaign-v2/HANDOFF.md` | Resume ledger; update actual implementation references and checks after each development session |

The editable artifact source and polished master/per-role PDFs are in the user's
`Documents/longhaul/scripts` package, with a reproducible generator and gender-organized actor files.
The beta `story/campaign-v2/source/` mirror retains the narrative/design sources for repository-only handoff.
The 43-hour route total is an untested design budget for active gameplay, not a guaranteed runtime or
43 hours of dialogue. P01-P04 now have a playable first implementation; M01-M36 remain NOT_IMPLEMENTED.
Merely generating documents, JSON or a journal entry does not make later missions playable.
No deployment or v1 save migration has occurred.

### Separation and versioning

Retain section 15's current runtime and `longhaul-campaign-v1` saves. Introduce separate proposed
`longhaul-campaign-v2` and `longhaul-campaign-v2-checkpoint` slots, schema 2 and a v2 menu gate before
switching defaults. Do not run `tools/build-campaign.mjs` against the new master: its parser and
speaker table are for the legacy campaign. A v2 loader validates the new JSON and LH2 namespace.
Never infer that similarly numbered missions are interchangeable between editions.

Implement pure data/state first, then authored sites, a cinematic sequencer, hints, lighting/score
adapters and chapter worlds under `js/campaign/v2/`. The prologue modules now exist; later chapter
worlds and the full ending system remain planned. Reuse `ChapterWorld`, targets, NPC animation, vehicle seats and pure-rule patterns
where appropriate. Maintain objective latching, transactional rewards, persisted pending scenes,
private evidence custody and world reconstruction before scene playback. Main remains the only
fixed-step and camera owner; no chapter starts a competing animation loop.

### Camera and discoverable-object contract

Main now arbitrates cinematic ownership through the v2 adapter and `cinematics.js`; CameraRig
continues to handle normal gameplay views. Future chapters must use the same ownership path. Shots follow actual player/vehicle transforms, use absolute coordinates
under worldRoot, and are collision checked. Convert render-space hits with `toWorld()`. Store and
restore cab/chase/foot mode, look, zoom, FOV, pointer-lock intent and motion preferences on completion,
skip, abort, reload and menu interruption; reset chase smoothing on return.

Each scene has authored follow, reaction, wide and object-focus instructions in its build sheet.
Start forced tracks only when safely stationary and no immediate threat is active. Never take
steering during a chase or choose a dialogue response through a camera cut. Minimum shot holds
extend for dialogue completion. Reduced-motion uses stable equivalent views; reduced-flash removes
lightning modulation while retaining threat information. Riped's fatal impact is non-graphic and
fixed, and Grevyn's injurious fall is not replaced with a rescue animation that erases her injuries.

An object-focused shot or hint does not collect evidence. Objects require real targets, unobstructed
interaction and saved inspection facts. Hints progress from composition/diegetic labels to an
optional voiced clue after 45 active-search seconds, then an on-request visible-object marker after
another 45. Pause, dialogue and travel do not accrue search time. No through-wall spoilers or
unearned culprit markers. Skip stops presentation, provides a factual recap and returns to unresolved
choices; it never auto-consents, spends reserve or selects sacrifice.

### Rescue, endings and audio contracts

Preparation is visible and repairable. A verified planned rescue deterministically lets both survive;
only an explicitly chosen emergency attempt uses chance. Edition 2 proposes a disclosed 65% emergency
survival value, one persisted draw at commitment and no reroll on reload. Fatal transfer is a separate,
cancelable confirmation: Cal dies, Grevyn survives with verified bodily support, Road Force is consumed.
All completed severings consume Road Force, including emergency failure. After both survive, an honest
conversation offers together or separate; no romance or hidden approval score chooses the outcome.
Resource numbers, emergency probability, supporting names and site offsets are production decisions
supplied by this draft and must be settled before recording lock.

`CAMPAIGN_IMPLEMENTATION.md` defines reserve/capacitor recovery and all preconditions. Medical support
is independent of field guidance. Grevyn remains severely injured after extraction and needs ongoing
care. Grandpa's later confrontation kills him and fatally damages the evil force; its subsequent death
never reverses the rescue result. Audience-only scenes do not automatically become Cal-known facts.

The existing music module only supports menu/radio playlists. New campaign score cues are requests
for original/owner-approved audio; no cue is claimed to exist or be licensed. Implement one score
owner with dialogue ducking and silence fallback. Preserve voice/subtitle settings and recorded-take
routing by edition. Keep new LH2 lines, branch filters and actor manifests synchronized. Every mission
must survive absent audio, reload, scene skip, streaming and camera restoration before its handoff
ledger status can become VERIFIED.

### Implemented prologue runtime (22 November 2026)

`js/campaign/v2/` implements P01-P04 behind Play → The Way Back. `data.js` validates the narrative JSON; `state.js` owns latching checks, evidence and scene queues; `objects.js` supplies 26 real inspection targets; `index.js` adapts main/journal/HUD/speech; `cinematics.js` owns safe camera tracks; `hints.js` manages active-search time and visible highlights; `lighting.js` reversibly stages time. `sites.js` creates Westhaven/Drywell and a Highway 9 corridor; `traffic.js` drives civilian cars with ordinary physics.

Ground grading is opt-in via `world/authored.js`; terrain height/surface and rendered sampling agree. Main selects v1/v2 adapters explicitly; v2 uses `campaign2`/`checkpoint2` storage slots mapping to the documented v2 keys. Vehicles marked transient are excluded from save flushing/removal writes. Ambient drivers claim and attach to real seats at offscreen spawn; reseating/boarding holds the car stopped. Roads use InstancedMesh batches with local geometry; town colliders and targets are disposed on campaign end.

The guide's original all-missions-NOT_IMPLEMENTED statements describe the initial plan. HANDOFF.md is the current status authority: prologue functional flow is automated-tested, bespoke cinematic acting/final art/manual target-device review remain, and M01-M36 have no gameplay rules yet. No v1 save migration or deployment occurred.

### Authored opening and explicit scene gates

`direction.js` defines the continuous 100-second opening, verified credits, all twelve scene entries, dates, actor marks and walk paths. `film.js` owns letterbox/credits/fades/title cards. `Cinematics.beginTrack` evaluates smooth poses; geographical cuts are hidden, and FOV/control restoration waits for fade-out. Chapter changes stage the next location under a three-second transition. `openingSeen`, `openingTime` and `transitionPending` are persisted in schema 2 without changing legacy slots.

The P01.A school-door target is explicit; proximity alone cannot start it. Regular later scenes use their designated object actions; only closing beats following a deliberate user action auto-continue after a settling interval. Do not reinstate the broad arrival-radius trigger. Static buildings are instanced for rendering and registered as raycast occluders; separate absolute physics colliders, interaction meshes and the mutable blockade are retained. Residents have sidewalk paths and continue walking during the opening.


### Detailed buildings and HUD inventory (local beta, 22 November 2026)

`js/campaign/v2/buildings.js` owns walls with real cutouts, glazed windows, roofs, thresholds, interior partitions and building-local door IDs. `building-materials.js` caches shared procedural finishes. `furnishings.js` supplies type-specific interiors. `sites.js` keeps 28 building records and 82 hinged leaves, registers collision and shelter, positions two shared indoor lights and disposes all per-world resources. `clues.js` supplies permanent evidence fixtures plus stage-specific raycast proxies; use these instead of generic evidence podiums.

`BuildingDoor` in `doors.js` registers its hinge as the actual interaction target. Both the visible hinge and an oriented box collider follow `amount` in [0,1]. Each proposed step checks people in the swing area; blocked steps wait. Paired leaves share a toggle. `PrologueState.doors[id] = {open, amount}` persists geometry and intent. Cinematic staging can open required doors under the film transition. Global static instancing skips dynamic/target ancestors; per-leaf instancing happens inside the hinge so handles, rails and glass remain part of the moving target.

The gameplay HUD uses `hud-roadglass` in `css/hud.css`: actual needs, mission/encounter, time/weather/money, contextual actions and minimap state. Pockets are absent from the normal HUD DOM. `menus.inventory()` renders the same six `Pockets.view()` slots in a compact right drawer, retaining vehicle/journey tabs. Select, use, hands, stow and drop call normal runtime actions; 1–6 quick-item controls remain available. No save format change is required for this presentation.

`ui/inventory-gesture.js` captures the current inventory binding before the menu's keyboard handler. A short press toggles; a press held >=300ms closes its newly opened drawer on release. A second press on an already latched drawer closes it. Ownership survives input `releaseAll()` and the switch to overlay mode. DOM event timestamps prevent queued dispatch from inflating physical hold duration. Typing and OS shortcuts are ignored; blur clears gesture ownership without resuming background gameplay. Touch retains the existing Inventory action. Film/input-locked scenes cannot open the drawer. `openOverlay` keeps the HUD undimmed only for inventory; other overlays retain their prior behavior.

Meaningful regressions: `tests/inventory-gesture.test.mjs`, `tests/buildings-v2.test.mjs`, `tests/campaign-v2-world.test.mjs`, `tests/cinematics-v2.test.mjs`, `tests/traffic-v2.test.mjs`, touch input, item actions/player and save tests. See campaign-v2/HANDOFF.md for observed browser checks and performance limits.
