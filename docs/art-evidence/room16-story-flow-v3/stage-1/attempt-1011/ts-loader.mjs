import {existsSync} from 'node:fs';
export async function resolve(specifier,context,nextResolve){
 if(specifier.startsWith('.') && context.parentURL && !/\.[a-z]+$/i.test(specifier)){
  const url=new URL(specifier+'.ts',context.parentURL);
  if(existsSync(url))return nextResolve(url.href,context);
 }
 return nextResolve(specifier,context);
}
