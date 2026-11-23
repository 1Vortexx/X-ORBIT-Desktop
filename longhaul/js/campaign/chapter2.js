// Long Haul – Chapter 2, The People Who Waited: the rules of its four missions (pure: runs in Node).
// Friday to the first Saturday's supper at Mercy Motel, then the drive home that night.
// World view additions (js/campaign/world2.js): w.ch2 = { gen: "idle"|"running"|"failed"|"passed", genIn (generator in the
// truck bed), bread (crates in the bed), chairsIn, oilIn, stoveIn (camp stove in the bed), legs (stove legs carried),
// ellis: "waiting"|"riding"|"home" } – plus facts written by interactions.
export const CHAPTER2 = {
  "02.01": {
    objectives: [
      { id: "diagnose", text: "Find out why Lorna's generator cuts out", hint: "Back at Vale Garage: run the generator on the test stand and watch what it does when it dies.",
        done: (w, st) => !!st.fact("gen:diagnosed") },
      { id: "fix", text: "Clean the fuel vent and run a load test", after: ["diagnose"],
        hint: "Clean the vent on the test stand, then start a load test. It has to hold for half an hour of game time; you can do other things meanwhile.",
        done: (w) => w.ch2.gen === "passed" },
      { id: "deliver", text: "Deliver the generator to Bell's Bakery", after: ["fix"],
        hint: "Lift it off the stand, secure it in the bed and drive to Bell's Bakery. Talk to Lorna there.", done: (w, st) => st.seen("02.01.A") },
      { id: "bread", text: (w) => `Load the bread for supper (${Math.min(2, w.ch2.bread)}/2 crates)`, after: ["deliver"],
        hint: "Lorna's two crates are outside the bakery door. Secure both in the pickup bed.", done: (w) => w.ch2.bread >= 2 },
    ],
    finish: { scene: "02.01.B" },
  },
  "02.02": {
    objectives: [
      { id: "chairs", text: (w, st) => `Collect six chairs from the hire shed (${Math.min(6, st.fact("chairs:delivered") || w.ch2.chairsIn)}/6)`,
        hint: "Basin Hire is on the highway between the garage and the motel. Stack the folding chairs in the bed.",
        done: (w, st) => (st.fact("chairs:delivered") || 0) >= 6 || w.ch2.chairsIn >= 6 },
      { id: "stove", text: "Borrow the camp stove from Manny", hint: "Mercy Camp is by the highway. The stove is beside Manny's tent; pick it up.",
        done: (w, st) => st.seen("02.02.A") },
      { id: "oil", text: "Bring the lamp oil, secured in the bed", hint: "The lamp oil tin is at the camp. Don't drive with it in your hands: set it down in the bed.",
        done: (w, st) => !!st.fact("oil:delivered") || w.ch2.oilIn },
      { id: "unload", text: "Unload everything at Mercy Motel", after: ["chairs", "stove", "oil"],
        hint: "Park at the motel and talk to Del by the yellow door table.", done: (w, st) => !!st.fact("supper:unloaded") },
      { id: "seating", text: "Set out the seating with Del", after: ["unload"],
        hint: "Use the table. Think about who has to get to it, and how.", done: (w, st) => st.seen("02.02.B") },
    ],
    finish: { day: "Saturday", time: 0.74 },
  },
  "02.03": {
    start: ["02.03.A"],
    objectives: [
      { id: "serve", text: (w, st) => `Serve the tables (${Math.min(3, st.count("serve:"))}/3)`, hint: "Hold the use key on the yellow door table, once for each table.",
        done: (w, st) => st.count("serve:") >= 3 },
      { id: "talk", text: (w, st) => `Talk to Nico, Fern and Ellis (${st.count("talk:")}/3)`, hint: "They're around the motel yard. Walk up and talk.",
        done: (w, st) => st.count("talk:") >= 3 },
      { id: "excerpt", text: "Hear the county recording Inez brought", after: ["serve", "talk"], hint: "Inez is by the motel office. Ask her about it.",
        done: (w, st) => !!st.branch["02.03.B"] },
      { id: "after", text: "Hear Ellis out", after: ["excerpt"], done: (w, st) => st.seen("02.03.B") },
    ],
  },
  "02.04": {
    objectives: [
      { id: "lift", text: "Give Ellis a lift home", hint: "Ellis is by the motel. Offer him a ride; his place is just up the road from Vale Garage.",
        done: (w) => w.ch2.ellis === "home" },
      { id: "stove", text: "Return the camp stove, legs and all", hint: "Load the stove from beside the table. Manny is at Mercy Camp. Bring the legs.",
        done: (w, st) => !!st.fact("stove:returned") },
      { id: "ticket", text: "Log the weigh ticket in the garage ledger", after: ["lift"], hint: "The ledger is on the office table at Vale Garage.",
        done: (w, st) => !!st.fact("ticket:logged") },
      { id: "close", text: "Close up the garage", after: ["ticket", "stove"], hint: "Lower the yard shutter.", done: (w, st) => !!st.fact("shutter:closed") },
      { id: "route", text: "Look over the route to the weigh station", after: ["ticket"], hint: "Open the map. The weigh station is marked further down the highway.",
        done: (w, st) => !!st.fact("map:weigh") },
      { id: "call", text: "Leave Lorna a message about the generator", after: ["close", "route"], hint: "The office telephone.",
        done: (w, st) => st.seen("02.04.B") },
    ],
    finish: { day: "next" },
  },
};

export const CONDS2 = {
  "not accessible": (st) => !st.flags.ACCESSIBLE_TABLE,
};
