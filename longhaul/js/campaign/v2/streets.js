import * as THREE from 'three';
// Street dressing for the prologue towns (same grid in Westhaven and Drywell, site-local metres): kerbed pavements
// along every street, street and yard trees, shrubs, streetlights, shop-front parking and house driveways.
// Boxes go through world.prop (batched with the buildings); trees are instanced, three draw calls a town.
// High streets run north–south at x = −70, 0, 70 (z −90..90); cross streets east–west at z = ±55 (x −100..100); all 9 m wide.
export const HIGH=[-70,0,70],CROSS=[-55,55],HALF=4.5;
export const SHOPS=[-92,-42,42,92];                       // the row at z −28, fronts facing the cross street
export const HOUSES=[[42,30],[92,30],[-92,78],[-42,78]];
// Where each house's driveway car stands, and the shop-front bays (all facing their building)
export const DRIVEWAYS=HOUSES.map(([x,z])=>({x:x+10.5,z:z-1,yaw:Math.PI}));
export const BAYS=[[-95,'sedan'],[-89,'pickup'],[-45,'sedan'],[-39,'sedan'],[45,'pickup'],[92,'sedan']].map(([x,type])=>({x,z:-45,yaw:0,type}));
const BUILDINGS=[...SHOPS.map(x=>[x,-28,16,14]),[-92,30,16,14],[-42,30,16,14],...HOUSES.map(([x,z])=>[x,z,16,14]),[42,78,16,14],[92,78,16,14],[0,0,27,23]];
const CONCRETE=0xbdb4a2,KERB=0x8f897c,PAD=0xa9a294,BAY=0x45494a,PAINT=0xe8e2d2;
const rnd=s=>{const x=Math.sin(s*91.7+13.3)*43758.5453;return x-Math.floor(x);};

