import { FilterTypeEnum } from './filter-type.enum';
import { BaseFilterModel } from './base-filter.model';

export interface SpatialFilterGeometry {
  id: string;
  geometry: string;
  referenceLayerId?: number;
}

export interface SpatialFilterModel extends BaseFilterModel {
  type: FilterTypeEnum.SPATIAL;
  geometryColumns: Array<{ layerId: number; column: string[] }>;
  geometries: SpatialFilterGeometry[];
  baseLayerId?: number;
  buffer?: number;
}
