import * as THREE from 'three';
import {box,M}from'../mesh.js';
// Story interactions attach to recognizable furniture and evidence, not identical plinths.
const LOCATIONS={
 'P01:timetable':[-5,-6.27,1.42,'notice'], 'P01:seat':[-11,-4.8,1.08,'seat'],
 'P01:sources':[-6,-1,.85,'book'], 'P01:friends':[7,-17,.8,'bench'],
 'P01:photo':[6,-10.72,1.6,'photo'], 'P01:sophomore':[-11,-4.8,1.08,'seat'],
 'P02:graduation':[0,9.78,1.6,'photo'], 'P02:contract':[3.4,-4,.85,'paper'],
 'P02:manifest':[4.6,-4,.85,'clipboard'], 'P02:ledger':[3.8,-4,.85,'book'], 'P02:copy':[4.8,-4,.85,'paper'],
 'P03:originals':[-12,8,1.35,'paper'], 'P03:panel':[-12,8,1.35,'cabinet'],
 'P03:westmap':[-7.7,8.7,.85,'map'], 'P03:phrase':[8,-8.5,1.16,'phone'],
 'P03:request':[7.5,8.6,1.25,'terminal'], 'P03:carbon':[8.5,8.6,.92,'printer'],
 'P03:depart':[0,-11.7,1.1,'exit'], 'P04:extract':[15,-12,.95,'stretcher'],
 'P04:lastcall':[4,-4.5,1.16,'phone'],
};
export function clue(world,id,site,x,z,label,run){
 const s=world.sites[site],spec=LOCATIONS[id]||[x,z,1.35,'checkpoint'];[x,z]=spec;const y=spec[2],kind=spec[3];
 const key=site+':'+kind+':'+x+':'+z,model=new THREE.Group();model.position.set(s.x+x,s.y,s.z+z);
 const b=(a,h,c,color,xx=0,yy=y,zz=0)=>box(model,a,h,c,M('lh2clue'+color,color),xx,yy,zz);
 if(!world.clueFixtures.has(key)&&!['seat','exit','cabinet'].includes(kind)){
  if(['paper','book','map','clipboard'].includes(kind)){
   b(.39,.04,.48,0x576b55);b(.36,.023,.45,0xe9ddbd,0,y+.03);b(.39,.014,.48,0x7d8d72,0,y+.05);
   if(kind==='map'){b(1.1,.022,.65,0xd2c397);for(let i=0;i<4;i++)b(.025,.026,.55,0x6d8877,-.4+i*.22,y+.02);}
  }else if(kind==='phone'){
   b(.38,.13,.28,0x303d3b);b(.43,.07,.1,0x272d2b,0,y+.11,.06);for(const xx of [-.17,.17])b(.09,.1,.13,0x303d3b,xx,y+.09,.04);
   for(let row=0;row<3;row++)for(let col=0;col<3;col++)b(.035,.016,.035,0xc9c4b6,-.05+col*.045,y+.078,-.085+row*.04);
  }else if(kind==='terminal'){
   b(.58,.47,.42,0xb8b39f,0,y);b(.48,.31,.018,0x243a32,0,y+.015,-.22);b(.65,.045,.25,0x9eaa99,0,y-.25,-.34);
   for(let i=0;i<7;i++)b(.35,.012,.009,0x82b28a,0,y-.08+i*.032,-.232);
  }else if(kind==='printer'){
   b(.55,.25,.48,0xb8b39f,0,y);b(.46,.018,.28,0xe8ddc5,0,y+.15,-.21);b(.4,.06,.025,0x35463e,0,y+.02,-.25);
  }else if(kind==='bench'){
   b(2.7,.12,.55,0x8e7352,0,.49);b(2.7,.53,.075,0x8e7352,0,.78,.24);for(const xx of [-1.05,1.05])b(.12,.47,.45,0x49564d,xx,.235);
  }else if(kind==='stretcher'){
   b(.75,.15,2.1,0x778b82,0,.81);b(.72,.12,1.95,0xd9d4bd,0,.94);b(.5,.12,.32,0xe9dfc9,0,1.04,.7);
   for(const xx of [-.3,.3])for(const zz of [-.8,.8]){b(.045,.66,.045,0x7c8b83,xx,.43,zz);b(.16,.18,.075,0x323935,xx,.13,zz);}
  }else if(kind==='photo'||kind==='notice'){
   b(.8,.64,.065,0x7d6242,0,y);b(.7,.54,.025,0xe7dcc0,0,y,-.045);
   const image=world.label(model,kind==='photo'?'THE CLASS / '+(id.startsWith('P02')?'2089':'2086'):'HISTORY 9 / ROOM 9',0,y-.17,-.065,.65,.13);
   if(kind==='photo')for(let i=0;i<5;i++){b(.085,.095,.03,[0xad7854,0xcb976c,0xa67754][i%3],-.25+i*.125,y+.07,-.07);b(.1,.14,.025,[0x61705c,0x8c6152,0x697d82][i%3],-.25+i*.125,y-.055,-.07);}
  }else{
   b(.1,1.4,.1,0x737d72,0,.7);b(.65,.5,.06,0xd9c78e,0,1.25);b(.8,.08,.5,0x7c8175,0,.04);world.label(model,'TRANSPORT / ROUTE CHECK',0,1.25,-.04,.59,.18);
  }
  world.group.add(model);world.clueFixtures.add(key);
 }
 const target=new THREE.Group();target.position.set(s.x+x,s.y+y,s.z+z);world.group.add(target);
 const material=new THREE.MeshStandardMaterial({color:0xd9b473,transparent:true,opacity:0,depthWrite:false});world.ownedMaterials.push(material);
 const size=kind==='seat'?[.68,.9,.68]:kind==='bench'?[2.8,1,.8]:kind==='terminal'?[.68,.65,.6]:kind==='printer'?[.7,.5,.85]:kind==='map'?[1.15,.24,.75]:kind==='stretcher'?[.8,.65,2.2]:kind==='photo'||kind==='notice'?[.85,.7,.12]:kind==='checkpoint'?[.7,.7,.15]:[.5,.24,.55];
 const paper=box(target,...size,material,0,0,0); // invisible, slightly proud interaction volume; real fixture stays visible
 const obj={mesh:target,paper,label,pos:target.position.clone(),site,proxy:true,requiresMapDoor:id==='P03:panel'||id==='P03:originals',kind};
 world.objects.set(id,obj);return {target,obj};
}
