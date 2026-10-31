export type ScreenBox={left:number;top:number;right:number;bottom:number};
export type HudSide='left'|'right';
const overlaps=(a:ScreenBox,b:ScreenBox,padding=0)=>a.left-padding<b.right&&a.right+padding>b.left&&a.top-padding<b.bottom&&a.bottom+padding>b.top;

/** Keep the read-only ammo panel opposite the marine, with room to avoid flicker. */
export function weaponHudSide(normal:ScreenBox,player:ScreenBox,width:number,previous:HudSide):HudSide{
 const left={top:normal.top,bottom:normal.bottom,left:width-normal.right,right:width-normal.left};
 if(previous==='left'){
  if(overlaps(left,player,24)||!overlaps(normal,player,64))return 'right';
  return 'left';
 }
 return overlaps(normal,player,24)&&!overlaps(left,player,24)?'left':'right';
}

export function positionWeaponHud(panel:HTMLElement,player:ScreenBox,width:number):void{
 // The picker and hint share a compact lower corner; include both in clearance.
 const picker=document.getElementById('weapon-picker');
 const hint=document.querySelector<HTMLElement>('.desktop-hint');
 if(picker&&hint){
  const previous:HudSide=picker.dataset.side==='left'?'left':'right';
  const box=picker.getBoundingClientRect(),hintBox=hint.getBoundingClientRect();
  const union={left:Math.min(box.left,hintBox.left),right:Math.max(box.right,hintBox.right),top:Math.min(box.top,hintBox.top),bottom:Math.max(box.bottom,hintBox.bottom)};
  const normal=previous==='left'?{...union,left:width-union.right,right:width-union.left}:union;
  const next=weaponHudSide(normal,player,width,previous);
  picker.dataset.side=next;hint.dataset.side=next;
  // Wrapping on narrow desktop windows must not collide with the ammo readout.
  panel.style.bottom=`${innerHeight-box.top+24}px`;
 }
 const previous:HudSide=panel.dataset.side==='left'?'left':'right';
 const rect=panel.getBoundingClientRect();
 const normal=previous==='left'?{top:rect.top,bottom:rect.bottom,left:width-rect.right,right:width-rect.left}:rect;
 const next=weaponHudSide(normal,player,width,previous);
 if(next!==previous)panel.dataset.side=next;
}

/** A relocating button must retain a mouse gesture until its native click completes. */
export function captureWeaponPointer(button:HTMLButtonElement):void{
 button.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button===0)button.setPointerCapture(event.pointerId);
 });
}
