// Scene-local time overrides; existing Sky remains the only sun/fog/environment writer.
// P01 is an early school morning (the opening is a sunrise, see OPENING_DAWN)
export const TIMES={P01:7.5/24,P02:11.5/24,P03:16/24,P04:18.5/24};
export class SceneLighting {
 constructor(ctx){this.ctx=ctx;this.active=false;}
 begin(mission){this.end();this.previous=this.ctx.time();this.time=TIMES[mission]??10/24;this.active=true;this.ctx.setTime(this.time);}
 update(){if(this.active)this.ctx.setTime(this.time);}
 end(){if(this.active)this.ctx.setTime(this.previous);this.active=false;}
}
