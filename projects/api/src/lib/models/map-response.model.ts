import { Bounds } from './bounds.model';
import { Service } from './service.model';
import { AppLayer } from './app-layer.model';
import { CoordinateReferenceSystem } from './coordinate-reference-system.enum';

export interface MapResponse {
    initialExtent: Bounds | null;
    maxExtent: Bounds | null;
    services: Service[];
    baseLayers: AppLayer[];
    crs: CoordinateReferenceSystem;
}
