import type {Point} from '../roguelike/types';
/** Stage1 Room16 silhouette in game XY. Sealed low solid, never a floor opening. */
export const SWARM_ORGAN:readonly Point[]=Object.freeze([
 [370,130],[415,115],[550,210],[575,220],[585,205],[615,205],
 [625,220],[650,210],[785,115],[830,130],[685,255],[650,285],
 [625,310],[625,370],[575,370],[575,310],[550,285],[515,255],
].map(([x,y])=>Object.freeze({x,y})));
