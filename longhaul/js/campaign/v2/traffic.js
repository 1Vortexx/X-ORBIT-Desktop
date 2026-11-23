import * as THREE from 'three';
import { roadX } from '../../world/terrain.js';
import { glossPaint } from '../../vehicles/materials.js';
import { DRIVEWAYS, BAYS, HIGH, CROSS, HALF } from './streets.js';
// Ordinary physics controls, never frame-by-frame vehicle teleportation. Drivers occupy actual seats.
export function trafficControl(v,target,obstacles=[],cruise=14) {
  const dx=target.x-v.pos.x,dz=target.z-v.pos.z;
  const error=Math.atan2(Math.sin(Math.atan2(dx,dz)-v.yaw),Math.cos(Math.atan2(dx,dz)-v.yaw));
  const forward={x:Math.sin(v.yaw),z:Math.cos(v.yaw)};
  let gap=Infinity;
  for(const o of obstacles) {
    if(o===v)continue;const x=o.pos.x-v.pos.x,z=o.pos.z-v.pos.z,along=x*forward.x+z*forward.z;
    if(along>0&&Math.abs(x*forward.z-z*forward.x)<3.5)gap=Math.min(gap,along);
  }
  const limit=Math.abs(error)>.45?5:cruise,speed=Math.max(0,v.speed||0);
  const stop=gap<9+speed*1.8;
  const look=Math.max(8,Math.hypot(dx,dz)),wheelbase=v.def?.wheelbase||2.8;
  const delta=Math.atan(2*wheelbase*Math.sin(error)/look),maxSteer=Math.min(v.def?.steerLock||.6,Math.atan(wheelbase*11.3/Math.max(1,speed*speed)));
  return {throttle:stop?(speed>.4?-1:0):speed>limit?-.3:.55,steer:Math.max(-1,Math.min(1,delta/Math.max(.05,maxSteer))),handbrake:stop&&speed<.4};
}
export class Traffic {
  constructor(ctx,z0){this.ctx=ctx;this.z0=z0;this.cars=[];this.clock=0;}
  update(dt,paused=false){
    this.clock+=dt;const p=this.ctx.player().pos;
    // Only spawn into the local road corridor, never in front of somebody standing in a lane.
    if(this.clock>3&&this.cars.length<6){this.clock=0;this.spawn(p);}
    const all=this.ctx.vehicles.list;
    const barriers=this.ctx.staticObstacles?.()||[];
    for(const e of [...this.cars]){
      const v=e.v;if(v.pos.distanceTo(p)>850){this.remove(e);continue;}
      if(v.pos.z < this.z0-200 || v.pos.z > this.z0+2940){this.remove(e);continue;}
      if(e.n.state==='enter'||!e.n.seat) {
        v.parkingBrake=true;v.ai={throttle:Math.abs(v.speed)>.6?-Math.sign(v.speed):0,steer:0,handbrake:true};
        if(!e.n.seat&&Math.abs(v.speed)<.5)e.n.enterVehicle(v,'driver');
        continue;
      }
      v.parkingBrake=false;
      const z=v.pos.z+e.dir*Math.max(14,Math.abs(v.speed)*1.3);
      const x=roadX(z)+e.offset-e.dir*2.8;
      v.ai=paused?{throttle:-1,steer:0,handbrake:true}:trafficControl(v,{x,z},[...all,...barriers,{pos:p}]);
      if(v.disabledReason()||v.bodyCond<10)v.ai={throttle:-1,steer:0,handbrake:true};
    }
  }
  spawn(p){
    const i=this.cars.length,dir=i%2?1:-1,offset=i<2?0:280;
    const z=Math.max(this.z0-100,Math.min(this.z0+2800,p.z+dir*180)),x=roadX(z)+offset-dir*2.8;
    if(Math.hypot(p.x-x,p.z-z)<80||this.ctx.vehicles.list.some(v=>Math.hypot(v.pos.x-x,v.pos.z-z)<35))return;
    const v=this.ctx.vehicles.spawn({id:'lh2:traffic:'+Date.now()+':'+i,type:'sedan',seed:19+i,x,z,yaw:dir===1?0:Math.PI,pristine:true});
    v.pinned=true;v.transient=true;v.parkingBrake=false;v.gearMode='auto';
    const n=this.ctx.npcs.spawn({id:v.id+':driver',name:'Road traveller',role:'walker',seed:301+i,x:x+3,z,age:32+i*4});
    // Ambient cars appear well outside interaction range with a real, already-seated driver.
    if(!n.enterVehicle(v,'driver')){this.ctx.npcs.remove(n);this.ctx.vehicles.remove(v,false);return;}
    n.attach(v);v.toggleIgnition();this.cars.push({v,n,dir,offset});
  }
  remove(e){this.ctx.npcs.remove(e.n);this.ctx.vehicles.remove(e.v,false);this.ctx.worldState?.vehicles.delete(e.v.id);this.cars=this.cars.filter(x=>x!==e);}
  dispose(){for(const e of [...this.cars])this.remove(e);}
}

