// Active search time only; no automatic pickup or objective completion. The current object glows once you are
// close and can see it (the floating marker over it is drawn by the campaign, see index.js objectiveMarker).
export class ObjectHints {
  constructor() { this.reset(); }
  reset() { this.age=0; this.spoken=false; this.requested=false; }
  request() { this.requested=true; }
  update(dt, { searching, visible, distance }) {
    if (searching && distance < 25) this.age+=Math.max(0,dt);
    const speak=searching && this.age>=45 && !this.spoken;
    if (speak) this.spoken=true;
    return { speak, outline:visible && distance<12 };
  }
}
