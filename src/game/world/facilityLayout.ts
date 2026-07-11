import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants';

export type FacilityPoint = Readonly<{
  x: number;
  y: number;
}>;

export type FacilityRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type FacilityRoom = FacilityRect &
  Readonly<{
    id: string;
    label: string;
    floor: 'plate' | 'grate' | 'reinforced';
  }>;

export type FacilityWall = FacilityRect &
  Readonly<{
    id: string;
  }>;

export type FacilityDoor = FacilityRect &
  Readonly<{
    id: string;
    label: string;
    unlockWave: number;
    initialState: 'open' | 'closed';
    axis: 'horizontal' | 'vertical';
  }>;

export type FacilityProp = FacilityRect &
  Readonly<{
    id: string;
    kind: 'console' | 'crate' | 'barrel' | 'generator' | 'teleporter';
    rotation?: number;
  }>;

export type FacilityBreach = FacilityPoint &
  Readonly<{
    id: string;
    unlockWave: number;
    facing: 'north' | 'south' | 'east' | 'west';
  }>;

export type FacilityHazardZone = FacilityRect &
  Readonly<{
    id: string;
    approachDoorId: string;
  }>;

export type QueenArena = FacilityRect &
  Readonly<{
    roomId: string;
    safeCenter: FacilityPoint;
    safeRadius: number;
  }>;

export type FacilityLayout = Readonly<{
  bounds: FacilityRect;
  playerSpawn: FacilityPoint;
  queenArena: QueenArena;
  armoryZone: FacilityRect;
  turretZone: FacilityRect;
  rooms: readonly FacilityRoom[];
  walls: readonly FacilityWall[];
  doors: readonly FacilityDoor[];
  props: readonly FacilityProp[];
  breaches: readonly FacilityBreach[];
  hazardZones: readonly FacilityHazardZone[];
}>;

const deepFreeze = <T>(value: T): T => {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};

