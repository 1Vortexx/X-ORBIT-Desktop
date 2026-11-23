import assert from 'node:assert/strict';
import { Group } from 'three';
import { Npcs } from '../js/npc/index.js';
import { heightAt } from '../js/world/terrain.js';
// People walk round things in their way: a long wall across the route, and a U-shaped trap they walk into.
const wall=(x,z,hx,hz)=>{const y=heightAt(x,z);return {kind:'box',x,z,hx,hz,yaw:0,y0:y-1,y1:y+3};};
function walk(cols,from,to,seconds=40){
  const npcs=new Npcs({root:new Group(),getColliders:(x,z,r)=>cols.filter(c=>Math.abs(c.x-x)<r+c.hx&&Math.abs(c.z-z)<r+c.hz)});
  const n=npcs.spawn({id:'p',role:'local',seed:3,x:from.x,z:from.z});n.walkTo(to.x,to.z,{arrive:.4});
  let t=0;for(;t<seconds&&!n.arrived;t+=1/30)npcs.update(1/30,{playerPos:n.pos});
  return {n,t};
}
const X=500,Z=2600;   // somewhere on open ground
{ const {n,t}=walk([wall(X,Z+5,6,.15)],{x:X,z:Z},{x:X,z:Z+10});
  assert(n.arrived,'walks round a 12 m wall to the far side (ended '+n.pos.x.toFixed(1)+','+(n.pos.z-Z).toFixed(1)+')');
  console.log('round a wall in',t.toFixed(1),'s'); }
{ const {n,t}=walk([wall(X,Z+4,4,.15),wall(X-4,Z+1.5,.15,2.6),wall(X+4,Z+1.5,.15,2.6)],{x:X,z:Z+1},{x:X,z:Z+12});
  assert(n.arrived,'backs out of a U-shaped pocket and goes round (ended '+(n.pos.x-X).toFixed(1)+','+(n.pos.z-Z).toFixed(1)+')');
  console.log('out of a U-shaped pocket in',t.toFixed(1),'s'); }
console.log('npc path: people walk round walls and out of dead ends');
