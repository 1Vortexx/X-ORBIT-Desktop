// Opt-in campaign grading; inactive for legacy campaigns and free roam. No rendering imports/cycles.
let buckets=new Map();
export function setAuthoredGround(features=[]) {
  buckets=new Map();
  for (const f of features) {
    for (let k=Math.floor((f.z-f.hz-16)/128);k<=Math.floor((f.z+f.hz+16)/128);k++) {
      if (!buckets.has(k)) buckets.set(k,[]); buckets.get(k).push(f);
    }
  }
}
export function authoredFeatures(z) { return buckets.get(Math.floor(z/128)) || []; }
export function authoredSurface(x,z) {
  for (const f of authoredFeatures(z)) if (Math.abs(x-f.x)<=f.hx && Math.abs(z-f.z)<=f.hz) return f.surface;
  return null;
}
export function authoredHeight(x,z,base) {
  let h=base;
  for (const f of authoredFeatures(z)) {
    const d=Math.max(Math.abs(x-f.x)-f.hx,Math.abs(z-f.z)-f.hz);
    if (d>=12) continue;
    const t=Math.max(0,Math.min(1,1-d/12)), w=t*t*(3-2*t);
    const y=f.y+(f.grade||0)*(z-f.z);
    h+=(y-h)*w;
  }
  return h;
}
