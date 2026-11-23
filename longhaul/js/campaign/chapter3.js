// Long Haul – Chapter 3, Weight on the Axle: the rules of its four missions (pure: runs in Node).
// The weigh station down the highway, the scrapyard and Wes's builders' merchant, the ticket, then Inez.
// World view additions (js/campaign/world3.js): w.ch3 = { onScale (pickup stopped on the platform), weights (test weights
// lying on the platform), balanced, belt, connector, paper, copies (evidence copies carried), toolbox (Ellis's toolbox in
// the bed or hands), ellis: "waiting"|"riding"|"dropped" } – plus facts written by interactions.
export const CHAPTER3 = {
  "03.01": {
    objectives: [
      { id: "arrive", text: "Meet Ellis at the Mercy Weigh Station", hint: "Drive down the highway past Bell's Bakery. Ellis is waiting by the scale; talk to him.",
        done: (w, st) => st.seen("03.01.A") },
      { id: "inspect", text: (w, st) => `Inspect the generator, junction box and scale platform (${Math.min(3, st.count("insp:"))}/3)`, after: ["arrive"],
        hint: "Walk up to each one and look it over. The junction box can't be opened while the supply is live.",
        done: (w, st) => st.count("insp:") >= 3 },
      { id: "isolate", text: "Isolate the power at the main switch", after: ["arrive"],
        hint: "The isolator is the grey box on the pole beside the shed. Isolate, test, work.", done: (w, st) => !!st.fact("ws:isolated") },
      { id: "debris", text: (w, st) => `Clear the fallen roof sheets off the platform (${Math.min(4, st.count("debris:"))}/4)`, after: ["isolate"],
        hint: "The roof is on the platform now. Hold the use key on each sheet to drag it clear.", done: (w, st) => st.count("debris:") >= 4 },
      { id: "printer", text: "Find out what the ticket printer needs", after: ["inspect", "debris"],
        hint: "The printer is on the desk in the roofless shed.", done: (w, st) => st.seen("03.01.B") },
    ],
    finish: { journal: "Weigh station: the printer wants continuous paper; the generator needs a sound pulley belt and a connector rated for it. Wes at the builders' merchant, or the scrapyard.", day: "next" },
  },
  "03.02": {
    objectives: [
      { id: "belt", text: "Find a pulley belt that fits", hint: "The scrap yard between the garage and the motel has old pump engines. Search them. Wes can sell you one if you strike out.",
        done: (w) => w.ch3.belt },
      { id: "wes", text: "See Wes at the builders' merchant about paper and a connector", hint: "Wes's place is up the highway from Vale Garage. Talk to him at the counter.",
        done: (w, st) => st.seen("03.02.A") },
      { id: "settle", text: "Settle up with Wes", after: ["wes"], hint: "Pay him, or work it off at his counter: he's got a vice that won't turn.",
        done: (w, st) => !!(st.flags.PAY_WES || st.flags.TRADE_WES) },
      { id: "parts", text: "Collect the connector and the printer paper", after: ["settle"], hint: "Wes puts them on the counter. They're small: they go in your pockets.",
        done: (w) => w.ch3.connector && w.ch3.paper },
    ],
    finish: { flags: ["SCALE_PARTS_READY"] },
  },
  "03.03": {
    objectives: [
      { id: "install", text: "Fit the belt and connector to the station generator", hint: "Back at the weigh station. Hold the use key on the generator with the parts in your pockets.",
        done: (w, st) => !!st.fact("ws:fitted") },
      { id: "paper", text: "Load the paper into the ticket printer", hint: "The printer on the shed desk.", done: (w, st) => !!st.fact("ws:paper") },
      { id: "restore", text: "Restore the power at the main switch", after: ["install", "paper"], hint: "The isolator on the pole.",
        done: (w, st) => !!st.fact("ws:restored") },
      { id: "start", text: "Get Ellis to start it", after: ["restore"], hint: "Ellis is at the controls by the shed. Talk to him.", done: (w, st) => st.seen("03.03.A") },
      { id: "calibrate", text: (w) => `Calibrate the empty platform: set out the four test weights (${Math.min(4, w.ch3.weights)}/4)`, after: ["start"],
        hint: "The 25 kg test weights are stacked by the shed. Carry them onto the platform and spread them out; set them down, don't hold them.",
        done: (w) => w.ch3.weights >= 4 && w.ch3.balanced },
      { id: "weigh", text: "Drive the pickup onto the scale and stop", after: ["calibrate"], hint: "Take the test weights off first if you like; the printer subtracts them. Stop with all four wheels on the platform.",
        done: (w, st) => !!st.fact("ws:weighed") },
      { id: "compare", text: "Compare the new ticket with June's carbon and the ledger stub", after: ["weigh"],
        hint: "At the shed desk. Photograph only the entry that matches the carbon.", done: (w, st) => st.seen("03.03.B") },
    ],
    finish: { flags: ["CARGO_WEIGHT_CONFIRMED", "LOT_41_LEAD"], day: "next" },
  },
  "03.04": {
    objectives: [
      { id: "copies", text: (w, st) => `Make two copies of the ticket and the stub (${Math.min(2, st.count("copy:"))}/2)`,
        hint: "June's copier is in the garage office at Vale Garage.", done: (w, st) => st.count("copy:") >= 2 },
      { id: "archive", text: "Lock the originals in the office archive case", after: ["copies"], hint: "The grey case under the office window. Water can't get at it there.",
        done: (w, st) => !!st.fact("archive:ticket") },
      { id: "tools", text: "Return Ellis's toolbox", hint: "It's the red box he lent you at the weigh station. Ellis is home: the Ward house past Last Chance Gas.",
        done: (w, st) => !!st.fact("toolbox:returned") },
      { id: "inez", text: "Take a copy to Inez at the radio station above Vega Tyre", after: ["archive"],
        hint: "Vega Tyre is past the weigh station. The studio is upstairs; Inez is in. Talk to her.", done: (w, st) => st.seen("03.04.A") },
      { id: "lead", text: "Ask Inez about the auction", after: ["inez"], done: (w, st) => st.seen("03.04.B") },
    ],
    finish: { flags: ["INEZ_CONTACT", "FERN_ADDRESS"], journal: "Fern called the household auction. Inez wrote her address on a tyre invoice. Correction to my notes: trip not yet matched to the call.", day: "next" },
  },
};

export const CONDS3 = {};
