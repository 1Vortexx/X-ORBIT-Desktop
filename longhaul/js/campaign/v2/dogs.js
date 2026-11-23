import * as THREE from 'three';
import { heightAt } from '../../world/terrain.js';
// Dogs for the prologue towns: a small procedural dog (a few breeds and sizes) with a trot, a wagging tail and a bark
// (head up, jaw open), kinematic movement on the ground, and an optional leash to the person walking it.
// The figure faces +z like the people; one unit of size is a medium dog about half a metre at the shoulder.
const BREEDS=[
 {coat:0x8b5a2b,belly:0xd6b088,ear:0x5e3a1b,size:1},        // brown mutt
 {coat:0x25211f,belly:0x4f443c,ear:0x1a1716,size:1.15},     // black lab
 {coat:0xe9dfc9,belly:0xf6f0e3,ear:0xc9b89a,size:.72},      // small white terrier
 {coat:0xb7843f,belly:0xe9c995,ear:0x8a5d27,size:.95},      // golden
 {coat:0x6c6660,belly:0xd2cbc1,ear:0x4a4541,size:1.25},     // grey shepherd
 {coat:0xa0522d,belly:0xf0e4d0,ear:0x7a3c1f,size:.8},       // red-and-white spaniel
];
const SPHERE=new THREE.SphereGeometry(1,12,9),BOX=new THREE.BoxGeometry(1,1,1),LIMB=new THREE.CylinderGeometry(1,.8,1,7).translate(0,-.5,0);
const mats=new Map();
const mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.85}));return mats.get(c);};
function part(parent,geo,color,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;}
const pivot=(parent,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};

