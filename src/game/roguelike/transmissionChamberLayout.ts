import type {Point} from './types';
/** Stage1 attempt962 reservations, with the antenna foundation fitted to its hardware.
 * These are sealed equipment footprints, not pits, shields or walkable platforms. */
const footprint=(pairs:readonly (readonly [number,number])[]):readonly Point[]=>Object.freeze(pairs.map(([x,y])=>Object.freeze({x,y})));
export const TRANSMISSION_BLOCKOUT=Object.freeze([
 {id:'waveguide--150',footprint:footprint([[462.091423,380.998098],[406.927992,357.397338],[431.927992,314.096068],[479.948566,350.06862]])},
 {id:'waveguide--90',footprint:footprint([[582.142857,291.066718],[575,231.493405],[625,231.493405],[617.857143,291.066718]])},
 {id:'waveguide--30',footprint:footprint([[720.051434,350.06862],[768.072008,314.096068],[793.072008,357.397338],[737.908577,380.998098]])},
 {id:'waveguide-30',footprint:footprint([[737.908577,499.001902],[793.072008,522.602662],[768.072008,565.903932],[720.051434,529.93138]])},
 {id:'waveguide-90',footprint:footprint([[617.857143,588.933282],[625,648.506595],[575,648.506595],[582.142857,588.933282]])},
 {id:'waveguide-150',footprint:footprint([[479.948566,529.93138],[431.927992,565.903932],[406.927992,522.602662],[462.091423,499.001902]])},
 {id:'exposed-feed',footprint:footprint([[660,440],[642.426407,482.426407],[600,500],[557.573593,482.426407],[540,440],[557.573593,397.573593],[600,380],[642.426407,397.573593]])},
 {id:'antenna-truss',footprint:footprint([[560,84],[640,84],[640,110],[560,110]])},
 {id:'southeast-desk',footprint:footprint([[850,620],[1000,620],[1000,685],[850,685]])},
].map(f=>Object.freeze(f)));
export const TRANSMISSION_TOPOLOGY=Object.freeze({
 boundary:footprint([[0,0],[1200,0],[1200,880],[0,880]]),
 voids:Object.freeze(TRANSMISSION_BLOCKOUT.map(f=>f.footprint)),obstacles:Object.freeze([]),
 spawn:Object.freeze({x:100,y:440}),exit:Object.freeze({x:1100,y:440}),
 breaches:footprint([[100,100],[1100,100],[100,780],[1100,780]]),
});
