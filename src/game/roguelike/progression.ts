import type {RunNode} from './types';
export function progressionFor(node:RunNode){
 const story=node.id.includes(':v3-'),modern=story||node.id.includes(':v2-');
 const depth=story?node.depth*11/19:node.depth,act=Math.min(2,Math.floor(depth/4));
 return Object.freeze({act,health:modern?1+depth*.045+act*.10:1,damage:modern?1+depth*.014+act*.035:1,speed:modern?Math.min(1.14,1+depth*.008+act*.018):1,eliteHealth:modern?1.65:2,eliteDamage:modern?1.2:2,specials:modern,guardian:modern&&(story?node.depth===5||node.depth===15:node.depth===3||node.depth===7)});
}
