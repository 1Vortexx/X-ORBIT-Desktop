// Each scene has its own blocking and composition. Coordinates are local to its authored site.
export const SCENE_ENTRIES={
 'P01.A':{object:'seat',label:'Sit at the window seat',year:'September 2085',chapter:'The window seat'},
 'P01.B':{object:'friends',label:'Meet Grevyn and the others',year:'June 2086',chapter:'After the last bell'},
 'P01.C':{object:'sophomore',label:'Return to the window seat',year:'September 2086',chapter:'Sophomore year'},
 'P02.A':{object:'graduation',label:'Remember graduation and service',year:'2089 — 2091',chapter:'In service'},
 'P02.B':{object:'manifest',label:'Join your colleagues',year:'2091',chapter:'Between assignments'},
 'P02.C':{object:'ledger',label:'Speak with Grevyn about the ledger',year:'2091',chapter:'What we signed'},
 'P03.A':{object:'originals',label:'Meet Grevyn after hours',year:'2091',chapter:'Save me the window seat'},
 'P03.B':{object:'westmap',label:'Discuss the western approach',year:'2091',chapter:'A way out'},
 'P03.C':{object:'depart',label:'Leave the school',year:'2091',chapter:'Borrowed authority',automatic:true},
 'P04.A':{object:'bridge',label:'Survey the closed crossing',year:'The evacuation · 2091',chapter:'No crossing'},
 'P04.B':{object:'blockade',label:'Try to reach Grevyn',year:'The evacuation · 2091',chapter:'The second road',automatic:true},
 'P04.C':{object:'lastcall',label:'Answer the call',year:'Later that night · 2091',chapter:'Stop calling me',automatic:true},
};
// The opening is one unbroken move timed to its music cue ("Prologue swell", 1:45; it builds to a drop at 1:20
// and has died away by 1:41). Site-local metres. It cranes down into Westhaven from the south-west and tours it at
// street level: up the west high street between the general store and the diner, past the water office and town
// hall, east along the north cross street between the houses, the rooms and the clinic, then south down the east
// high street towards the school. At 1:15 it rises into open sky; the logo drops in on the 1:20 drop and fades out
// at 1:30 as the camera pans away and the picture goes slowly to black with the music; the school follows.
// Keys marked hold are the still frames used with reduced motion.
const OPENING_KEYS=[
 [0,    [-132,30,-138],[-60,2,-48],52,true],
 [8.6,  [-98,7,-74],   [-72,2,-50],50],
 [15,   [-71,2.8,-63], [-66,2.2,-30],48,true],
 [22.5, [-70,2.7,-36], [-80,2,-18],47],
 [30,   [-70,2.8,-4],  [-58,2.2,24],47,true],
 [37.5, [-69,3,36],    [-60,2,62],47],
 [44,   [-54,3.2,55],  [-30,2,72],47,true],
 [51.5, [-12,3,56],    [10,2.2,74],47],
 [59,   [34,3,55],     [54,2,38],47,true],
 [66.5, [69,3,28],     [56,2,0],47],
 [75,   [68,3.4,-18],  [24,3,-12],48,true],
 [80,   [42,28,-42],   [4,58,16],53],
 [89,   [20,47,-57],   [-6,92,27],56,true],
 [101.5,[2,60,-66],    [-76,84,-32],58],
];
export const OPENING_DURATION=100;
// From the game's CREDITS.md (the roles on The Long Haul Discord, 2026-11-22): one card per section, names as each
// person goes by. Twelve cards over the town tour, every one gone before the climb at 1:15.
export const OPENING_CREDITS=[
 ['X-ORBIT Studios','presents'],
 ['1Vortexx','Studio lead'],
 ['1Vortexx · Michael Lester','Development'],
 ['#1 My Name Is Mud · GlitzerX · Kunnii · Metal · Sad_potato_950 · Star Fox','Voice cast'],
 ['#1 My Name Is Mud · Colzic · GlitzerX · Kunnii · Metal · Michael Lester · Sad_potato_950 · Star Fox · ZeeAnimate','Contributors'],
 ['#1 My Name Is Mud · Colzic · GATO · GlitzerX · ironbull · Metal · Michael Lester · Reddy · Ulyrn · vector visuals','Quality assurance'],
 ['#1 My Name Is Mud · 1Vortexx · Michael Lester','Content creators'],
 ['Sad_potato_950','Community moderation'],
 ['Jaobi · Michael Lester','Music'],
 ['DieselMan999 · feminineindividual · JJ · SpoonerMan','Special thanks'],
 ['Westhaven','September 2085'],
 ['Before the Dust','The Way Back'],
].map(([credit,role],i)=>({at:2+i*6,dur:5,credit,role}));
// The logo drops in on the 1:20 drop (settling into place over `full`), holds, and from `away` fades out over
// the next couple of seconds while the camera pans off it; the picture fades to black over `fade`
export const OPENING_LOGO={in:80,full:80.7,away:90,out:92.6};
// As the logo goes: "Created by Demitri Burns", held over the darkening sky and gone before the school
export const OPENING_BYLINE={in:90.8,full:92.4,out:95.8,gone:97.6,text:'Created by Demitri Burns'};
export const OPENING_FADE={from:90,to:98.6};
// Time of day across the opening (fraction of a day): just before sunrise, the sun up over the town by the end
export const OPENING_DAWN={from:5.9/24,to:7.3/24};
export function openingShots(s){
 const at=a=>[s.x+a[0],s.y+a[1],s.z+a[2]];
 return [{duration:OPENING_DURATION,collision:false,
  fade:OPENING_FADE,keys:OPENING_KEYS.map(([t,p,q,fov,hold])=>({t,position:at(p),target:at(q),fov,hold:!!hold}))}];
}
export function openingCredit(t){
 for(const c of OPENING_CREDITS)if(t>=c.at&&t<=c.at+c.dur){const f=Math.min(1.2,c.dur/4);return {...c,opacity:ease01((t-c.at)/f)*(1-ease01((t-c.at-c.dur+f)/f))};}
 return null;
}
const ease01=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const BLOCKING={
 'P01.A':{cal:[-10.2,-5.25],calSeat:'window',people:{GREVYN:[-9.4,-4.2],ORIN:[-6.2,9.7]},sit:{GREVYN:'grevyn'},camera:[-7.4,1.6,-2.9],end:[-7.9,1.55,-3.1],look:[-10.2,1.05,-4.7]},
 'P01.B':{cal:[0,-17],people:{GREVYN:[-2,-18],TAY:[2,-18],TAYJ:[4,-17],RIPED:[-4,-16]},camera:[-5,2,-24],end:[-3,2,-24],look:[0,1.4,-17]},
 'P01.C':{cal:[-10.2,-5.25],calSeat:'window',people:{GREVYN:[-9.4,-4.2],TAY:[-7.6,-5],TAYJ:[-6.4,-5.3],RIPED:[-8.2,-5.5],ORIN:[-6.2,9.7]},sit:{GREVYN:'grevyn'},camera:[-7.2,1.65,-2.8],end:[-7.8,1.6,-3],look:[-9.4,1.1,-4.9]},
 'P02.A':{cal:[0,-5],people:{GREVYN:[-3,-2],RIPED:[3,-2],VOSS:[0,5]},camera:[6,2,-8],end:[4,2,-8],look:[0,1.4,-1]},
 'P02.B':{cal:[0,-4],people:{GREVYN:[-3,-2],LIO:[-1,-1],JESS:[3,-1],RIPED:[6,3]},camera:[-5,1.9,-7],end:[-3,1.9,-7],look:[0,1.4,-1]},
 'P02.C':{cal:[-2,0],people:{GREVYN:[-4,2],RIPED:[5,5]},camera:[3,2,-4],end:[2,2,-4],look:[-3,1.3,2]},
 'P03.A':{cal:[0,-8],people:{GREVYN:[-7,5],RIPED:[1,-16]},camera:[-4,2,-1],end:[-3,2,-1],look:[-6,1.3,5],walk:[[0,-3],[-6,-3],[-6,4]]},
 'P03.B':{cal:[-2,3],people:{GREVYN:[1,4],RIPED:[1,-16]},camera:[-4,1.9,0],end:[-3,1.9,-1],look:[0,1.2,5]},
 'P03.C':{cal:[3,7],people:{GREVYN:[0,-15],RIPED:[4,4]},camera:[0,2,3],end:[1,2,2],look:[4,1.3,7]},
 'P04.A':{cal:[0,-20],people:{},camera:[-7,2.6,-25],end:[-5,2.6,-25],look:[0,1,-2]},
 'P04.B':{cal:[18,-9],people:{VOSS:[10,-5],TAY:[18,-12],TAYJ:[16,-16]},camera:[24,2,-17],end:[23,2,-16],look:[16,1.3,-6]},
 'P04.C':{cal:[0,-4],people:{TAY:[-3,-3],TAYJ:[3,-3]},camera:[5,1.9,-6],end:[4,1.9,-6],look:[0,1.2,-2]},
};
export function sceneDirection(id,site){
 const d=BLOCKING[id],point=a=>({x:site.x+a[0],z:site.z+a[1]});
 const v=a=>[site.x+a[0],site.y+a[1],site.z+a[2]];
 return {...d,cal:point(d.cal),people:Object.fromEntries(Object.entries(d.people).map(([k,a])=>[k,point(a)])),walk:(d.walk||[]).map(point),
  shots:[{duration:120,from:{position:v(d.camera),target:v(d.look),fov:46},to:{position:v(d.end),target:v(d.look),fov:44},safe:v(d.camera)}]};
}
