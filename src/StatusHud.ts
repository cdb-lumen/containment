import type {ScreenBox} from './WeaponHud';

/** Mirror the status column away from the marine; retain a wider return margin. */
export function positionStatusHud(panel:HTMLElement,player:ScreenBox,width:number):void{
 const previous=panel.dataset.side==='right'?'right':'left';
 const rect=panel.getBoundingClientRect();
 const left=previous==='right'?{top:rect.top,bottom:rect.bottom,left:width-rect.right,right:width-rect.left}:rect;
 const right={...left,left:width-left.right,right:width-left.left};
 const overlaps=(box:ScreenBox,padding:number)=>box.left-padding<player.right&&box.right+padding>player.left&&box.top-padding<player.bottom&&box.bottom+padding>player.top;
 const next=previous==='right'
  ?overlaps(right,24)||!overlaps(left,64)?'left':'right'
  :overlaps(left,24)&&!overlaps(right,24)?'right':'left';
 if(next!==previous)panel.dataset.side=next;
}
