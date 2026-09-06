/** Cap presentation at 60 Hz while retaining elapsed time on 120/144 Hz displays. */
export class FramePacer {
 private previous:number|null=null;private credit=0;private sinceRender=0;
 reset(){this.previous=null;this.credit=this.sinceRender=0;}
 sample(now:number):number|null{
  if(this.previous===null){this.previous=now;return 1/60;}
  const elapsed=Math.max(0,(now-this.previous)/1000);this.previous=now;
  this.credit+=elapsed;this.sinceRender+=elapsed;
  if(this.credit<1/60-.0001)return null;
  const dt=this.sinceRender;this.sinceRender=0;this.credit=elapsed>.1?0:Math.max(0,this.credit-1/60)%(1/60);return dt;
 }
}
export type GraphicsTier='high'|'balanced'|'low';
/** Rolling windows react to sustained misses, without lowering quality for a single pause. */
export class FrameBudget {
 private samples=0;private slow=0;private blocked=0;
 reset(){this.samples=this.slow=this.blocked=0;}
 sample(frameSeconds:number,cpuMs:number):boolean{
  if(!Number.isFinite(frameSeconds)||frameSeconds<=0||frameSeconds>1){this.reset();return false;}
  this.samples++;if(frameSeconds>.023||cpuMs>19)this.slow++;if(frameSeconds>.075||cpuMs>50)this.blocked++;
  if(this.samples<45)return false;
  const reduce=this.slow>=12||this.blocked>=3;this.reset();return reduce;
 }
}

/** Local, on-demand diagnostics. No per-frame logging, network calls, or HUD allocation. */
export class FrameDiagnostics {
 private frame=new Float32Array(120);private update=new Float32Array(120);private render=new Float32Array(120);private cursor=0;private count=0;private stalls=0;
 record(frameMs:number,updateMs:number,renderMs:number){const i=this.cursor++%120;this.frame[i]=frameMs;this.update[i]=updateMs;this.render[i]=renderMs;this.count=Math.min(120,this.count+1);if(frameMs>50)this.stalls++;}
 get snapshot(){const stats=(a:Float32Array)=>{const values=Array.from(a.subarray(0,this.count)).sort((a,b)=>a-b);return{average:values.reduce((n,x)=>n+x,0)/(values.length||1),p95:values[Math.max(0,Math.ceil(values.length*.95)-1)]??0};};return{samples:this.count,stallsOver50ms:this.stalls,frameMs:stats(this.frame),updateMs:stats(this.update),renderSubmissionMs:stats(this.render)};}
}
