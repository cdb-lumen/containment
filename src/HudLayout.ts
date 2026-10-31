import {positionWeaponHud,type ScreenBox} from './WeaponHud';
import {positionStatusHud,positionVitalsHud} from './StatusHud';

type Group={elements:HTMLElement[];box:ScreenBox;previous?:ScreenBox};
const previous=new WeakMap<HTMLElement,ScreenBox>();
const intersects=(a:ScreenBox,b:ScreenBox,pad=0)=>a.left-pad<b.right&&a.right+pad>b.left&&a.top-pad<b.bottom&&a.bottom+pad>b.top;
const distance=(a:ScreenBox,b:ScreenBox)=>Math.abs(a.left-b.left)+Math.abs(a.top-b.top);
const rect=(el:HTMLElement):ScreenBox=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
const union=(boxes:ScreenBox[]):ScreenBox=>({left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))});

/** Place existing HUD panels together. Keep their DOM, focus and input semantics;
 * translations are measured afresh after resize/content changes, never accumulated. */
export function positionHudPanels(player:ScreenBox,width:number,height:number):boolean{
 const selectors=[['#status-hud'],['#weapon-picker','.desktop-hint'],['.weapon-hud'],['.vitals'],['#boss-hud']];
 const groups:Group[]=selectors.map(ids=>({elements:ids.map(id=>document.querySelector<HTMLElement>(id)).filter((el):el is HTMLElement=>!!el&&el.getClientRects().length>0),box:{left:0,right:0,top:0,bottom:0}})).filter(g=>g.elements.length);
 for(const g of groups)for(const el of g.elements)el.style.translate='';
 const ammo=document.querySelector<HTMLElement>('.weapon-hud'),status=document.getElementById('status-hud'),vitals=document.querySelector<HTMLElement>('.vitals');
 if(ammo)positionWeaponHud(ammo,player,width);
 if(status)positionStatusHud(status,player,width);
 if(vitals)positionVitalsHud(vitals,player,height);
 for(const g of groups){g.box=union(g.elements.map(rect));g.previous=previous.get(g.elements[0]);}
 // Larger panels constrain the available space most. Small readouts can use the
 // remaining gaps, including opposite upper corners in short desktop windows.
 groups.sort((a,b)=>(b.box.right-b.box.left)*(b.box.bottom-b.box.top)-(a.box.right-a.box.left)*(a.box.bottom-a.box.top));
 let attempts=0;
 const place=(index:number,placed:ScreenBox[]):ScreenBox[]|null=>{
  if(index===groups.length)return placed;
  if(++attempts>3000)return null;
  const g=groups[index],w=g.box.right-g.box.left,h=g.box.bottom-g.box.top;
  const xs=[g.box.left,12,width-w-12],ys=[g.box.top,12,height-h-12];
  for(const box of placed){xs.push(box.right+12,box.left-w-12);ys.push(box.bottom+12,box.top-h-12);}
  const candidates:ScreenBox[]=[];
  const add=(left:number,top:number)=>{const box={left,right:left+w,top,bottom:top+h};if(left>=8&&top>=8&&box.right<=width-8&&box.bottom<=height-8&&!intersects(box,player,12)&&!placed.some(other=>intersects(box,other,8))&&!candidates.some(other=>other.left===left&&other.top===top))candidates.push(box);};
  if(g.previous)add(g.previous.left,g.previous.top);
  for(const x of xs)for(const y of ys)add(x,y);
  const retain=g.previous&&intersects(g.box,player,64);
  candidates.sort((a,b)=>{
   const score=(box:ScreenBox)=>distance(box,g.box)+(g.previous?distance(box,g.previous)*.15:0)-(retain&&g.previous&&distance(box,g.previous)<.1?10000:0);
   return score(a)-score(b);
  });
  for(const candidate of candidates){const result=place(index+1,[...placed,candidate]);if(result)return result;}
  return null;
 };
 const layout=place(0,[]);
 if(!layout)return false;
 groups.forEach((g,i)=>{
  const box=layout[i],dx=box.left-g.box.left,dy=box.top-g.box.top;
  for(const el of g.elements)el.style.translate=`${dx}px ${dy}px`;
  previous.set(g.elements[0],box);
 });
 return true;
}
