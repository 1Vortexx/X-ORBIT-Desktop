import * as THREE from 'three';
// Fair-weather cumulus over the prologue country: clusters of soft camera-facing puffs in one draw call, brighter on
// top and greyer underneath, drifting slowly with the wind and hazed by the scene fog with distance.
const rnd=s=>{const x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);};
let puffTexture=null;
function texture(){
 if(puffTexture)return puffTexture;
 const n=128,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');
 // a lumpy soft disc: a broad gradient plus smaller overlapping blobs for a cauliflower edge
 const blob=(x,y,r,a)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);if(!gr)return;gr.addColorStop(0,`rgba(255,255,255,${a})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};
 if(g){        // (headless test canvases draw nothing: the texture is just left blank)
  blob(64,64,60,.8);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,d=22+rnd(i)*14;blob(64+Math.cos(a)*d,64+Math.sin(a)*d*.8,18+rnd(i+20)*14,.45);}
 }
 puffTexture=new THREE.CanvasTexture(c);puffTexture.colorSpace=THREE.SRGBColorSpace;puffTexture.userData.shared=true;
 return puffTexture;
}
const VERT=`
attribute vec3 center;attribute vec2 corner;attribute float size;attribute float shade;
uniform float uTime;uniform vec2 uWind;uniform float uSpan;uniform vec3 uOrigin;
varying vec2 vUv;varying float vShade;varying float vTop;
#include <fog_pars_vertex>
void main(){
 vec3 c=center+vec3(uWind.x,0.,uWind.y)*uTime;
 // wrap round the field so the sky never empties
 c.xz=uOrigin.xz+mod(c.xz-uOrigin.xz+uSpan*.5,uSpan)-uSpan*.5;
 vec4 mvPosition=modelViewMatrix*vec4(c,1.);
 mvPosition.xy+=corner*size;
 gl_Position=projectionMatrix*mvPosition;
 vUv=corner*.5+.5;vShade=shade;vTop=corner.y;
 #include <fog_vertex>
}`;
const FRAG=`
uniform sampler2D uMap;uniform vec3 uLit;uniform vec3 uShadow;
varying vec2 vUv;varying float vShade;varying float vTop;
#include <fog_pars_fragment>
void main(){
 float a=texture2D(uMap,vUv).a;
 if(a<.01)discard;
 vec3 col=mix(uShadow,uLit,clamp(vShade+vTop*.35,0.,1.));
 gl_FragColor=vec4(col,a*.92);
 #include <fog_fragment>
}`;
// origin: the site the field is centred on; z0 spreads it along the prologue's run of towns
export function makeClouds(origin,z0,{count=48,span=3600}={}){
 const centers=[],corners=[],sizes=[],shades=[],index=[];let k=0;
 const add=(x,y,z,s,shade)=>{for(const [cx,cy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){centers.push(x,y,z);corners.push(cx,cy);sizes.push(s);shades.push(shade);}index.push(k,k+1,k+2,k,k+2,k+3);k+=4;};
 for(let i=0;i<count;i++){
  const x=origin.x+(rnd(i)-.5)*span,z=origin.z+(rnd(i+100)-.5)*span,base=origin.y+170+rnd(i+200)*90,w=60+rnd(i+300)*90;
  const puffs=7+Math.floor(rnd(i+400)*7);
  for(let j=0;j<puffs;j++){
   const u=(rnd(i*31+j)-.5)*2,v=rnd(i*17+j+50);
   // a flat base and a heaped middle: puffs near the centre sit higher and are bigger
   const along=u*w*.5,side=(rnd(i*13+j+90)-.5)*w*.45,heap=(1-Math.abs(u))*w*.22*v;
   const s=w*(.22+.18*(1-Math.abs(u)))*(.75+rnd(i*7+j+70)*.5);
   add(x+along,base+heap+s*.3,z+side,s,.45+heap/(w*.22)*.4+rnd(i+j)*.1);
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(centers,3));   // for bounds only; the shader moves them
 geo.setAttribute('center',new THREE.Float32BufferAttribute(centers,3));
 geo.setAttribute('corner',new THREE.Float32BufferAttribute(corners,2));
 geo.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));
 geo.setAttribute('shade',new THREE.Float32BufferAttribute(shades,1));
 geo.setIndex(index);
 geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(origin.x,origin.y+220,origin.z),span);
 const mat=new THREE.ShaderMaterial({
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uMap:{value:null},uTime:{value:0},uWind:{value:new THREE.Vector2(2.4,.9)},uSpan:{value:span},
   uOrigin:{value:new THREE.Vector3(origin.x,origin.y,origin.z)},uLit:{value:new THREE.Color(0xfbf7ee)},uShadow:{value:new THREE.Color(0xa9b1bd)}}]),
  vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:false,fog:true});
 mat.uniforms.uMap.value=texture();
 const mesh=new THREE.Mesh(geo,mat);mesh.name='Clouds';mesh.frustumCulled=false;mesh.renderOrder=-1;
 return {mesh,update(dt){mat.uniforms.uTime.value+=dt;}};
}
