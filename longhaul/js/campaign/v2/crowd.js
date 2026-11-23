// Townspeople for the prologue towns: people walking the pavements (now and then crossing at a corner, stopping to
// look in a window), the odd jogger, groups talking outside the shops and the diner, people on the benches and, in
// Westhaven on a school morning, students making their way to the high school and waiting out front.
// A town fills when the player comes within reach and empties when they leave; nothing here is saved.
import * as THREE from 'three';
import { HIGH, CROSS, HALF, HOUSES } from './streets.js';
import { Dog, leash } from './dogs.js';
const FIRST=['Ana','Ben','Cora','Dale','Edie','Finn','Gail','Hank','Iris','Jack','Kate','Leo','Mae','Ned','Opal','Pete','Rhea','Sid','Tess','Uri','Vera','Walt','Yara','Zeke','Bo','Cass','Dot','Gus','Hal','Lou'];
const NEAR=360,FAR=460,OFF=HALF+.5;            // walking line: the inner half of the pavement, clear of trees and bins
const rnd=s=>{const x=Math.sin(s*78.233+21.7)*43758.5453;return x-Math.floor(x);};
// Pavement lines (site-local): [x0,z0,x1,z1]
function lines(){
 const L=[];
 for(const x of HIGH)for(const side of [-1,1]){
  const lx=x+side*OFF;
  if(x===0){L.push([lx,-88,lx,-26],[lx,14,lx,88]);}else L.push([lx,-88,lx,88]);
 }
 for(const z of CROSS)for(const side of [-1,1])L.push([-98,z+side*OFF,98,z+side*OFF]);
 return L;
}
const LINES=lines();
const along=(l,u)=>({x:l[0]+(l[2]-l[0])*u,z:l[1]+(l[3]-l[1])*u});
// Groups standing about (site-local centre, how many): shop fronts, the diner, the town hall steps
const GROUPS=[[-92,-38.5,3],[-42,-38.6,4],[42,-38.4,2],[92,-38.5,3],[-42,19.5,3],[-92,19.6,2],[44,64.5,2]];
const BENCHES=[[-57,-37],[57,-37],[-57,21],[57,21]];
// Students waiting before school: small groups out at the sides of the forecourt, never in front of the doors
// (x −3..3) or where the courtyard scene is staged (x −5..5, z −14..−19). The rest walk up and go in.
const SCHOOL_FRONT=[[-15,-15.5],[15.5,-16.5],[-10.5,-27],[11,-26.5]];
const SCHOOL_DOOR={x:0,z:-12.6};
// The front yards that have a dog behind the fence (index into HOUSES), and how far a dog notices you
const YARD_DOGS=[0,2,3],NOTICE_YARD=15,NOTICE_LEAD=5,BARK_QUICK='audio/sfx/dog_bark_quick.mp3';

