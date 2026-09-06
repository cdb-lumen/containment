import assert from 'node:assert/strict';

export function evidenceOptions(args) {
  const values=new Set(['out','start','limit','quality','expect','expect-environments','rooms','viewport','width','height']);
  const flags=new Set(['inventory-only','append','verify-all','gameplay-all']);
  for(const arg of args) {
    const match=/^--([^=]+)(?:=(.*))?$/.exec(arg);
    assert.ok(match && (match[2]===undefined?flags.has(match[1]):values.has(match[1])),`Unknown option ${arg}`);
  }
  const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
  const start=Number(option('start','0')),limit=Number(option('limit','1000'));
  assert.ok(Number.isInteger(start)&&start>=0&&Number.isInteger(limit)&&limit>0,'Invalid start/limit');
  const named={desktop:'1280x900',phone:'390x844'};
  const size=option('viewport','desktop'), match=/^(\d+)x(\d+)$/.exec(named[size]??size);
  assert.ok(match,'Viewport must be desktop, phone or WIDTHxHEIGHT');
  const viewport={width:Number(option('width',match[1])),height:Number(option('height',match[2]))};
  assert.ok(Object.values(viewport).every(n=>Number.isInteger(n)&&n>0&&n<=8192),'Invalid viewport dimensions');
  const ids=option('rooms',null)?.split(',')??null;
  if(ids) assert.ok(ids.every(Boolean)&&new Set(ids).size===ids.length,'Room IDs must be nonempty and unique');
  return {option,start,limit,viewport,ids,gameplayAll:args.includes('--gameplay-all')};
}

export function selectRooms(rooms,options) {
  if(options.ids) for(const id of options.ids) assert.ok(rooms.some(r=>r.roomId===id||r.templateId===id),`Unknown room ${id}`);
  const scope=options.ids?rooms.filter(r=>options.ids.includes(r.roomId)||options.ids.includes(r.templateId)):rooms;
  const selected=scope.slice(options.start,options.start+options.limit);
  assert.ok(selected.length,'Empty capture range');
  return {scope,selected};
}

export function captureModes(room,total,options) {
  return ['overview',...(options.gameplayAll||[0,Math.floor(total/2),total-1].includes(room.index)?['gameplay']:[])];
}
