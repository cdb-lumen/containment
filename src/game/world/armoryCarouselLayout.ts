import type {Point} from '../roguelike/types';

export const ARMORY_CENTER=Object.freeze({x:600,y:450});
const polar=(radius:number,degrees:number):Point=>Object.freeze({x:600+radius*Math.cos(degrees*Math.PI/180),y:450+radius*Math.sin(degrees*Math.PI/180)});
// One continuous counter, open to the south. The ordinary floor within the U
// remains traversable; these polygons describe sealed equipment solids only.
export const ARMORY_COUNTER=Object.freeze([
 ...Array.from({length:25},(_,i)=>polar(300,150+i*10)),
 ...Array.from({length:25},(_,i)=>polar(210,390-i*10)),
]);
export const ARMORY_CAROUSEL=Object.freeze(Array.from({length:48},(_,i)=>polar(80,i*360/48)));
export const ARMORY_SOLIDS=Object.freeze([ARMORY_COUNTER,ARMORY_CAROUSEL]);
