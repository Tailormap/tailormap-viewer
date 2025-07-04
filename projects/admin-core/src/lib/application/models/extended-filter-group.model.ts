import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';

export interface ExtendedFilterGroupModel {
  filterGroup: FilterGroupModel<AttributeFilterModel>;
  layers: ExtendedGeoServiceLayerModel[];
  isSelected: boolean;
}
