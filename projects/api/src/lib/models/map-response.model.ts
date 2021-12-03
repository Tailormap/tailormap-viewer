import { BoundsModel } from './bounds.model';
import { ServiceModel } from './service.model';
import { AppLayerModel } from './app-layer.model';
import { CoordinateReferenceSystem } from './coordinate-reference-system.enum';

export interface MapResponseModel {
    initialExtent: BoundsModel | null;
    maxExtent: BoundsModel | null;
    services: ServiceModel[];
    baseLayers: AppLayerModel[];
    crs: CoordinateReferenceSystem;
}
