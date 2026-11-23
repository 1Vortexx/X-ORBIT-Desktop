import assert from 'node:assert/strict';
import {readFileSync}from'node:fs';
import * as THREE from 'three';
const c2=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={body:{append(){}},createElement:()=>({width:0,height:0,getContext:()=>c2,setAttribute(){},append(){},remove(){},hidden:false,style:{},dataset:{}})};
const {setSeed,heightAt,surfaceAt}=await import('../js/world/terrain.js');
const {PrologueCampaign}=await import('../js/campaign/v2/index.js');
const {trafficControl}=await import('../js/campaign/v2/traffic.js');
const {circleFree}=await import('../js/core/collide.js');
const {Cinematics}=await import('../js/campaign/v2/cinematics.js');
setSeed(19112112);
const root=new THREE.Group(),camera=new THREE.PerspectiveCamera(70),p={pos:new THREE.Vector3(),speed:0,onFoot:true},people=[];
let time=.4,dialogue=null;
const ctx={root,camera,npcs:{spawn:s=>{const n={...s,pos:new THREE.Vector3(s.x,heightAt(s.x,s.z),s.z),talkFor(){},enterVehicle(){}};people.push(n);return n;},remove:n=>people.splice(people.indexOf(n),1)},vehicles:{list:[]},truck:()=>null,player:()=>p,teleport:(x,z)=>p.pos.set(x,heightAt(x,z),z),move:(x,z)=>p.pos.set(x,heightAt(x,z),z),setTime:t=>time=t,time:()=>time,yaw:()=>0,reducedMotion:()=>false,releaseInput(){},snapCamera(){},notify(){},sfx(){},stopVoice(){},speaking:()=>false,say(){},wound(){},dialogue:s=>{dialogue=s;}};
const camp=new PrologueCampaign(ctx,JSON.parse(readFileSync(new URL('../story/campaign-v2/campaign_data.json',import.meta.url))));
camp.bindPlaces();camp.begin(null,{fresh:true});
assert(camp.opening,'fresh campaign opens in the town, not a classroom scene');
camp.finishOpening(true);for(let i=0;i<12;i++){camp.applyCamera(.1);camp.update(.1);}
assert(!camp.opening&&camp.st.openingSeen);
camp.traffic.update=()=>{}; // Vehicle/NPC integration is exercised in traffic-v2.test.mjs.
assert.equal(camp.scene,undefined,'school scene waits for interaction');
const door=camp.world.objects.get('classroom');p.pos.set(door.pos.x,door.pos.y-1.5,door.pos.z-1);
for(let i=0;i<25;i++)camp.update(.1);
assert(!camp.scene,'standing near the entrance must not auto-start a scene');
// Room 9: the window seat does nothing until Cal has opened the classroom door; then sitting there starts the scene
const seat=camp.world.objects.get('P01:seat');p.pos.set(seat.pos.x,seat.pos.y,seat.pos.z-.8);
assert(camp.awaitingDoor&&!camp.enterQueuedScene('seat'),'the seat waits for the classroom door');
const classDoor=camp.world.schoolBuilding.doors.find(d=>d.id.endsWith(':history'));
p.pos.set(classDoor.origin.x+1.2,classDoor.origin.y,classDoor.origin.z);classDoor.setOpen(true,true,false);camp.update(.1);
assert(camp.st.facts['P01:door']&&!camp.awaitingDoor,'opening the classroom door is registered');
p.pos.set(seat.pos.x,seat.pos.y,seat.pos.z-.8);
assert(camp.enterQueuedScene('seat'),'sitting at the window seat starts the first scene');
assert(camp.playerChair(),'Cal sits in the window seat for the scene');assert(camp.st.facts['P01:seat']);
camp.finishScene(true);for(let i=0;i<12;i++){camp.applyCamera(.1);camp.update(.1);}assert(camp.st.seen['P01.A']);assert.equal(camp.playerChair(),null,'Cal stands up when the scene ends');
// the next objective is marked: a marker floats over the timetable, and moves on once it has been read
{const tt=camp.world.objects.get('P01:timetable');p.pos.set(tt.pos.x+6,tt.pos.y-1.4,tt.pos.z-3);camp.update(.1);
 assert(camp.marker.visible&&Math.hypot(camp.marker.position.x-tt.pos.x,camp.marker.position.z-tt.pos.z)<.01&&camp.marker.position.y>tt.pos.y,'marker over the timetable');
 p.pos.set(tt.pos.x,heightAt(tt.pos.x,tt.pos.z-1.3),tt.pos.z-1.3);camp.inspect('timetable');assert(dialogue,'the timetable reads from in front of it');dialogue.onChoose('continue');dialogue=null;camp.update(.1);
 const next=camp.currentObject();assert(next&&next!==tt,'objective moves on');
 // still standing in the foyer, inside: the way to Grevyn is shown anyway (marker, objective line, minimap)
 camp.update(.1);const h=camp.hud(),pin=camp.mapPins().find(q=>q.current);
 assert(camp.marker.visible,'marker shows while you are still inside the school');
 assert(/Meet Grevyn/.test(h.text)&&/\d+ m/.test(h.text),'objective says where and how far: '+h.text);
 assert(pin&&Math.hypot(pin.x-next.pos.x,pin.z-next.pos.z)<.01,'and the minimap pins it');
 assert(camp.marker.children.some(m=>m.material.depthTest===false),'the marker shows through the walls between');
 p.pos.set(next.pos.x+8,next.pos.y-1,next.pos.z);camp.update(.1);
 assert(camp.marker.visible&&Math.hypot(camp.marker.position.x-next.pos.x,camp.marker.position.z-next.pos.z)<.01,'and the marker moves with it ('+next.label+')');}
