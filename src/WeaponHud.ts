export type ScreenBox={left:number;top:number;right:number;bottom:number};
export type HudSide='left'|'right';
const overlaps=(a:ScreenBox,b:ScreenBox,padding=0)=>a.left-padding<b.right&&a.right+padding>b.left&&a.top-padding<b.bottom&&a.bottom+padding>b.top;

/** Keep the read-only ammo panel opposite the marine, with room to avoid flicker. */
export function weaponHudSide(normal:ScreenBox,player:ScreenBox,width:number,previous:HudSide):HudSide{
 const left={...normal,left:width-normal.right,right:width-normal.left};
 if(previous==='left'){
  if(overlaps(left,player,24)||!overlaps(normal,player,64))return 'right';
  return 'left';
 }
 return overlaps(normal,player,24)&&!overlaps(left,player,24)?'left':'right';
}

export function positionWeaponHud(panel:HTMLElement,player:ScreenBox,width:number):void{
 const previous:HudSide=panel.dataset.side==='left'?'left':'right';
 const rect=panel.getBoundingClientRect();
 const normal=previous==='left'?{top:rect.top,bottom:rect.bottom,left:width-rect.right,right:width-rect.left}:rect;
 const next=weaponHudSide(normal,player,width,previous);
 if(next!==previous)panel.dataset.side=next;
}
