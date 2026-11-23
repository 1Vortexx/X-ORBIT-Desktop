import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PrologueState } from '../js/campaign/v2/state.js';
import { validateData,PROLOGUE } from '../js/campaign/v2/data.js';
import { ObjectHints } from '../js/campaign/v2/hints.js';
import { setStorage,writeSave,loadSave,clearSave } from '../js/save.js';
const data=validateData(JSON.parse(readFileSync(new URL('../story/campaign-v2/campaign_data.json',import.meta.url))));
assert.equal(data.missions[0].id,'P01');
let s=new PrologueState();assert(!s.inspect('seat'),'scenes do not complete objectives');
const scenes=[];
for(const m of PROLOGUE){
 assert.equal(s.mission,m.id);
 for(let stage=0;stage<3;stage++){
  while(s.queue.length){scenes.push(s.queue[0]);s.finishScene(s.queue[0]);s.advance();}
  for(const id of m.stages[stage]) {
   assert(s.inspect(id),m.id+':'+id);s.advance();
   // Reload after every interaction, including the closing-scene queue and half-finished stages.
   s=new PrologueState(s.serialize());
   if(s.queue.length && s.queue[0]==='P04.B'){scenes.push('P04.B');s.finishScene('P04.B');s.advance();}
  }
 }
 while(s.queue.length){scenes.push(s.queue[0]);s.finishScene(s.queue[0]);s.advance();}
}
assert(s.ended);assert.equal(Object.keys(s.done).length,4);assert.equal(new Set(scenes).size,12);
assert(!s.inspect('lastcall'));assert.throws(()=>new PrologueState({schema:1}));
const h=new ObjectHints();assert(!h.update(90,{searching:false,visible:true,distance:2}).speak);
assert(h.update(45,{searching:true,visible:false,distance:4}).speak);
h.request();assert(!h.update(1,{searching:true,visible:false,distance:4}).outline);assert(h.update(1,{searching:true,visible:true,distance:4}).outline);
h.reset();assert.equal(h.age,0);
const storage=new Map();setStorage({getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)});
const base={seed:1,day:1,needs:{},world:{},player:{pos:[1,2,3]}};
writeSave({...base,campaign:{mission:'01.01'}},'campaign');writeSave(base);writeSave({...base,campaign:s.serialize()},'campaign2');
assert(loadSave('campaign2').save.campaign.ended);assert.equal(loadSave('campaign').save.campaign.mission,'01.01');
clearSave('campaign2');assert(loadSave('campaign').save);assert(loadSave().save);
console.log('campaign v2: data validation, all four missions, twelve scene gates, per-action reload, hints and save isolation pass');
