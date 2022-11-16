import { BaseFilterModel } from '../models/base-filter.model';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import { FilterTypeEnum } from '../models/filter-type.enum';
import { SpatialFilterModel } from '../models/spatial-filter.model';

export class FilterTypeHelper {

  public static isAttributeFilter(filter?: BaseFilterModel): filter is AttributeFilterModel {
    return filter?.type === FilterTypeEnum.ATTRIBUTE;
  }

  public static isSpatialFilter(filter?: BaseFilterModel): filter is SpatialFilterModel {
    return filter?.type === FilterTypeEnum.SPATIAL;
  }

}
