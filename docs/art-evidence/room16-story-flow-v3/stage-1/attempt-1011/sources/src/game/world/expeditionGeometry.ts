import type { Point, Rect, RoomTemplate, RunNode } from '../roguelike/types';
import { ROOM_TEMPLATES } from '../roguelike/roomTemplates';
import type { FacilityBreach, QueenArena } from './facilityLayout';
import { segmentIntersectsRect } from '../input/aimAssist';
import {clearPolygonTopology} from './polygonGeometry';

export type ExpeditionGeometry = Readonly<{
  bounds: Rect;
  boundary?: readonly Point[];
  voids?: readonly (readonly Point[])[];
  blockers: readonly Rect[];
  boundaryWalls: readonly Rect[];
  breaches: readonly FacilityBreach[];
  playerSpawn: Point;
  exitPoint: Point;
  bossSpawn: Point;
  queenArena: QueenArena;
}>;

/** Perimeter solids sit outside authored bounds, preserving authored clearance. */
export function createExpeditionGeometry(node: RunNode): ExpeditionGeometry {
  const template = ROOM_TEMPLATES[node.templateId];
  if (!template) throw new Error('Unknown expedition room template.');
  const { width, height } = template;
  const bounds = Object.freeze({ x: 0, y: 0, width, height });
  const boundaryWalls = Object.freeze([
    { x: -32, y: -32, width: width + 64, height: 32 },
    { x: -32, y: height, width: width + 64, height: 32 },
    { x: -32, y: 0, width: 32, height },
    { x: width, y: 0, width: 32, height },
  ].map(rect => Object.freeze(rect)));
  const bossSpawn = Object.freeze({ x: width / 2, y: height / 2 });
  const breaches: readonly FacilityBreach[] = Object.freeze(template.breaches.map((point, index) => Object.freeze({
    ...point, id: `${node.id}:breach-${index}`, unlockWave: 0,
    // Existing HordeRuntime adds a 56-unit inward offset. All corners face inward.
    facing: point.x < width / 2 ? 'east' as const : 'west' as const,
  })));
  return Object.freeze({
    bounds, boundaryWalls, blockers: Object.freeze([...boundaryWalls, ...template.obstacles]),
    boundary: template.boundary, voids: template.voids,
    breaches, playerSpawn: template.spawn, exitPoint: template.exit, bossSpawn,
    queenArena: Object.freeze({ ...bounds, roomId: node.id, safeCenter: bossSpawn, safeRadius: 180 }),
  });
}

export function canOccupyExpedition(geometry: ExpeditionGeometry, point: Point, radius: number): boolean {
  if (!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(radius)||radius < 0) return false;
  if (!clearPolygonTopology(geometry,point,point,radius)) return false;
  const bounds = geometry.bounds;
  if (point.x - radius < bounds.x || point.y - radius < bounds.y
    || point.x + radius > bounds.x + bounds.width || point.y + radius > bounds.y + bounds.height) return false;
  for(const rect of geometry.blockers){
    const dx = point.x - Math.max(rect.x, Math.min(rect.x + rect.width, point.x));
    const dy = point.y - Math.max(rect.y, Math.min(rect.y + rect.height, point.y));
    if(radius===0?dx===0&&dy===0:dx*dx+dy*dy<radius*radius)return false;
  }return true;
}

export function hasClearExpeditionShot(geometry: ExpeditionGeometry, from: Point, to: Point): boolean {
  const inBounds = (point: Point): boolean => point.x >= geometry.bounds.x && point.y >= geometry.bounds.y
    && point.x <= geometry.bounds.x + geometry.bounds.width && point.y <= geometry.bounds.y + geometry.bounds.height;
  return [from.x, from.y, to.x, to.y].every(Number.isFinite)
    && inBounds(from) && inBounds(to)
    && clearPolygonTopology(geometry,from,to)
    && geometry.blockers.every(rect => !segmentIntersectsRect(from, to, rect));
}

export function canTraverseExpedition(geometry: ExpeditionGeometry, from: Point, to: Point, radius: number): boolean {
  return canOccupyExpedition(geometry,from,radius) && canOccupyExpedition(geometry,to,radius)
    && clearPolygonTopology(geometry,from,to,radius)
    && geometry.blockers.every(rect=>!segmentIntersectsRect(from,to,{x:rect.x-radius,y:rect.y-radius,width:rect.width+radius*2,height:rect.height+radius*2}));
}

export function expeditionTemplate(node: RunNode): RoomTemplate {
  const template = ROOM_TEMPLATES[node.templateId];
  if (!template) throw new Error('Unknown expedition room template.');
  return template;
}
