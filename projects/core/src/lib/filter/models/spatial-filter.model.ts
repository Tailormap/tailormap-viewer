import { FilterTypeEnum } from './filter-type.enum';
import { BaseFilterModel } from './base-filter.model';

export interface SpatialFilterGeometry {
  id: string;
  geometry: string;
  referenceLayerName?: string;
}

export interface SpatialFilterModel extends BaseFilterModel {
  type: FilterTypeEnum.SPATIAL;
  geometryColumns: Array<{ layerName: string; column: string[] }>;
  geometries: SpatialFilterGeometry[];
  baseLayerName?: string;
  buffer?: number;
}
