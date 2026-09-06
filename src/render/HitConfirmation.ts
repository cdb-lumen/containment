type Marker={hidden:boolean|string;style:{left:string;top:string;opacity:string};dataset:{contact?:string}};
/** One reusable, silent visual acknowledgement. No timer survives a screen change. */
export class HitConfirmation {
 private life=0;private active=false;
 constructor(private marker:Marker){}
 point(x:number,y:number){this.active=true;this.marker.style.left=`${x}px`;this.marker.style.top=`${y}px`;}
 confirm(contact:'damage'|'armor'|'blocked'){if(!this.active)return;this.life=.1;this.marker.dataset.contact=contact;this.marker.hidden=false;this.marker.style.opacity='.65';}
 update(dt:number,playing:boolean){this.life=playing?Math.max(0,this.life-dt):0;this.marker.hidden=this.life===0;this.marker.style.opacity=String(.65*Math.min(1,this.life/.1));}
 clear(){this.life=0;this.active=false;this.marker.hidden=true;}
}