// Town life for the prologue towns: cars parked on the house driveways and in the shop-front bays, and a few cars
// with real seated drivers circling the outer streets in both directions, keeping right, slowing for the corners and
// stopping for anyone in the road. A town is filled when the player comes within reach and emptied when they leave.
const LOOP=[[-70,-55],[70,-55],[70,55],[-70,55]],LANE=2.2,NEAR=380,FAR=480,CRUISE=9.5;
// Traffic stops in Westhaven, on streets the opening's camera runs along (site-local; yaw = heading of the stopped
// car; curb = which side of it the kerb is, +1 right): the west high street northbound, the north cross street eastbound
const STOPS=[{x:-74.4,z:-12,yaw:0,curb:1},{x:12,z:59.4,yaw:Math.PI/2,curb:1}];
// A police cruiser's dressing on an ordinary sedan, placed from the body's own dimensions (models sit comH under
// vehicle.mesh): a light bar on the roof (red and blue halves that flash, with glows), a black-and-white livery
// (white door panels with POLICE, a star and a stripe, on a black car), a push bar and a roof number.
// Returns the materials and glows to flash.
let glowTex=null;
const decal=(draw,w,h)=>{if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(!g?.fillText)return null;draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
function star(g,x,y,r){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,k=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*k,y+Math.sin(a)*k);}g.closePath();g.fill();}
function policeDress(v,unit){
 if(!v.mesh)return null;
 const d=v.def,b=d.body||{},base=-d.comH,roof=base+(b.roofY??1.4),hw=b.hw??.88;
 // a kept fleet car: clean gloss black, not the town's weathered paint
 const black=glossPaint(0x121418);v.mesh.traverse(o=>{if(o.isMesh&&o.material?.name==='paint')o.material=black;});
 const zF=b.zRoofFront??.3,zR=b.zRoofRear??-1;
 // light bar: across the front half of the roof, sitting on it
 const red=new THREE.MeshStandardMaterial({color:0x8a1410,emissive:0xff2a1a,emissiveIntensity:.2,roughness:.25}),blue=new THREE.MeshStandardMaterial({color:0x14247a,emissive:0x2a58ff,emissiveIntensity:.2,roughness:.25});
 const dark=new THREE.MeshStandardMaterial({color:0x1a1c20,roughness:.45,metalness:.3});
 const bar=new THREE.Group();bar.name='Light bar';bar.position.set(0,roof-.005,zF-(zF-zR)*.3);v.mesh.add(bar);
 const piece=(m,w,h,dd,x,y,z=0)=>{const p=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),m);p.position.set(x,y,z);p.castShadow=true;bar.add(p);return p;};
 const W=Math.min(1.2,(b.roofHw??.68)*1.7);
 for(const x of [-W*.32,W*.32])piece(dark,.08,.04,.22,x,.02);           // feet on the roof
 piece(dark,W,.05,.28,0,.065);                                          // base
 const rb=piece(red,W*.46,.1,.24,W*.255,.14),bb=piece(blue,W*.46,.1,.24,-W*.255,.14);
 piece(dark,.06,.1,.25,0,.14);                                          // centre divider
 const halos=[];
 if(typeof document!=='undefined'){
  if(!glowTex)glowTex=decal((g,w)=>{const gr=g.createRadialGradient?.(w/2,w/2,0,w/2,w/2,w/2);if(!gr)return;gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,w);},64,64);
  for(const [mesh,color,isRed] of [[rb,0xff3020,true],[bb,0x3366ff,false]]){
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));
   sp.scale.set(1.4,1.4,1);sp.userData.red=isRed;mesh.add(sp);halos.push(sp);
  }
 }
 // push bar on the nose
 const pb=new THREE.Group();pb.position.set(0,base,(b.zNose??2.2)+.12);v.mesh.add(pb);
 for(const x of [-.36,.36]){const u=new THREE.Mesh(new THREE.BoxGeometry(.06,.5,.06),dark);u.position.set(x,.62,0);pb.add(u);}
 for(const y of [.48,.78]){const r=new THREE.Mesh(new THREE.BoxGeometry(.86,.05,.06),dark);r.position.set(0,y,0);pb.add(r);}
 // door panels: white, POLICE, a gold star, a blue stripe and the town and unit along the bottom
 const zA=(b.zDoorFront??.76)-.02,zB=(b.zDoor2Rear??-1.02)+.03,y0=(b.rockerY??.29)+.12,y1=(b.beltY??.93)-.04;
 const L=zA-zB,H=y1-y0,tex=decal((g,w,h)=>{
  g.fillStyle='#f4f3ee';g.fillRect(0,0,w,h);
  g.fillStyle='#1f4fa8';g.fillRect(0,h*.7,w,h*.08);
  g.fillStyle='#c9a23a';star(g,h*.36,h*.38,h*.24);g.fillStyle='#8a6a1c';g.font=`bold ${h*.12}px sans-serif`;g.textAlign='center';g.fillText('W',h*.36,h*.43);
  g.fillStyle='#14161a';g.font=`900 ${h*.36}px "Arial Black", Impact, sans-serif`;g.textAlign='left';g.fillText('POLICE',h*.72,h*.52);
  g.font=`bold ${h*.11}px sans-serif`;g.fillText(`WESTHAVEN  ·  UNIT ${unit}`,h*.74,h*.93);
 },1024,Math.round(1024*H/L));
 if(tex){
  const m=new THREE.MeshStandardMaterial({map:tex,roughness:.4,polygonOffset:true,polygonOffsetFactor:-2});
  for(const side of [-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(L,H),m);p.position.set(side*(hw+.012),base+(y0+y1)/2,(zA+zB)/2);p.rotation.y=side*Math.PI/2;v.mesh.add(p);}
  // unit number on the roof, for the helicopter that never comes
  const n=decal((g,w,h)=>{g.fillStyle='#f4f3ee';g.fillRect(0,0,w,h);g.fillStyle='#14161a';g.font=`900 ${h*.8}px sans-serif`;g.textAlign='center';g.fillText(String(unit),w/2,h*.82);},256,128);
  if(n){const p=new THREE.Mesh(new THREE.PlaneGeometry(.7,.35),new THREE.MeshStandardMaterial({map:n,roughness:.4,polygonOffset:true,polygonOffsetFactor:-2}));p.rotation.set(-Math.PI/2,0,Math.PI);p.position.set(0,roof+.004,zR+(zF-zR)*.3);v.mesh.add(p);}
 }
 return {red,blue,halos};
}

