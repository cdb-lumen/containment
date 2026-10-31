import fs from 'node:fs';
import ts from '/home/chernodubv/dev/alien-shooter-containment/node_modules/typescript/lib/typescript.js';
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && context.parentURL) {
    const url = new URL(specifier, context.parentURL);
    if (!/\.[a-z]+$/i.test(url.pathname) && fs.existsSync(new URL(url.href + '.ts'))) return {url:url.href+'.ts',shortCircuit:true};
  }
  return next(specifier, context);
}
export async function load(url, context, next) {
  if (url.endsWith('.json')) return {format:'module',shortCircuit:true,source:'export default '+fs.readFileSync(new URL(url),'utf8')+';'};
  if (url.endsWith('.ts')) return {format:'module',shortCircuit:true,source:ts.transpileModule(fs.readFileSync(new URL(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText};
  return next(url, context);
}
