export const families: string[];
export function geometryBatchKey(geometry:import('three').BufferGeometry):string;
export const assetVariants: Record<'before'|'budget',Record<string,string>>;
export const placements: {family:string;x:number;z:number;angle:number;dx:number;dz:number}[];
export function transformAuthored(code:string):string;
export function reserveOutput(argument?:string):Promise<string>;