// avoid: absolute points the opening camera passes through low down; nothing tall is placed near them
export function dressTown(world,s,{avoid=[]}={}){
 const near=(x,z,r)=>avoid.some(p=>Math.abs(p.x-s.x-x)<r&&Math.abs(p.z-s.z-z)<r&&Math.hypot(p.x-s.x-x,p.z-s.z-z)<r);
 const prop=(x,z,w,h,d,c,solid=false,y=0)=>{const m=world.prop(s,x,z,w,h,d,c,solid);if(y)m.position.y+=y;return m;};
 // ── pavements: 2.5 m either side of each street, with a kerb on the road edge, broken where another street crosses
 const run=(alongZ,line,from,to,gaps)=>{
  let segs=[[from,to]];
  for(const [a,b] of gaps)segs=segs.flatMap(([u,v])=>b<=u||a>=v?[[u,v]]:[[u,a],[b,v]].filter(([p,q])=>q-p>.5));
  for(const side of [-1,1])for(const [a,b] of segs){
   const mid=(a+b)/2,len=b-a,off=line+side*(HALF+1.25),kerb=line+side*(HALF+.11);
   if(alongZ){prop(off,mid,2.5,.13,len,CONCRETE);prop(kerb,mid,.22,.17,len,KERB);}
   else{prop(mid,off,len,.13,2.5,CONCRETE);prop(mid,kerb,len,.17,.22,KERB);}
  }
 };
 const across=w=>CROSS.map(z=>[z-HALF,z+HALF]),through=HIGH.map(x=>[x-HALF,x+HALF]);
 for(const x of HIGH)run(true,x,-90,90,[...across(),...(x===0?[[-26,14]]:[])]);   // the centre street stops at the school
 for(const z of CROSS)run(false,z,-100,100,through);

 // ── shop-front parking (between the shop walkway and the cross-street pavement) and house driveways
 for(const x of SHOPS){
  prop(x,-45,13,.07,6,BAY);
  for(const k of [-4.5,-1.5,1.5,4.5])prop(x+k,-45,.1,.02,5,PAINT,false,.07);
  prop(x,-42.4,13,.12,.2,KERB);                               // wheel stop line
 }
 for(const [x,z] of HOUSES){
  const z0=z-10,z1=z+4;prop(x+10.5,(z0+z1)/2,3.4,.08,z1-z0,PAD);
  prop(x+10.5,z0+.1,3.4,.02,.12,KERB,false,.08);
  prop(x+8.5,(z0+z1)/2,.12,.5,z1-z0,0xa38a66);                // a low fence along the drive
  // a white picket fence round the front yard, with a gate gap for the front path (the yard dogs live behind it)
  const fz=z-9.6,PICKET=0xe9e3d3;
  for(const [a,b] of [[x-8,x-.8],[x+.8,x+8.4]]){
   prop((a+b)/2,fz,b-a,.07,.07,PICKET,false,.32);prop((a+b)/2,fz,b-a,.07,.07,PICKET,false,.72);
   for(let px=a+.1;px<b;px+=.32)prop(px,fz,.08,.95,.04,PICKET);
   world.solid(s.x+(a+b)/2,s.z+fz,b-a,.12,s.y,s.y+.95);
  }
  prop(x-8,z-8.3,.07,.07,2.6,PICKET,false,.32);prop(x-8,z-8.3,.07,.07,2.6,PICKET,false,.72);
  for(let pz=fz+.3;pz<z-7;pz+=.32)prop(x-8,pz,.04,.95,.08,PICKET);
  world.solid(s.x+x-8,s.z+z-8.3,.12,2.6,s.y,s.y+.95);
 }

 // ── streetlights: pole, arm over the road, lamp
 // every 21 m, alternating sides; world.lamps collects the lamp heads (absolute) for the glow and the dawn switch-off
 const lamps=[];
 const light=(x,z,dx,dz)=>{
  if(near(x,z,2.4)||near(x+dx*1.45,z+dz*1.45,2))return;
  prop(x,z,.16,5.6,.16,0x4f5753,true);
  prop(x+dx*.75,z+dz*.75,dx?1.5:.12,.1,dz?1.5:.12,0x4f5753,false,5.5);
  const head=prop(x+dx*1.45,z+dz*1.45,dx?.55:.3,.14,dz?.55:.3,0xe9dfc0,false,5.38);if(world.lampMat)head.material=world.lampMat;
  lamps.push({x,z});world.lamps?.push({x:s.x+x+dx*1.45,y:s.y+5.33,z:s.z+z+dz*1.45});
 };
 HIGH.forEach((x,h)=>{let k=h;for(let z=-84;z<=84;z+=21){
  if(CROSS.some(c=>Math.abs(z-c)<7)||(x===0&&z>-30&&z<16))continue;
  const side=k++%2?1:-1;light(x+side*6.9,z,-side,0);
 }});
 CROSS.forEach((z,c)=>{let k=c;for(let x=-94;x<=94;x+=21){
  if(HIGH.some(h=>Math.abs(x-h)<7))continue;
  const side=k++%2?1:-1;light(x,z+side*6.9,0,-side);
 }});

 // ── a few small things on the pavements: bins, hydrants, post boxes
 for(const [x,z] of [[-64.4,-30],[75.6,-26],[-64.4,40],[64.4,8],[-20,-48.6],[24,61.6]]){prop(x,z,.55,.95,.55,0x3d5148,true);prop(x,z,.6,.06,.6,0x2f3d37,false,.95);}
 for(const [x,z] of [[-75.6,-62],[64.4,62],[-12,-61.8],[30,48.4]]){prop(x,z,.26,.62,.26,0xa83a2c,true);prop(x,z,.36,.1,.14,0xa83a2c,false,.38);}
 for(const [x,z] of [[-64.4,-46],[75.6,48]]){prop(x,z,.5,1.1,.42,0x2f5a7a,true);prop(x,z,.52,.2,.44,0x2f5a7a,false,1.1);}

 // ── trees
 const T=[];
 const clearOf=(x,z,r)=>!BUILDINGS.some(([bx,bz,w,d])=>Math.abs(x-bx)<w/2+r&&Math.abs(z-bz)<d/2+r)
  &&!HIGH.some(l=>Math.abs(x-l)<HALF+.6&&Math.abs(z)<92)&&!CROSS.some(l=>Math.abs(z-l)<HALF+.6&&Math.abs(x)<102)
  &&!lamps.some(l=>Math.hypot(x-l.x,z-l.z)<2.2)&&!BAYS.some(b=>Math.abs(x-b.x)<4&&Math.abs(z-b.z)<4.5)&&!HOUSES.some(([hx,hz])=>Math.abs(x-hx-10.5)<2.6&&z>hz-11&&z<hz+5);
 const plant=(x,z,kind,seed)=>{if(clearOf(x,z,kind==='shrub'?.4:1.2)&&(kind==='shrub'||!near(x,z,kind==='cypress'?3:4.2)))T.push({x,z,kind,seed});};
 const crossings=[-40,18,66];
 for(const l of [-70,70])for(const side of [-1,1])for(let z=-84;z<=86;z+=15){
  if(CROSS.some(c=>Math.abs(z-c)<10)||crossings.some(c=>Math.abs(z-c)<4))continue;
  if(l===70&&side<0&&z<-8&&z>-50)continue;                  // keep the opening's crane over the school clear
  plant(l+side*6.4,z,'street',l*7+z+side);
 }
 for(const l of CROSS)for(const side of [-1,1])for(let x=-94;x<=94;x+=15){
  if(HIGH.some(h=>Math.abs(x-h)<10))continue;
  plant(x,l+side*6.4,'street',l*3+x+side);
 }
 for(const [x,z] of [[-105,-44],[105,-44],[-105,44],[105,44]])plant(x,z,'shade',x+z);
 BUILDINGS.forEach(([bx,bz,w,d],i)=>{
  if(i===BUILDINGS.length-1)return;
  plant(bx-w/2-3,bz+d/2+2.5,i%3?'shade':'cypress',i*5);plant(bx+w/2+3,bz+d/2+3,i%2?'cypress':'shade',i*5+1);
  for(const k of [-5.5,-3.2,3.2,5.5])plant(bx+k,bz-d/2-.8,'shrub',i*11+k);
 });
 for(const [x,z,k] of [[-21,-17,'shade'],[21,-17,'shade'],[-21,6,'cypress'],[21,6,'cypress'],[-17,17,'shade'],[17,17,'shade'],[-30,-6,'shade'],[30,-4,'shade']])plant(x,z,k,x*z);
 for(const t of T)if(t.kind!=='shrub')world.solid(s.x+t.x,s.z+t.z,.42,.42,s.y,s.y+3);
 world.group.add(buildTrees(world,s,T));
 return T;
}

