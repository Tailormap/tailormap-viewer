import { FilterGroupModel } from './filter-group.model';
import { AppLayerModel } from '@tailormap-viewer/api';
import { BaseFilterModel } from './base-filter.model';

export interface ExtendedFilterGroupModel<T = BaseFilterModel> extends FilterGroupModel<T> {
  layers: AppLayerModel[];
}
