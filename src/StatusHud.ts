import type {ScreenBox} from './WeaponHud';

/** Mirror the status column away from the marine; retain a wider return margin. */
export function positionStatusHud(panel:HTMLElement,player:ScreenBox,width:number):void{
 const previous=panel.dataset.side==='right'?'right':'left';
 const rect=panel.getBoundingClientRect().toJSON() as ScreenBox;
 const left=previous==='right'?{top:rect.top,bottom:rect.bottom,left:width-rect.right,right:width-rect.left}:rect;
 const right={...left,left:width-left.right,right:width-left.left};
 const overlaps=(box:ScreenBox,padding:number)=>box.left-padding<player.right&&box.right+padding>player.left&&box.top-padding<player.bottom&&box.bottom+padding>player.top;
 const next=previous==='right'
  ?overlaps(right,24)||!overlaps(left,64)?'left':'right'
  :overlaps(left,24)&&!overlaps(right,24)?'right':'left';
 if(next!==previous)panel.dataset.side=next;
}

/** Preserve the familiar top-left vitals except when they cover the marine. */
export function positionVitalsHud(panel:HTMLElement,player:ScreenBox,height:number):void{
 const rect=panel.getBoundingClientRect(),top=panel.parentElement!.getBoundingClientRect().top;
 const inset=Number.parseFloat(getComputedStyle(panel).getPropertyValue('--vitals-bottom'));
 const upper={left:rect.left,right:rect.right,top,bottom:top+rect.height};
 const lower={...upper,top:height-inset-rect.height,bottom:height-inset};
 const overlaps=(box:ScreenBox,padding:number)=>box.left-padding<player.right&&box.right+padding>player.left&&box.top-padding<player.bottom&&box.bottom+padding>player.top;
 const previous=panel.dataset.anchor==='bottom'?'bottom':'top';
 const next=previous==='bottom'
  ?overlaps(lower,24)||!overlaps(upper,64)?'top':'bottom'
  :overlaps(upper,24)&&!overlaps(lower,24)?'bottom':'top';
 if(next!==previous)panel.dataset.anchor=next;
}
