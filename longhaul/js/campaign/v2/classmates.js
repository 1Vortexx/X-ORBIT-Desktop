// The rest of Westhaven High in P01: classmates fill room 9 (writing, reading, whispering to the next desk, a hand
// up now and then) and a few groups stand talking outside. Nobody here is saved; they are rebuilt with the mission.
const FIRST=['Mina','Joel','Priya','Owen','Lucy','Theo','Ada','Rafi','Nell','Marco','Ivy','Sol','June','Ezra','Bea','Kai','Lena','Rory','Wren','Isaac'];
// The cast's own desks in room 9 (b.seats ids); classmates never take these
export const CAST_SEATS={GREVYN:'grevyn',TAY:'r1c2',TAYJ:'r1c3',RIPED:'r2c1'};
const EMPTY=new Set(['window','r0c3','r3c0']);          // Cal's chair stays free, and a couple of absentees
// [x, z] local to the school site; members stand round the spot facing in
const GROUPS=[[-14,-21,3],[12.5,-19,3],[0.2,8,2]];
const SOLO=['write','write','write','read','read','listen','listen','lean'];
const hash=i=>{const x=Math.sin(i*127.1+11.7)*43758.5453;return x-Math.floor(x);};

export class Classmates {
 constructor(ctx){this.ctx=ctx;this.list=[];this.desks=[];this.pairs=[];this.groups=[];this.t=0;}
 // Where someone sits on chair `id`: the hip point over the seat, facing the board (+z)
 seatSpot(id,h=1){
  const b=this.ctx.schoolBuilding?.(),s=this.ctx.site(),c=b?.seats?.find(q=>q.id===id);if(!c)return null;
  return {x:s.x+c.x,y:s.y+.55+(h-1)*.45,z:s.z+c.z+.13,yaw:0,out:{x:s.x+c.x+.62,z:s.z+c.z}};
 }
 seat(n,id,act='write',turn=0){const spot=this.seatSpot(id,n.rig?.height??1);return !!(spot&&n.sitOn?.(spot,act,turn));}
 spawn(){
  this.clear();
  const b=this.ctx.schoolBuilding?.(),s=this.ctx.site();if(!b?.seats||!s)return;
  const taken=new Set([...EMPTY,...Object.values(CAST_SEATS)]);
  const add=(i,x,z)=>{const n=this.ctx.npcs.spawn({id:'lh2:class:'+i,name:FIRST[i%FIRST.length],role:'local',seed:900+i*7,x,z,age:14+(i%3===0?1:0)});this.list.push(n);return n;};
  let i=0;
  for(const c of b.seats){
   if(taken.has(c.id))continue;
   const n=add(i,s.x+c.x,s.z+c.z);
   const d={n,id:c.id,act:SOLO[Math.floor(hash(i)*SOLO.length)],next:4+hash(i+40)*14,raise:0};
   this.desks.push(d);this.seat(n,c.id,d.act);i++;
  }
  // neighbours in the same row (next column over, both present) whisper to each other
  const at=id=>this.desks.find(d=>d.id===id);
  for(const [a,b2] of [['r0c0','r0c1'],['r2c2','r2c3'],['r3c1','r3c2']]){
   const A=at(a),B=at(b2);if(!A||!B)continue;
   A.act=B.act='chat';A.pair=B.pair=true;this.seat(A.n,A.id,'chat',.9);this.seat(B.n,B.id,'chat',-.9);
   this.pairs.push({a:A,b:B,turn:0,t:0});
  }
  for(const [gx,gz,count] of GROUPS){
   const g={members:[],t:1+hash(gx)*2,speaker:-1};
   for(let k=0;k<count;k++){
    const a=k/count*Math.PI*2+hash(gz+k),x=s.x+gx+Math.sin(a)*.85,z=s.z+gz+Math.cos(a)*.85;
    const n=add(i++,x,z);n.lookAt?.({x:s.x+gx,z:s.z+gz});g.members.push(n);
   }
   this.groups.push(g);
  }
 }
 clear(){for(const n of this.list)this.ctx.npcs.remove(n);this.list=[];this.desks=[];this.pairs=[];this.groups=[];this.teacher=null;}
 // quiet: a story scene is playing in the room, so whispering stops and heads come up
 update(dt,quiet=false){
  if(!this.list.length)return;
  this.t+=dt;
  // Orin teaches in bursts between pauses while the class works (his own scene lines drive him when one plays)
  const T=this.teacher;
  if(T&&!quiet&&(this.lecture=(this.lecture??3)-dt)<=0){const secs=3+Math.random()*5;T.talkFor?.(secs);this.lecture=secs+2+Math.random()*6;}
  for(const d of this.desks){
   if(d.pair&&!quiet)continue;
   if(d.raise>0&&(d.raise-=dt)<=0)d.n.act=d.act;
   if((d.next-=dt)>0)continue;
   d.next=6+Math.random()*14;
   const r=Math.random();
   if(quiet){d.n.act=r<.6?'listen':'write';d.n.turn=0;continue;}
   if(d.pair)continue;
   if(r<.07){d.n.act='raise';d.raise=2.5+Math.random()*2;}       // a question, then the hand goes down again
   else {d.act=r<.45?'write':r<.65?'read':r<.88?'listen':'lean';d.n.act=d.act;}
  }
  for(const P of this.pairs){
   if(quiet){P.a.n.talkUntil=P.b.n.talkUntil=0;continue;}
   if(P.a.n.act!=='chat'){P.a.n.act=P.b.n.act='chat';P.a.n.turn=.9;P.b.n.turn=-.9;}
   if((P.t-=dt)>0)continue;
   // take turns, with the odd pause where both look back at their work
   if(Math.random()<.25){P.t=3+Math.random()*4;P.a.n.act=P.b.n.act='write';continue;}
   P.turn^=1;const who=P.turn?P.a.n:P.b.n,secs=1.6+Math.random()*2.6;who.talkFor?.(secs);P.t=secs+.3;
  }
  for(const g of this.groups){
   if((g.t-=dt)>0)continue;
   let k;do k=Math.floor(Math.random()*g.members.length);while(g.members.length>1&&k===g.speaker);
   g.speaker=k;const who=g.members[k],secs=1.8+Math.random()*3.2;who.talkFor?.(secs);
   for(const n of g.members)if(n!==who&&Math.random()<.8)n.lookAt?.(who.pos);
   g.t=secs+(Math.random()<.3?1.5:.4);
  }
 }
}
