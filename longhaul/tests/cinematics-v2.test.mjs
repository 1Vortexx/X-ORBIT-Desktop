import assert from 'node:assert/strict';
import { PerspectiveCamera } from 'three';
import { Cinematics } from '../js/campaign/v2/cinematics.js';
import { openingShots, OPENING_DURATION, OPENING_CREDITS, OPENING_LOGO, OPENING_BYLINE, OPENING_FADE, openingCredit, SCENE_ENTRIES } from '../js/campaign/v2/direction.js';
import { PrologueState } from '../js/campaign/v2/state.js';
const shots=openingShots({x:0,y:15,z:0});
assert.equal(shots.reduce((s,v)=>s+v.duration,0),OPENING_DURATION);
assert.equal(shots.length,1,'the opening is one unbroken move');
// everyone in CREDITS.md has a card
for(const name of ['1Vortexx','Michael Lester','#1 My Name Is Mud','GlitzerX','Kunnii','Metal','Sad_potato_950','Star Fox','Colzic','ZeeAnimate','GATO','ironbull','Reddy','Ulyrn','vector visuals','Jaobi','DieselMan999','feminineindividual','JJ','SpoonerMan'])
 assert(OPENING_CREDITS.some(c=>c.credit.split(' · ').includes(name)||c.credit===name),'opening credits name '+name);
assert(OPENING_BYLINE.text==='Created by Demitri Burns'&&OPENING_BYLINE.in>=OPENING_LOGO.away&&OPENING_BYLINE.gone<=OPENING_DURATION,'the byline follows the logo out, before the school');assert.equal(OPENING_CREDITS.at(-1).credit,'Before the Dust');
assert(openingCredit(OPENING_CREDITS[2].at+3).opacity>.99);assert.equal(openingCredit(OPENING_LOGO.in+1),null,'no credit over the logo');
assert(OPENING_CREDITS.at(-1).at+OPENING_CREDITS.at(-1).dur<OPENING_LOGO.in&&OPENING_LOGO.full<OPENING_DURATION);
function sample(hz,seconds,reduced=false){const camera=new PerspectiveCamera(71);const c=new Cinematics(camera);c.beginTrack(shots,{reduced});for(let i=0;i<Math.round(hz*seconds);i++)c.update(1/hz);return {c,camera};}
for(const t of [2,7,13,25,42,53,61,85,95]){
 const a=sample(30,t),b=sample(120,t);
 assert(a.camera.position.distanceTo(b.camera.position)<.0001,'track is frame-rate independent at '+t);
 assert(a.camera.quaternion.angleTo(b.camera.quaternion)<.0001);
}
// no cuts and no blackouts: after the entry fade the picture stays up and the camera never jumps
{const camera=new PerspectiveCamera(71),c=new Cinematics(camera);c.beginTrack(shots);let prev=null,top=0;
 for(let i=0;i<OPENING_DURATION*60;i++){c.update(1/60);if(i>180&&i/60<OPENING_FADE.from)assert(c.opacity<.001,'no fade mid-opening at '+(i/60).toFixed(2));if(prev)top=Math.max(top,camera.position.distanceTo(prev));prev=camera.position.clone();}
 assert(top<.25,'largest step per frame '+top);assert(camera.position.y>40,'the opening ends up in the sky');assert(c.opacity>.99,'and fades to black as the track ends');}
assert(OPENING_LOGO.in===80&&OPENING_LOGO.away===90&&OPENING_FADE.to<=OPENING_DURATION&&OPENING_DURATION<=101,'timed to the Prologue swell cue: logo drops at 1:20, fades at 1:30, school once the track has died away');
const {c,camera}=sample(60,9.99);
c.leave();for(let i=0;i<60;i++)c.update(1/60);assert(c.done);c.end();assert.equal(camera.fov,71);
const calm=sample(60,2,true),initial=calm.camera.position.clone();for(let i=0;i<120;i++)calm.c.update(1/60);assert(calm.camera.position.distanceTo(initial)<.0001,'reduced motion holds a still composition');
const state=new PrologueState({schema:2,openingTime:23.5});assert.equal(new PrologueState(state.serialize()).openingTime,23.5);assert(!state.openingSeen);
state.openingSeen=true;assert(new PrologueState(state.serialize()).openingSeen);
assert(!SCENE_ENTRIES['P01.A'].automatic,'school entry requires an explicit interaction');
console.log('cinema v2: one continuous opening move into the sky, timed credits and logo, smooth deterministic poses, no blackouts, FOV restoration, reduced motion and resumable opening pass');
