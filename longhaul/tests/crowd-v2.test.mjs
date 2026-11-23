import assert from 'node:assert/strict';
import { Group, Vector3 } from 'three';
globalThis.Audio??=class{play(){return Promise.resolve();}pause(){}load(){}removeAttribute(){}};
import { Npcs } from '../js/npc/index.js';
import { Crowd } from '../js/campaign/v2/crowd.js';
const root=new Group(),npcs=new Npcs({root,getColliders:()=>[]}),me={pos:new Vector3(0,0,-30)},barks=[];
const crowd=new Crowd({npcs,root,player:()=>me,listener:()=>me.pos,opening:()=>false,clip:(src,o)=>{barks.push({src,...o});return {setVolume(){},stop(){}};}},[{x:0,y:0,z:0},{x:0,y:0,z:5000}]);
crowd.update(1/30,{school:true});
const town=crowd.towns[0];
assert(town.on&&!crowd.towns[1].on,'only the nearby town fills');
assert(npcs.list.length>=50&&npcs.list.length<=80,'a busy town, not a crush: '+npcs.list.length+' people');
assert(town.people.filter(e=>e.kind==='jog').length<=2,'two joggers at most');
const walkers=town.people.filter(e=>e.kind==='walk'||e.kind==='jog'),from=new Map(walkers.map(e=>[e,e.n.pos.clone()]));
assert(town.dogs.some(d=>d.owner)&&town.dogs.some(d=>d.yard),'dogs on leads and in the front yards');
const students=()=>town.people.filter(e=>e.kind==='student').length,before=students();let atDoor=0,samples=0;
for(let i=0;i<30*90;i++){crowd.update(1/30,{school:true});npcs.update(1/30,{playerPos:me.pos,viewPos:me.pos});
 if(i>30*20&&i%15===0){samples++;atDoor+=npcs.list.filter(n=>!n.seat&&Math.abs(n.pos.x)<3&&n.pos.z<-11&&n.pos.z>-14.5&&n.arrived).length;}}
assert(walkers.filter(e=>e.n.pos.distanceTo(from.get(e))>10).length>=walkers.length*.75,'people actually walk about town');
assert(students()>=before-3,'students keep arriving as others go in ('+students()+' of '+before+')');
assert(atDoor/samples<1,'nobody hangs about in front of the doors (average '+(atDoor/samples).toFixed(2)+')');
const waiting=town.people.filter(e=>e.kind==='waiting');assert(waiting.every(e=>Math.abs(e.n.pos.x)>6||e.n.pos.z<-22),'waiting students stand to the sides, clear of the doors and the courtyard');
// a yard dog barks at you when you walk up to its fence (in bursts, with pauses), louder the closer you are
const yard=town.dogs.find(d=>d.yard);me.pos.set(yard.house.x,0,yard.house.z-14);barks.length=0;
for(let i=0;i<30*4;i++)crowd.update(1/30,{school:true});const far=barks.length?Math.max(...barks.map(b=>b.volume)):0;
me.pos.set(yard.house.x,0,yard.house.z-10.6);barks.length=0;for(let i=0;i<30*8;i++)crowd.update(1/30,{school:true});const near=Math.max(...barks.map(b=>b.volume));
assert(barks.length>=2&&barks.every(b=>/dog_bark_quick/.test(b.src)),'quick barks at you');assert(near>far,'louder up close ('+far.toFixed(2)+' -> '+near.toFixed(2)+')');
assert(town.people.filter(e=>e.kind==='sit').every(e=>e.n.perch),'bench sitters stay seated');
me.pos.set(0,0,2000);crowd.update(1/30);assert.equal(npcs.list.length,0,'leaving town clears the crowd');assert.equal(root.children.filter(c=>c.name==='Dog'||c.isLine).length,0,'and its dogs');
console.log('crowd v2: a full town of walkers, joggers, groups, bench sitters and students arriving at school; cleared on leaving');
