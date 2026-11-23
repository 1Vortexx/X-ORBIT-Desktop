import * as THREE from "three";
import { heightAt, surfaceAt } from "../world/terrain.js";
import { circleFree, resolveCircle } from "../core/collide.js";
import { addTarget, removeTarget } from "../core/targets.js";
import { emit, sfx } from "../core/bus.js";
import { buildPerson, pose, animate, animateFace, walkSpeed } from "./model.js";
import { cycleLength } from "./pose.js";
import { planDetour } from "./path.js";
export { HITCH_RULES } from "./hitch.js";

export async function prepare(report = () => {}) { report(1, "Roadside travellers ready"); }
const names = ["Mara","Wes","Sam","Jo","Rosa","Eli","Val","Jess","Ruth","Dev","Avery","Kit"];
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
const GRAVITY = 9.8, GET_UP = 3.2;      // seconds lying there before someone who was only knocked down gets up
class Npc {
  constructor(manager, spec) {
    this.manager=manager;
    const {id,role,seed=1,x=0,z=0,yaw=0} = spec;
    Object.assign(this,{id,role,seed,yaw,state:"idle",health:100,seat:null,hostile:false,arrived:true});
    this.name = spec.name || names[(seed>>>0)%names.length];
    this.pos = new THREE.Vector3(x,heightAt(x,z),z);
    this.rig = buildPerson(seed,role,{age:spec.age});
    this.age = this.rig.age; this.gait = 0; this.moved = 0;
    this.mesh = this.rig.mesh;
    this.mesh.name = id;
    manager.root.add(this.mesh);
    this.phase = (seed>>>0)%31;
    this.senseIn = (seed>>>0)%13/60;
    this.stepDistance = this.animAge = 0;
    this.sync();
  }
  around(p=this.pos) {
    return (this.manager.getColliders(p.x,p.z,4)||[]).filter(c=>c.npc!==this);
  }
  idle() { this.order=null; this.arrived=true; if(!this.seat && !this.perch && this.state!=="down") this.state="idle"; }
  lookAt(p) { if(p && this.state!=="sit") this.yaw=Math.atan2(p.x-this.pos.x,p.z-this.pos.z); }
  walkTo(x,z,{run=false,arrive=.24}={}) {
    if(this.seat || this.state==="down") return;
    if(this.perch) this.standAt(this.perch.out||this.pos);
    this.order={x,z,run,keep:arrive}; this.arrived=false; this.state="walk"; this.newRoute();
  }
  follow(getPos,{run=true,keep=1.5}={}) {
    if(this.seat || this.state==="down") return;
    this.order={getPos,run,keep}; this.arrived=false; this.state="pursue";
  }
  flee(from) {
    const dx=this.pos.x-from.x,dz=this.pos.z-from.z,len=Math.hypot(dx,dz)||1;
    this.walkTo(this.pos.x+30*(dx||.1)/len,this.pos.z+30*dz/len,{run:true});
    if(this.order) this.state="flee";
  }
  threaten(on=true) {
    if(this.state==="down"||this.seat) return;
    if(on && this.state!=="threaten") sfx("threat",{pos:this.pos});
    this.idle(); this.hostile=on; this.state=on?"threaten":"idle";
  }
  strike() {
    if(this.striking) return this.striking.promise;
    this.state="strike";
    let finish;
    const promise=new Promise(resolve=>{finish=resolve;});
    this.striking={time:.25,finish,promise};
    return promise;
  }
  // Take dmg health. At zero they drop where they are (out of any seat) and stop being a threat. true = put down now.
  wound(dmg) {
    if(this.state==="down") return false;
    this.health=Math.max(0,this.health-dmg);
    if(this.health>0) return false;
    if(this.seat) { const v=this.manager.getVehicle(this.seat.vehicle); if(v) this.releaseClaim(v); else this.seat=null; this.standAt(this.pos); }
    this.state="down"; this.order=null; this.hostile=false; this.setTarget(null);
    return true;
  }
  setTarget(def) {
    removeTarget(this.mesh);
    if(def) addTarget(this.mesh,{id:this.id,reach:3,...def});
  }
  say(text,ms=4500) { emit("npc:say",{npc:this,name:this.name,text,ms}); sfx("npc_talk",{pos:this.pos}); this.talkFor(ms/1000); }
  // The mouth moves for this long (campaign scenes call it for each line)
  talkFor(secs) { this.talkUntil=(this.animT||0)+secs; }

