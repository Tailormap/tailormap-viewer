import { CoordinateReferenceSystem } from './coordinate-reference-system.enum';

export interface AppLayerModel {
    id: number;
    url: string;
    serviceId: number;
    visible: boolean;
    crs: CoordinateReferenceSystem;
    isBaseLayer: boolean;
}
