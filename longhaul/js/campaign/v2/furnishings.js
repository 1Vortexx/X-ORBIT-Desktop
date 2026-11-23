import * as THREE from 'three';
import { box,M } from '../mesh.js';
import { finish } from './building-materials.js';
const C={wood:0x806044,dark:0x393c38,cream:0xd9cfb8,steel:0x8b9590,seat:0x5a746b,red:0x9d5349};
export function furnish(b){
 const {group:g,world:w,site:s,type,w:width,d:depth}=b;
 const p=(name,x,y,z,a,h,c,color=C.wood,solid=false,material=null)=>{
  const o=box(g,a,h,c,material||M('lh2furn:'+color,color),x,y,z);o.name=name;b.details.push(name);
  if(solid)w.solid(s.x+x,s.z+z,a,c,s.y+Math.max(.02,y-h/2),s.y+y+h/2);return o;
 };
 const label=(text,x,y,z,a=2,h=.4)=>w.label(g,text,x,y,z,a,h);
 const legs=(x,z,a,c,y=.7)=>{for(const xx of [-a/2+.08,a/2-.08])for(const zz of [-c/2+.08,c/2-.08])p('Furniture leg',x+xx,y/2,z+zz,.055,y,.055,C.dark);};
 const table=(x,z,a=1.5,c=.9)=>{p('Table top',x,.76,z,a,.09,c,C.wood,true,finish('wood',C.wood));legs(x,z,a,c);};
 const chair=(x,z,yaw=0,color=C.seat)=>{
  const q=new THREE.Group();q.position.set(x,0,z);q.rotation.y=yaw;g.add(q);
  const seat=box(q,.48,.09,.49,M('lh2chair:'+color,color),0,.47,0);seat.name='Upholstered chair';
  box(q,.48,.49,.065,M('lh2chair:'+color,color),0,.73,.22);
  for(const xx of [-.19,.19])for(const zz of [-.19,.19])box(q,.035,.45,.035,M('lh2chairlegs',C.dark),xx,.225,zz);
  b.details.push('Chair');w.solid(s.x+x,s.z+z,.48,.49,s.y,s.y+.95);return seat;
 };
 const cabinet=(x,z,a=1.7,h=2.1)=>{
  p('Cabinet carcass',x,h/2,z,a,h,.5,C.wood,true,finish('wood',0x806044));
  for(const side of [-1,1]){p('Inset cabinet door',x+side*a*.245,h*.52,z-.266,a*.46,h*.88,.035,0xa88c64);p('Cabinet handle',x+side*.09,h*.53,z-.3,.025,.13,.035,C.dark);}
 };
 const shelf=(x,z,a=2.5,books=false)=>{
  for(const xx of [-a/2,a/2])p('Shelf upright',x+xx,1,z,.07,2,.45,C.steel);
  p('Shelf back',x,1,z+.2,a,2,.035,0x6e786e);
  for(let row=0;row<4;row++){
   const yy=.25+row*.48;p('Shelf board',x,yy,z,a,.045,.5,C.wood);
   for(let col=0;col<7;col++){
    const xx=x-a*.42+col*a*.14;
    p(books?'Book spine':'Stocked carton',xx,yy+(books?.15:.12),z-.03,books?.11:.18,books?.3:.23,books?.24:.2,[0x747c50,0xb78757,0x8caaae,0xb75345,0xe1c8a0][(row+col)%5]);
   }
  }
  w.solid(s.x+x,s.z+z,a+.1,.5,s.y,s.y+2);
 };
 const counter=(x,z,a=5,color=C.wood)=>{
  p('Counter cabinet',x,.47,z,a,.94,.9,color,true);p('Counter worktop',x,1,z,a+.08,.07,1,C.cream);
  for(let j=0;j<Math.max(2,Math.floor(a));j++){const xx=x-a/2+.5+j;p('Counter drawer',xx,.68,z-.464,.83,.31,.025,color);p('Drawer pull',xx,.73,z-.49,.18,.025,.035,C.dark);}
 };
 const bed=(x,z)=>{
  p('Bed frame',x,.25,z,1.35,.4,2.2,C.wood,true);p('Mattress',x,.51,z,1.31,.22,2.06,0xdbd5c5);p('Folded blanket',x,.64,z-.28,1.32,.055,1.35,0x7a8e85);p('Pillow',x,.68,z+.72,.85,.16,.4,0xf1e8d0);p('Headboard',x,.63,z+1.08,1.45,1.1,.1,C.wood);
 };
 const sink=(x,z)=>{p('Sink cabinet',x,.45,z,.85,.9,.6,C.cream,true);p('Basin rim',x,.94,z,.8,.04,.56,C.steel);p('Basin recess',x,.966,z,.53,.025,.36,0x52625e);p('Tap stem',x,1.07,z+.17,.04,.23,.04,C.steel);p('Tap spout',x,1.17,z+.1,.04,.04,.19,C.steel);};
 const kitchen=(x,z)=>{
  counter(x,z,4.2,0x718775);sink(x-1.45,z);
  p('Oven',x+.65,.5,z-.03,.9,.95,.8,C.steel,true);p('Oven glass',x+.65,.47,z-.45,.65,.45,.025,C.dark);
  for(const xx of [-.2,.2])for(const zz of [-.2,.2])p('Cooktop ring',x+.65+xx,1.02,z+zz,.16,.02,.16,C.dark);
  p('Refrigerator',x+3,1.05,z,.95,2.1,.9,0xd1d6c9,true);p('Fridge handle',x+3.34,1.1,z-.48,.035,.4,.055,C.dark);
  cabinet(x-1.2,z+.2,2.8,.5);
 };
 const bathroom=(x,z)=>{
  sink(x-1,z);p('Toilet base',x+.75,.2,z,.43,.4,.55,C.cream,true);p('Toilet bowl',x+.75,.45,z-.08,.51,.17,.65,C.cream);p('Toilet cistern',x+.75,.75,z+.25,.53,.68,.19,C.cream);p('Mirror',x-1,1.6,z+.31,.65,.7,.025,0x7b989f);
  p('Towel rail',x-1,1.2,z-.35,.55,.025,.025,C.steel);p('Hand towel',x-1,1.02,z-.35,.35,.37,.02,0x8b9e92);
 };
 const workbench=(x,z)=>{
  counter(x,z,4,0x617169);p('Pegboard',x,1.75,z+.43,4,1.25,.06,0x967650);
  for(let k=0;k<8;k++){p('Hanging tool',x-1.5+k*.42,1.72,z+.38,.05,.4,.035,C.steel);p('Tool grip',x-1.5+k*.42,1.54,z+.36,.09,.15,.055,[0x455d69,0x954d3c][k%2]);}
  p('Bench vise',x-1,1.16,z,.4,.26,.34,C.steel);p('Toolbox',x+.75,1.2,z,.85,.34,.4,C.red);p('Toolbox handle',x+.75,1.42,z,.35,.05,.05,C.dark);
 };
 const lamp=(x,z)=>{p('Ceiling fixture',x,3.08,z,1.5,.09,.3,0xd5cdb7);p('Light diffuser',x,3.02,z,1.35,.035,.23,0xf5e8c3,false,M('lh2litFixture',0xf5e8c3,{r:.5}));};
 if(type==='school'){
  // Two classrooms flank a central corridor; the south end is a foyer with reception and lockers.
  for(const x of [5,9])for(const z of [-1,3,7]){table(x,z,1.25,.7);chair(x,z-1.1,Math.PI);p('Exercise book',x,.825,z,.26,.025,.32,0xd9c58b);}
  // Room 9: four rows of four desks facing the board, and the back pair by the west window (Cal's and Grevyn's).
  // b.seats lists every chair (building-local) so the class can be seated: {id,x,z} is the chair, all face the board.
  b.seats=[];
  const desk=(id,x,z,gap=.8)=>{
   table(x,z,1.15,.65);chair(x,z-gap,Math.PI);b.seats.push({id,x,z:z-gap});
   const k=b.seats.length;
   p('Exercise book',x-.22,.825,z-.05,.26,.025,.32,[0xd9c58b,0x9bb0a4,0xc7a27c][k%3]);
   p('Worksheet',x+.18,.817,z-.08,.24,.006,.31,0xf1ead8);
   p('Pencil',x+.32,.823,z-.12,.012,.012,.16,0xd1a640);
  };
  for(const [r,z] of [-1.2,1.3,3.8,6.3].entries())for(const [c,x] of [-11,-8.7,-6.4,-4.1].entries())desk('r'+r+'c'+c,x,z);
  desk('window',-11,-3.6,1.2);desk('grevyn',-9.4,-3.6,1.2);
  for(const x of [-7.7,7.5]){
   p('Chalkboard frame',x,1.8,10.77,6.6,1.7,.09,C.wood);p('Chalkboard',x,1.8,10.7,6.35,1.45,.025,0x314a43);
   label('HISTORY 9  /  SOURCES & EVIDENCE',x,2,10.67,5.5,.35);
   p('Chalk tray',x,.99,10.64,6.5,.07,.14,C.wood);table(x,8.7,1.7,.8);
  }
  for(let i=0;i<7;i++){
   const x=-11+i*1.03;p('Locker',x,.98,-10.65,.96,1.95,.46,[0x758b80,0x72838b][i%2],true);
   for(const y of [.4,1.42]){p('Locker pull',x+.27,y,-10.91,.04,.16,.035,C.dark);for(let k=0;k<3;k++)p('Locker vent',x, y+.2+k*.055,-10.9,.5,.02,.015,0x3c514c);}
  }
  counter(8,-8.5,4,0x7e694b);p('Reception telephone',8,1.09,-8.5,.34,.15,.25,C.dark);
  label('RECEPTION',8,1.7,-10.76,2,.35);label('WESTHAVEN HIGH SCHOOL',0,2.8,-10.8,3.8,.4);
  cabinet(11.5,8,1.3,2);shelf(8,9.8,3,true);
  p('Map cabinet',-12.45,1.2,8,.5,2.3,2.8,0x886b44,true);
  label('WORLD HISTORY / 2085',-7,2.7,10.66,4,.35);
  // the timetable board hangs in the foyer, on the Room 9 wall, facing you as you come in the front doors
  p('School noticeboard',-5,1.5,-6.17,2.5,1.25,.08,0x9b805a);label('TIMETABLE  /  HISTORY - ROOM 9',-5,1.98,-6.23,2.25,.3);
  for(const x of [-7,7])for(const z of [-1,6])lamp(x,z);
  b.windowSeat={x:-11,z:-4.8};
 }else if(type==='diner'){
  for(const x of [-5,5])for(const z of [-2.8,1.5]){
   table(x,z,2,.95);
   for(const side of [-1,1]){p('Booth plinth',x,.25,z+side*.95,2.1,.45,.65,C.wood,true);p('Booth cushion',x,.54,z+side*.95,2.1,.18,.65,C.red);p('Booth backrest',x,.89,z+side*1.23,2.1,.8,.12,C.red);}
   p('Table napkin holder',x+.6,.89,z,.18,.2,.16,C.steel);p('Menu card',x-.6,.92,z,.2,.25,.035,C.cream);
  }
  counter(-1,4.1,9,0x9e5d48);kitchen(-1,6);
  for(let i=0;i<5;i++){p('Counter stool',-4+i*1.4,.45,2.9,.45,.09,.45,C.red);p('Stool stem',-4+i*1.4,.23,2.9,.06,.45,.06,C.steel);}
  label('COFFEE  /  HOT FOOD  /  OPEN',0,2.3,6.8,5,.45);lamp(-4,-1);lamp(4,-1);
 }else if(type==='store'){
  shelf(-5,1,3.2);shelf(0,1,3.2);shelf(5,1,3.2);shelf(0,5.8,7);
  counter(-4,-4.5,4,0x6e806c);p('Cash register',-4,1.15,-4.5,.55,.28,.42,C.steel);p('Register display',-4,1.4,-4.39,.4,.18,.06,C.dark);
  label('WATER  /  FOOD  /  REPAIRS',0,2.3,6.8,5,.45);
  for(const x of [-6,6])p('Stock crate',x,.28,5,.8,.55,.8,0x9b8057,true);
  lamp(-3,0);lamp(3,0);
 }else if(type==='workshop'||type==='depot'){
  workbench(-4,4);shelf(4,depth/2-1,4);p('Service jack',1,.18,1,.55,.3,1.25,C.red,true);
  for(const x of [2.4,5.5])for(const z of [0,2.4])p('Lift pad',x,.1,z,.65,.18,.8,C.steel);
  for(let i=0;i<4;i++)p('Stacked spare tire',-6,.2+i*.22,-2,.75,.2,.75,C.dark,true);
  p('Parts desk',4,.75,-4,2.7,.12,.95,C.wood,true);chair(4,-3.1);p('Service ledger',4,.84,-4,.4,.04,.3,C.cream);
  label(type==='depot'?'TRANSPORT DESK / AUTHORIZATIONS':'SERVICE / PARTS / REPAIRS',0,2.3,depth/2-.2,6,.5);lamp(-4,1);lamp(4,1);
 }else if(type==='rooms'){
  bed(-4,3);bed(4,3);cabinet(-6,5.8,1.3);cabinet(6,5.8,1.3);counter(-4,-4.5,3.5);table(4,-3.5,1.2,.8);chair(4,-4.5);label('GUEST REGISTER / ROOMS',-4,2.3,-6.82,3,.4);lamp(-4,3);lamp(4,3);
 }else if(type==='house'){
  kitchen(-4,depth/2-1.3);bed(4,3);cabinet(6.4,depth/2-1.1,1.4);
  p('Sofa base',-4,.36,-2,2.7,.55,.9,0x78816b,true);p('Sofa back',-4,.86,-1.59,2.7,.7,.14,0x78816b);for(const xx of [-5.35,-2.65])p('Sofa arm',xx,.68,-2,.17,.45,1,0x66755c);
  table(-4,-4,1.35,.65);p('Worn rug',-4,.065,-3.2,3.6,.015,3.5,0xa47853);
  bathroom(4,-4.8);label('HOME',-4,2.3,depth/2-.2,1,.3);lamp(-3,0);lamp(4,3);
 }else if(type==='clinic'){
  for(const x of [-5,4]){
   p('Treatment bed frame',x,.46,2,1.15,.85,2.5,C.steel,true);p('Treatment mattress',x,.91,2,1.1,.17,2.35,C.cream);
   p('Treatment pillow',x,1.05,2.8,.65,.15,.4,0xeee5d2);p('Privacy screen',x+1.1,1.15,2,.065,2.2,2.7,0xa2b7ad,true);
   p('Monitor trolley',x-1,.48,2, .6,.9,.5,C.steel,true);p('Monitor',x-1,1.15,2,.5,.38,.2,C.dark);
  }
  cabinet(-5,depth/2-1,3);sink(4,depth/2-1);counter(4,-4.5,3.5,0x81998b);label('CLINIC / TRIAGE',0,2.3,depth/2-.2,4,.5);lamp(-4,1);lamp(4,1);
 }else if(type==='radio'){
  table(-4,2,5,1.15);for(let i=0;i<3;i++){p('Radio receiver',-5+i*1.7,1.03,2,.8,.42,.7,0x56675f);p('Tuning display',-5+i*1.7,1.09,1.63,.4,.16,.03,0xb4c9b0);}
  chair(-3,.7);shelf(4,5,3,true);counter(4,-3,3,0x7f8d81);for(let i=0;i<12;i++)p('Postal sorting cubby',4+(i%4)*.45-1,1.2+Math.floor(i/4)*.38,4.9,.4,.32,.4,C.wood);
  label('POST / PUBLIC RADIO / MESSAGES',0,2.3,depth/2-.2,5,.45);lamp(-3,1);lamp(4,1);
 }else if(type==='water'){
  for(const x of [-4,3]){p('Pump motor',x,.7,3,1.8,1.25,2,0x547c79,true);for(let k=0;k<4;k++)p('Pressure pipe',x+1,1+k*.2,3,.13,.13,2.5,C.steel);}
  counter(-3,-3.5,4);cabinet(5,depth/2-1,2);label('WATER OFFICE / MAINTENANCE',0,2.3,depth/2-.2,5,.45);lamp(0,0);
 }else{
  counter(-4,-3.5,4);for(const z of [0,3]){table(0,z,3,1);chair(-1,z-1);chair(1,z+1,Math.PI);}
  shelf(-5,depth/2-1,3,true);cabinet(5,depth/2-1,2);label('COMMUNITY NOTICES / RECORDS',0,2.3,depth/2-.2,5,.45);lamp(-3,1);lamp(3,1);
 }
 return b;
}
