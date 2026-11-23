import { PROLOGUE } from './data.js';
export class PrologueState {
  constructor(rec) {
    if (rec && rec.schema !== 2) throw Error('Unsupported campaign save edition.');
    this.schema = 2; this.edition = 2;
    this.doors=JSON.parse(JSON.stringify(rec?.doors||{}));
    this.transitionPending=!!rec?.transitionPending;this.openingSeen=!!rec?.openingSeen;this.openingTime=Math.max(0,Math.min(120,Number(rec?.openingTime)||0));
    this.mission = PROLOGUE.some(m => m.id === rec?.mission) ? rec.mission : 'P01';
    this.done = { ...rec?.done }; this.facts = { ...rec?.facts }; this.seen = { ...rec?.seen };
    this.evidence = { ...rec?.evidence }; this.choices = { ...rec?.choices };
    this.queue = (Array.isArray(rec?.queue) ? rec.queue : []).filter(k => /^P0[1-4]\.[ABC]$/.test(k));
    this.ended = !!rec?.ended; this.stage = Math.max(0, Math.min(2, rec?.stage | 0));
    this.year = this.mission==='P01' && (this.stage>0 || this.seen['P01.B']) ? 2086 : PROLOGUE.find(m => m.id === this.mission).year;
    if (!this.ended && !this.queue.length && !this.seen[this.mission+'.A']) this.enqueue(this.mission+'.A');
  }
  get spec() { return PROLOGUE.find(m => m.id === this.mission); }
  get required() { return this.ended ? [] : this.spec.stages[this.stage]; }
  enqueue(id) { if (!this.seen[id] && !this.queue.includes(id)) this.queue.push(id); }
  inspect(id) {
    if (this.ended || this.queue.length || !this.required.includes(id) || this.facts[this.mission+':'+id]) return false;
    this.facts[this.mission+':'+id] = true;
    if(this.mission==='P04' && id==='blockade') this.enqueue('P04.B');
    this.evidence[this.mission+':'+id] = { source:id, year:this.year, private:true };
    return true;
  }
  advance() {
    if (this.ended || this.queue.length || !this.required.every(id => this.facts[this.mission+':'+id])) return false;
    if (this.stage < 2) { this.stage++; if(this.mission!=='P04' && !(this.mission==='P03' && this.stage===2)) this.enqueue(this.mission+'.'+String.fromCharCode(65+this.stage)); }
    else if(!this.seen[this.mission+'.C']) { this.enqueue(this.mission+'.C'); return false; }
    else {
      this.done[this.mission] = true;
      const i = PROLOGUE.findIndex(m => m.id === this.mission);
      if (i === PROLOGUE.length-1) this.ended = true;
      else { this.mission=PROLOGUE[i+1].id; this.year=PROLOGUE[i+1].year; this.stage=0; this.enqueue(this.mission+'.A'); }
    }
    return true;
  }
  finishScene(id) { this.seen[id]=true; this.queue=this.queue.filter(k => k!==id); }
  serialize() { return JSON.parse(JSON.stringify(this)); }
}