const PAINT=[0x4f8f8c,0x8e3b2c,0xb49a6c,0x6f93ad,0xcfc5a3,0x7c8450,0xba8f2f,0xd4d1c6,0x2f4a5e,0x5c5f60];
// The loop in travel order, every point moved LANE metres to the right of the direction of travel
function lanePath(cw){
 const pts=cw?[...LOOP].reverse():LOOP,n=pts.length,out=[];
 const right=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);return [-dz/l,dx/l];};
 for(let i=0;i<n;i++){const p=pts[i],r1=right(pts[(i-1+n)%n],p),r2=right(p,pts[(i+1)%n]);out.push([p[0]+(r1[0]+r2[0])*LANE,p[1]+(r1[1]+r2[1])*LANE]);}
 return out;
}
export class TownLife {
 constructor(ctx,sites){this.ctx=ctx;this.towns=sites.map((s,i)=>({s,i,on:false,parked:[],cars:[],stops:[]}));this.t=0;}
 update(dt,paused=false){
  if(!this.ctx.vehicles?.spawn)return;
  const p=this.ctx.player().pos;this.t+=dt;
  for(const t of this.towns){
   const d=Math.hypot(p.x-t.s.x,p.z-t.s.z);
   if(!t.on&&d<NEAR)this.fill(t);else if(t.on&&d>FAR)this.empty(t);
   if(t.on)for(const e of t.cars)this.drive(t,e,paused);
   if(t.on)for(const st of t.stops)this.stopScene(st,dt);
  }
 }
 vehicle(id,type,x,z,yaw,seed,paint=PAINT[seed%PAINT.length],wearLook){
  const v=this.ctx.vehicles.spawn({id,type,seed,x,z,yaw,paint,pristine:true,...(wearLook!==undefined?{wearLook}:{})});
  v.pinned=true;v.transient=true;v.parkingBrake=true;return v;
 }
 fill(t){
  t.on=true;const s=t.s,k=t.i*50;
  [...DRIVEWAYS.map(d=>({...d,type:'sedan'})),...BAYS].forEach((b,i)=>{
   if(t.i===1&&i%3===2)return;                                 // Drywell is a little quieter
   t.parked.push(this.vehicle(`lh2:parked:${t.i}:${i}`,b.type||'sedan',s.x+b.x,s.z+b.z,b.yaw,k+i*7+3));
  });
  if(t.i===0)for(const [i,st] of STOPS.entries())this.trafficStop(t,st,i);
  // town traffic, both ways round: mostly Corvina sedans, a couple of pickups
  const plan=t.i===0?[[false,.05],[false,.38],[false,.72],[true,.2],[true,.55],[true,.88]]:[[false,.2],[false,.7],[true,.45],[true,.95]];
  plan.forEach(([cw,at],j)=>{
   const path=lanePath(cw),seg=Math.floor(at*4),u=at*4-seg,a=path[seg],b=path[(seg+1)%4];
   const x=s.x+a[0]+(b[0]-a[0])*u,z=s.z+a[1]+(b[1]-a[1])*u,yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);
   const v=this.vehicle(`lh2:towncar:${t.i}:${j}`,j===1||j===4?'pickup':'sedan',x,z,yaw,k+j*13+1);v.parkingBrake=false;v.gearMode='auto';
   const n=this.ctx.npcs.spawn({id:v.id+':driver',name:'Local driver',role:'walker',seed:520+k+j,x:x+3,z,age:28+j*9});
   if(!n.enterVehicle?.(v,'driver')){this.ctx.npcs.remove(n);this.ctx.vehicles.remove(v,false);return;}
   n.attach?.(v);v.toggleIgnition?.();t.cars.push({v,n,path,seg});
  });
 }
 empty(t){
  const mine=this.ctx.player().vehicle;    // a car the player has taken stays theirs
  for(const v of t.parked)if(v!==mine)this.ctx.vehicles.remove(v,false);
  for(const e of t.cars){if(e.n.seat)e.n.releaseClaim?.(e.v);this.ctx.npcs.remove(e.n);if(e.v!==mine)this.ctx.vehicles.remove(e.v,false);}
  for(const st of t.stops){for(const n of st.people){for(const v of [st.car,st.cop])if(n.seat?.vehicle===v.id)n.releaseClaim?.(v);this.ctx.npcs.remove(n);}for(const v of [st.car,st.cop])if(v!==mine)this.ctx.vehicles.remove(v,false);for(const h of st.halos)h.removeFromParent();}
  t.parked=[];t.cars=[];t.stops=[];t.on=false;
 }
 // A traffic stop: a car pulled over at the kerb, a police car behind it with its lights going, one officer at the
 // passenger window (kerb side) talking to the driver and a partner in the cruiser. Both cars sit on the shoulder,
 // so passing traffic squeezes by instead of queuing behind them.
 trafficStop(t,st,i){
  const s=t.s,fx=Math.sin(st.yaw),fz=Math.cos(st.yaw),k=t.i*50+i*7;
  const car=this.vehicle(`lh2:stopped:${t.i}:${i}`,i?'pickup':'sedan',s.x+st.x,s.z+st.z,st.yaw,k+40);
  const cop=this.vehicle(`lh2:police:${t.i}:${i}`,'sedan',s.x+st.x-fx*7.2,s.z+st.z-fz*7.2,st.yaw,k+41,0x16181c,0);   // a kept fleet car: clean black paint, no rust
  car.shoulder=cop.shoulder=true;
  const lights=policeDress(cop,[12,27][i]??i+1);
  const people=[],seat=(v,name,seed,role)=>{const n=this.ctx.npcs.spawn({id:v.id+':'+name,name:role==='police'?'Officer':'Driver',role,seed,x:v.pos.x+3,z:v.pos.z,age:30+seed%20});if(n.enterVehicle?.(v,'driver')){n.attach?.(v);people.push(n);}else this.ctx.npcs.remove(n);};
  seat(car,'driver',610+k,'local');seat(cop,'driver',620+k,'police');
  // the officer: kerb side, level with the front passenger window, facing the car
  // the officer: at the front passenger window (kerb side), leaning in to talk to the driver
  const cb=car.def?.body||{},side=(cb.hw??.88)+.34,along=((cb.zDoorFront??.76)+(cb.zDoorRear??-.2))/2;   // level with the front door window
  const rx=-fz*st.curb,rz=fx*st.curb,ox=s.x+st.x+rx*side+fx*along,oz=s.z+st.z+rz*side+fz*along;
  const officer=this.ctx.npcs.spawn({id:`lh2:officer:${t.i}:${i}`,name:'Officer',role:'police',seed:630+k,x:ox,z:oz,age:34+i*9});
  officer.standAt?.({x:ox,z:oz});officer.lookAt?.({x:ox-rx,z:oz-rz});officer.lean=true;people.push(officer);
  t.stops.push({car,cop,people,officer,lights,halos:lights?.halos||[],talk:1+i});
 }
 stopScene(st,dt){
  // red–red, blue–blue, a little out of step between the two cruisers
  const ph=(this.t*1.6+st.talk*.37)%1,red=ph<.11||(ph>.2&&ph<.31),blue=(ph>.5&&ph<.61)||(ph>.7&&ph<.81);
  if(st.lights){st.lights.red.emissiveIntensity=red?4:.15;st.lights.blue.emissiveIntensity=blue?4:.15;for(const h of st.halos)h.material.opacity=(h.userData.red?red:blue)?.85:0;}
  if((st.talk-=dt)<=0){const who=Math.random()<.6?st.officer:null;who?.talkFor?.(1.5+Math.random()*2.5);st.talk=2.5+Math.random()*3;}
 }
 // Anyone standing or walking on the asphalt of this town (not on the pavements) is something to stop for
 inRoad(s,q){const x=q.x-s.x,z=q.z-s.z;return HIGH.some(l=>Math.abs(x-l)<HALF&&Math.abs(z)<92)||CROSS.some(l=>Math.abs(z-l)<HALF&&Math.abs(x)<102);}
 drive(t,e,paused){
  const v=e.v,s=t.s;
  if(!this.ctx.vehicles.list.includes(v))return;
  if(!e.n.seat||e.n.state==='enter'){v.ai={throttle:-1,steer:0,handbrake:true};return;}
  // advance to the next corner once this one is close, then aim a little way along the lane
  const P=e.path,n=P.length,lx=v.pos.x-s.x,lz=v.pos.z-s.z;
  let b=P[(e.seg+1)%n];if(Math.hypot(b[0]-lx,b[1]-lz)<7){e.seg=(e.seg+1)%n;b=P[(e.seg+1)%n];}
  const a=P[e.seg],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L;
  const along=Math.max(0,Math.min(L,(lx-a[0])*ux+(lz-a[1])*uz))+Math.max(10,Math.abs(v.speed)*1.4);
  let tx,tz;
  if(along<=L){tx=a[0]+ux*along;tz=a[1]+uz*along;}
  else{const c=P[(e.seg+2)%n],ex=c[0]-b[0],ez=c[1]-b[1],m=Math.hypot(ex,ez),over=Math.min(m,along-L);tx=b[0]+ex/m*over;tz=b[1]+ez/m*over;}
  const p=this.ctx.player().pos,people=(this.ctx.npcs.list||[]).filter(q=>!q.seat&&this.inRoad(s,q.pos));
  const others=this.ctx.vehicles.list.filter(o=>o!==v&&!o.shoulder&&Math.hypot(o.pos.x-v.pos.x,o.pos.z-v.pos.z)<40);
  const obstacles=[...others,...people,...(this.inRoad(s,p)?[{pos:p}]:[])];
  v.parkingBrake=false;
  // ease off before each corner, as a driver would, so the turn stays in lane
  const toCorner=Math.hypot(b[0]-lx,b[1]-lz),cruise=toCorner<26?Math.max(4.5,CRUISE*(toCorner-7)/19):CRUISE;
  v.ai=paused?{throttle:-1,steer:0,handbrake:true}:trafficControl(v,{x:s.x+tx,z:s.z+tz},obstacles,cruise);
  if(v.disabledReason?.()||v.bodyCond<10)v.ai={throttle:-1,steer:0,handbrake:true};
 }
 dispose(){for(const t of this.towns)if(t.on)this.empty(t);}
}
