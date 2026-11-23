// Long Haul – who the story's people are, from the campaign script's character directory: gender and playing age.
// Used for how they walk and stand (js/npc/model.js via the campaign) and how they sound (js/speech.js).
export const CAST = {
  Callum:{g:"m",age:26}, Grevyn:{g:"f",age:26}, Riped:{g:"m",age:26}, Tay:{g:"f",age:26}, TayJ:{g:"f",age:26}, Orin:{g:"m",age:62}, "Commander Voss":{g:"m",age:46}, Lio:{g:"m",age:21}, Jess:{g:"f",age:21},
  Kit: { g: "f", age: 30 }, June: { g: "f", age: 60 }, Alma: { g: "f", age: 68 }, Nico: { g: "m", age: 40 },
  Ellis: { g: "m", age: 29 }, Inez: { g: "f", age: 40 }, Del: { g: "m", age: 70 }, Lorna: { g: "f", age: 43 },
  Mara: { g: "f", age: 44 }, Owen: { g: "m", age: 64 }, Sera: { g: "f", age: 41 }, Fern: { g: "f", age: 74 },
  Wes: { g: "m", age: 59 }, Edie: { g: "f", age: 36 }, Manny: { g: "m", age: 55 }, Rosa: { g: "f", age: 54 },
  Mateo: { g: "m", age: 22 }, Len: { g: "m", age: 34 }, Ada: { g: "f", age: 47 }, Tom: { g: "m", age: 38 },
};
// Roadside strangers' names (js/npc/index.js) that read as one or the other; the rest are decided by a hash
const STRANGERS = { Mara: "f", Wes: "m", Sam: "m", Jo: "f", Rosa: "f", Eli: "m", Val: "f", Jess: "f", Ruth: "f", Dev: "m", Avery: "f", Kit: "f" };

export function castOf(name) {
  if (CAST[name]) return CAST[name];
  let h = 0;
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { g: STRANGERS[name] || (h % 2 ? "m" : "f"), age: 25 + (h % 45) };
}