  // ── physics: thrown by a car, tumbling, bouncing, sliding to a stop, then (if it was only a knock) getting up ──
  knock(vx,vy,vz) {
    if(this.seat) return;
    this.fly={v:new THREE.Vector3(vx,vy,vz),spin:new THREE.Vector3((Math.random()-.5)*14,0,(Math.random()-.5)*14),rest:0,ground:false};
    this.order=null; this.state="down"; this.arrived=true;
  }
  // A slow bump: a step or two backwards, still on their feet
  shove(vx,vz) {
    if(this.seat || this.state==="down") return;
    this.push={x:vx,z:vz,t:.35};
  }
  flyUpdate(dt) {
    const f=this.fly, v=f.v;
    v.y-=GRAVITY*dt;
    const p={x:this.pos.x+v.x*dt,z:this.pos.z+v.z*dt};
    const col=this.around(p), ground=heightAt(p.x,p.z);
    let y=this.pos.y+v.y*dt;
    if(resolveCircle(p,.3,col,Math.max(y,ground)+.12,Math.max(y,ground)+1.2)) { v.x*=-.35; v.z*=-.35; sfx("npc_step",{pos:this.pos}); }
    if(y<=ground) {
      y=ground;
      if(v.y<-2.2) { v.y=-v.y*.32; v.x*=.62; v.z*=.62; f.spin.multiplyScalar(.6); sfx("npc_step",{pos:this.pos,surface:surfaceAt(p.x,p.z)}); }
      else { v.y=0; f.ground=true; }
    }
    if(f.ground) {                         // sliding along the ground
      const k=Math.max(0,1-5*dt); v.x*=k; v.z*=k; f.spin.multiplyScalar(Math.max(0,1-6*dt));
    }
    this.pos.set(p.x,y,p.z);
    // tumble about the middle of the body, limbs flailing
    const r=this.mesh.rotation;
    if(!f.ground) { r.x+=f.spin.x*dt; r.z+=f.spin.z*dt; }
    else { r.x+=(-Math.PI/2-r.x)*Math.min(1,8*dt); r.z+=(0-r.z)*Math.min(1,8*dt); }
    const rig=this.rig, fl=f.ground?0:1, t=this.animT*9;
    rig.body.rotation.x=0; rig.body.position.y=-.9;
    for(let i=0;i<2;i++) {
      rig.arms[i].rotation.z=(i?-1:1)*(1.1+.5*Math.sin(t+i))*fl+(i?-1:1)*.4*(1-fl);
      rig.arms[i].rotation.x=(Math.sin(t*1.3+i*2)*1.2)*fl;
      rig.legs[i].rotation.x=(Math.sin(t*1.1+i*3)*.8)*fl;
      rig.knees[i].rotation.x=(.4+.4*Math.sin(t+i))*fl;
    }
    if(f.ground && Math.hypot(v.x,v.z)<.25 && (f.rest+=dt)>.4) {
      // come to rest: lying flat in the ordinary "down" pose
      this.fly=null; r.x=0; r.z=0;
      pose(this.rig,"down",this.phase,false,this.role);
      this.downFor=0;
    }
  }
  enterVehicle(v,seat) {
    if(this.seat||this.state==="down"||Math.abs(v.speed)>=1||!v.claimSeat(seat,this.id)) return false;
    this.seat={vehicle:v.id,seat}; this.state="enter"; this.order=null; this.arrived=false;
    this.doorAge=0; this.boardPath=null;
    return true;
  }
  releaseClaim(v) {
    if(this.seat && v?.seatOf(this.id)===this.seat.seat) v.releaseSeat(this.seat.seat);
    this.seat=null;
  }
  // Sit on furniture (not a vehicle). spot = {x,y,z,yaw}: the hip point and facing; out = where to stand up to.
  // act is what they do there: "write" | "read" | "listen" | "chat" | "lean" | "raise" (see pose.js); turn for "chat".
  sitOn(spot,act="listen",turn=0) {
    if(this.seat || this.state==="down" || this.fly) return false;
    this.manager.root.add(this.mesh);
    this.perch={...spot}; this.act=act; this.turn=turn;
    this.order=null; this.push=null; this.state="sit"; this.arrived=true;
    this.pos.set(spot.x,spot.y,spot.z); this.yaw=spot.yaw||0; this.sync();
    return true;
  }
  standAt(p) {
    this.perch=null;
    this.manager.root.add(this.mesh);
    this.pos.set(p.x,heightAt(p.x,p.z),p.z);
    this.order=null; this.state="idle"; this.arrived=true; this.sync();
  }
  exitVehicle() {
    if(!this.seat) return false;
    const v=this.manager.getVehicle(this.seat.vehicle);
    if(!v||Math.abs(v.speed)>=1) return false;
    const seat=this.seat.seat, spot=v.doorSpot(seat);
    const choices=[spot,...v.exitSpots()];
    for(const base of [...choices]) {
      const dx=base.x-v.pos.x,dz=base.z-v.pos.z;
      choices.push({x:base.x+dx*.65,z:base.z+dz*.65});
    }
    const p=choices.find(q=>{
      const y=heightAt(q.x,q.z); return circleFree(q.x,q.z,.26,this.around(q),y+.12,y+1.6);
    });
    if(!p) return false;
    const door=v.def.seats[seat].door;
    v.setDoor(door,true); this.releaseClaim(v); this.standAt(p);
    this.closing={v,door,time:.5};
    emit("npc:exited",{npc:this}); return true;
  }
  newRoute() { this.detour=null; this.bestD=Infinity; this.stuckT=0; }
  move(dt,dest,keep,run) {
    // A player can park across a waiting person or restore a car overlapping them.
    // Resolve the existing penetration first so bounded walking steps work from there.
    const col=this.around();
    if(resolveCircle(this.pos,.26,col,this.pos.y+.12,this.pos.y+1.6)) this.pos.y=heightAt(this.pos.x,this.pos.z);
    const dist=distance(dest,this.pos);
    if(dist<=keep+.03) { this.detour=null; return true; }
    // on a detour round something: head for its next corner instead of straight at the destination
    let goal=dest;
    if(this.detour?.length) { if(distance(this.detour[0],this.pos)<.45) this.detour.shift(); if(this.detour.length) goal=this.detour[0]; }
    this.lookAt(goal);
    // pace from who they are: age, injuries (see model.js walkSpeed)
    const step=Math.min(dist-keep,goal===dest?Infinity:distance(goal,this.pos)+.05,walkSpeed(this.rig,this.health,run)*dt);
    const old=this.pos.clone();
    // Try increasingly wide arcs around a blocked route, preserving the actual collision boundary.
    let moved=false;
    for(const turn of [0,.65,-.65,1.38,-1.38]) {
      const yaw=this.yaw+turn, p={x:old.x+Math.sin(yaw)*step,z:old.z+Math.cos(yaw)*step};
      const y=heightAt(p.x,p.z);
      resolveCircle(p,.26,col,y+.12,y+1.6);
      if(distance(p,old)<step*.5 || distance(p,old)>step+.08) continue;
      this.pos.set(p.x,heightAt(p.x,p.z),p.z); this.yaw=yaw; moved=true; break;
    }
    // stuck (no real progress for a while): plan a way round, a few people a frame at most
    const now=distance(dest,this.pos);
    if(now<(this.bestD??Infinity)-.25) { this.bestD=now; this.stuckT=0; } else this.stuckT=(this.stuckT||0)+dt;
    if(this.stuckT>.9 && this.manager.planBudget>0 && (this.animT||0)>=(this.nextPlan||0)) {
      this.manager.planBudget--; this.nextPlan=(this.animT||0)+2.5; this.stuckT=0; this.bestD=now;
      this.detour=planDetour(this.pos,dest,(x,z,r)=>(this.manager.getColliders(x,z,r)||[]).filter(c=>!c.npc));
    }
    if(moved) {
      const travel=distance(this.pos,old);
      this.moved+=travel; this.stepDistance+=travel;
      this.phase+=2*Math.PI*travel/cycleLength(Math.max(.5,this.gait));    // the feet keep to the ground covered
      if(this.stepDistance>.8) { this.stepDistance=0; sfx("npc_step",{pos:this.pos,surface:surfaceAt(this.pos.x,this.pos.z)}); }
    }
    return false;
  }
  attach(v) {
    const seat=this.seat.seat;
    v.mesh.add(this.mesh);
    this.mesh.position.fromArray(v.def.seats[seat].pos);
    this.mesh.rotation.set(0,0,0);
    v.seatPos(seat,this.pos);
    this.state="sit"; this.arrived=true;
    pose(this.rig,this.state,this.phase,false,this.role);
  }
  vehicleUpdate(dt) {
    const v=this.manager.getVehicle(this.seat.vehicle);
    if(!v) return; // An unloaded seat and its claim survive until the car streams in.
    const seat=this.seat.seat;
    if(v.seatOf(this.id)!==seat && !v.claimSeat(seat,this.id)) {
      this.seat=null;
      const spot=v.doorSpot(seat), y=heightAt(spot.x,spot.z);
      resolveCircle(spot,.27,this.around(spot),y+.12,y+1.6);
      this.standAt(spot); return;
    }
    if(this.state==="enter") {
      if(Math.abs(v.speed)>=1) {
        v.setDoor(v.def.seats[seat].door,false);
        this.releaseClaim(v); this.standAt(this.pos); return;
      }
      const doorSpot=v.doorSpot(seat);
      if(!this.boardPath) {
        this.boardPath=[];
        // When the door is on the far side, walk around the nearest bumper.
        const dx=this.pos.x-v.pos.x, dz=this.pos.z-v.pos.z;
        const localX=dx*Math.cos(v.yaw)-dz*Math.sin(v.yaw);
        const localZ=dx*Math.sin(v.yaw)+dz*Math.cos(v.yaw);
        const side=Math.sign(v.def.seats[seat].pos[0]);
        if(localX*side<0) {
          const z=localZ>(v.def.zFront+v.def.zRear)/2 ? v.def.zFront+1 : v.def.zRear-1;
          for(const s of [-side,side]) this.boardPath.push(v.localToWorld(s*(v.def.halfW+.9),0,z));
        }
      }
      const next=this.boardPath[0];
      if(next) { if(this.move(dt,next,.22,false)) this.boardPath.shift(); return; }
      if(!this.move(dt,doorSpot,.48,false)) return;
      const door=v.def.seats[seat].door;
      v.setDoor(door,true); this.doorAge=(this.doorAge||0)+dt;
      if(this.doorAge<.35) return;
      this.attach(v); v.setDoor(door,false); emit("npc:seated",{npc:this});
    } else {
      if(this.mesh.parent!==v.mesh) this.attach(v);
      else v.seatPos(seat,this.pos);
    }
  }
  dodgeCar(v) {
    if(!v || Math.abs(v.speed)<3) return false;
    const dx=this.pos.x-v.pos.x, dz=this.pos.z-v.pos.z;
    const vx=v.vel.x, vz=v.vel.z, speed2=vx*vx+vz*vz;
    if(speed2<9) return false;
    const t=(dx*vx+dz*vz)/speed2;
    if(t<=0 || t>.85 || Math.hypot(dx-vx*t,dz-vz*t)>v.def.halfW+.6) return false;
    const speed=Math.sqrt(speed2), side=dx*vz-dz*vx>=0?1:-1;
    this.walkTo(this.pos.x+side*vz*2.6/speed,this.pos.z-side*vx*2.6/speed,{run:true});
    return true;
  }
  sync() {
    if(this.mesh.parent===this.manager.root) {
      this.mesh.position.copy(this.pos); this.mesh.rotation.y=this.yaw;
      if(this.fly) this.mesh.position.y+=.9;          // tumbling turns about the hips, not the feet
    }
  }
  update(dt,frame) {
    this.animT=(this.animT||0)+dt;
    if(this.fly) { this.flyUpdate(dt); this.sync(); return; }
    if(this.closing && (this.closing.time-=dt)<=0) { this.closing.v.setDoor(this.closing.door,false); this.closing=null; }
    if(this.striking && (this.striking.time-=dt)<=0) { this.striking.finish(); this.striking=null; this.state=this.seat?"sit":"idle"; }
    if(this.seat) this.vehicleUpdate(dt);
    else if(this.perch) { /* sitting on furniture: stays put */ }
    else if(this.state!=="down") {
      // Distant stationary people need fewer collision queries. Keep full rates for combat and moving orders.
      const nearPlayer=frame.playerPos && distance(this.pos,frame.playerPos)<35;
      this.senseIn-=dt;
      const sense=nearPlayer || !!this.order || this.senseIn<=0;
      if(sense) this.senseIn=.17;
      const nearby=sense ? this.around() : [];
      const hit=nearby.find(c=>c.vehicle && Math.abs(c.vehicle.speed)>3 && !circleFree(this.pos.x,this.pos.z,.25,[c],this.pos.y+.12,this.pos.y+1.6));
      if(hit) {
        const speed=Math.abs(hit.vehicle.speed), cv=hit.vehicle.vel||{x:0,z:0};
        this.health=Math.max(0,this.health-speed*4);
        // thrown along with the car and a little away from its centreline, up into the air
        const dx=this.pos.x-hit.vehicle.pos.x, dz=this.pos.z-hit.vehicle.pos.z, dl=Math.hypot(dx,dz)||1;
        const k=.85, side=Math.min(4,speed*.25);
        this.knock(cv.x*k+dx/dl*side, 1.5+speed*.28, cv.z*k+dz/dl*side);
        this.yaw=Math.atan2(-cv.x,-cv.z);
        emit("npc:hit",{npc:this,speed,vehicle:hit.vehicle});
      } else if(this.push) {
        const pu=this.push, step={x:this.pos.x+pu.x*dt,z:this.pos.z+pu.z*dt};
        resolveCircle(step,.26,nearby,this.pos.y+.12,this.pos.y+1.6);
        this.pos.set(step.x,heightAt(step.x,step.z),step.z);
        if((pu.t-=dt)<=0) this.push=null;
      } else if(this.order) {
        const o=this.order,dest=o.getPos?o.getPos():o;
        if(dest && this.move(dt,dest,o.keep,o.run)) {
          if(!this.arrived) emit("npc:arrived",{npc:this});
          this.arrived=true;
          if(!o.getPos) this.idle();
        } else this.arrived=false;
      } else if(this.state==="idle") {
        // a car creeping into someone moves them out of the way; a fast one coming at them makes them jump clear
        const bump=nearby.find(c=>c.vehicle && Math.abs(c.vehicle.speed)>.4 && !circleFree(this.pos.x,this.pos.z,.3,[c],this.pos.y+.12,this.pos.y+1.6));
        if(bump) { const bv=bump.vehicle.vel||{x:0,z:0}; this.shove(bv.x*1.4,bv.z*1.4); }
        else if(nearby.some(c=>this.dodgeCar(c.vehicle))) this.state="walk";
      }
    }
    if(this.state==="down" && !this.seat && this.downFor!==undefined && this.health>=25 && !this.hostile && (this.downFor+=dt)>GET_UP) {
      this.downFor=undefined; this.state="idle"; this.idle();
      emit("npc:up",{npc:this});
    }
    this.sync();
    this.rig.armed=this.hostile;
    const dist=frame.playerPos?distance(this.pos,frame.playerPos):0,seen=frame.viewPos?distance(this.pos,frame.viewPos):dist;
    this.animAge+=dt;
    // how fast they're really going over the ground (smoothed), for the gait
    const measured=dt>0?this.moved/dt:0; this.moved=0;
    this.gait+=(measured-this.gait)*Math.min(1,dt*8);
    const talking=this.animT<(this.talkUntil||0);
    if(seen<30 && this.state!=="down") animateFace(this.rig,this.animT,talking);
    if(this.animAge>=(seen>100?.22:frame.lite?.06:0)) {
      if(this.perch) animate(this.rig,{dt:this.animAge,mode:"sit",chair:true,recline:0.05,act:this.act,turn:this.turn,talk:talking});
      else if(this.seat || this.state==="sit") pose(this.rig,"sit",0,false,this.role);
      else {
        // a glance at the player when they come close
        let lookYaw=0;
        if(frame.playerPos && dist<7 && this.state!=="down") { lookYaw=Math.atan2(frame.playerPos.x-this.pos.x,frame.playerPos.z-this.pos.z)-this.yaw; lookYaw=Math.atan2(Math.sin(lookYaw),Math.cos(lookYaw)); if(Math.abs(lookYaw)>1.9) lookYaw=0; }
        animate(this.rig,{dt:this.animAge,mode:this.state==="down"?"down":"stand",speed:this.gait<.12?0:this.gait,phase:this.phase,health:this.health,
          talk:talking||this.state==="talk",threat:this.state==="threaten",armed:this.hostile,strike:this.striking?1-Math.max(0,this.striking.time)/.25:-1,
          hitch:this.role==="hitchhiker"&&this.state==="idle"&&!this.order?-1:0,lean:this.lean&&!this.order&&this.gait<.12,lookYaw:this.lean?0:lookYaw});
      }
      this.animAge=0;
    }
  }
  serialize() {
    return {id:this.id,name:this.name,role:this.role,seed:this.seed,pos:this.pos.toArray(),yaw:this.yaw,
      state:this.perch?"idle":this.state,seat:this.seat&&{...this.seat},health:this.health,hostile:this.hostile,
      order:this.order && !this.order.getPos ? {...this.order} : null};
  }
  restore(r) {
    if(r.pos) this.pos.fromArray(r.pos);
    this.state=r.state==="strike"?"idle":r.state||"idle"; this.seat=r.seat&&{...r.seat};
    this.yaw=r.yaw??this.yaw; this.health=r.health??100; this.hostile=!!r.hostile;
    this.order=r.order&&{...r.order}; this.arrived=!this.order;
    if(this.state==="down") this.downFor=0;               // a knock that was saved still wears off
    this.sync(); return this;
  }
}
export class Npcs {
  constructor({root,getColliders=()=>[],getVehicle=()=>null}) {
    Object.assign(this,{root,getColliders,getVehicle,list:[],byId:new Map()});
  }
  get(id) { return this.byId.get(id)||null; }
  spawn(spec) {
    if(this.get(spec.id)) return this.get(spec.id);
    const n=new Npc(this,spec);
    this.byId.set(n.id,n); this.list.push(n); return n;
  }
  remove(n) {
    if(!n||!this.byId.delete(n.id)) return;
    this.list.splice(this.list.indexOf(n),1);
    n.setTarget(null); n.mesh.removeFromParent();
    if(n.closing) n.closing.v.setDoor(n.closing.door,false);
    if(n.striking) n.striking.finish();
  }
  update(dt,frame={}) { this.planBudget=3; for(const n of this.list) n.update(dt,frame); }
  colliders(x,z,r,out=[]) {
    for(const n of this.list) if(n.state!=="sit" && Math.hypot(n.pos.x-x,n.pos.z-z)<r+.3) {
      out.push({kind:"circle",r:.27,x:n.pos.x,z:n.pos.z,y0:n.pos.y,y1:n.pos.y+(n.state==="down"?.3:1.65),npc:n});
    }
    return out;
  }
  setQuality({lite}) { this.lite=lite; }
  clear() { for(const n of [...this.list]) this.remove(n); }
  dispose() { this.clear(); }
}
