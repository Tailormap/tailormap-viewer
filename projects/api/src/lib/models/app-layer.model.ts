import { CoordinateReferenceSystemModel } from './coordinate-reference-system.model';

export interface AppLayerModel {
    id: number;
    url: string;
    displayName: string;
    serviceId: number;
    visible: boolean;
    crs: CoordinateReferenceSystemModel;
    isBaseLayer: boolean;
}
