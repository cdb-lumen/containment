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
    kind: 'console' | 'crate' | 'barrel' | 'generator' | 'teleporter' | 'specimen' | 'coolant' | 'wreck' | 'armory' | 'turret';
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
      label: 'COLD STORAGE',
      floor: 'grate',
      x: 80,
      y: 520,
      width: 620,
      height: 340,
    },
    {
      id: 'room-generator',
      label: 'GENERATOR / COOLANT',
      floor: 'reinforced',
      x: 80,
      y: 900,
      width: 620,
      height: 460,
    },
    {
      id: 'room-central-processing',
      label: 'PROCESSING HALL',
      floor: 'plate',
      x: 760,
      y: 80,
      width: 820,
      height: 660,
    },
    {
      id: 'room-medical-lab',
      label: 'MEDICAL / SPECIMENS',
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
      label: 'SPECIMEN TRANSIT',
      floor: 'grate',
      x: 1640,
      y: 80,
      width: 840,
      height: 560,
    },
    {
      id: 'room-queen-containment',
      label: 'BIOREACTOR / QUEEN CONTAINMENT',
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
    // Continuous sector boundaries. Every opening is an actual door, never a bypass gap.
    { id: 'wall-cargo-a', x: 700, y: 40, width: 48, height: 175 },
    { id: 'wall-cargo-b', x: 700, y: 345, width: 48, height: 305 },
    { id: 'wall-cargo-c', x: 700, y: 830, width: 48, height: 240 },
    { id: 'wall-cargo-d', x: 700, y: 1210, width: 48, height: 190 },
    { id: 'wall-processing-south-a', x: 748, y: 740, width: 172, height: 48 },
    { id: 'wall-processing-south-b', x: 1100, y: 740, width: 260, height: 48 },
    { id: 'wall-processing-south-c', x: 1540, y: 740, width: 52, height: 48 },
    { id: 'wall-transit-west-a', x: 1592, y: 40, width: 48, height: 250 },
    { id: 'wall-transit-west-b', x: 1592, y: 470, width: 48, height: 450 },
    { id: 'wall-queen-west-b', x: 1592, y: 1120, width: 48, height: 280 },
    { id: 'wall-queen-north-a', x: 1640, y: 672, width: 310, height: 48 },
    { id: 'wall-queen-north-b', x: 2170, y: 672, width: 350, height: 48 },
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
      y: 650,
      width: 48,
      height: 180,
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
      width: 180,
      height: 48,
      axis: 'horizontal',
      unlockWave: 1,
      initialState: 'closed',
    },
    {
      id: 'door-processing-armory',
      label: 'ARMORY SEAL',
      x: 1360,
      y: 740,
      width: 180,
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
      height: 180,
      axis: 'vertical',
      unlockWave: 4,
      initialState: 'closed',
    },
    {
      id: 'door-armory-queen',
      label: 'CONTAINMENT LOCK',
      x: 1592,
      y: 920,
      width: 48,
      height: 200,
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
    // Cargo: staggered islands make short shotgun corners with an open escape lane.
    { id: 'prop-dock-console', kind: 'console', x: 140, y: 130, width: 90, height: 60 },
    { id: 'prop-dock-crate-a', kind: 'crate', x: 460, y: 155, width: 96, height: 96 },
    { id: 'prop-dock-crate-b', kind: 'crate', x: 490, y: 345, width: 96, height: 96 },
    { id: 'prop-dock-crate-c', kind: 'crate', x: 235, y: 405, width: 88, height: 88 },
    { id: 'prop-storage-crate-a', kind: 'crate', x: 160, y: 585, width: 96, height: 96 },
    { id: 'prop-storage-crate-b', kind: 'crate', x: 390, y: 585, width: 96, height: 96 },
    { id: 'prop-storage-crate-c', kind: 'crate', x: 250, y: 770, width: 96, height: 96 },
    { id: 'prop-storage-barrel', kind: 'barrel', x: 540, y: 820, width: 58, height: 58 },
    // Power: two large islands and a wide circuit for sustained kiting.
    { id: 'prop-generator-a', kind: 'generator', x: 145, y: 1020, width: 180, height: 120 },
    { id: 'prop-generator-b', kind: 'generator', x: 435, y: 1170, width: 180, height: 120 },
    { id: 'prop-generator-coolant', kind: 'coolant', x: 445, y: 940, width: 132, height: 88 },
    // Processing: asymmetric cover breaks cross-room fire without becoming a bunker.
    { id: 'prop-processing-console', kind: 'console', x: 855, y: 155, width: 120, height: 72 },
    { id: 'prop-processing-island-a', kind: 'generator', x: 1090, y: 285, width: 180, height: 120 },
    { id: 'prop-processing-island-b', kind: 'coolant', x: 920, y: 510, width: 156, height: 104 },
    { id: 'prop-processing-crate', kind: 'crate', x: 1390, y: 165, width: 88, height: 88 },
    // The medical wing reveals what the freight actually contained.
    { id: 'prop-medical-console', kind: 'console', x: 805, y: 875, width: 100, height: 60 },
    { id: 'prop-medical-specimen-a', kind: 'specimen', x: 825, y: 1090, width: 72, height: 96 },
    { id: 'prop-medical-specimen-b', kind: 'specimen', x: 1040, y: 1130, width: 72, height: 96 },
    { id: 'prop-medical-wreck', kind: 'wreck', x: 930, y: 1285, width: 80, height: 64 },
    { id: 'prop-armory-rack', kind: 'armory', x: 1335, y: 1030, width: 80, height: 80 },
    { id: 'prop-turret-station', kind: 'turret', x: 1355, y: 555, width: 80, height: 80 },
    { id: 'prop-armory-crate', kind: 'crate', x: 1250, y: 845, width: 88, height: 88 },
    { id: 'prop-armory-crate-b', kind: 'crate', x: 1480, y: 1215, width: 80, height: 80 },
    // Transit: offset specimen cars create two lanes and visible crossovers.
    { id: 'prop-transit-console', kind: 'console', x: 1720, y: 145, width: 100, height: 60 },
    { id: 'prop-transit-specimen-a', kind: 'specimen', x: 1870, y: 220, width: 96, height: 128 },
    { id: 'prop-transit-specimen-b', kind: 'specimen', x: 2200, y: 380, width: 96, height: 128 },
    { id: 'prop-transit-wreck', kind: 'wreck', x: 2040, y: 490, width: 120, height: 96 },
    // The queen owns the center. Perimeter equipment leaves the dodge circle clear.
    { id: 'prop-queen-teleporter', kind: 'teleporter', x: 2280, y: 1180, width: 120, height: 120 },
    { id: 'prop-queen-console', kind: 'console', x: 1710, y: 1240, width: 100, height: 60 },
    { id: 'prop-queen-coolant', kind: 'coolant', x: 2320, y: 800, width: 132, height: 88 },
    { id: 'prop-queen-wreck', kind: 'wreck', x: 1720, y: 790, width: 100, height: 80 },
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
