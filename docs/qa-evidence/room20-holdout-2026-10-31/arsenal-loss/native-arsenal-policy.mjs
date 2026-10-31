/** Read-only test-pilot choices. Never grants ammo or changes game state. */
export function arsenalChoice(current,ammo){
 const order=['plasma','shotgun','rifle','rocket'];
 const threshold={plasma:8,shotgun:3,rifle:12,rocket:2};
 const total=id=>Math.max(0,ammo[id]?.magazine??0)+Math.max(0,ammo[id]?.reserve??0);
 if(current!=='pistol'&&total(current)>0)return null;
 const next=order.find(id=>total(id)>=(current==='pistol'?threshold[id]:1))??'pistol';
 return next===current?null:{weapon:next,key:{pistol:'1',rifle:'2',shotgun:'3',plasma:'4',rocket:'5'}[next],reason:current==='pistol'?'finite batch replenished':'selected finite weapon exhausted'};
}