export class Dog {
 constructor(root,{breed=0,x=0,z=0,yaw=0}={}){
  const b=BREEDS[((breed%BREEDS.length)+BREEDS.length)%BREEDS.length];
  this.size=b.size;this.pos=new THREE.Vector3(x,heightAt(x,z),z);this.yaw=yaw;this.speed=0;this.phase=Math.random()*6;this.t=Math.random()*9;
  this.barkT=0;this.excite=0;this.sniff=0;
  const g=this.mesh=new THREE.Group();g.name='Dog';root.add(g);
  const s=pivot(g,0,0,0);s.scale.setScalar(b.size);this.body=s;
  part(s,SPHERE,b.coat,0,.5,-.04,.2,.19,.4);                     // body
  part(s,SPHERE,b.belly,0,.45,.02,.17,.14,.3);                   // belly
  part(s,SPHERE,b.coat,0,.53,.22,.19,.21,.19);                   // chest
  const neck=this.neck=pivot(s,0,.62,.32);
  part(neck,SPHERE,b.coat,0,.02,.02,.09,.13,.09);
  const head=this.head=pivot(neck,0,.12,.07);
  part(head,SPHERE,b.coat,0,.03,0,.12,.115,.13);
  part(head,BOX,b.coat,0,.0,.15,.095,.075,.15);                  // muzzle
  part(head,SPHERE,0x141110,0,.035,.23,.032,.028,.03);           // nose
  for(const sx of [-1,1]){part(head,SPHERE,0x120f0e,sx*.055,.07,.1,.018,.02,.012);
   const ear=pivot(head,sx*.07,.1,-.02);ear.rotation.z=sx*-.5;part(ear,BOX,b.ear,0,.04,0,.05,.1,.03);}
  const jaw=this.jaw=pivot(head,0,-.03,.08);part(jaw,BOX,b.belly,0,-.012,.07,.08,.026,.13);
  part(jaw,BOX,0xb4545a,0,.004,.06,.05,.008,.09);                // tongue
  this.legs=[];
  for(const [lx,lz,front] of [[-.1,.24,1],[.1,.24,1],[-.1,-.28,0],[.1,-.28,0]]){
   const hip=pivot(s,lx,.43,lz);part(hip,LIMB,b.coat,0,0,0,.048,.4,.048);part(hip,SPHERE,b.belly,0,-.41,.02,.045,.025,.06);
   this.legs.push({hip,front,side:lx>0?1:0});
  }
  const tail=this.tail=pivot(s,0,.58,-.42);tail.rotation.x=-2.2;part(tail,LIMB,b.coat,0,0,0,.03,.3,.03);
  this.sync();
 }
 // Head for a point at up to maxSpeed m/s, slowing to stop within `keep` of it; returns the distance left
 moveTowards(tx,tz,dt,maxSpeed=1.6,keep=.3){
  const dx=tx-this.pos.x,dz=tz-this.pos.z,d=Math.hypot(dx,dz);
  const want=d>keep?Math.min(maxSpeed,(d-keep)*1.8):0;
  this.speed+=(want-this.speed)*Math.min(1,dt*4);
  if(d>.05&&this.speed>.05){
   const yaw=Math.atan2(dx,dz),diff=Math.atan2(Math.sin(yaw-this.yaw),Math.cos(yaw-this.yaw));
   this.yaw+=Math.max(-dt*5,Math.min(dt*5,diff));
   const step=Math.min(d,this.speed*dt);this.pos.x+=Math.sin(this.yaw)*step;this.pos.z+=Math.cos(this.yaw)*step;
   this.pos.y=heightAt(this.pos.x,this.pos.z);
  }
  return d;
 }
 face(x,z,dt){const yaw=Math.atan2(x-this.pos.x,z-this.pos.z),diff=Math.atan2(Math.sin(yaw-this.yaw),Math.cos(yaw-this.yaw));this.yaw+=Math.max(-dt*6,Math.min(dt*6,diff));}
 bark(){this.barkT=.28;this.excite=Math.min(1,this.excite+.5);}
 update(dt){
  this.t+=dt;this.barkT=Math.max(0,this.barkT-dt);this.excite=Math.max(0,this.excite-dt*.12);
  const sp=this.speed/this.size,gait=Math.min(1,sp/.4);
  this.phase+=dt*(4+sp*5.5);
  const swing=.55*gait;
  for(const l of this.legs){const diag=(l.front^l.side)?0:Math.PI;l.hip.rotation.x=Math.sin(this.phase+diag)*swing;}
  this.body.position.y=Math.abs(Math.sin(this.phase))*.025*gait*this.size;
  // tail: a lazy sway at rest, a fast wag when excited
  this.tail.rotation.z=Math.sin(this.t*(4+this.excite*10))*(.25+this.excite*.45);
  this.tail.rotation.x=-2.2+this.excite*.5;
  // bark: head up and the jaw open for a moment; idle dogs sniff the ground now and then
  const b=this.barkT>0?Math.sin((1-this.barkT/.28)*Math.PI):0;
  this.jaw.rotation.x=b*.6;
  if(gait<.2&&b===0&&(this.sniff-=dt)<0&&Math.random()<dt*.15)this.sniff=1.5+Math.random()*2;
  const down=this.sniff>0&&b===0?.65:0;
  this.neck.rotation.x+=((down-b*.35)-this.neck.rotation.x)*Math.min(1,dt*6);
  this.head.rotation.y=Math.sin(this.t*.7)*.25*(1-gait);
  this.sync();
 }
 sync(){this.mesh.position.copy(this.pos);this.mesh.rotation.y=this.yaw;}
 // the collar, for the leash (absolute)
 collar(out=new THREE.Vector3()){this.neck.updateWorldMatrix(true,false);return this.neck.getWorldPosition(out);}
 dispose(){this.mesh.removeFromParent();this.leash?.line.removeFromParent();}
}

// A leash: a slightly sagging line from the walker's hand to the collar
const LEASH=new THREE.LineBasicMaterial({color:0x3a2a1f});
export function leash(root){
 const pts=new Float32Array(8*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pts,3));
 const line=new THREE.Line(geo,LEASH);line.frustumCulled=false;root.add(line);
 const a=new THREE.Vector3(),b=new THREE.Vector3();
 return {line,update(hand,collarPos){
  a.copy(hand);b.copy(collarPos);const span=a.distanceTo(b),sag=Math.max(0,1.5-span)*.25;
  for(let i=0;i<8;i++){const u=i/7;pts[i*3]=a.x+(b.x-a.x)*u;pts[i*3+1]=a.y+(b.y-a.y)*u-Math.sin(u*Math.PI)*sag;pts[i*3+2]=a.z+(b.z-a.z)*u;}
  geo.attributes.position.needsUpdate=true;
 }};
}
