import { BoundsModel } from '@tailormap-viewer/api';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';

export interface AdminProjection {
  code: string;
  label: string;
  bounds: BoundsModel;
}

export interface ProjectionAvailability {
  label: string;
  available: boolean;
}

export class AdminProjectionsHelper {

  // TODO: replace hardcoded list with projections list from API backend from GeoTools EPSG store

  public static projections: AdminProjection[] = [
    {
      code: 'EPSG:28992',
      label: 'EPSG:28992 (Amersfoort / RD New)',
      bounds: {
        minx: 482,
        miny: 306602,
        maxx: 284182,
        maxy: 637049,
      },
    },
    {
      code: 'EPSG:3857',
      label: 'EPSG:3857 (WGS 84 / Pseudo-Mercator)',
      bounds: {
      minx: -20037508,
      miny: -20048966,
      maxx: 20037508,
      maxy: 20048966,
      },
    },
  ];

  public static find(projectionCode: string) {
    return this.projections.find(p => p.code == projectionCode);
  }

  public static getProjectionAvailabilityForServiceLayer(
    layer: ExtendedGeoServiceLayerModel | undefined,
    layersInService: ExtendedGeoServiceLayerModel[],
  ): ProjectionAvailability[] {
    const crs: string[] = [];
    while (layer) {
      if (layer.crs) {
        crs.push(...layer.crs);
      }
      layer = layersInService.find(l => l.id === layer?.parentId);
    }
    return AdminProjectionsHelper.projections.map(adminProjection => ({
      label: adminProjection.label,
      available: crs.includes(adminProjection.code),
    }));
  }
}
