import { AppLayerModel, BaseFilterModel, FilterGroupModel } from '@tailormap-viewer/api';

export interface ExtendedFilterGroupModel<T = BaseFilterModel> extends FilterGroupModel<T> {
  layers: AppLayerModel[];
}
