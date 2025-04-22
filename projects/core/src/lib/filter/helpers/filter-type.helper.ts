import { BaseFilterModel } from '@tailormap-viewer/api';
import { AttributeFilterModel } from '@tailormap-viewer/api';
import { FilterTypeEnum } from '@tailormap-viewer/api';
import { SpatialFilterModel } from '@tailormap-viewer/api';
import { FilterGroupModel } from '@tailormap-viewer/api';

export class FilterTypeHelper {

  public static isAttributeFilter(filter?: BaseFilterModel): filter is AttributeFilterModel {
    return filter?.type === FilterTypeEnum.ATTRIBUTE;
  }

  public static isSpatialFilter(filter?: BaseFilterModel): filter is SpatialFilterModel {
    return filter?.type === FilterTypeEnum.SPATIAL;
  }

  public static isAttributeFilterGroup(group?: FilterGroupModel): group is FilterGroupModel<AttributeFilterModel> {
    return group?.type === FilterTypeEnum.ATTRIBUTE;
  }

  public static isSpatialFilterGroup(group?: FilterGroupModel): group is FilterGroupModel<SpatialFilterModel> {
    return group?.type === FilterTypeEnum.SPATIAL;
  }

}
