// Long Haul – Chapter 4, Lot Forty-One: the rules of its four missions (pure: runs in Node).
// Fern and the sale barn, Alma's photo box at Wes's, Edie's machine, and the locked room behind Vale Garage.
// The player never gets an objective to take anything from someone who paid for it.
// World view additions (js/campaign/world4.js): w.ch4 = { fern: "waiting"|"riding"|"dropped" (to the barn),
// fernHome: same (the drive back), box (Alma's photo box in the bed or hands), treadle (in the bed or hands),
// note: "none"|"unsigned"|"signed", key (the annex key carried) } – plus facts written by interactions.
export const CHAPTER4 = {
  "04.01": {
    objectives: [
      { id: "fern", text: "Collect Fern from her house", hint: "Fern's house is past Vega Tyre, the address Inez wrote down. Talk to her at the window, then pull up alongside so she can get in.",
        done: (w) => w.ch4.fern !== "waiting" },
      { id: "barn", text: "Drive Fern to the sale barn", after: ["fern"], hint: "The sale barn is further down the highway. Stop by the barn doors and she'll get out.",
        done: (w) => w.ch4.fern === "dropped" },
      { id: "door", text: "Get the barn door open", after: ["barn"], hint: "It sticks. There's a hand lever on the wall beside it.", done: (w, st) => !!st.fact("barn:open") },
      { id: "lots", text: (w, st) => `Match the lot boards to Fern's photographs (${Math.min(3, st.count("lot:"))}/3)`, after: ["door"],
        hint: "Lot boards hang inside the barn. Look at each against the photographs.", done: (w, st) => st.count("lot:") >= 3 },
      { id: "book", text: "Have Fern read the buyer entry for Lot 41", after: ["lots"], hint: "Talk to Fern. It's her book.", done: (w, st) => st.seen("04.01.B") },
      { id: "home", text: "Drive Fern home", after: ["book"], hint: "Pull alongside, let her in, and take her back to her house.", done: (w) => w.ch4.fernHome === "dropped" },
    ],
    finish: { flags: ["AUCTION_CONFIRMED", "THREE_RETURN_LEADS"], journal: "Lot 41: mixed household timber, bought by Fern's father for firewood. Some doors went before he collected. Witness didn't see who.", day: "next" },
  },
  "04.02": {
    objectives: [
      { id: "ask", text: "Ask Alma how to recognise her photo box", hint: "Alma is at Mercy Motel.", done: (w, st) => !!st.fact("alma:details") },
      { id: "find", text: "Pick out Alma's box from Wes's second-hand shelf", after: ["ask"],
        hint: "Wes's place. Three boxes on the shelf: only one has two red corners, a dog with a torn ear and her sister's writing.", done: (w, st) => !!st.fact("box:found") },
      { id: "settle", text: "Settle the box with Wes", after: ["find"], hint: "Talk to Wes. Cover his stock cost, or fix the shelf that's been sagging since spring.",
        done: (w, st) => st.seen("04.02.A") },
      { id: "deliver", text: "Bring the box to Alma", after: ["settle"], hint: "Carry it to the pickup, drive to Mercy Motel and talk to Alma.", done: (w, st) => !!st.branch["04.02.B"] },
      { id: "after", text: "Look through the photographs with Alma", after: ["deliver"], done: (w, st) => st.seen("04.02.B") },
    ],
    finish: { flags: ["PHOTOS_RETURNED"], day: "next" },
  },
  "04.03": {
    objectives: [
      { id: "edie", text: "Talk to Edie at her workshop", hint: "Edie's workshop is the house past the bakery. Wait for her to finish the seam.", done: (w, st) => st.seen("04.03.A") },
      { id: "choose", text: "Agree what happens to the treadle machine", after: ["edie"], hint: "Talk to Edie again.",
        done: (w, st) => !!st.branch["04.03.B"] },
      { id: "repair", text: "Get Edie's old hand machine holding tension", after: ["choose"], when: (st) => st.branch["04.03.B"] === "MACHINE_RETURNED",
        hint: "The hand machine on Edie's bench. Her tray has needles and belts: pick the ones that match.", done: (w, st) => !!st.fact("hand:fixed") },
      { id: "carry", text: "Take the treadle to the family at Mercy Camp", after: ["repair"], when: (st) => st.branch["04.03.B"] === "MACHINE_RETURNED",
        hint: "Load the treadle into the bed and drive to Mercy Camp. Manny is holding things for them.", done: (w, st) => !!st.fact("treadle:delivered") },
      { id: "note", text: "Take Edie's ownership note to the family at Mercy Camp", after: ["choose"], when: (st) => st.branch["04.03.B"] === "MACHINE_RETAINED",
        hint: "Drive to Mercy Camp. Manny will get it signed.", done: (w) => w.ch4.note === "signed" },
      { id: "back", text: "Tell Edie how it went", after: ["choose"], hint: "Back to Edie's workshop.",
        done: (w, st) => st.seen("04.03.B") },
    ],
    finish: { day: "next" },
  },
  "04.04": {
    objectives: [
      { id: "key", text: "Find the storage key on June's key board", hint: "The key board is on the office wall at Vale Garage. June tagged everything; read the tags.",
        done: (w) => w.ch4.key },
      { id: "open", text: "Open the storage annex", after: ["key"], hint: "The annex is the block down the track behind Vale Garage. Ellis is meeting you there.",
        done: (w, st) => st.seen("04.04.A") },
      { id: "crates", text: (w, st) => `Inventory the six crates (${Math.min(6, st.count("crate:"))}/6)`, after: ["open"],
        hint: "Read each crate's label. June's addresses are old but accurate.", done: (w, st) => st.count("crate:") >= 6 },
      { id: "form", text: "Look under the wrapping paper", after: ["crates"], hint: "On the shelf at the back.", done: (w, st) => st.seen("04.04.B") },
      { id: "plan", text: "Choose the first two deliveries", after: ["form"], hint: "Talk to Ellis.", done: (w, st) => (st.store.deliveries || []).length >= 2 },
    ],
    finish: { flags: ["RETURN_ROUTE_PLANNED", "CLEARANCE_FORM_FOUND"], journal: "June's contractor form: 'Collection complete. Site cleared as instructed.' Her signature. The attachment is missing. We deliver the crates first." },
  },
};

export const CONDS4 = {
  paying: (st) => !!st.flags.PAY_WES_BOX,
  "repairing shelving": (st) => !!st.flags.TRADE_WES_BOX,
};
