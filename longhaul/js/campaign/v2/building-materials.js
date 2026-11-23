import * as THREE from 'three';
const shared=new Map();
// Shared procedural finishes: subtle plaster, timber grain, masonry and ceramic tile.
export function finish(kind,color){
 const key=kind+color;if(shared.has(key))return shared.get(key);
 const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');
 p.fillStyle='#'+color.toString(16).padStart(6,'0');p.fillRect(0,0,256,256);
 let seed=271;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1100;i++){p.fillStyle=rand()>.5?'rgba(255,255,255,.055)':'rgba(0,0,0,.055)';p.fillRect(rand()*256,rand()*256,1+rand()*3,1+rand()*3);}
 if(kind==='brick')for(let row=0;row<8;row++){
   p.fillStyle='rgba(27,23,20,.32)';p.fillRect(0,row*32,256,2);
   for(let x=(row%2)*32;x<256;x+=64)p.fillRect(x,row*32,2,32);
 }else if(kind==='wood'){
   for(let x=0;x<256;x+=32){p.fillStyle='rgba(24,14,9,.24)';p.fillRect(x,0,1.5,256);for(let j=0;j<5;j++){p.fillStyle='rgba(24,14,9,.055)';p.fillRect(x+rand()*30,0,.6,256);}}
 }else if(kind==='tile'){
   p.strokeStyle='rgba(35,35,32,.25)';p.lineWidth=2;for(let k=0;k<=256;k+=32){p.beginPath();p.moveTo(k,0);p.lineTo(k,256);p.stroke();p.beginPath();p.moveTo(0,k);p.lineTo(256,k);p.stroke();}
 }
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(kind==='wood'?2:3,kind==='wood'?1:2);map.anisotropy=2;
 const m=new THREE.MeshStandardMaterial({map,roughness:kind==='tile'?.62:.9});m.userData.shared=true;shared.set(key,m);return m;
}
