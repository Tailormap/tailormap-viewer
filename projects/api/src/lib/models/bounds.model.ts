import { CoordinateReferenceSystem } from './coordinate-reference-system.enum';

export interface Bounds {
    miny: number;
    minx: number;
    maxy: number;
    maxx: number;
    crs: CoordinateReferenceSystem;
}
