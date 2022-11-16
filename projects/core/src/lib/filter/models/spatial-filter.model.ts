import { FilterTypeEnum } from './filter-type.enum';
import { BaseFilterModel } from './base-filter.model';

export interface SpatialFilterModel extends BaseFilterModel {
  type: FilterTypeEnum.SPATIAL;
  geometryColumns: Array<{ layerId: number; column: string[] }>;
  geometries: string[];
  baseLayerId?: number;
  buffer?: number;
}
