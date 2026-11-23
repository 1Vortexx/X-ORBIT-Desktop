import * as THREE from 'three';
import { addTarget } from '../../core/targets.js';
import { circleFree } from '../../core/collide.js';
import { box, M } from '../mesh.js';
// A real swinging leaf: visible geometry, a live oriented collider, and persistent opening progress.
export class BuildingDoor {
  constructor(world,{id,parent,x,z,y=0,yaw=0,width=1.05,height=2.3,side=1,style='wood',name='door',pair=null}){
    Object.assign(this,{world,id,width,height,side,yaw,name,pair});
    const saved=world.doorStates[id];this.open=typeof saved==='object'?!!saved.open:!!saved;
    this.amount=typeof saved==='object'?Math.max(0,Math.min(1,saved.amount??(this.open?1:0))):(this.open?1:0);
    this.base=new THREE.Group();this.base.position.set(x,y,z);this.base.rotation.y=yaw;this.base.userData.dynamic=true;parent.add(this.base);
    this.hinge=new THREE.Group();this.base.add(this.hinge);
    const c=side*width/2,wood=M('lh2DoorWood',0x684c34,{r:.8}),paint=M('lh2DoorSteel',0x56716d,{m:.35,r:.55}),trim=M('lh2DoorTrim',0xc8b694),metal=M('lh2DoorHardware',0xa7aaa2,{m:.8,r:.3});
    if(style==='wood'){
      const leaf=box(this.hinge,width,height,.085,wood,c,height/2,0);leaf.name='Hinged panel door';
      for(const yy of [.55,1.65]){box(this.hinge,width*.72,.7,.025,trim,c,yy,-.052);box(this.hinge,width*.62,.6,.028,wood,c,yy,-.07);}
    }else{
      const glass=world.glass||(world.glass=new THREE.MeshStandardMaterial({color:0xa4c7c9,transparent:true,opacity:.28,roughness:.2,metalness:.1,depthWrite:false}));
      box(this.hinge,width,.8,.085,paint,c,.4,0);
      for(const edge of [0,width])box(this.hinge,.11,height,.085,paint,side*edge,height/2,0);
      box(this.hinge,width,.12,.085,paint,c,height-.06,0);
      box(this.hinge,width-.2,height-1,.018,glass,c,.9+(height-1)/2,0);
      box(this.hinge,width,.09,.085,paint,c,.87,0);
      box(this.hinge,width*.72,.045,.045,metal,c,1.1,-.09);
    }
    for(const yy of [.25,height-.25])box(this.hinge,.08,.15,.1,metal,side*.035,yy,-.04);
    box(this.hinge,.18,.045,.08,metal,side*(width-.17),1.03,-.11);
    // Batch within the hinge, never across it: hardware and rails keep moving
    // and raycasting as a real leaf without a draw call for each small box.
    const parts=[...this.hinge.children],batches=new Map();
    for(const o of parts){o.updateMatrix();if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(o);}
    const unit=world.doorUnit||(world.doorUnit=new THREE.BoxGeometry(1,1,1));
    for(const [mat,list]of batches){
      const mesh=new THREE.InstancedMesh(unit,mat,list.length);mesh.name='Hinged leaf / '+list.length+' details';
      list.forEach((o,i)=>{const p=o.geometry.parameters,m=o.matrix.clone().multiply(new THREE.Matrix4().makeScale(p.width,p.height,p.depth));mesh.setMatrixAt(i,m);o.removeFromParent();o.geometry.dispose();});
      mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;mesh.computeBoundingSphere();this.hinge.add(mesh);
    }
    const pp=parent.position;
    this.origin={x:pp.x+x,y:pp.y+y,z:pp.z+z};
    this.collider={kind:'box',x:0,z:0,hx:width/2,hz:.055,yaw:0,y0:this.origin.y,y1:this.origin.y+height,door:id};world.solids.push(this.collider);
    addTarget(this.hinge,{id:'lh2:door:'+id,name,reach:2.4,info:()=>({note:this.obstructed?'Someone is in the doorway.':this.open?'Open':'Closed'}),actions:()=>[{key:'use',label:(this.open?'Close ':'Open ')+name,run:()=>this.toggle()}]});
    this.apply(this.amount);world.doors.set(id,this);
  }
  geometry(t){
    const turn=-this.side*t*Math.PI*.51,yaw=this.yaw+turn,c=this.side*this.width/2;
    return {...this.collider,x:this.origin.x+Math.cos(yaw)*c,z:this.origin.z-Math.sin(yaw)*c,yaw};
  }
  apply(t){this.amount=t;this.hinge.rotation.y=-this.side*t*Math.PI*.51;Object.assign(this.collider,this.geometry(t));}
  setOpen(open,immediate=false,notify=true){
    this.open=!!open;if(immediate)this.apply(this.open?1:0);
    this.save();if(notify){this.world.ctx.sfx?.(this.open?'door_open':'door_close',{pos:this.origin});this.world.onDoorChange?.();}
  }
  toggle(){
    if(this.pair){const leaves=[...this.world.doors.values()].filter(d=>d.pair===this.pair),open=!leaves.every(d=>d.open);for(const d of leaves)d.setOpen(open,false,false);this.world.ctx.sfx?.(open?'door_open':'door_close',{pos:this.origin});this.world.onDoorChange?.();}
    else this.setOpen(!this.open);
  }
  save(){this.world.doorStates[this.id]={open:this.open,amount:this.amount};}
  update(dt){
    const target=this.open?1:0;if(Math.abs(target-this.amount)<.0001){this.obstructed=false;return;}
    const next=this.amount+Math.sign(target-this.amount)*Math.min(Math.abs(target-this.amount),dt*1.45),col=this.geometry(next);
    const p=this.world.ctx.player?.(),people=[...(this.world.ctx.npcs?.list||[]).filter(n=>!n.seat).map(n=>n.pos),...(p?.onFoot?[p.pos]:[])];
    this.obstructed=people.some(pos=>!circleFree(pos.x,pos.z,.36,[col],pos.y+.08,pos.y+1.7));
    if(!this.obstructed){this.apply(next);this.save();}
  }
}