const layout: FacilityLayout = {
  bounds: { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT },
  playerSpawn: { x: 360, y: 280 },
  queenArena: {
    roomId: 'room-queen-containment',
    x: 1640,
    y: 720,
    width: 860,
    height: 640,
    safeCenter: { x: 2060, y: 1040 },
    safeRadius: 180,
  },
  armoryZone: { x: 1250, y: 940, width: 250, height: 260 },
  turretZone: { x: 1290, y: 520, width: 210, height: 150 },
  rooms: [
    {
      id: 'room-loading-dock',
      label: 'LOADING DOCK',
      floor: 'plate',
      x: 80,
      y: 80,
      width: 620,
      height: 400,
    },
    {
      id: 'room-storage',
      label: 'STORAGE VAULT',
      floor: 'grate',
      x: 80,
      y: 520,
      width: 620,
      height: 340,
    },
    {
      id: 'room-generator',
      label: 'GENERATOR HALL',
      floor: 'reinforced',
      x: 80,
      y: 900,
      width: 620,
      height: 460,
    },
    {
      id: 'room-central-processing',
      label: 'CENTRAL PROCESSING',
      floor: 'plate',
      x: 760,
      y: 80,
      width: 820,
      height: 660,
    },
    {
      id: 'room-medical-lab',
      label: 'MEDICAL / LAB',
      floor: 'plate',
      x: 760,
      y: 800,
      width: 400,
      height: 560,
    },
    {
      id: 'room-armory',
      label: 'ARMORY',
      floor: 'reinforced',
      x: 1200,
      y: 800,
      width: 380,
      height: 560,
    },
    {
      id: 'room-transit-nexus',
      label: 'CONTAINMENT TRANSIT',
      floor: 'grate',
      x: 1640,
      y: 80,
      width: 840,
      height: 560,
    },
    {
      id: 'room-queen-containment',
      label: 'QUEEN CONTAINMENT / TELEPORTER',
      floor: 'reinforced',
      x: 1640,
      y: 720,
      width: 860,
      height: 640,
    },
  ],
  walls: [
    { id: 'wall-north-a', x: 0, y: 0, width: 260, height: 40 },
    { id: 'wall-north-b', x: 340, y: 0, width: 880, height: 40 },
    { id: 'wall-north-c', x: 1300, y: 0, width: 820, height: 40 },
    { id: 'wall-north-d', x: 2200, y: 0, width: 360, height: 40 },
    { id: 'wall-south-a', x: 0, y: 1400, width: 420, height: 40 },
    { id: 'wall-south-b', x: 500, y: 1400, width: 900, height: 40 },
    { id: 'wall-south-c', x: 1480, y: 1400, width: 620, height: 40 },
    { id: 'wall-south-d', x: 2180, y: 1400, width: 380, height: 40 },
    { id: 'wall-west-a', x: 0, y: 40, width: 40, height: 220 },
    { id: 'wall-west-b', x: 0, y: 340, width: 40, height: 700 },
    { id: 'wall-west-c', x: 0, y: 1120, width: 40, height: 280 },
    { id: 'wall-east-a', x: 2520, y: 40, width: 40, height: 500 },
    { id: 'wall-east-b', x: 2520, y: 620, width: 40, height: 500 },
    { id: 'wall-east-c', x: 2520, y: 1200, width: 40, height: 200 },
    { id: 'wall-loading-east-a', x: 700, y: 80, width: 48, height: 135 },
    { id: 'wall-loading-east-b', x: 700, y: 345, width: 48, height: 515 },
    { id: 'wall-generator-east-a', x: 700, y: 900, width: 48, height: 170 },
    { id: 'wall-generator-east-b', x: 700, y: 1210, width: 48, height: 150 },
    { id: 'wall-processing-south-a', x: 760, y: 740, width: 160, height: 48 },
    { id: 'wall-processing-south-b', x: 1060, y: 740, width: 320, height: 48 },
    { id: 'wall-processing-south-c', x: 1500, y: 740, width: 80, height: 48 },
    { id: 'wall-transit-west-a', x: 1592, y: 80, width: 48, height: 210 },
    { id: 'wall-transit-west-b', x: 1592, y: 430, width: 48, height: 210 },
    { id: 'wall-queen-west-a', x: 1592, y: 720, width: 48, height: 200 },
    { id: 'wall-queen-west-b', x: 1592, y: 1080, width: 48, height: 280 },
    { id: 'wall-queen-north-a', x: 1640, y: 672, width: 310, height: 48 },
    { id: 'wall-queen-north-b', x: 2170, y: 672, width: 310, height: 48 },
  ],
  doors: [
    {
      id: 'door-loading-processing',
      label: 'DOCK BULKHEAD',
      x: 700,
      y: 215,
      width: 48,
      height: 130,
      axis: 'vertical',
      unlockWave: 0,
      initialState: 'open',
    },
    {
      id: 'door-storage-processing',
      label: 'CARGO LOCK',
      x: 700,
      y: 710,
      width: 48,
      height: 110,
      axis: 'vertical',
      unlockWave: 2,
      initialState: 'closed',
    },
    {
      id: 'door-generator-lab',
      label: 'POWER LOCK',
      x: 700,
      y: 1070,
      width: 48,
      height: 140,
      axis: 'vertical',
      unlockWave: 3,
      initialState: 'closed',
    },
    {
      id: 'door-processing-medical',
      label: 'LAB SEAL',
      x: 920,
      y: 740,
      width: 140,
      height: 48,
      axis: 'horizontal',
      unlockWave: 1,
      initialState: 'closed',
    },
    {
      id: 'door-processing-armory',
      label: 'ARMORY SEAL',
      x: 1380,
      y: 740,
      width: 120,
      height: 48,
      axis: 'horizontal',
      unlockWave: 4,
      initialState: 'closed',
    },
    {
      id: 'door-processing-transit',
      label: 'TRANSIT SPINE',
      x: 1592,
      y: 290,
      width: 48,
      height: 140,
      axis: 'vertical',
      unlockWave: 2,
      initialState: 'closed',
    },
    {
      id: 'door-armory-queen',
      label: 'CONTAINMENT LOCK',
      x: 1592,
      y: 920,
      width: 48,
      height: 160,
      axis: 'vertical',
      unlockWave: 7,
      initialState: 'closed',
    },
    {
      id: 'door-transit-queen',
      label: 'CROWN GATE',
      x: 1950,
      y: 672,
      width: 220,
      height: 48,
      axis: 'horizontal',
      unlockWave: 8,
      initialState: 'closed',
    },
  ],
  props: [
    { id: 'prop-dock-console', kind: 'console', x: 145, y: 130, width: 70, height: 42 },
    { id: 'prop-dock-crate-a', kind: 'crate', x: 500, y: 130, width: 72, height: 72 },
    { id: 'prop-dock-crate-b', kind: 'crate', x: 575, y: 205, width: 64, height: 64 },
    { id: 'prop-storage-crate-a', kind: 'crate', x: 150, y: 590, width: 78, height: 78 },
    { id: 'prop-storage-crate-b', kind: 'crate', x: 270, y: 680, width: 78, height: 78 },
    { id: 'prop-storage-barrel', kind: 'barrel', x: 560, y: 740, width: 48, height: 48 },
    { id: 'prop-generator-a', kind: 'generator', x: 150, y: 1000, width: 150, height: 100 },
    { id: 'prop-generator-b', kind: 'generator', x: 430, y: 1160, width: 150, height: 100 },
    { id: 'prop-processing-console', kind: 'console', x: 860, y: 170, width: 80, height: 44 },
    { id: 'prop-medical-console', kind: 'console', x: 820, y: 880, width: 76, height: 44 },
    { id: 'prop-armory-crate', kind: 'crate', x: 1250, y: 850, width: 72, height: 72 },
    { id: 'prop-transit-console', kind: 'console', x: 1710, y: 160, width: 80, height: 44 },
    { id: 'prop-queen-teleporter', kind: 'teleporter', x: 2280, y: 1180, width: 120, height: 120 },
    { id: 'prop-queen-console', kind: 'console', x: 1710, y: 1240, width: 80, height: 44 },
  ],
  breaches: [
    { id: 'breach-north-dock', x: 300, y: 64, unlockWave: 0, facing: 'south' },
    { id: 'breach-north-core', x: 1260, y: 64, unlockWave: 1, facing: 'south' },
    { id: 'breach-north-transit', x: 2160, y: 64, unlockWave: 4, facing: 'south' },
    { id: 'breach-west-dock', x: 64, y: 300, unlockWave: 0, facing: 'east' },
    { id: 'breach-west-power', x: 64, y: 1080, unlockWave: 3, facing: 'east' },
    { id: 'breach-east-transit', x: 2496, y: 580, unlockWave: 4, facing: 'west' },
    { id: 'breach-east-queen', x: 2496, y: 1160, unlockWave: 7, facing: 'west' },
    { id: 'breach-south-storage', x: 460, y: 1376, unlockWave: 2, facing: 'north' },
    { id: 'breach-south-armory', x: 1440, y: 1376, unlockWave: 5, facing: 'north' },
    { id: 'breach-south-queen', x: 2140, y: 1376, unlockWave: 8, facing: 'north' },
  ],
  hazardZones: [
    {
      id: 'hazard-loading-processing',
      approachDoorId: 'door-loading-processing',
      x: 620,
      y: 264,
      width: 80,
      height: 32,
    },
    {
      id: 'hazard-processing-armory',
      approachDoorId: 'door-processing-armory',
      x: 1400,
      y: 692,
      width: 80,
      height: 48,
    },
    {
      id: 'hazard-processing-transit',
      approachDoorId: 'door-processing-transit',
      x: 1512,
      y: 344,
      width: 80,
      height: 32,
    },
    {
      id: 'hazard-armory-containment',
      approachDoorId: 'door-armory-queen',
      x: 1512,
      y: 984,
      width: 80,
      height: 32,
    },
    {
      id: 'hazard-transit-queen',
      approachDoorId: 'door-transit-queen',
      x: 1996,
      y: 640,
      width: 128,
      height: 32,
    },
  ],
};

export const FACILITY_LAYOUT: FacilityLayout = deepFreeze(layout);
