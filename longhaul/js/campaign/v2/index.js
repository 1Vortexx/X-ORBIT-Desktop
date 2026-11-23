import { FilmPresentation } from './film.js';
import { SCENE_ENTRIES, openingShots, sceneDirection, OPENING_DURATION, OPENING_LOGO, OPENING_BYLINE, OPENING_DAWN, openingCredit } from './direction.js';
import { TIMES } from './lighting.js';
import { Crowd } from './crowd.js';
const smooth01=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
import { ease } from './cinematics.js';
import { SceneLighting } from './lighting.js';
import * as THREE from 'three';
import { emit } from '../../core/bus.js';
import { pathBlocked, resolveCircle } from '../../core/collide.js';
import { heightAt } from '../../world/terrain.js';
import { PrologueState } from './state.js';
import { PROLOGUE,NAMES } from './data.js';
import { PrologueWorld } from './sites.js';
import { ObjectHints } from './hints.js';
import { Cinematics } from './cinematics.js';
import { Traffic, TownLife } from './traffic.js';
import { OBJECTS } from './objects.js';
import { Classmates, CAST_SEATS } from './classmates.js';
const PLAYERS={P01:['GREVYN','TAY','TAYJ','RIPED','ORIN'],P02:['GREVYN','RIPED','VOSS','LIO','JESS'],P03:['GREVYN','RIPED'],P04:['TAY','TAYJ','VOSS']};
export class PrologueCampaign {
 constructor(ctx,data){this.ctx=ctx;this.data=data;this.active=false;this.people=[];this.hints=new ObjectHints();this.world=new PrologueWorld(ctx);this.lighting=new SceneLighting(ctx);this.cinema=new Cinematics(ctx.camera,(a,b)=>this.blocked(a,b));
  this.classmates=new Classmates({npcs:ctx.npcs,schoolBuilding:()=>this.world.schoolBuilding,site:()=>this.places?.school});}
 get playing(){return !!this.scene || !!this.opening || !!this.transition;}
 get inputLocked(){return this.playing;}
 get mission(){return this.data.missions.find(m=>m.id===this.st.mission);}
 bindPlaces(){this.world=new PrologueWorld(this.ctx);this.world.bind();this.places=this.world.sites;}
 begin(rec,{fresh}={}){
  this.st=new PrologueState(rec);this.active=true;this.world.doorStates=this.st.doors;this.world.onDoorChange=()=>this.checkpoint();this.world.build();this.lastMission=null;
  for(const [mid,list]of Object.entries(OBJECTS))for(const [id,site,x,z,label,text]of list){
   const key=mid+':'+id;const mesh=this.world.addObject(key,site,x,z,label,()=>this.inspect(id));
   mesh.userData.target.actions=()=>{
    if(this.playing||this.st?.mission!==mid)return [];
    const entry=SCENE_ENTRIES[this.st.queue[0]];
    if(entry)return entry.object===id&&!this.awaitingDoor?[{key:'use',label:entry.label,run:()=>this.enterQueuedScene(id)}]:[];
    return this.st.required.includes(id)&&!this.st.facts[mid+':'+id]?[{key:'use',label:'Inspect',run:()=>this.inspect(id)}]:[];
   };
  }
  this.residents=[];
  for(const site of [this.places.school,this.places.drywell])for(let i=0;i<6;i++) {
   const n=this.ctx.npcs.spawn({id:'lh2:resident:'+site.name+':'+i,name:['Avery','Rosa','Dev','Ruth','Sam','Jo'][i],role:'local',seed:710+i,x:site.x+[-78,-35,20,59,80,61][i],z:site.z+[-40,-46,-40,-46,-8,16][i],age:24+i*6});
   this.residents.push({n,home:{x:n.pos.x,z:n.pos.z},phase:i,index:i,site:site===this.places.school?'school':'drywell',leg:false});
  }
  this.townLife=new TownLife(this.ctx,[this.places.school,this.places.drywell]);this.crowd=new Crowd({...this.ctx,listener:()=>this.ctx.camera?.position,opening:()=>!!this.opening},[this.places.school,this.places.drywell]);this.traffic=new Traffic({...this.ctx,staticObstacles:()=>this.st.mission==='P04'?[{pos:this.places.bridge}]:[]},this.world.plan.z0);this.syncMission(!!fresh);
  if(fresh)this.ctx.teleport(this.places.school.x-25,this.places.school.z-58,0);
  this.oldTime=this.ctx.time();this.ctx.setTime(TIMES[this.st.mission]??.4167);
  this.film=new FilmPresentation();this.film.skip.onclick=()=>this.finishOpening(true);
  this.ui=document.createElement('section');this.ui.className='lh2-cinema';this.ui.setAttribute('aria-label','Campaign cutscene');this.ui.hidden=true;
  const title=document.createElement('div');title.className='lh2-scene-title';this.ui.append(title);this.sceneTitle=title;
  this.caption=document.createElement('p');this.caption.setAttribute('aria-live','polite');this.ui.append(this.caption);
  const next=document.createElement('button');next.textContent='Next line';next.onclick=()=>{this.lineSkip=true;};this.ui.append(next);
  const skip=document.createElement('button');skip.textContent='Skip scene';skip.onclick=()=>this.finishScene(true);this.ui.append(skip);document.body.append(this.ui);
  this.gate=this.world.entrance();
  this.world.batchBuildings();this.queueAge=0;this.grace=1.5;
  // the floating marker over the current objective: an amber chevron, bobbing. Solid where you can see it, and a
  // faint ghost of it through walls and buildings, so the way to go is never hidden (you can be inside the school
  // when the next thing is out in the courtyard)
  const coneG=new THREE.ConeGeometry(.2,.36,4).rotateX(Math.PI),ringG=new THREE.TorusGeometry(.17,.025,6,24).rotateX(Math.PI/2);
  this.marker=new THREE.Group();this.marker.visible=false;this.marker.name='Objective marker';
  for(const [mat,order] of [[new THREE.MeshBasicMaterial({color:0xf2aa2e,transparent:true,opacity:.95,fog:false}),0],
                            [new THREE.MeshBasicMaterial({color:0xffc861,transparent:true,opacity:.38,depthTest:false,depthWrite:false,fog:false}),999]]){
   const chev=new THREE.Mesh(coneG,mat),ring=new THREE.Mesh(ringG,mat);ring.position.y=.3;chev.renderOrder=ring.renderOrder=order;chev.frustumCulled=ring.frustumCulled=false;this.marker.add(chev,ring);
  }
  this.ctx.root.add(this.marker);
  if(!this.st.openingSeen&&this.st.mission==='P01'&&!this.st.seen['P01.A'])this.startOpening();
  else {
   if(this.st.transitionPending){const s=this.places[this.st.spec.site];this.ctx.teleport(s.x,s.z-15,0);this.st.transitionPending=false;this.film.show();this.film.opacity(1);this.handoff=1.1;}
   this.ctx.notify('The Way Back · '+this.st.year+'. J opens objectives.',{ms:5000});
  }
 }
 syncMission(fresh=false,staging=false){
  const mid=this.st.mission;
  if(this.world.bridgeBarrier){this.world.bridgeBarrier.parent.visible=mid==='P04';this.world.bridgeCollider.solid=mid==='P04';}
  if(this.lastMission===mid)return;
  if(this.lastMission&&!fresh&&!staging){if(!this.transition)this.beginTransition();return;}
  for(const n of this.people)this.ctx.npcs.remove(n);this.people=[];
  const site=this.places[this.st.spec.site];
  for(const [i,code] of PLAYERS[mid].entries()){
   const n=this.ctx.npcs.spawn({id:'lh2:'+code,name:NAMES[code],role:'walker',seed:400+i*17,x:site.x-5+i*2.3,z:site.z-2,age:mid==='P01'?(code==='ORIN'?51:15):code==='VOSS'?41:21});
   n.code=code;this.people.push(n);
  }
  if(mid==='P01')this.fillSchool();else this.classmates.clear();
  if(this.lastMission && !fresh){this.ctx.teleport(site.x,site.z-15,0);this.ctx.notify(mid+' · '+this.mission.title+' · '+this.st.year,{ms:6000});}
  if(mid==='P02'){
   const v=this.ctx.truck();if(v){v.place(site.x+12,site.z-40,0);v.parkingBrake=true;}
  }
  if(mid==='P04'){
   const v=this.ctx.truck();if(v){v.place(this.places.school.x+12,this.places.school.z-25,0);v.parkingBrake=true;}
  }
  this.lastMission=mid;this.hints.reset();
 }
 // P01 opens with Cal finding Room 9: the scene waits until he has opened its door (or is standing inside)
 get awaitingDoor(){return this.st?.mission==='P01'&&this.st.queue[0]==='P01.A'&&!this.st.facts['P01:door'];}
 watchDoor(){
  if(!this.awaitingDoor||this.playing)return;
  const b=this.world.schoolBuilding,s=this.places.school,p=this.ctx.player();if(!b||!p.onFoot)return;
  const lx=p.pos.x-s.x,lz=p.pos.z-s.z,inside=lx>-13&&lx<-2&&lz>-6&&lz<11;
  const opened=b.doors.some(d=>/:(history|foyer)$/.test(d.id)&&d.open&&Math.hypot(p.pos.x-d.origin.x,p.pos.z-d.origin.z)<3.2);
  if(!inside&&!opened)return;
  this.st.facts['P01:door']=true;this.hints.reset();this.checkpoint();
  this.ctx.notify('Room 9 · History. Sit at the window seat, the empty chair by the west window beside Grevyn.',{icon:'🪑',ms:7000});
 }
 // The marker floats over whatever the objective is now (the door plate, the seat, the next thing to look at),
 // turning slowly and bobbing, larger with distance so it stays findable; it steps aside in cutscenes and once
 // you are close enough to use the thing.
 objectiveMarker(dt){
  const m=this.marker;if(!m)return;
  const obj=!this.playing&&!this.st.ended&&this.currentObject(),p=this.ctx.player().pos;
  const show=!!obj&&obj.mesh.visible!==false&&obj.mesh.parent&&p.distanceTo(obj.pos)>2.2;
  m.visible=show;if(!show)return;
  this.markerT=(this.markerT||0)+dt;
  const d=p.distanceTo(obj.pos),k=Math.max(1,Math.min(5,d/9));
  m.position.set(obj.pos.x,obj.pos.y+.75+.35*k+Math.sin(this.markerT*2.4)*.08*k,obj.pos.z);
  m.scale.setScalar(k);m.rotation.y+=dt*1.6;
 }
 // Cal's own chair while a scene seats him (the player's body is drawn sitting there; see main updateBody)
 playerChair(){return this.calChair?{...this.calChair,talk:this.sceneAge<(this.calTalkUntil||0)}:null;}
 // Room 9 in session: the cast at their desks, Orin at the board, the rest of the class around them
 fillSchool(){
  this.classmates.spawn();
  for(const n of this.people){
   if(CAST_SEATS[n.code])this.classmates.seat(n,CAST_SEATS[n.code],n.code==='GREVYN'?'write':'listen');
   if(n.code==='ORIN'){this.frontOfClass(n);this.classmates.teacher=n;}
  }
 }
 frontOfClass(n){const s=this.places.school;n.standAt?.({x:s.x-6.2,z:s.z+9.7});n.yaw=Math.PI;n.sync?.();}
 inspect(id){
  if(!this.active||this.playing)return;
  if(this.st.queue.length){this.enterQueuedScene(id);return;}
  if(!this.st.required.includes(id))return;
  const entry=OBJECTS[this.st.mission].find(x=>x[0]===id),obj=this.world.objects.get(this.st.mission+':'+id),p=this.ctx.player();
  if(obj?.requiresMapDoor&&this.world.mapDoor?.amount<.8){this.ctx.notify('Open the map cabinet first.');return;}
  if(!obj||p.pos.distanceTo(obj.pos)>3.2||!this.visible(obj))return;
  if(['checkpoint1','checkpoint2','bridge','westroad'].includes(id)&&Math.abs(this.ctx.truck()?.speed||0)>1){this.ctx.notify('Park the pickup before inspecting.');return;}
  const commit=()=>{
   if(!this.st.inspect(id))return;
   this.st.evidence[this.st.mission+':'+id]={...this.st.evidence[this.st.mission+':'+id],title:entry[4],text:entry[5]};
   this.hints.reset();this.ctx.sfx('pickup');
   if(id==='blockade'){this.st.facts.gunshot=true;this.ctx.wound();}
   if(id==='extract'){this.st.evidence.treatment={year:2091,source:'Tay treatment card'};this.st.evidence.rescueRoute={year:2091,source:'TayJ radio and route log'};this.ctx.teleport(this.places.workshop.x,this.places.workshop.z-13,0);}
   this.st.advance();this.syncMission();this.checkpoint();
   if(this.st.ended)this.ctx.notify('Prologue complete · Chapter 1 is next in development. Explore the towns or save and return to the menu.',{ms:12000});
  };
  const choices=id==='sources'?[{id:'names',label:'The names of people arrested',detail:'Compare the two original accounts.'},{id:'date',label:'The date',detail:'Check the public and original dates again.'}]:[{id:'continue',label:id==='contract'?'Continue to service, 2091':'Continue'}];
  this.ctx.dialogue({speaker:entry[4],role:'The Way Back · '+this.st.year,lines:[entry[5]],choices,onChoose:answer=>{
   if(id==='sources'&&answer!=='names'){this.ctx.notify('The dates match. Compare whose names disappeared, then try again.');return;}commit();
  }});
 }
 checkpoint(){emit('campaign:checkpoint');}
 blocked(a,b){return pathBlocked(a.x,a.z,b.x,b.z,.25,this.world.solids,Math.min(a.y,b.y),Math.max(a.y,b.y));}
 visible(obj){const p=this.ctx.player().pos;return !pathBlocked(p.x,p.z,obj.pos.x,obj.pos.z,.02,this.world.solids,Math.min(p.y+1.66,obj.pos.y),Math.max(p.y+1.66,obj.pos.y));}
 beginTransition(){
  this.transition={time:this.sceneFinishing?.8:0,moved:false};this.st.transitionPending=true;this.ctx.releaseInput();this.ctx.stopVoice();this.ui.hidden=true;
  this.film.show();this.film.opacity(this.sceneFinishing?1:0);const entry=SCENE_ENTRIES[this.st.mission+'.A'];this.film.chapter(entry.year,entry.chapter,0);
 }
 updateTransition(dt){
  const tr=this.transition;tr.time+=dt;
  if(tr.time>=.8&&!tr.moved){this.syncMission(false,true);this.ctx.gameplayCamera?.();tr.moved=true;}
  const opacity=tr.time<.8?ease(tr.time/.8):tr.time<1.8?1:1-ease((tr.time-1.8)/1.2);
  this.film.opacity(opacity);const entry=SCENE_ENTRIES[this.st.mission+'.A'];this.film.chapter(entry.year,entry.chapter,opacity);
  if(tr.time>=3){this.transition=null;this.st.transitionPending=false;this.film.hide();this.ctx.releaseInput();this.grace=1.2;this.queueAge=0;this.checkpoint();}
 }
 startOpening(){
  this.savedLook=this.ctx.captureLook?.();this.opening=true;this.hold=0;this.film.show(true);this.ui.hidden=true;this.ctx.releaseInput();
  this.lighting.begin('P01');this.lighting.time=OPENING_DAWN.from;this.lighting.update();
  this.cinema.beginTrack(openingShots(this.places.school),{reduced:this.ctx.reducedMotion(),time:this.st.openingTime,entry:2});
  this.ctx.musicCue?.('opening',{at:this.st.openingTime,quiet:true});
  for(const r of this.residents){r.phase=0;this.walkResident(r);}
 }
 finishOpening(skipped=false){
  if(!this.opening)return;
  this.openingExit=true;this.cinema.leave();
 }
 completeOpening(){
  this.st.openingSeen=true;this.st.openingTime=OPENING_DURATION;this.opening=false;this.openingExit=false;
  this.cinema.end();this.lighting.end();this.ctx.stopCue?.('opening');
  const s=this.places.school;this.stagePlayer(s.x,s.z-16,0);
  this.film.opacity(1);this.film.root.hidden=false;this.handoff=1.1;
  this.ctx.snapCamera();this.ctx.releaseInput();this.grace=1.2;this.queueAge=0;this.checkpoint();
 }
 stagePlayer(x,z,yaw=0){(this.ctx.stagePlayer||this.ctx.teleport)(x,z,yaw);}
 walkResident(r){
  const s=this.places.school;
  // Pedestrian paths lie along open sidewalks, clear of house footprints and lampposts.
  const routes=[[-78,-40,-34,-40],[-35,-46,-77,-46],[20,-40,58,-40],[59,-46,21,-46],[80,-8,80,13],[61,16,61,-7]];
  const a=routes[r.index%routes.length],home=r.site==='school'?s:this.places.drywell;
  const to=r.leg?a.slice(0,2):a.slice(2);r.leg=!r.leg;
  r.n.walkTo?.(home.x+to[0],home.z+to[1],{arrive:.35});
 }
 enterQueuedScene(object){
  if(this.playing||this.grace>0)return false;
  const id=this.st.queue[0],entry=SCENE_ENTRIES[id];if(!entry||entry.object!==object||this.awaitingDoor)return false;
  const obj=this.world.objects.get(object==='classroom'?'classroom':this.st.mission+':'+object),p=this.ctx.player();
  if(!obj||!p.onFoot||p.pos.distanceTo(obj.pos)>3.2||!this.visible(obj))return false;
  this.startScene(id);return true;
 }
 sceneSite(id){return this.places[id==='P04.A'?'bridge':id==='P04.C'?'workshop':this.st.spec.site];}
 startScene(id){
  if(this.opening)return;
  const scene=this.data.missions.flatMap(m=>m.scenes).find(s=>s.id===id);if(!scene)return;
  if(id==='P01.B'||id==='P01.C')this.st.year=2086;
  this.savedLook=this.ctx.captureLook?.();this.scene=scene;this.line=-1;this.remaining=0;this.hold=0;this.lineSkip=false;this.sceneAge=0;
  this.ctx.releaseInput();this.film.show();this.film.opacity(1);this.ui.hidden=true;
  const entry=SCENE_ENTRIES[id];this.sceneTitle.textContent=entry.chapter;
  this.film.chapter(entry.year,entry.chapter,1);
  this.lighting.begin(this.st.mission);
  // Blocking is staged only while the image is black, never as a visible teleport.
  const site=this.sceneSite(id);this.world.openSceneDoors(id,site);const d=sceneDirection(id,site);this.direction=d;this.walkPath=[...d.walk];
  this.stagePlayer(d.cal.x,d.cal.z,0);
  const chair=d.calSeat&&this.classmates.seatSpot(d.calSeat);this.calChair=chair?{...chair,act:'chat',turn:.9}:null;this.calTalkUntil=0;
  if(id==='P01.A')this.st.facts['P01:seat']=true;       // sitting down at the window seat is the seat step
  for(const n of [...this.people])if(!d.people[n.code]){this.ctx.npcs.remove(n);this.people=this.people.filter(p=>p!==n);}
  for(const [code,mark]of Object.entries(d.people)){
   let n=this.people.find(n=>n.code===code);
   if(!n){const i=Math.max(0,PLAYERS[this.st.mission].indexOf(code));n=this.ctx.npcs.spawn({id:'lh2:'+code,name:NAMES[code],role:'walker',seed:400+i*17,x:mark.x,z:mark.z,age:this.st.mission==='P01'?(code==='ORIN'?51:15):code==='VOSS'?41:21});n.code=code;this.people.push(n);}
   if(n.standAt)n.standAt(mark);else n.pos.set(mark.x,heightAt(mark.x,mark.z),mark.z);
   n.lookAt?.(this.ctx.player().pos);
   if(d.sit?.[code])this.classmates.seat(n,d.sit[code],'chat',-.9);    // seated cast turn toward Cal at the window
  }
  const shots=[...d.shots];
  if(d.walk.length&&!this.ctx.reducedMotion()){
   const follow=()=>{const p=this.ctx.player().pos;return {position:[p.x+.6,p.y+1.85,p.z-2.5],target:[p.x,p.y+1.25,p.z+.5],fov:49};};
   shots.unshift({duration:19,from:follow,to:follow});
  }
  this.cinema.beginTrack(shots,{reduced:this.ctx.reducedMotion(),entry:1.6});
 }
 finishScene(skipped=false){
  if(!this.scene)return;
  this.ctx.stopVoice();this.sceneSkip=skipped;this.cinema.leave();this.ui.hidden=true;
 }
 completeScene(){
  const scene=this.scene,id=scene.id;this.sceneFinishing=true;this.cinema.end();
  if(this.savedLook)this.ctx.restoreLook?.(this.savedLook);this.ctx.snapCamera();this.ctx.releaseInput();
  this.lighting.end();this.ui.hidden=true;
  if(this.sceneSkip)this.ctx.notify(scene.title+' · '+this.mission.steps[this.st.stage][1],{ms:6500});
  this.st.finishScene(id);this.scene=null;this.calChair=null;this.st.advance();this.syncMission();this.sceneFinishing=false;this.caption.textContent='';
  this.film.opacity(1);this.handoff=this.transition?0:1.1;this.grace=1.2;this.queueAge=0;this.sceneSkip=false;this.checkpoint();
 }
 update(dt,{skip=false,holdSkip=false}={}){
  if(!this.active)return;
  this.world.update(dt);
  this.syncMission();
  this.classmates.update(dt,!!this.scene);
  this.watchDoor();
  this.objectiveMarker(dt);
  for(const [key,obj]of this.world.objects){
   const local=key.split(':')[1],entry=SCENE_ENTRIES[this.st.queue[0]],wanted=this.st.required.includes(local)||entry?.object===local;
   obj.mesh.visible=key==='classroom'?this.st.mission==='P01':key.startsWith(this.st.mission+':')&&wanted&&(!obj.requiresMapDoor||this.world.mapDoor?.amount>.8);
  }
  this.traffic.update(dt,this.playing);
  this.townLife.update(dt,!!this.scene);
  this.crowd.update(dt,{paused:!!this.scene,school:this.st.mission==='P01'});
  for(const r of this.residents||[]){
   r.phase+=dt;
   if((this.opening||!this.playing)&&(r.n.arrived||r.phase>22)){r.phase=0;this.walkResident(r);}
  }
  this.grace=Math.max(0,(this.grace||0)-dt);
  if(this.transition){this.updateTransition(dt);return;}
  if(this.handoff>0){this.handoff=Math.max(0,this.handoff-dt);this.film.opacity(ease(this.handoff/1.1));if(!this.handoff)this.film.hide();}
  if(this.opening){
   this.lighting.time=OPENING_DAWN.from+(OPENING_DAWN.to-OPENING_DAWN.from)*Math.min(1,this.cinema.time/OPENING_DURATION);this.lighting.update();
   // follow the music: the logo has to land on the drop even if the track started late or stuttered
   const heard=this.ctx.cueTime?.('opening');
   if(heard>.3&&!this.openingExit){const off=heard-this.cinema.time;if(Math.abs(off)>4)this.cinema.time=heard;else if(Math.abs(off)>.04)this.cinema.time+=off*Math.min(1,dt*1.5);}
   this.st.openingTime=Math.min(OPENING_DURATION,this.cinema.time);
   this.hold=holdSkip?this.hold+dt:0;if(this.hold>=.6||this.cinema.time>=OPENING_DURATION)this.finishOpening();
   const t=this.cinema.time,c=openingCredit(t);
   this.film.creditText(c?.role||'',c?.credit||'',c?.opacity||0);
   const L=OPENING_LOGO,away=smooth01((t-L.away)/(L.out-L.away));
   this.film.logo(smooth01((t-L.in)/(L.full-L.in))*(1-away),away);
   const B=OPENING_BYLINE;this.film.byline(B.text,smooth01((t-B.in)/(B.full-B.in))*(1-smooth01((t-B.out)/(B.gone-B.out))));
   if(this.cinema.done)this.completeOpening();return;
  }
  if(this.scene){
   this.lighting.update();this.sceneAge+=dt;
   this.hold=holdSkip?this.hold+dt:0;if(this.hold>=.6)this.finishScene(true);
   if(this.cinema.done){this.completeScene();return;}
   if(this.cinema.exiting)return;
   this.film.chapter(SCENE_ENTRIES[this.scene.id].year,SCENE_ENTRIES[this.scene.id].chapter,1-ease((this.sceneAge-1.7)/1));
   if(this.sceneAge<2.8)return;
   this.ui.hidden=false;
   if(this.walkPath.length&&this.ctx.player().onFoot){
    const p=this.ctx.player().pos,to=this.walkPath[0],dx=to.x-p.x,dz=to.z-p.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*1.1);
    if(d<.2)this.walkPath.shift();else {const next={x:p.x+dx/d*step,z:p.z+dz/d*step};resolveCircle(next,.32,this.world.solids,p.y,p.y+1.8);this.ctx.move(next.x,next.z,dt);this.ctx.face?.(Math.atan2(dx,dz));}
   }
   this.remaining-=dt;
   if((skip||this.lineSkip)&&this.line>=0){this.remaining=0;this.ctx.stopVoice();this.lineSkip=false;}
   if(this.remaining<=0&&!this.ctx.speaking()){
    this.line++;
    if(this.line>=this.scene.lines.length){this.finishScene();return;}
    const l=this.scene.lines[this.line],secs=Math.max(2.2,1.1+l.text.split(/\s+/).length*.36);
    this.caption.textContent=(NAMES[l.speaker]||l.speaker)+': '+l.text;
    this.ctx.say(NAMES[l.speaker]||l.speaker,l.text,secs,null,l.direction);this.remaining=secs;
    if(l.speaker==='CAL')this.calTalkUntil=this.sceneAge+secs;
    const actor=this.people.find(n=>n.code===l.speaker);actor?.talkFor(secs);actor?.lookAt?.(this.ctx.player().pos);
   }
   return;
  }
  const obj=this.world.objects.get(this.st.mission+':'+this.st.required.find(id=>!this.st.facts[this.st.mission+':'+id]));
  if(this.st.queue.length){
   this.queueAge+=dt;
   const entry=SCENE_ENTRIES[this.st.queue[0]],target=this.currentObject();
   if(target&&!entry.automatic){const distance=this.ctx.player().pos.distanceTo(target.pos),h=this.hints.update(dt,{searching:true,visible:this.visible(target),distance});target.paper.material.emissive.setHex(h.outline?0xc49142:0);if(target.proxy)target.paper.material.opacity=h.outline?.2:0;if(h.speak)this.ctx.notify(entry.label+' · '+(entry.object==='classroom'?'Use the doorway plaque beside the school entrance.':'Inspect the marked object to begin.'),{ms:6500});}
   if(entry.automatic&&this.queueAge>1.2&&this.grace<=0&&target&&this.ctx.player().speed<.2&&this.ctx.player().pos.distanceTo(target.pos)<8)this.startScene(this.st.queue[0]);
  }else if(obj){
   const distance=this.ctx.player().pos.distanceTo(obj.pos),h=this.hints.update(dt,{searching:true,visible:this.visible(obj),distance});
   obj.paper.material.emissive.setHex(h.outline?0xc49142:0x000000);if(obj.proxy)obj.paper.material.opacity=h.outline?.2:0;
   if(h.speak)this.ctx.notify(this.mission.object_hint[1],{ms:7000});
  }
 }
 applyCamera(dt){if(this.transition)return true;if(this.playing){this.cinema.update(dt);this.film.opacity(this.cinema.opacity);return true;}return false;}
 indoorsAt(x,z){return this.active&&!!this.world.indoorAt(x,z);}
 serialize(){return this.st.serialize();}
 colliders(x,z,r,out=[]){if(this.active)this.world.colliders(x,z,r,out);return out;}
 end(){if(!this.active)return;this.calChair=null;if(this.marker){this.marker.removeFromParent();const used=new Set();this.marker.traverse(o=>{for(const r of [o.geometry,o.material])if(r&&!used.has(r)){used.add(r);r.dispose();}});this.marker=null;}this.ctx.stopVoice();this.ctx.stopCue?.();this.cinema.end();this.scene=null;this.opening=false;this.transition=null;this.lighting.end();this.traffic?.dispose();this.townLife?.dispose();this.crowd?.dispose();for(const r of this.residents||[])this.ctx.npcs.remove(r.n);this.residents=[];this.classmates.clear();for(const n of this.people)this.ctx.npcs.remove(n);this.people=[];this.world.dispose();this.ui?.remove();this.film?.dispose();this.ctx.setTime(this.oldTime);this.active=false;}
 hud(){if(!this.active)return null;const obj=this.currentObject(),entry=SCENE_ENTRIES[this.st.queue[0]];return {title:'The Way Back · '+this.st.mission+' · '+this.mission.title,text:this.transition?'A new chapter':this.opening?'Opening · Westhaven, 2085':this.st.ended?'Prologue complete · next chapter in development':this.playing?'Cutscene · Enter: next line · hold Enter: skip':this.awaitingDoor?'Find Room 9 · Open the history classroom door, west corridor':entry?entry.label+' · '+(entry.object==='seat'?'The empty chair by the west window':'Press E at the marked object')+(obj?' · '+Math.round(this.ctx.player().pos.distanceTo(obj.pos))+' m':''):(obj?obj.label+' · '+Math.round(this.ctx.player().pos.distanceTo(obj.pos))+' m · J: journal':''),level:'info'};}
 currentObject(){const entry=SCENE_ENTRIES[this.st.queue[0]];if(this.awaitingDoor)return this.world.objects.get('classroom');if(entry)return this.world.objects.get(entry.object==='classroom'?'classroom':this.st.mission+':'+entry.object);return this.world.objects.get(this.st.mission+':'+this.st.required.find(id=>!this.st.facts[this.st.mission+':'+id]));}
 journal(){return {title:'The Way Back',day:1,weekday:String(this.st.year),ended:this.st.ended,help:this.hints.requested,mission:{playable:!this.st.ended,title:this.mission.title,objectives:this.st.required.map(id=>({text:OBJECTS[this.st.mission].find(x=>x[0]===id)[4],done:!!this.st.facts[this.st.mission+':'+id],hint:this.hints.requested?this.mission.object_hint[1]:''}))},journal:Object.entries(this.st.evidence).map(([id,e])=>({text:e.text||e.title||id,day:1,mission:id.split(':')[0]})),chapters:[{n:0,title:'Prologue',missions:PROLOGUE.map(m=>({title:m.id,done:!!this.st.done[m.id],current:m.id===this.st.mission,playable:true}))}]};}
 askHelp(){this.hints.request();this.ctx.notify(this.currentObject()?.label||'Prologue complete');}
 takeDay(){return null;} note(){} replay(){} paperRange(){return null;}
 mapPins(){
  const pins=Object.values(this.places).map((p,i)=>({...p,id:'lh2:place:'+i,kind:'home',name:p.name}));
  // the current objective, ringed and pulsing (and held at the minimap's edge when it is off it)
  const obj=this.active&&!this.playing&&!this.st?.ended&&this.currentObject();
  if(obj)pins.push({x:obj.pos.x,z:obj.pos.z,id:'lh2:objective',kind:'home',name:SCENE_ENTRIES[this.st.queue[0]]?.label||obj.label,current:true});
  return pins;
 }
 mapRoutes(){return this.world.plan.routes.map(r=>({pts:[r.a,r.b],color:'#d6b37a'}));}
 setWaypoint(x,z,name){this.waypoint={x,z,name:name||'Destination'};}clearWaypoint(){this.waypoint=null;}
}
