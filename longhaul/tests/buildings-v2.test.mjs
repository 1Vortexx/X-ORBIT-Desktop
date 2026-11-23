import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PrologueWorld } from '../js/campaign/v2/sites.js';
import { setSeed } from '../js/world/terrain.js';
import { circleFree } from '../js/core/collide.js';
import { PrologueState } from '../js/campaign/v2/state.js';
const canvas=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>canvas})};
setSeed(19112112);
const root=new THREE.Group(),person={onFoot:true,pos:new THREE.Vector3(0,0,-1000)},sounds=[];
const ctx={root,player:()=>person,npcs:{list:[]},sfx:(s)=>sounds.push(s)};
const state=new PrologueState(),world=new PrologueWorld(ctx);world.doorStates=state.doors;world.bind();world.build();
assert.equal(world.buildings.length,28);assert(world.doors.size>=70,'public buildings, homes, school and internal rooms have real doors');
for(const type of ['school','diner','store','house','rooms','clinic','workshop','radio','water','civic']){
 const b=world.buildings.find(b=>b.type===type);assert(b,type+' exists');assert(b.details.length>30,type+' is furnished');assert(b.doors.length>=2,type+' has entry/exit doors');
 assert(world.indoorAt(b.site.x,b.site.z),'authored interiors count as shelter');
}
const school=world.schoolBuilding,doors=school.doors.filter(d=>d.pair),a=doors[0];
const centre={x:school.site.x,z:school.site.z-school.d/2},y=school.site.y;
assert(!circleFree(centre.x,centre.z,.32,doors.map(d=>d.collider),y+.1,y+1.7),'closed doors block the doorway');
a.toggle();for(let i=0;i<100;i++)world.update(.01);
assert(doors.every(d=>d.amount>.99));assert(circleFree(centre.x,centre.z,.32,doors.map(d=>d.collider),y+.1,y+1.7),'open doors leave actual walking clearance');
assert(sounds.includes('door_open'));
world.openSceneDoors('P01.A',school.site);
assert.equal(school.doors.find(d=>d.id.endsWith(':foyer')).amount,0,'seated shot keeps the foyer leaf out of the window desks');
assert.equal(school.doors.find(d=>d.id.endsWith(':history')).amount,1,'the corridor entry stays clear');
const saved=new PrologueState(state.serialize());assert(saved.doors[a.id].open&&saved.doors[a.id].amount>.99,'door position persists');
const dynamic=[];a.hinge.traverse(o=>{if(o.isMesh)dynamic.push(o);});assert(dynamic.reduce((n,o)=>n+(o.count||1),0)>=6,'leaf includes rails, glass and hardware');assert(dynamic.length<=4,'leaf details are batched within their moving hinge');assert(dynamic.every(o=>o.parent),'batching retains animated door geometry');
// Closing must not sweep through somebody standing in the door arc.
const next=a.geometry(.7);person.pos.set(next.x,y,next.z);a.setOpen(false);const old=a.amount;
for(let i=0;i<100;i++)world.update(.01);
assert(a.amount>.7,'door stops before intersecting occupant');assert(a.obstructed);
person.pos.set(0,0,-1000);for(let i=0;i<100;i++)world.update(.01);assert(a.amount<.01,'closing resumes when clear');assert(sounds.includes('door_close'));
const id=a.id;world.dispose();assert.equal(root.children.length,0);
const restored=new PrologueWorld(ctx);restored.doorStates=saved.doors;restored.bind();restored.build();assert(restored.doors.get(id).amount>.99,'reload reconstructs open geometry and collider');restored.dispose();
console.log('detailed buildings: 28 furnished interiors, 70+ hinged doors, open/closed collision, real leaves after batching, swing safety, sound, save/restore and cleanup pass');
