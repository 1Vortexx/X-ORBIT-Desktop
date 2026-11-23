import assert from 'node:assert/strict';
import {Vehicle} from '../js/vehicles/vehicle.js';
import {setGround} from '../js/vehicles/ground.js';
import {trafficControl} from '../js/campaign/v2/traffic.js';
setGround({heightAt:()=>0,normalAt:(x,z,o)=>Object.assign(o,{x:0,y:1,z:0}),surfaceAt:()=> 'asphalt',onRoad:()=>true});
const v=new Vehicle({id:'traffic-test',type:'sedan',seed:19}).place(0,0,0);
v.occupied=true;v.parkingBrake=false;v.toggleIgnition();
const dt=1/120,env={ambient:30,wet:0,sand:0,wear:1,night:false};
for(let i=0;i<120*25;i++){
 const target={x:5*Math.sin((v.pos.z+20)/100),z:v.pos.z+20};
 v.step(dt,trafficControl(v,target),env);
}
assert(v.pos.z>80,'civilian drives forward under normal physics');assert(Math.abs(v.pos.x)<12,'driver stays in its road corridor');assert(v.ign==='running');
const obstacle={pos:{x:v.pos.x,z:v.pos.z+24}};
for(let i=0;i<120*12;i++)v.step(dt,trafficControl(v,{x:v.pos.x,z:v.pos.z+20},[obstacle]),env);
assert(Math.abs(v.speed)<.6,'traffic stops for a vehicle/pedestrian ahead');assert(v.pos.z<obstacle.pos.z-3,'traffic leaves clearance');
console.log('traffic v2: civilian engine starts, travels >80 m on a curved route and stops for road users using real vehicle physics');
// Real traffic manager + real NPC seats: every ambient car must contain its driver before moving.
const {Group,Vector3}=await import('three');
const {Npcs}=await import('../js/npc/index.js');
const {Traffic}=await import('../js/campaign/v2/traffic.js');
const root=new Group(),loaded=[];
const fleet={list:loaded,spawn:o=>{const c=new Vehicle(o).place(o.x,o.z,o.yaw);root.add(c.mesh);loaded.push(c);return c;},remove:c=>{loaded.splice(loaded.indexOf(c),1);c.mesh.removeFromParent();}};
const npcs=new Npcs({root,getVehicle:id=>loaded.find(v=>v.id===id),getColliders:()=>[]});
const me={pos:new Vector3(0,0,1100)};
const traffic=new Traffic({vehicles:fleet,npcs,player:()=>me},200);
for(let i=0;i<4;i++)traffic.spawn(me.pos);
assert.equal(traffic.cars.length,4);assert(traffic.cars.some(e=>e.offset===280),'secondary highway has traffic too');
const initial=traffic.cars.map(e=>e.v.pos.clone());
for(const e of traffic.cars){assert.equal(e.n.state,'sit');assert.equal(e.v.seats.driver,e.n.id);assert.equal(e.n.mesh.parent,e.v.mesh);}
for(let i=0;i<120*15;i++){
 npcs.update(dt,{playerPos:me.pos,playerVehicle:null,lite:true,night:false});traffic.update(dt);
 for(const c of loaded)c.step(dt,c.ai,env,loaded);
}
assert(traffic.cars.some((e,i)=>e.v.pos.distanceTo(initial[i])>15));
for(const e of traffic.cars){assert.equal(e.n.state,'sit');assert.equal(e.v.seats.driver,e.n.id);}
traffic.dispose();assert.equal(loaded.length,0);assert.equal(npcs.list.length,0);
console.log('traffic v2: all four cars start with real seated NPCs, use both highways, drive and dispose cleanly');
