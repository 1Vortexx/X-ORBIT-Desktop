import * as THREE from 'three';
import { heightAt } from '../../world/terrain.js';
export const ease = t => { t=Math.max(0,Math.min(1,t)); return t*t*t*(t*(t*6-15)+10); };
const vec=a=>a?.isVector3?a.clone():new THREE.Vector3(...a);
const blend=(a,b,t)=>vec(a).lerp(vec(b),t);
// Monotone cubic (Fritsch–Carlson) through (xs[i], ys[i]) with zero slope at both ends: a move that starts and
// settles gently, never overshoots a key and has no sudden change of speed at one.
function monotone(xs,ys){
  const n=xs.length,d=[],m=new Array(n).fill(0);
  for(let i=0;i<n-1;i++)d.push((ys[i+1]-ys[i])/(xs[i+1]-xs[i]));
  for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:3*(xs[i+1]-xs[i-1])/((2*xs[i+1]-xs[i]-xs[i-1])/d[i-1]+(xs[i+1]+xs[i]-2*xs[i-1])/d[i]);
  return x=>{
    if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];
    let i=0;while(x>xs[i+1])i++;
    const h=xs[i+1]-xs[i],t=(x-xs[i])/h,t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h*m[i+1];
  };
}
// A keyed shot: one continuous camera move through keys [{t,position,target,fov}], no cuts.
function keyed(shot){
  if(shot._path)return shot._path;
  const k=shot.keys,P=new THREE.CatmullRomCurve3(k.map(q=>vec(q.position)),false,'catmullrom',.5),T=new THREE.CatmullRomCurve3(k.map(q=>vec(q.target)),false,'catmullrom',.5);
  // Distance travelled is a smooth function of time through each key's arc length, so the pace only changes
  // gradually; the camera is placed by arc length and the aim follows the same keys.
  const n=k.length-1,L=[0],steps=200;let prev=P.getPoint(0),acc=0;
  for(let i=1;i<=n*steps;i++){const p=P.getPoint(i/(n*steps));acc+=p.distanceTo(prev);prev=p;if(i%steps===0)L.push(acc);}
  const dist=monotone(k.map(q=>q.t),L),index=monotone(L,k.map((q,i)=>i));
  return shot._path={P,T,n,total:acc,dist,index,fovs:monotone(k.map(q=>q.t),k.map(q=>q.fov??48))};
}
// Points along a keyed shot's camera path, every `step` seconds (used to keep the set dressing out of the way)
export function samplePath(shot,step=.25){
 const path=keyed(shot),out=[],end=shot.keys.at(-1).t;
 for(let t=0;t<=end;t+=step)out.push(path.P.getPointAt(Math.min(1,path.dist(t)/path.total)));
 return out;
}
// Gentle, deterministic hand-held drift (time-based, so identical at any frame rate)
function drift(t,out,scale){
  out.x+=scale*(Math.sin(t*.61)*.05+Math.sin(t*1.37+1.1)*.02);
  out.y+=scale*(Math.sin(t*.47+2.3)*.035+Math.sin(t*1.13)*.012);
  out.z+=scale*(Math.sin(t*.53+.7)*.04);
  return out;
}
// Authored tracks, in absolute coordinates under worldRoot. Keyed shots move continuously; listed shots cut behind a fade.
export class Cinematics {
  constructor(camera,blocked=()=>false){this.camera=camera;this.blocked=blocked;this.active=false;this.opacity=0;}
  beginTrack(shots,{reduced=false,time=0,entry=1.1}={}){
    this.end();this.oldFov=this.camera.fov;this.oldPosition=this.camera.position.clone();this.oldRotation=this.camera.quaternion.clone();
    this.shots=shots;this.reduced=reduced;this.time=time;this.entry=entry;this.active=true;this.opacity=1;this.done=false;this.exitTime=null;
    this.age=0;this.duration=shots.reduce((n,s)=>n+s.duration,0);this.segment=-1;
  }
  // Compatibility for a free-moving follow shot; no timed follow/object/wide jumps.
  begin(anchor,object,reduced=false){
    const pose=()=>{const a=anchor();if(!a)return null;const yaw=a.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
      return {position:[a.x+2.2*c-3.6*s,a.y+1.7,a.z-2.2*s-3.6*c],target:[a.x,a.y+1.25,a.z],fov:50};};
    this.beginTrack([{duration:3600,from:pose,to:pose}],{reduced,entry:.8});
  }
  leave(){if(this.active&&this.exitTime===null)this.exitTime=0;}
  get exiting(){return this.exitTime!==null;}
  update(dt){
    if(!this.active)return;
    dt=Math.max(0,dt);this.time+=dt;this.age+=dt;
    if(this.exitTime!==null){
      const keyed=this.shots.length===1&&this.shots[0].keys;
      if(keyed)this.updateKeyed(this.shots[0]);   // keep drifting into the fade
      const was=keyed?this.opacity:0;
      this.exitTime+=dt;this.opacity=Math.max(was,ease(this.exitTime/.8));if(this.exitTime>=.8)this.done=true;return;
    }
    if(this.shots.length===1&&this.shots[0].keys){this.updateKeyed(this.shots[0]);return;}
    let at=Math.min(this.time,this.duration),index=0;
    for(;index<this.shots.length-1&&at>this.shots[index].duration;index++)at-=this.shots[index].duration;
    const shot=this.shots[index],u=this.reduced?.5:ease(at/shot.duration);
    const a=typeof shot.from==='function'?shot.from():shot.from,b=typeof shot.to==='function'?shot.to():shot.to||a;
    if(!a||!b){this.leave();return;}
    let pos=blend(a.position,b.position,u),target=blend(a.target,b.target,u);
    pos.y=Math.max(pos.y,heightAt(pos.x,pos.z)+.45);
    const fade=Math.min(.8,shot.duration/4),first=index===0,last=index===this.shots.length-1;
    this.opacity=Math.max(1-ease(this.age/this.entry),first?1-ease(this.time/this.entry):1-ease(at/fade),!last?ease((at-shot.duration+fade)/fade):0);
    // Check only the short active camera ray. Do not sweep from a previous location across town.
    if(shot.collision!==false && this.blocked(target,pos)){
      const safe=shot.safe?vec(shot.safe):target.clone().add(new THREE.Vector3(0,.4,-.9));
      if(!this.blocked(target,safe))pos=safe;
      else if(this.lastSafe)pos.copy(this.lastSafe);
    }else this.lastSafe=pos.clone();
    // The pose is analytical, with zero endpoint velocity, so it is identical at 30/60/120 Hz.
    this.camera.position.copy(pos);
    this.camera.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pos,target,this.camera.up));
    const fov=(a.fov??48)+((b.fov??48)-(a.fov??48))*u;
    this.camera.fov=fov;this.camera.updateProjectionMatrix();this.segment=index;
  }
  updateKeyed(shot){
    const path=keyed(shot),k=shot.keys,t=Math.min(this.time,k.at(-1).t);
    let pos,target,fov;
    if(this.reduced){
      // reduced motion: still frames at the keys that have hold:true, changing behind a short fade
      const holds=k.filter(q=>q.hold),i=Math.max(0,holds.findLastIndex(q=>q.t<=t)),q=holds[i]||k[0],next=holds[i+1];
      pos=vec(q.position);target=vec(q.target);fov=q.fov??48;
      this.opacity=Math.max(1-ease(this.age/this.entry),1-ease((t-q.t)/.8),next?ease((t-next.t+.8)/.8):0);
    }else{
      const d=path.dist(t);
      pos=path.P.getPointAt(Math.min(1,d/path.total));target=path.T.getPoint(path.index(d)/path.n);fov=path.fovs(t);
      const calm=Math.min(1,t/3)*Math.min(1,(this.duration-t)/3);
      drift(t,pos,calm);drift(t+9.3,target,calm*1.6);
      this.opacity=1-ease(this.age/this.entry);
    }
    // an authored fade to black at the end of the move (the camera keeps going underneath it)
    if(shot.fade)this.opacity=Math.max(this.opacity,ease((t-shot.fade.from)/(shot.fade.to-shot.fade.from)));
    pos.y=Math.max(pos.y,heightAt(pos.x,pos.z)+.45);
    this.camera.position.copy(pos);
    this.camera.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pos,target,this.camera.up));
    this.camera.fov=fov;this.camera.updateProjectionMatrix();this.segment=0;
  }
  end(){if(this.active){this.camera.fov=this.oldFov;this.camera.updateProjectionMatrix();}this.active=false;this.opacity=0;this.lastSafe=null;}
}
