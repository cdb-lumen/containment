export type ElementalCue = 'freeze' | 'shatter' | 'reactor';
const durations:Record<ElementalCue,number>={freeze:.32,shatter:.24,reactor:.68};
/** Original synthesized mono cues; no downloaded samples or per-frame synthesis. */
export function elementalCueSamples(kind:ElementalCue,sampleRate:number):Float32Array{
 if(!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Invalid audio sample rate');
 const duration=durations[kind],samples=new Float32Array(Math.ceil(duration*sampleRate));
 let seed=0x12f3ab91,previous=0;
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate,u=t/duration;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/0x80000000-1,air=(noise-previous)*.5;previous=noise;
  const attack=Math.min(1,t/.006),release=Math.max(0,1-u)**2;
  let signal:number;
  if(kind==='freeze'){
   // A rising glassy squeeze and fine air, distinct from the impact below.
   const phase=2*Math.PI*(950*t+1800*t*t);
   signal=(Math.sin(phase)*.23+Math.sin(phase*1.51)*.10+air*.10)*attack*release;
  }else if(kind==='shatter'){
   const tail=Math.exp(-t*17);
   signal=(air*.40+(Math.sin(2*Math.PI*2381*t)+.6*Math.sin(2*Math.PI*3677*t))*.12)*attack*tail*release;
  }else{
   // A short low induction surge, not an alarm or a looping room ambience.
   const phase=2*Math.PI*(115*t-25*t*t);
   signal=(Math.sin(phase)*.30+Math.sin(phase*2)*.10+Math.sin(phase*3.03)*.045+air*.025)*attack*release;
  }
  samples[i]=signal;
 }
 // Exactly silent endpoints prevent clicks independent of the voice envelope.
 samples[0]=samples[samples.length-1]=0;
 return samples;
}
