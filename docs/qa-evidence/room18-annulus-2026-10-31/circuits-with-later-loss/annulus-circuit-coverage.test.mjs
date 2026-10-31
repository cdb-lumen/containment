import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyCircuitCoverage} from './annulus-circuit-coverage.mjs';
function fixture(){const frames=[];for(let i=0;i<=200;i++){const a=Math.PI+(i<=100?i:200-i)*Math.PI/50;frames.push({i,routeIndex:i<100?1:i<200?6:11,player:{x:600+300*Math.cos(a),y:440+300*Math.sin(a)}});}return frames;}
test('requires two opposite complete continuous circuits',()=>{const r=verifyCircuitCoverage(fixture());assert(Math.abs(r[0].windingRadians-2*Math.PI)<1e-6);assert(Math.abs(r[1].windingRadians+2*Math.PI)<1e-6);});
test('waypoint labels without angular traversal fail',()=>{const f=fixture();for(const frame of f)frame.player={x:300,y:440};assert.throws(()=>verifyCircuitCoverage(f),/wind once/);});
test('two same-direction circuits fail',()=>{const f=fixture();for(let i=101;i<=200;i++)f[i].player={x:600+300*Math.cos(Math.PI+i*Math.PI/50),y:440+300*Math.sin(Math.PI+i*Math.PI/50)};assert.throws(()=>verifyCircuitCoverage(f),/opposite/);});
test('missing final waypoint fails',()=>{assert.throws(()=>verifyCircuitCoverage(fixture().slice(0,-1)),/start\/end/);});