// Instanced trees: trunks, rounded crowns of several overlapping clumps (shade and street trees), stacked cones
// (cypress) and low clumps (shrubs). Colour varies per clump.
const unitTrunk=new THREE.CylinderGeometry(.62,1,1,7).translate(0,.5,0),unitBlob=new THREE.IcosahedronGeometry(1,1),unitCone=new THREE.ConeGeometry(1,1,8).translate(0,.5,0);
const GREENS=[0x58703f,0x657c44,0x4c663a,0x718a4b,0x5d7448,0x6c7f3e];
function buildTrees(world,s,T){
 const trunks=[],blobs=[],cones=[];
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),k=new THREE.Vector3();
 const put=(list,x,y,z,sx,sy,sz,yaw=0,tilt=0,color)=>{e.set(tilt,yaw,0);q.setFromEuler(e);m.compose(v.set(x,y,z),q,k.set(sx,sy,sz));list.push({m:m.clone(),color});};
 for(const t of T){
  const r=i=>rnd(t.seed*1.31+i),x=s.x+t.x,z=s.z+t.z,y=s.y,green=i=>GREENS[Math.floor(r(i)*GREENS.length)];
  if(t.kind==='shrub'){put(blobs,x,y+.42,z,.75+r(1)*.3,.5+r(2)*.2,.7+r(3)*.3,r(4)*6,0,green(5));continue;}
  if(t.kind==='cypress'){
   const h=6+r(1)*2.5;put(trunks,x,y,z,.16,1.2,.16,0,0,0x5b4532);
   put(cones,x,y+.8,z,1.15+r(2)*.25,h*.62,1.15+r(2)*.25,r(3)*6,0,green(4));
   put(cones,x,y+h*.38,z,.85,h*.55,.85,r(5)*6,0,green(6));
   continue;
  }
  const big=t.kind==='shade',h=(big?3.1:2.5)+r(1)*1.1,R=(big?2.2:1.65)+r(2)*.6,lean=(r(3)-.5)*.12;
  put(trunks,x,y,z,big?.3:.22,h+.5,big?.3:.22,r(4)*6,lean,0x5e4834);
  // two forks out of the trunk under the crown
  for(const a of [0,2.4])put(trunks,x,y+h*.72,z,.1,R*.75,.1,r(5)*6+a,.6,0x5e4834);
  const n=big?6:5;
  for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2+r(10+i),d=i===0?0:R*.55,yy=y+h+R*.45+(i===0?R*.35:(r(20+i)-.3)*R*.5);
   const sc=R*(i===0?.85:.62+r(30+i)*.2);
   put(blobs,x+Math.sin(a)*d,yy,z+Math.cos(a)*d,sc,sc*.82,sc,r(40+i)*6,0,green(50+i));
  }
 }
 const g=new THREE.Group();g.name='Town trees';
 const make=(geo,list,mat)=>{
  if(!list.length)return;world.ownedMaterials.push(mat);const mesh=new THREE.InstancedMesh(geo,mat,list.length),c=new THREE.Color();
  list.forEach((o,i)=>{mesh.setMatrixAt(i,o.m);mesh.setColorAt(i,c.setHex(o.color));});
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();g.add(mesh);
 };
 make(unitTrunk,trunks,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95}));
 make(unitBlob,blobs,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,flatShading:true}));
 make(unitCone,cones,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,flatShading:true}));
 return g;
}

