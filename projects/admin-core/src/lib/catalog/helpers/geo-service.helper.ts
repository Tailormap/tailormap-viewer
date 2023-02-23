import { GeoServiceWithLayersModel } from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';

export class GeoServiceHelper {

  public static getExtendedGeoServiceLayer(geoService: GeoServiceWithLayersModel, catalogNodeId: string): ExtendedGeoServiceLayerModel[] {
    return geoService.layers.map((layer, idx) => {
      const id = layer.name || `virtual-layer-${idx}`;
      return {
        ...layer,
        id: `${geoService.id}_${id}`,
        serviceId: `${geoService.id}`,
        catalogNodeId,
      };
    });
  }

  public static getExtendedGeoService(geoService: GeoServiceWithLayersModel, catalogNodeId: string): [ ExtendedGeoServiceModel, ExtendedGeoServiceLayerModel[] ] {
    const serviceLayers = GeoServiceHelper.getExtendedGeoServiceLayer(geoService, catalogNodeId);
    const service = {
      ...geoService,
      id: `${geoService.id}`,
      catalogNodeId,
      layers: serviceLayers.map(layer => layer.id),
      capabilities: undefined, // do not store Blob in the state, should not be loaded anyway
    };
    return [ service, serviceLayers ];
  }

}
