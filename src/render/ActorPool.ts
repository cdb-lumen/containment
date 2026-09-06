import {alien,disposeModel,type ActorModel} from './models';
/** Retain prepared rigs/materials after death instead of rebuilding and releasing GPU programs. */
export class ActorPool {
 private free=new Map<string,ActorModel[]>();
 private keys=new WeakMap<ActorModel,string>();
 take(kind:string,elite=false){
  const key=`${kind}:${elite}`,list=this.free.get(key);const model=list?.pop()??alien(kind,elite);
  this.keys.set(model,key);return model;
 }
 release(model:ActorModel){
  model.root.removeFromParent();const key=this.keys.get(model);if(!key){disposeModel(model.root);return;}
  const list=this.free.get(key)??[];if(list.includes(model))return;
  model.reset?.();if(list.length<4){list.push(model);this.free.set(key,list);}else{model.stop?.();disposeModel(model.root);}
 }
 dispose(){for(const list of this.free.values())for(const model of list){model.stop?.();disposeModel(model.root);}this.free.clear();}
}
