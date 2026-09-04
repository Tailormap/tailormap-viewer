import { FilterTypeEnum, SpatialFilterModel } from '@tailormap-viewer/api';
import { getFilterGroup } from '@tailormap-viewer/shared';

export const getSpatialFilterGroup = (geoms: string[], columns?: Array<{ layerId: string; column: string[] }>, buffer?: number) => {
  const group = getFilterGroup<SpatialFilterModel>([{
    id: '1',
    type: FilterTypeEnum.SPATIAL,
    geometryColumns: columns || [{ layerId: '1', column: ['the_geom'] }],
    geometries: geoms.map((g, idx) => ({ id: `${idx + 1}`, geometry: g })),
    buffer,
    projectionCode: 'EPSG:4326',
  }], FilterTypeEnum.SPATIAL);
  if (columns) {
    return { ...group, layerIds: columns.map(c => c.layerId) };
  }
  return group;
};
