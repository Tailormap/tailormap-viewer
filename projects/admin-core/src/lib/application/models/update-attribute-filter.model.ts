import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { GeoServiceLayerInApplicationModel } from './geo-service-layer-in-application.model';

export interface UpdateAttributeFilterModel {
  filterGroup: FilterGroupModel<AttributeFilterModel>;
  filterId: string;
  filterableLayers?: GeoServiceLayerInApplicationModel[];
}