assert.equal(camp.world.objects.size,27); // all interactables are real registered meshes
const s=camp.places.school;assert.equal(surfaceAt(s.x,s.z),'concrete');
assert(camp.world.plan.routes.some(r=>r.name==='Highway 9'));
assert(camp.world.solids.length>130,'two towns have actual enterable buildings and walls');
let actions=0;
for(let guard=0;guard<100&&!camp.st.ended;guard++){
 if(camp.transition){for(let i=0;i<35;i++)camp.update(.1);}
 if(camp.st.queue.length){
  const id=camp.st.queue[0];camp.startScene(id);camp.update(.25);camp.applyCamera(.25);assert(camp.cinema.active);camp.finishScene(true);for(let i=0;i<12;i++){camp.applyCamera(.1);camp.update(.1);}assert.equal(camera.fov,70);continue;
 }
 const id=camp.st.required.find(id=>!camp.st.facts[camp.st.mission+':'+id]);assert(id);
 const o=camp.world.objects.get(camp.st.mission+':'+id);
 if(o.requiresMapDoor)camp.world.mapDoor.setOpen(true,true,false);
 let found=false;
 for(const [dx,dz]of [[0,-1.3],[1.3,0],[0,1.3],[-1.3,0],[.9,.9],[-.9,-.9]]){
  p.pos.set(o.pos.x+dx,heightAt(o.pos.x+dx,o.pos.z+dz),o.pos.z+dz);
  if(camp.visible(o)&&circleFree(p.pos.x,p.pos.z,.32,camp.world.solids,p.pos.y+.05,p.pos.y+1.7)){found=true;break;}
 }
 assert(found,'reachable inspection position for '+id);
 camp.inspect(id);assert(dialogue,'inspection has a readable interaction '+id);dialogue.onChoose(id==='sources'?'names':'continue');dialogue=null;actions++;
}
assert(camp.st.ended,'all four missions complete using their real inspection callback');assert.equal(actions,24); // P01's seat is taken in its scene, and the timetable is read above
const saved=camp.serialize();camp.end();assert.equal(root.children.length,0);assert.equal(people.length,0);
const moving=new THREE.Vector3(0,heightAt(0,0),0),cin=new Cinematics(camera);cin.begin(()=>moving);cin.update(.1);const old=camera.position.clone();moving.z+=1;cin.update(.1);assert(camera.position.distanceTo(old)>0,'camera follows actual moving subject');cin.end();assert.equal(camera.fov,70);
assert(trafficControl({pos:{x:0,z:0},yaw:0,speed:10},{x:0,z:30},[{pos:{x:0,z:9}}]).throttle<0,'traffic brakes for a road user');
assert(trafficControl({pos:{x:0,z:0},yaw:0,speed:0},{x:0,z:30},[]).throttle>0);
console.log('campaign v2 world: 26 real interactions, 4 missions, town collision/road ground, moving camera/restore, cleanup and traffic braking pass');