// Warm halos round the lit lamp heads, one draw call for a town's worth. Each lamp has its own photocell: they go
// out one by one as it gets light (and come back on at dusk). hour() is the time of day in hours.
export function lampGlow(lamps,hour){
 const P=[],C=[],K=[],I=[];let k=0;
 lamps.forEach((l,i)=>{const off=rnd(i*3.7+1);for(const [cx,cy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){P.push(l.x,l.y,l.z);C.push(cx,cy);K.push(off);}I.push(k,k+1,k+2,k,k+2,k+3);k+=4;});
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('corner',new THREE.Float32BufferAttribute(C,2));geo.setAttribute('cell',new THREE.Float32BufferAttribute(K,1));geo.setIndex(I);
 const mat=new THREE.ShaderMaterial({uniforms:{uHour:{value:12}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`attribute vec2 corner;attribute float cell;uniform float uHour;varying vec2 vC;varying float vOn;
   void main(){
    float off=6.25+cell*.5,on=19.1+cell*.4;
    vOn=(1.-smoothstep(off-.06,off+.06,uHour))+smoothstep(on-.06,on+.06,uHour);
    vec4 mv=modelViewMatrix*vec4(position,1.);mv.xy+=corner*1.6;vC=corner;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec2 vC;varying float vOn;void main(){float d=length(vC);float a=pow(max(0.,1.-d),2.2)*vOn;if(a<.003)discard;gl_FragColor=vec4(vec3(1.,.78,.5)*a*.9,a);}`});
 const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;mesh.name='Lamp glow';
 return {mesh,update(){const h=hour();mat.uniforms.uHour.value=h;
  // the lamp heads themselves: lit while most of the cells are still on
  const lit=Math.max(1-smoothstep(6.25,6.75,h),smoothstep(19.1,19.5,h));
  if(lampMatRef.m){lampMatRef.m.emissiveIntensity=2.2*lit;}
 }};
}
const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export const lampMatRef={m:null};
