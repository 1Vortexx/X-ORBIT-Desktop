import * as THREE from 'three';
import { box,M } from '../mesh.js';
import { BuildingDoor } from './doors.js';
import { finish } from './building-materials.js';
import { furnish } from './furnishings.js';
export function buildingType(title){
 if(title.includes('SCHOOL'))return 'school';if(title.includes('GENERAL STORE'))return 'store';if(title.includes('DINER'))return 'diner';
 if(title.includes('DEPOT'))return 'depot';if(title.includes('WORKSHOP'))return 'workshop';if(title.includes('CLINIC'))return 'clinic';
 if(title.includes('HOUSE'))return 'house';if(title==='ROOMS')return 'rooms';if(title.includes('RADIO'))return 'radio';
 if(title.includes('WATER')||title.includes('PUMP'))return 'water';return 'civic';
}
export function detailedBuilding(world,site,w,d,title,color){
 const type=buildingType(title),group=new THREE.Group();group.position.set(site.x,site.y,site.z);group.name=title;world.group.add(group);
 const id=Math.round(site.z)+':'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
 const b={world,site,group,id,type,title,w,d,details:[],doors:[]};world.buildings.push(b);
 const wallMat=finish(type==='school'?'brick':'plaster',color),trim=M('lh2ArchitectTrim',0xdac9a8),stone=M('lh2Sill',0xa6987c),roof=M('lh2RoofMetal',0x565e59,{m:.35,r:.7});
 const part=(name,x,y,z,a,h,c,mat=wallMat,solid=false)=>{const o=box(group,a,h,c,mat,x,y,z);o.name=name;if(mat.transparent)o.castShadow=false;b.details.push(name);if(solid)world.solid(site.x+x,site.z+z,a,c,site.y+y-h/2,site.y+y+h/2);return o;};
 const H=3.3,T=.24;
 // Every opening is cut out of both geometry and collision, rather than painted onto a wall.
 const wall=(axis,fixed,start,end,holes=[])=>{
  const slab=(a,z0,len,height,bottom=0)=>{
   if(len<.015||height<.015)return;
   const u=a+len/2,x=axis==='x'?u:fixed,z=axis==='x'?fixed:u;
   part('Wall',x,bottom+height/2,z,axis==='x'?len:T,height,axis==='x'?T:len,wallMat,true);
  };
  let cursor=start;
  for(const hole of [...holes].sort((a,b)=>a.at-b.at)){
   const a=hole.at-hole.width/2,c=hole.at+hole.width/2;slab(cursor,fixed,a-cursor,H);
   if(hole.bottom>0)slab(a,fixed,hole.width,hole.bottom);
   slab(a,fixed,hole.width,H-hole.bottom-hole.height,hole.bottom+hole.height);cursor=c;
  }
  slab(cursor,fixed,end-cursor,H);
 };
 const window=(axis,u,fixed,width=3,bottom=1,height=1.45)=>{
  const x=axis==='x'?u:fixed,z=axis==='x'?fixed:u,y=bottom+height/2;
  const glass=world.glass||(world.glass=new THREE.MeshStandardMaterial({color:0xa4c7c9,transparent:true,opacity:.28,roughness:.2,metalness:.1,depthWrite:false}));
  part('Glazed window',x,y,z,axis==='x'?width:.035,height,axis==='x'?.035:width,glass,true);
  const vertical=(du,a,h)=>part('Window frame',axis==='x'?x+du:x,y,z+(axis==='z'?du:0),axis==='x'?a:.13,h,axis==='x'?.13:a,trim);
  vertical(-width/2,.09,height+.15);vertical(width/2,.09,height+.15);vertical(0,.045,height);
  for(const yy of [bottom,bottom+height])part('Window rail',x,yy,z,axis==='x'?width+.1:.13,.085,axis==='x'?.13:width+.1,trim);
  part('Projecting window sill',x,bottom-.065,z,axis==='x'?width+.3:.38,.12,axis==='x'?.38:width+.3,stone);
 };
 const portal=(axis,u,fixed,width=1.12,{back=false,paired=false,name='door',key='entry'}={})=>{
  const height=type==='school'?2.6:2.4;
  const x=axis==='x'?u:fixed,z=axis==='x'?fixed:u;
  for(const sign of [-1,1])part('Door jamb',axis==='x'?x+sign*(width/2+.055):x, height/2,z+(axis==='z'?sign*(width/2+.055):0),axis==='x'?.11:.3,height+.1,axis==='x'?.3:.11,trim);
  part('Door lintel trim',x,height+.05,z,axis==='x'?width+.22:.3,.1,axis==='x'?.3:width+.22,trim);
  part('Door threshold',x,.035,z,axis==='x'?width:.35,.07,axis==='x'?.35:width,stone);
  const pair=paired?id+':'+key:null,style=type==='house'||type==='rooms'?'wood':'glazed';
  if(paired){
   for(const side of [1,-1])b.doors.push(new BuildingDoor(world,{id:id+':'+key+':'+side,parent:group,x:x-side*width/2,z,width:width/2,height:height-.04,side,style,name,pair}));
  }else{
   const yaw=axis==='x'?(back?Math.PI:0):(fixed<0?-Math.PI/2:Math.PI/2);
   b.doors.push(new BuildingDoor(world,{id:id+':'+key,parent:group,x:axis==='x'?x+(back?1:-1)*width/2:x,z:axis==='z'?z+(fixed<0?-1:1)*width/2:z,yaw,width,height:height-.04,style,name}));
  }
  return {at:u,width,bottom:0,height};
 };
 const entryWidth=type==='school'?2.4:type==='depot'?2.8:1.2;
 const front=[portal('x',0,-d/2,entryWidth,{paired:type==='school'||type==='depot',name:type==='school'?'school double doors':'front door'})];
 const windowWidth=type==='school'?4.6:type==='store'||type==='diner'?4.2:2.5;
 for(const u of [-w*.29,w*.29]){front.push({at:u,width:windowWidth,bottom:.95,height:1.5});window('x',u,-d/2,windowWidth,.95,1.5);}
 wall('x',-d/2,-w/2,w/2,front);
 const rear=[portal('x',w*.26,d/2,1.12,{back:true,name:'rear door',key:'rear'})];wall('x',d/2,-w/2,w/2,rear);
 for(const x of [-w/2,w/2]){
  const holes=[-d*.22,d*.24].map(at=>({at,width:2.6,bottom:1.05,height:1.4}));wall('z',x,-d/2,d/2,holes);for(const h of holes)window('z',h.at,x,h.width,h.bottom,h.height);
 }
 // Plinth, cornice, skirting and rainwater hardware make the shell read as construction.
 part('Finished floor',0,.035,0,w-.12,.06,d-.12,finish(type==='diner'||type==='clinic'?'tile':type==='house'?'wood':'tile',type==='diner'?0xc5bc9f:0xbeb5a1));
 for(const z of [-d/2,d/2]){
  const centre=z<0?0:w*.26,gap=z<0?entryWidth:1.12;
  for(const [a,c]of [[-w/2,centre-gap/2],[centre+gap/2,w/2]])part('Foundation plinth',(a+c)/2,.16,z,c-a,.28,.3,stone);
  part('Cornice',0,3.26,z,w+.36,.18,.36,trim);
 }

 // Keep the doorway foundation open; a flush ramp bridges its small threshold.
 part('Entry ramp',0,.04,-d/2-.5,entryWidth+.5,.07,1.1,stone);
 for(const x of [-w/2,w/2]){part('Foundation plinth',x,.17,0,.32,.3,d,stone);part('Cornice',x,3.26,0,.36,.18,d+.36,trim);part('Downpipe',x+.15,1.6,d/2+.18,.085,3.2,.085,roof);}
 if(type==='house'){
  const rise=.95,angle=Math.atan2(rise,d/2);
  for(const side of [-1,1]){const r=part('Pitched roof',0,3.3+rise/2,side*d/4,w+.8,.14,Math.hypot(d/2,rise)+.55,roof);r.rotation.x=side*angle;}
  for(const side of [-1,1]){
   const shape=new THREE.Shape();shape.moveTo(-d/2,0);shape.lineTo(0,rise);shape.lineTo(d/2,0);shape.closePath();
   const gable=new THREE.Mesh(new THREE.ShapeGeometry(shape),wallMat);gable.rotation.y=Math.PI/2;gable.position.set(side*w/2,3.3,0);gable.material.side=THREE.DoubleSide;group.add(gable);
  }
  part('Roof ridge cap',0,3.3+rise,0,w+.9,.12,.2,roof);
 }else{
  part('Roof deck',0,3.38,0,w+.3,.13,d+.3,roof);
  for(const x of [-w/2,w/2])part('Parapet',x,3.65,0,.24,.5,d+.4,wallMat);
  for(const z of [-d/2,d/2])part('Parapet',0,3.65,z,w+.4,.5,.24,wallMat);
  part('Roof air conditioner',w*.23,3.79,d*.22,1.7,.7,1.25,M('lh2AC',0x8e9991));
  for(let k=0;k<8;k++)part('AC louver',w*.23-.68+k*.19,3.8,d*.22-.64,.06,.47,.025,roof);
 }
 const awningColor=type==='diner'?0x92574b:type==='store'?0x718568:0x657c7a;
 part('Entrance awning',0,2.82,-d/2-1.1,type==='school'?7:w+.7,.14,2.3,M('lh2awning'+awningColor,awningColor));
 for(const x of [-1,1])part('Awning post',x*(type==='school'?3.25:w/2+.18),1.4,-d/2-2.1,.11,2.8,.11,trim);
 if(type==='house')world.label(group,'No. '+(12*Number(title.match(/\d+/)?.[0]||1)+1),1.35,1.65,-d/2-.19,.65,.27);
 else world.label(group,(site.town&&type==='diner'?site.town+' ': '')+title,0,3.08,-d/2-.19,Math.min(w-1,10),.45);
 if(type!=='house')world.label(group,type==='house'?'PRIVATE RESIDENCE':type==='diner'?'COFFEE  •  HOT FOOD':type==='store'?'GENERAL GOODS  •  OPEN DAILY':'WELCOME',0,2.61,-d/2-.2,Math.min(w-2,5),.25);
 if(type==='school'){
  // Central corridor and two classrooms, with three working internal doors on clear story paths.
  const a=portal('z',-3,-2,1.2,{name:'history classroom door',key:'history'});wall('z',-2,-6,d/2,[a]);
  const c=portal('z',-3,2,1.2,{name:'library door',key:'library'});wall('z',2,-6,d/2,[c]);
  const f=portal('x',-10,-6,1.2,{name:'classroom foyer door',key:'foyer'});wall('x',-6,-w/2,-2,[f]);
  wall('x',-6,2,w/2,[]);
  b.isSchool=true;world.schoolBuilding=b;
 }else if(type==='house'){
  const a=portal('z',-.1,.7,1.05,{name:'bedroom door',key:'bedroom'});wall('z',.7,-d/2,d/2,[a]);
  const c=portal('x',4,-1.2,1.05,{back:true,name:'bathroom door',key:'bathroom'});wall('x',-1.2,.7,w/2,[c]);
 }else if(type==='rooms'){
  const a=portal('x',-4,0,1.05,{name:'guest room one',key:'room-one'}),c=portal('x',4,0,1.05,{name:'guest room two',key:'room-two'});
  wall('x',0,-w/2,w/2,[a,c]);wall('z',0,0,d/2,[]);
 }
 furnish(b);
 if(type==='school'){
   const map=new BuildingDoor(world,{id:id+':map-cabinet',parent:group,x:-12.1,z:9,y:.3,yaw:Math.PI/2,width:1.8,height:1.85,style:'wood',name:'map cabinet'});
   b.doors.push(map);world.mapDoor=map;
   const chart=world.label(map.hinge,'WORLD MAP / HISTORY ARCHIVE',.9,1.02,.065,1.55,1.1);chart.rotation.y=0;
 }
 return b;
}
