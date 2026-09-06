import type {RunNode} from './types';
export function progressionFor(node:RunNode){
 const modern=node.id.includes(':v2-'),act=Math.min(2,Math.floor(node.depth/4));
 return Object.freeze({act,health:modern?1+node.depth*.045+act*.10:1,damage:modern?1+node.depth*.014+act*.035:1,speed:modern?Math.min(1.14,1+node.depth*.008+act*.018):1,eliteHealth:modern?1.65:2,eliteDamage:modern?1.2:2,specials:modern,guardian:modern&&(node.depth===3||node.depth===7)});
}
