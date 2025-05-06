import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';

export interface UpdateAttributeFilterModel {
  filterGroup: FilterGroupModel<AttributeFilterModel>;
  filterId: string;
}
