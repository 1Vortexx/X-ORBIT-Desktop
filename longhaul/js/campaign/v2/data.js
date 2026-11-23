// Separate from the legacy SCRIPT/parser and save edition.
export function validateData(data) {
  const ids = new Set();
  if (!data?.cast || data.missions?.length !== 40) throw Error('Campaign edition 2 needs 40 missions and a cast.');
  for (const m of data.missions) {
    if (ids.has(m.id) || !m.scenes?.length) throw Error('Invalid mission: ' + m.id);
    ids.add(m.id);
    for (const s of m.scenes) {
      if (ids.has(s.id)) throw Error('Duplicate scene: ' + s.id);
      ids.add(s.id);
      for (const l of s.lines) {
        if (ids.has(l.id) || !data.cast[l.speaker]) throw Error('Invalid line: ' + l.id);
        ids.add(l.id);
      }
    }
  }
  return data;
}
export async function loadData(fetcher = fetch) {
  const r = await fetcher(new URL('../../../story/campaign-v2/campaign_data.json', import.meta.url));
  if (!r.ok) throw Error('The Way Back script could not be loaded.');
  return validateData(await r.json());
}
export const NAMES = { CAL:'Callum', GREVYN:'Grevyn', RIPED:'Riped', TAY:'Tay', TAYJ:'TayJ', ORIN:'Orin', VOSS:'Commander Voss', LIO:'Lio', JESS:'Jess' };
// Objects are explicit stage checks. Watching/skipping a scene never checks them off.
export const PROLOGUE = [
 { id:'P01', site:'school', year:2085, stages:[['timetable','seat'],['sources','friends'],['photo','sophomore']] },
 { id:'P02', site:'depot', year:2091, stages:[['graduation','contract'],['manifest','checkpoint1','checkpoint2'],['ledger','copy']] },
 { id:'P03', site:'school', year:2091, stages:[['originals','panel'],['westmap','phrase'],['request','carbon','depart']] },
 { id:'P04', site:'drywell', year:2091, stages:[['bridge','slip'],['westroad','blockade'],['extract','lastcall']] },
];
