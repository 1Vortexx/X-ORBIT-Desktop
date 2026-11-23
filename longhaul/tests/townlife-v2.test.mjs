import assert from 'node:assert/strict';
import { Group, Vector3 } from 'three';
import { Vehicle } from '../js/vehicles/vehicle.js';
import { setGround } from '../js/vehicles/ground.js';
import { Npcs } from '../js/npc/index.js';
import { TownLife } from '../js/campaign/v2/traffic.js';
setGround({heightAt:()=>0,normalAt:(x,z,o)=>Object.assign(o,{x:0,y:1,z:0}),surfaceAt:()=>'asphalt',onRoad:()=>true});
const root=new Group(),loaded=[];
const fleet={list:loaded,spawn:o=>{const c=new Vehicle(o).place(o.x,o.z,o.yaw);root.add(c.mesh);loaded.push(c);return c;},remove:c=>{loaded.splice(loaded.indexOf(c),1);c.mesh.removeFromParent();}};
const npcs=new Npcs({root,getVehicle:id=>loaded.find(v=>v.id===id),getColliders:()=>[]});
const me={pos:new Vector3(0,0,-30),vehicle:null};
const life=new TownLife({vehicles:fleet,npcs,player:()=>me},[{x:0,y:0,z:0},{x:0,y:0,z:5000}]);
const dt=1/60,env={ambient:30,wet:0,sand:0,wear:1,night:false};
life.update(dt);
const town=life.towns[0];
assert(town.on&&!life.towns[1].on,'only the town the player is in comes to life');
assert(town.parked.length>=8&&town.cars.length===6,'six cars driving round Westhaven');
for(const e of town.cars)assert.equal(e.v.seats.driver,e.n.id,'every town car has its driver seated');
const corners=town.cars.map(e=>({seg:e.seg,n:0}));
for(let i=0;i<60*90;i++){
 life.update(dt);npcs.update(dt,{});
 for(const v of loaded)v.step(dt,v.ai||{throttle:0,steer:0,handbrake:true},env);
 town.cars.forEach((e,j)=>{if(e.seg!==corners[j].seg){corners[j].seg=e.seg;corners[j].n++;}
  const x=e.v.pos.x,z=e.v.pos.z;assert(Math.min(Math.abs(x-70),Math.abs(x+70),Math.abs(z-55),Math.abs(z+55))<5.5,'town car stays on its streets');});
}
for(const c of corners)assert(c.n>=4,'each car keeps circling the town ('+c.n+' corners in 90 s)');
for(const v of town.parked)assert(Math.abs(v.speed)<.05,'parked cars stay parked');
me.pos.set(0,0,2000);life.update(dt);
assert.equal(loaded.length,0);assert.equal(npcs.list.length,0,'leaving the town clears its cars and drivers');
console.log('town life v2: parked cars, seated drivers circling the streets in lane under real physics, cleared on leaving');
