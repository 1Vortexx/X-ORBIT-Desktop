// Long Haul – Chapter 1, The Garage: the rules of its four missions (pure: runs in Node).
// Objectives read the world view `w` built by the runtime (js/campaign/index.js) every half second:
//   w.day, w.inOffice, w.water (bottles + jugs carried or in the truck), w.truck = { hood 0..1, newBattery, running,
//   oil 0..1, coolant 0..1, cargo: Set of item types, door } – and the facts interactions write into the state.
// Wording follows the script's objective lists; hints only show after the player asks for help in the journal.
export const CHAPTER1 = {
  "01.01": {
    start: ["01.01.A"],
    objectives: [
      { id: "office", text: "Enter the office", hint: "June ran the business from the house by the road. Go in through the front door.",
        done: (w) => w.inOffice },
      { id: "tags", text: (w, st) => `Read the three customer job tags (${Math.min(3, st.count("tag:"))}/3)`,
        hint: "The tags are on the table in the office, beside the telephone.", done: (w, st) => st.count("tag:") >= 3 },
      { id: "truck", text: "Inspect the pickup", hint: "Open the hood of the pickup on the driveway and look the engine over.",
        done: (w) => w.truck.hood > 0.5 },
      { id: "phone", text: "Telephone the generator customer", after: ["tags"],
        hint: "The telephone is on the office table. The generator tag has the customer's name.", done: (w, st) => st.seen("01.01.B") },
      { id: "shutter", text: "Open the yard shutters", hint: "Hold the use key on the roll-up shutter across the garage bay.",
        done: (w, st) => !!st.fact("shutter") },
    ],
    finish: { scene: "01.01.C" },
  },
  "01.02": {
    objectives: [
      { id: "test", text: "Test the old battery", hint: "Sit in the pickup and turn the key. Listen to what the starter does.",
        done: (w, st) => !!st.fact("battery:tested") },
      { id: "find", text: "Find the replacement battery", hint: "June kept new parts on the floor under the workbench at the back of the garage.",
        done: (w, st) => !!st.fact("battery:found") },
      { id: "install", text: "Install the new battery", after: ["find"],
        hint: "Open the hood. With the wrench, take the old battery out, then fit the new one from the carton.",
        done: (w) => w.truck.newBattery },
      { id: "water", text: (w) => `Carry drinking water (${Math.min(2, w.water)}/2)`,
        hint: "There are bottles on the porch table. Keep them in your pockets or secure them in the bed.", done: (w) => w.water >= 2 },
      { id: "fluids", text: "Check the oil and coolant", hint: "Pull the dipstick under the hood. The oil on the workbench tops it up.",
        done: (w) => w.truck.oil >= 0.84 && w.truck.coolant >= 0.84 },
      { id: "kit", text: "Secure the recovery kit in the bed", hint: "June's orange recovery kit is on the garage floor by the bay (the jack or a repair kit will do too). Carry it to the pickup bed and set it down inside.",
        done: (w) => w.truck.cargo.has("recovery_kit") || w.truck.cargo.has("jack") || w.truck.cargo.has("repairkit") },
      { id: "start", text: "Start the engine", after: ["install"], hint: "Get in and turn the key.",
        done: (w) => w.truck.newBattery && w.truck.running },
    ],
    finish: { scene: "01.02.B" },
  },
  "01.03": {
    objectives: [
      { id: "message", text: "Play the message on the answering machine", hint: "The answering machine is beside the telephone in the office.",
        done: (w, st) => st.seen("01.03.A") },
      { id: "bench", text: "Take a closer look at the workbench", after: ["message"],
        hint: "The yellow workbench in the middle of the garage. Look at what it really is.", done: (w, st) => !!st.fact("bench:seen") },
      { id: "call", text: "Call Alma back", after: ["message"], hint: "Use the office telephone.", done: (w, st) => st.seen("01.03.B") },
      { id: "clear", text: "Clear the tools and brackets off the door", after: ["bench"], hint: "Hold the use key on the door.",
        done: (w, st) => !!st.fact("door:cleared") },
      { id: "marks", text: "Protect the pencil marks on the jamb", after: ["clear"],
        hint: "Wrap the jamb before it moves. Wiping it down would take the marks with the dust.",
        done: (w, st) => !!(st.fact("door:wrapped") || st.fact("door:wiped")) },
      { id: "load", text: "Secure the door in the pickup bed", after: ["marks"],
        hint: "Lift the door off the trestles, carry it to the pickup and set it down inside the bed.", done: (w) => w.truck.door },
      { id: "tape", text: "Play the cassette by the battery shelf", optional: true, after: ["message"],
        hint: "There's a cassette player on the back bench in the garage.", done: (w, st) => st.seen("01.03.C") },
    ],
  },
  "01.04": {
    objectives: [
      { id: "route", text: "Find Mercy Motel on the map", hint: "Open the map. The motel is marked on the highway ahead.",
        done: (w, st) => !!st.fact("map:opened") },
      { id: "straps", text: "Check the straps at the pull-off", hint: "Pull in at the marked pull-off on the way, get out and check the load in the bed.",
        done: (w, st) => !!st.fact("straps") },
      { id: "del", text: (w, st) => (st.branch["01.04.A"] === "DRIVE" ? "Drop Del at the motel" : "Help Del with his groceries"),
        hint: "Del is waiting at the pull-off with his shopping. Talk to him.",
        done: (w, st) => !!(st.flags.DEL_ASSISTED || st.fact("del:home")) },
      { id: "deliver", text: "Deliver the door to Alma at Mercy Motel", hint: "Park at Mercy Motel with the door in the bed and talk to Alma.",
        done: (w, st) => st.seen("01.04.B") },
    ],
    finish: { day: "Friday" },
  },
};

// Conditions written into line directions in chapter 1
export const CONDS = {
  "not protected": (st) => !st.flags.PENCIL_PROTECTED,
};