export class Crowd {
 constructor(ctx,sites){this.ctx=ctx;this.towns=sites.map((s,i)=>({s,i,on:false,people:[],dogs:[]}));this.serial=0;}
 update(dt,{paused=false,school=false}={}){
  const p=this.ctx.player().pos;
  for(const t of this.towns){
   const d=Math.hypot(p.x-t.s.x,p.z-t.s.z);
   if(!t.on&&d<NEAR)this.fill(t,school&&t.i===0);else if(t.on&&d>FAR)this.empty(t);
   if(t.on&&!paused)for(const e of [...t.people])this.think(t,e,dt);
   if(t.on)this.dogs(t,dt);
   if(t.on&&t.refill?.length){t.refill=t.refill.map(r=>r-dt);for(const r of t.refill)if(r<=0)this.student(t,this.serial);t.refill=t.refill.filter(r=>r>0);}
  }
 }
 spawn(t,x,z,age,role='local'){
  const i=this.serial++,seed=1200+t.i*400+i;
  return this.ctx.npcs.spawn({id:`lh2:crowd:${t.i}:${i}`,name:FIRST[seed%FIRST.length],role,seed,x:t.s.x+x,z:t.s.z+z,age});
 }
 fill(t,school){
  t.on=true;const lite=!!this.ctx.npcs.lite,k=lite?.5:1,s=t.s;
  // walkers and joggers spread along the pavements
  // a lively but not frantic street: about twenty out walking, never more than two of them jogging
  const walkers=Math.round((t.i===0?20:12)*k);let joggers=0;
  for(let j=0;j<walkers;j++){
   const li=Math.floor(rnd(t.i*97+j)*LINES.length),u=rnd(t.i*53+j*3),pt=along(LINES[li],u);
   const jog=joggers<2&&rnd(j+7)<.1&&!!++joggers,n=this.spawn(t,pt.x,pt.z,jog?24+Math.floor(rnd(j)*14):18+Math.floor(rnd(j+1)*60));
   const e={n,kind:jog?'jog':'walk',line:li,wait:rnd(j+3)*3,timer:0};t.people.push(e);
   // every fifth walker has a dog on a lead
   if(!jog&&j%5===2&&this.ctx.root){e.dog=new Dog(this.ctx.root,{breed:j+t.i*3,x:s.x+pt.x+.8,z:s.z+pt.z});e.lead=leash(this.ctx.root);t.dogs.push({dog:e.dog,owner:e,quiet:0});}
  }
  // groups talking
  for(const [gx,gz,count] of GROUPS.slice(0,Math.ceil(GROUPS.length*k))){
   const g={members:[],t:rnd(gx)*2,speaker:-1};
   for(let m=0;m<count;m++){
    const a=m/count*Math.PI*2+rnd(gz+m),n=this.spawn(t,gx+Math.sin(a)*.8,gz+Math.cos(a)*.8,22+Math.floor(rnd(gx+m)*45));
    n.lookAt?.({x:s.x+gx,z:s.z+gz});g.members.push(n);
   }
   t.people.push({kind:'group',g});
  }
  // benches: one or two sitting, chatting or watching the street
  BENCHES.forEach(([bx,bz],b)=>{
   for(const side of b%2?[-.55]:[-.55,.55]){
    const n=this.spawn(t,bx+side,bz-.7,35+Math.floor(rnd(b+side)*40));
    n.sitOn?.({x:s.x+bx+side,y:s.y+.6,z:s.z+bz+.05,yaw:Math.PI,out:{x:s.x+bx+side,z:s.z+bz-.8}},b%2?'lean':'chat',side<0?-.8:.8);
    t.people.push({n,kind:'sit'});
   }
  });
  // dogs behind the front-yard fences
  if(this.ctx.root)for(const h of YARD_DOGS){
   const [hx,hz]=HOUSES[h],yard={x0:hx-7,x1:hx+6.5,z0:hz-9.2,z1:hz-7.6};
   const dog=new Dog(this.ctx.root,{breed:h*2+1+t.i,x:s.x+hx,z:s.z+(yard.z0+yard.z1)/2,yaw:Math.PI});
   t.dogs.push({dog,yard,house:{x:s.x+hx,z:s.z+hz},next:0,target:null,quiet:0,burst:0});
  }
  // a school morning: students on their way in, and some already waiting at the front
  if(school){
   t.school=true;const going=Math.round(12*k),waiting=Math.round(10*k);
   for(let j=0;j<going;j++)this.student(t,j);
   for(let j=0;j<waiting;j++){
    const spot=j%SCHOOL_FRONT.length,[fx,fz]=SCHOOL_FRONT[spot],a=Math.floor(j/SCHOOL_FRONT.length)*2.3+spot,n=this.spawn(t,fx+Math.sin(a)*.85,fz+Math.cos(a)*.85,14+(j%4),'walker');
    n.lookAt?.({x:s.x+fx,z:s.z+fz});t.people.push({n,kind:'waiting',spot,timer:rnd(j)*4});
   }
  }
 }
 empty(t){for(const e of t.people){if(e.g)for(const n of e.g.members)this.ctx.npcs.remove(n);else this.ctx.npcs.remove(e.n);e.lead?.line.removeFromParent();}for(const d of t.dogs)d.dog.dispose();t.people=[];t.dogs=[];t.on=false;}
 // A student somewhere on the pavements, heading for school (topping the numbers back up as others go in)
 student(t,j){
  const li=Math.floor(rnd(j*5+400+this.serial)*LINES.length),pt=along(LINES[li],rnd(j*7+401+this.serial));
  t.people.push({n:this.spawn(t,pt.x,pt.z,14+(j%4),'walker'),kind:'student',line:li,stage:0,wait:rnd(j)*6});
 }
 listener(){return this.ctx.listener?.()||this.ctx.player().pos;}
 // Dogs: walked dogs keep to their walker's side; yard dogs patrol the fence and rush it when someone comes near.
 // Out of the opening a dog that notices you barks at you, louder the closer you are; the opening stays quiet.
 dogs(t,dt){
  const L=this.listener(),opening=!!this.ctx.opening?.(),hand=new THREE.Vector3(),collar=new THREE.Vector3();
  for(const d of t.dogs){
   const dog=d.dog,dl=Math.hypot(L.x-dog.pos.x,L.z-dog.pos.z);
   if(d.owner){
    const n=d.owner.n,c=Math.cos(n.yaw),sn=Math.sin(n.yaw);
    // ahead and to the walker's right, sniffing about when they stop
    const tx=n.pos.x-c*.9+sn*.7,tz=n.pos.z+sn*.9+c*.7;
    dog.moveTowards(tx,tz,dt,n.arrived?.6:2.4,n.arrived?.6:.25);
    if(dog.speed<.1&&n.arrived)dog.face(n.pos.x+Math.sin(n.yaw)*3,n.pos.z+Math.cos(n.yaw)*3,dt*.3);
    hand.set(n.pos.x-c*.24,n.pos.y+.82,n.pos.z+sn*.24);d.owner.lead.update(hand,dog.collar(collar));
   }else{
    const y=d.yard,lx=L.x-t.s.x;
    if(dl<NOTICE_YARD){
     // to the fence, level with whoever it is, and bark
     const fx=Math.max(y.x0,Math.min(y.x1,lx)),k=t.s;dog.moveTowards(k.x+fx,k.z+y.z0,dt,3.2,.2);
     if(dog.speed<.4)dog.face(L.x,L.z,dt);
     dog.excite=Math.min(1,dog.excite+dt);
    }else if((d.next-=dt)<=0||!d.target){
     d.next=3+Math.random()*6;d.target={x:t.s.x+y.x0+Math.random()*(y.x1-y.x0),z:t.s.z+y.z0+Math.random()*(y.z1-y.z0)};
    }else dog.moveTowards(d.target.x,d.target.z,dt,1.1,.3);
   }
   // barking
   const notice=d.owner?NOTICE_LEAD:NOTICE_YARD;
   if((d.quiet-=dt)<=0){
    if(!opening&&dl<notice){
     dog.bark();
     const v=.7*Math.pow(Math.max(0,1-dl/(notice*1.6)),1.4);
     if(v>.02)this.ctx.clip?.(BARK_QUICK,{volume:v});
     // in bursts: two to four barks, then a breath
     d.burst=(d.burst||0)+1;d.quiet=d.burst<2+Math.floor(Math.random()*3)?.45+Math.random()*.35:(d.burst=0,1.8+Math.random()*2.5);
    }else d.quiet=.5;
   }
   dog.update(dt);
  }
 }
 // pick somewhere further along this pavement, or turn at a junction onto a pavement that crosses it, or cross
 // the road to the facing pavement
 next(t,e){
  const s=t.s,n=e.n,lx=n.pos.x-s.x,lz=n.pos.z-s.z,l=LINES[e.line],vertical=l[0]===l[2];
  const r=Math.random();
  if(r<.3){
   // junctions: where a perpendicular pavement crosses this one, within both
   const turns=[];
   LINES.forEach((m,i)=>{
    if(i===e.line||(m[0]===m[2])===vertical)return;
    const x=vertical?l[0]:m[0],z=vertical?m[1]:l[1];
    const inside=(a,b,v)=>v>=Math.min(a,b)-.1&&v<=Math.max(a,b)+.1;
    if(inside(l[0],l[2],x)&&inside(l[1],l[3],z)&&inside(m[0],m[2],x)&&inside(m[1],m[3],z)&&Math.hypot(x-lx,z-lz)<90)turns.push({i,x,z});
   });
   if(turns.length){const q=turns[Math.floor(Math.random()*turns.length)];e.line=q.i;return {x:q.x,z:q.z};}
  }else if(r<.4){
   const facing=LINES.map((m,i)=>i).filter(i=>i!==e.line&&(vertical?LINES[i][0]===LINES[i][2]&&Math.abs(LINES[i][0]-l[0])<2*OFF+.1:LINES[i][1]===LINES[i][3]&&Math.abs(LINES[i][1]-l[1])<2*OFF+.1));
   if(facing.length){e.line=facing[0];const m=LINES[e.line];return vertical?{x:m[0],z:lz}:{x:lx,z:m[1]};}
  }
  const m=LINES[e.line],len=Math.hypot(m[2]-m[0],m[3]-m[1]);
  // project where they are onto the line and walk 15–60 m one way or the other
  const u0=Math.max(0,Math.min(1,((lx-m[0])*(m[2]-m[0])+(lz-m[1])*(m[3]-m[1]))/(len*len)));
  const u=Math.max(0,Math.min(1,u0+(Math.random()<.5?-1:1)*(15+Math.random()*45)/len));
  return along(m,u);
 }
 think(t,e,dt){
  const s=t.s;
  if(e.kind==='group'){
   const g=e.g;if((g.t-=dt)>0)return;
   let k;do k=Math.floor(Math.random()*g.members.length);while(g.members.length>1&&k===g.speaker);
   g.speaker=k;const who=g.members[k],secs=1.8+Math.random()*3.4;who.talkFor?.(secs);
   for(const n of g.members)if(n!==who&&Math.random()<.75)n.lookAt?.(who.pos);
   g.t=secs+(Math.random()<.3?1.6:.4);return;
  }
  const n=e.n;
  if(e.kind==='sit'){if(n.act==='chat'&&Math.random()<dt*.15)n.talkFor?.(1.5+Math.random()*2.5);return;}
  if(e.kind==='waiting'){
   if((e.timer-=dt)<=0){e.timer=2+Math.random()*5;if(Math.random()<.5)n.talkFor?.(1.5+Math.random()*2.5);const [fx,fz]=SCHOOL_FRONT[e.spot];n.lookAt?.({x:s.x+fx,z:s.z+fz});}
   return;
  }
  if(!n.arrived){e.timer+=dt;if(e.timer<25)return;}       // walking (or stuck too long: choose again)
  if((e.wait-=dt)>0)return;
  e.timer=0;
  if(e.kind==='student'){
   // two legs: along their pavement towards the school, then up the front path and in through the doors
   if(e.stage===0){e.stage=1;const l=LINES[e.line],a=along(l,0),b=along(l,1),near=Math.hypot(a.x,a.z+20)<Math.hypot(b.x,b.z+20)?a:b;n.walkTo?.(s.x+near.x,s.z+near.z,{arrive:1});return;}
   // up the front path (from out in the forecourt, not across it) and in through the doors
   if(e.stage===1){e.stage=2;n.walkTo?.(s.x+(Math.random()-.5)*2,s.z-24,{arrive:1});return;}
   if(e.stage===2){e.stage=3;n.walkTo?.(s.x+SCHOOL_DOOR.x+(Math.random()-.5)*1.4,s.z+SCHOOL_DOOR.z,{arrive:.7});return;}
   this.ctx.npcs.remove(n);t.people.splice(t.people.indexOf(e),1);
   if(t.school)(t.refill||(t.refill=[])).push(4+Math.random()*9);
   return;
  }
  const to=this.next(t,e),run=e.kind==='jog';
  n.walkTo?.(s.x+to.x,s.z+to.z,{run,arrive:.5});
  // most walkers pause on arrival: a shop window, a word with somebody, waiting to cross
  e.wait=run?.5:Math.random()<.55?1.5+Math.random()*6:0;
 }
 dispose(){for(const t of this.towns)if(t.on)this.empty(t);}
}
