import { clue } from './clues.js';
import { detailedBuilding } from './buildings.js';
import * as THREE from 'three';
import { roadX, roadY, heightAt } from '../../world/terrain.js';
import { setAuthoredGround } from '../../world/authored.js';
import { addOccluder, removeOccluder, addTarget, removeAllUnder } from '../../core/targets.js';
import { M, box } from '../mesh.js';
import { dressTown, lampGlow, lampMatRef } from './streets.js';
import { makeClouds } from './clouds.js';
import { samplePath } from './cinematics.js';
import { openingShots } from './direction.js';
export function makePlan() {
  const z0=200, town=(z)=>({x:roadX(z)+420,z,y:roadY(z),yaw:0});
  const school={...town(z0),name:'Westhaven High School'},depot={...town(z0+900),name:'Westhaven Service Depot'},drywell={...town(z0+2400),name:'Drywell Pump Station'};
  const bridge={x:roadX(z0+1700)+280,z:z0+1700,y:roadY(z0+1700),yaw:0,name:'Destroyed east approach'};
  const workshop={...town(z0+2650),name:'Drywell recovery clinic'};
  const sites={school,depot,drywell,bridge,workshop};
  const features=[];
  for (const s of [school,depot,drywell,workshop]) features.push({...s,hx:110,hz:95,surface:'concrete'});
  // A second two-way highway: independent lanes, junctions, destinations and an end-to-end drivable loop.
  const routes=[];
  for(let z=z0-220;z<z0+2950;z+=40) {
    const a={x:roadX(z)+280,z}, b={x:roadX(z+40)+280,z:z+40};
    routes.push({a,b,name:'Highway 9'});
    features.push({x:(a.x+b.x)/2,z:z+20,y:roadY(z+20),grade:(roadY(z+40)-roadY(z))/40,hx:7,hz:20,surface:'asphalt'});
  }
  for(const z of [z0-140,z0+900,z0+2400,z0+2850]) {
    const start=roadX(z);
    routes.push({a:{x:start,z},b:{x:start+530,z},name:'Westhaven / Drywell connector'});
    features.push({x:start+265,z,y:roadY(z),hx:265,hz:6,surface:'asphalt'});
  }
  // The towns join the roads: Westhaven's centre street runs south to the connector, and in both towns the south
  // cross street runs west to Highway 9, so you can drive in from the main road.
  const link=(a,b,name,y0,y1)=>{
   routes.push({a,b,name,w:9});
   const alongZ=a.x===b.x,len=alongZ?Math.abs(b.z-a.z):Math.abs(b.x-a.x);
   features.push({x:(a.x+b.x)/2,z:(a.z+b.z)/2,y:(y0+y1)/2,grade:alongZ?(y1-y0)/(b.z-a.z):0,hx:alongZ?4.5:len/2,hz:alongZ?len/2:4.5,surface:'asphalt'});
  };
  link({x:school.x,z:school.z-90},{x:school.x,z:z0-140+6},'Westhaven Road',school.y,roadY(z0-140));
  for(const [s,name] of [[school,'Westhaven'],[drywell,'Drywell']]){
   const z=s.z-55,hx=roadX(z)+280+6;
   link({x:hx,z},{x:s.x-100,z},name+' / Highway 9',roadY(z),s.y);
   s.junction={x:hx,z,name};
  }
  return {sites,routes,features,z0};
}
export class PrologueWorld {
  constructor(ctx) {this.ctx=ctx;this.plan=makePlan();this.sites=this.plan.sites;this.objects=new Map();this.solids=[];this.ownedMaterials=[];this.roadParts=[];this.buildings=[];this.doors=new Map();this.doorStates={};this.clueFixtures=new Set();this.labelMaterials=new Map();}
  bind() {setAuthoredGround(this.plan.features);}
  build() {
    this.trees=[];this.lamps=[];this.group=new THREE.Group();this.group.name='The Way Back / towns';
    this.lampMat=lampMatRef.m=new THREE.MeshStandardMaterial({color:0xe9dfc0,emissive:0xffd29a,emissiveIntensity:0,roughness:.5});this.ownedMaterials.push(this.lampMat);this.ctx.root.add(this.group);
    for(const r of this.plan.routes) this.road(r.a,r.b,r.w||12,r.name);
    // where the town roads leave Highway 9: a sign pointing the way in
    for(const s of [this.sites.school,this.sites.drywell])if(s.junction){const j=s.junction;this.sign(j.x+5,heightAt(j.x+5,j.z-9)+2.2,j.z-9,j.name.toUpperCase()+'  →  TOWN CENTRE');this.prop({x:j.x+5,y:heightAt(j.x+5,j.z-9),z:j.z-9},0,0,.1,2.2,.1,0x576c61);}
    this.town(this.sites.school,'Westhaven');this.town(this.sites.drywell,'Drywell');
    this.room(this.sites.depot,24,20,'SERVICE DEPOT',0x697c81);
    this.room(this.sites.workshop,24,20,'DRYWELL CLINIC',0xb59b7b);
    this.room(this.sites.school,26,22,'WESTHAVEN HIGH SCHOOL',0xa58a67);
    const s=this.sites.drywell;this.room(s,26,20,'DRYWELL PUMP STATION',0x837e68);
    for(const x of [-8,-4,0,4,8])this.prop(s,x,-22,2.4,1,1,0x8b7060,true);
    const b=this.sites.bridge;
    this.sign(b.x,b.y+2,b.z-20,'ROAD CLOSED / SPAN DESTROYED');
    this.bridgeBarrier=this.prop(b,0,0,13,1.3,2,0x69645e,true);this.bridgeCollider=this.solids[this.solids.length-1]; // solid barricade, never a lethal invisible void
    this.sign(roadX(this.plan.z0-140)+20,roadY(this.plan.z0-140)+2,this.plan.z0-140,'WESTHAVEN → / HIGHWAY 9');
    this.sign(roadX(this.plan.z0+2400)+20,roadY(this.plan.z0+2400)+2,this.plan.z0+2400,'DRYWELL → / HIGHWAY 9');
    this.streetDetails(this.sites.school,'Westhaven');this.streetDetails(this.sites.drywell,'Drywell');this.pumpCourt(this.sites.drywell);
    this.interiorLights=[new THREE.PointLight(0xffead0,0,18,2),new THREE.PointLight(0xe5ece3,0,18,2)];for(const light of this.interiorLights)this.group.add(light);
    this.flushRoads();
    this.glow=lampGlow(this.lamps,()=>((this.ctx.time?.()??.5)%1)*24);this.group.add(this.glow.mesh);this.ownedMaterials.push(this.glow.mesh.material);
    this.clouds=makeClouds(this.sites.school,this.plan.z0);this.group.add(this.clouds.mesh);this.ownedMaterials.push(this.clouds.mesh.material);
    this.batchBuildings();
  }
  batchBuildings(){
    // Keep interaction meshes and the mutable blockade separate. Batch the static town geometry.
    this.group.updateMatrixWorld(true);
    const inverse=new THREE.Matrix4().copy(this.group.matrixWorld).invert(),batches=new Map(),old=[];
    this.group.traverse(o=>{
      if(!o.isMesh||o.isInstancedMesh||o.geometry?.type!=='BoxGeometry'||o===this.bridgeBarrier)return;
      for(let p=o;p&&p!==this.group;p=p.parent)if(p.userData.dynamic||p.userData.target)return;
      const p=o.geometry.parameters,m=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld);
      const origin=new THREE.Vector3().setFromMatrixPosition(m),key=o.material.uuid+':'+Math.floor(origin.x/160)+':'+Math.floor(origin.z/160);
      if(!batches.has(key))batches.set(key,{material:o.material,base:origin.clone(),items:[]});
      batches.get(key).items.push({matrix:m,scale:new THREE.Matrix4().makeScale(p.width,p.height,p.depth)});old.push(o);
    });
    if(!batches.size)return;
    const unit=new THREE.BoxGeometry(1,1,1);
    for(const {material,base,items}of batches.values()){
      const mesh=new THREE.InstancedMesh(unit,material,items.length);mesh.position.copy(base);mesh.castShadow=mesh.receiveShadow=true;
      items.forEach(({matrix,scale},i)=>{const m=matrix.clone();m.elements[12]-=base.x;m.elements[13]-=base.y;m.elements[14]-=base.z;mesh.setMatrixAt(i,m.multiply(scale));});
      mesh.computeBoundingSphere();this.group.add(mesh);addOccluder(mesh);
    }
    for(const o of old){removeOccluder(o);o.geometry.dispose();o.removeFromParent();}
  }
  road(a,b,width,name) {
    const len=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(len/12));
    for(let i=0;i<steps;i++) {
      const t=(i+.5)/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=heightAt(x,z)+.04;
      const yaw=Math.atan2(b.x-a.x,b.z-a.z);
      this.roadParts.push({x,y,z,yaw,w:width,h:.055,d:len/steps+.12,kind:'asphalt'});
      if(i%2===0)this.roadParts.push({x,y:y+.04,z,yaw,w:.15,h:.025,d:Math.min(3,len/steps),kind:'stripe'});
    }
  }
  flushRoads() {
    const batches=new Map();
    for(const p of this.roadParts){const key=Math.floor(p.z/400)+':'+p.kind;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(p);}
    const unit=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0);
    for(const list of batches.values()){
      const first=list[0],base={x:first.x,y:first.y,z:Math.floor(first.z/400)*400};
      const mesh=new THREE.InstancedMesh(unit,M('lh2'+first.kind,first.kind==='stripe'?0xe4cc82:0x383c3b),list.length);
      mesh.position.set(base.x,base.y,base.z);mesh.receiveShadow=true;
      list.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x-base.x,p.y-base.y,p.z-base.z),q.setFromAxisAngle(axis,p.yaw),new THREE.Vector3(p.w,p.h,p.d));mesh.setMatrixAt(i,matrix);});
      mesh.computeBoundingSphere();this.group.add(mesh);
    }
    this.roadParts=[];
  }
  town(s,name) {
    // Six blocks, two cross streets, a high street and accessible public buildings off the highway.
    for(const x of [-70,0,70])this.road({x:s.x+x,z:s.z-90},{x:s.x+x,z:s.z+90},9,name+' High Street');
    for(const z of [-55,55])this.road({x:s.x-100,z:s.z+z},{x:s.x+100,z:s.z+z},9,name+' Cross Street');
    // Continuous sidewalks and marked crossings give pedestrians an actual downtown route.
    for(const z of [-40,18,66]){
      for(const [a,b]of [[-108,-70],[-70,0],[0,70],[70,108]])this.prop(s,(a+b)/2,z,b-a-10,.06,4,0xc5b89f);
      for(const x of [-70,0,70])for(let stripe=-3;stripe<=3;stripe++)this.prop(s,x+stripe,z,.48,.075,3,0xe7deca);
    }
    const names=['GENERAL STORE','DINER','WORKSHOP','POST & RADIO','WATER OFFICE','TOWN HALL','HOUSE 1','HOUSE 2','HOUSE 3','HOUSE 4','ROOMS','CLINIC'];
    const spots=[[-92,-28],[-42,-28],[42,-28],[92,-28],[-92,30],[-42,30],[42,30],[92,30],[-92,78],[-42,78],[42,78],[92,78]];
    spots.forEach(([x,z],i)=>this.room({x:s.x+x,z:s.z+z,y:s.y,yaw:0,town:name},16,14,names[i],[0xaf987b,0x8c9b94,0xa98570][i%3]));
    this.sign(s.x-15,s.y+2,s.z-80,name.toUpperCase()+' / SERVICES / HIGHWAY 9');
    // Sidewalks, shade, benches, and working supply counters make a town a usable stop.
    for(const x of [-62,62])for(const z of [-48,48]) {
      this.prop(s,x,z,1,.25,3,0xb7ac96);
      this.prop(s,x,z, .15,4,.15,0x535d5a);
      this.solid(s.x+x,s.z+z,.16,.16,s.y,s.y+4);
    }
    const store=this.buildings.find(b=>b.type==='store'&&b.site.town===name),counter=store.group.getObjectByName('Cash register');
    addTarget(counter,{id:'lh2:shop:'+name,name:name+' supplies',reach:2.2,actions:()=>[{key:'use',label:'Buy supplies',run:()=>this.ctx.dialogue({speaker:name+' supplies',role:'Community store',lines:['Water, food and basic repairs. Stocks for travellers are separate from clinic supplies.'],choices:[{id:'water',label:'Water',cost:'$3'},{id:'beans',label:'Canned food',cost:'$5'},{id:'repairkit',label:'Repair kit',cost:'$20'},{id:'back',label:'Leave'}],onChoose:id=>{if(id==='back')return;const price={water:3,beans:5,repairkit:20}[id];if(this.ctx.stock.pay({money:price}))this.ctx.stock.give({items:[{type:id,n:1}]});else this.ctx.notify('Not enough money.');}})}]});
  }
  streetDetails(s,name){
    const metal=M('lh2streetmetal',0x43564d,{m:.4}),wood=M('lh2streetwood',0x8f7352);
    const round=(x,y,z,r,h,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),mat);m.position.set(s.x+x,s.y+y,s.z+z);this.group.add(m);return m;};
    for(const x of [-62,62])for(const z of [-48,48]){
      this.prop(s,x+.45,z,1,.09,.18,0x53645c).position.y+=3.96;this.prop(s,x+.9,z,.6,.12,.4,0xd9cfa9).position.y+=3.94;
      round(x-1,.42,z,.28,.8,metal);round(x-1,.84,z,.32,.06,metal);
    }
    for(const [x,z]of [[-57,-37],[57,-37],[-57,21],[57,21]]){
      this.prop(s,x,z,2.5,.09,.5,0x92714e).position.y+=.47;
      for(const xx of [-1,1])this.prop(s,x+xx,z,.09,.45,.45,0x4b5d53);
      const back=this.prop(s,x,z+.23,2.5,.48,.07,0x92714e);back.position.y+=.55;
    }
    const avoid=s===this.sites.school?samplePath(openingShots(s)[0]).filter(p=>p.y<s.y+11):[];
    this.trees=(this.trees||[]).concat(dressTown(this,s,{avoid}).map(t=>({...t,x:s.x+t.x,z:s.z+t.z})));
    for(const [x,z,number]of [[47,67,13],[97,67,25],[-47,67,37],[-97,67,49]]){
      this.prop(s,x,z,.08,.95,.08,0x88704e);const box=this.prop(s,x,z,.48,.27,.26,0x61786a);box.position.y+=.9;
      this.label(this.group,String(number),s.x+x,s.y+1.1,s.z+z-.15,.3,.13);
    }
    this.prop(s,6,-62,.08,2.6,.08,0x576c61);this.sign(s.x+6,s.y+2.65,s.z-62,name.toUpperCase()+' / MESA STREET');
  }
  pumpCourt(s){
    this.prop(s,0,-16,14,.16,6,0x6f8279).position.y+=3.5;
    for(const x of [-6.5,6.5])this.prop(s,x,-16,.16,3.5,.16,0xb5bea8,true);
    for(const x of [-4,4]){
      const g=new THREE.Group();g.position.set(s.x+x,s.y,s.z-16);this.group.add(g);
      box(g,.8,1.4,.6,M('lh2pump',0x788b7e),0,.7,0);box(g,.64,.3,.035,M('lh2pumpDisplay',0x283c33),0,1.03,-.32);
      this.label(g,'FUEL / 5 L',0,1.03,-.35,.55,.23);
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.42,1.1,0),new THREE.Vector3(.8,.8,-.1),new THREE.Vector3(.7,.25,-.05),new THREE.Vector3(.36,.4,0)]);
      const hose=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.035,5,false),M('lh2hose',0x29332d));g.add(hose);
      this.solid(s.x+x,s.z-16,.8,.6,s.y,s.y+1.4);
      addTarget(g,{id:'lh2:fuel:'+x,name:'Drywell fuel pump',reach:2.4,actions:()=>{const v=this.ctx.truck?.();return [{key:'use',label:'Buy 5 L fuel ($10)',blocked:!v||Math.hypot(v.pos.x-(s.x+x),v.pos.z-(s.z-16))>8?'Park the pickup beside the pump.':v.running?'Turn the engine off first.':v.fuel>=v.def.tank?'The tank is full.':null,run:()=>{if(v&&this.ctx.stock.pay({money:10})){v.fuel=Math.min(v.def.tank,v.fuel+5);this.ctx.sfx?.('pour_start');this.pourTime=.6;this.ctx.notify('Added fuel to the pickup.');}else this.ctx.notify('Not enough money.');}}];}});
    }
  }
  room(s,w,d,title,color){return detailedBuilding(this,s,w,d,title,color);}
  label(parent,text,x,y,z,width=3,height=.4){
    const cached=this.labelMaterials.get(text);
    if(cached){const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),cached);m.position.set(x,y,z);m.rotation.y=Math.PI;parent.add(m);return m;}
    const c=document.createElement('canvas');c.width=1024;c.height=128;const p=c.getContext('2d');
    p.fillStyle='#29413d';p.fillRect(0,0,1024,128);p.strokeStyle='#c6b38d';p.lineWidth=5;p.strokeRect(8,8,1008,112);p.fillStyle='#f7e4bf';p.font='bold 42px sans-serif';p.textAlign='center';p.fillText(text,512,79,970);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=Math.PI;parent.add(m);this.labelMaterials.set(text,m.material);return m;
  }
  indoorAt(x,z){return this.buildings.find(b=>Math.abs(x-b.site.x)<b.w/2&&Math.abs(z-b.site.z)<b.d/2)||null;}
  openSceneDoors(id,site){
    const b=this.buildings.find(b=>b.site===site);if(!b)return;
    // Seated classroom shots need the foyer leaf shut behind the window desks;
    // an open leaf otherwise occupies the space between Cal and Grevyn.
    for(const d of b.doors)if(!d.id.includes('map-cabinet'))d.setOpen(!(/^P01\./.test(id)&&d.id.endsWith(':foyer')),true,false);
  }
  update(dt){
    this.clouds?.update(dt);this.glow?.update();
    for(const door of this.doors.values())door.update(dt);
    if(this.pourTime>0){this.pourTime-=dt;if(this.pourTime<=0)this.ctx.sfx?.('pour_stop');}
    const p=this.ctx.player?.()?.pos,b=p&&this.indoorAt(p.x,p.z);
    for(const [i,light]of (this.interiorLights||[]).entries()){
      light.intensity=b?27:0;if(b)light.position.set(b.site.x+(i?1:-1)*b.w*.24,b.site.y+2.85,b.site.z);
    }
  }
  solid(x,z,w,d,y0,y1){this.solids.push({kind:'box',x,z,hx:w/2,hz:d/2,yaw:0,y0,y1});}
  prop(s,x,z,w,h,d,color,solid=false) {
    const g=new THREE.Group();g.position.set(s.x+x,s.y,s.z+z);this.group.add(g);
    const mesh=box(g,w,h,d,M('lh2prop'+color,color),0,h/2,0);
    if(solid){this.solid(s.x+x,s.z+z,w,d,s.y,s.y+h);addOccluder(mesh);}return mesh;
  }
  sign(x,y,z,text) {
    const c=document.createElement('canvas');c.width=1024;c.height=128;const p=c.getContext('2d');
    p.fillStyle='#20383c';p.fillRect(0,0,1024,128);p.fillStyle='#f7e4bf';p.font='bold 42px sans-serif';p.textAlign='center';p.fillText(text,512,80,980);
    const mat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(6,.75),mat);m.position.set(x,y,z);m.rotation.y=Math.PI;this.group.add(m);return m;
  }
  // The ROOM 9 plate on the corridor wall beside the history classroom door: what the hints point at until it opens
  entrance(){
    const s=this.sites.school,g=new THREE.Group();g.position.set(s.x-1.84,s.y+1.55,s.z-1.75);this.group.add(g);
    const paper=box(g,.06,.42,.5,M('lh2doorplate',0xcfb891),0,0,0);
    addTarget(g,{id:'lh2:classroom',name:'Room 9 · History',reach:2.2,info:()=>({note:'Orin Bell · Ninth-grade history'}),actions:()=>[]});
    this.objects.set('classroom',{mesh:g,paper,label:'History classroom',pos:g.position.clone(),site:'school'});return g;
  }
  addObject(id,site,x,z,label,run){
    const {target}=clue(this,id,site,x,z,label,run);
    addTarget(target,{id:'lh2:'+id,name:label,reach:2.2,info:()=>({note:label}),actions:()=>[{key:'use',label:'Inspect',run}]});return target;
  }
  colliders(x,z,r,out) {for(const c of this.solids)if(Math.abs(c.x-x)<r+c.hx&&Math.abs(c.z-z)<r+c.hz)out.push(c);}
  dispose() {
    setAuthoredGround();if(this.pourTime>0)this.ctx.sfx?.('pour_stop');if(!this.group)return;removeAllUnder(this.group);
    const mats=new Set(),geos=new Set();this.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geos.add(o.geometry);if(o.material?.map&&!o.material.userData.shared)mats.add(o.material);});
    for(const m of this.ownedMaterials)m.dispose();this.ownedMaterials=[];
    for(const g of geos)g.dispose();for(const m of mats){m.map.dispose();m.dispose();}
    this.group.removeFromParent();this.objects.clear();this.solids=[];this.doors.clear();this.buildings=[];this.glass?.dispose();for(const light of this.interiorLights||[])light.dispose?.();this.labelMaterials.clear();this.clueFixtures.clear();
  }
}
