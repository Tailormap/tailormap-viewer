import { FilterTypeEnum } from './filter-type.enum';
import { BaseFilterModel } from './base-filter.model';

export interface SpatialFilterGeometry {
  id: string;
  geometry: string;
  referenceLayerId?: string;
}

export interface SpatialFilterModel extends BaseFilterModel {
  type: FilterTypeEnum.SPATIAL;
  geometryColumns: Array<{ layerId: string; column: string[] }>;
  geometries: SpatialFilterGeometry[];
  baseLayerId?: string;
  buffer?: number;
}
