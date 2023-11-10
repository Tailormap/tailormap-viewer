import { FeatureSourceModel, FeatureTypeModel, GeoServiceWithLayersModel } from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';

export class ExtendedCatalogModelHelper {

  public static getExtendedGeoServiceLayer(geoService: GeoServiceWithLayersModel, catalogNodeId: string): ExtendedGeoServiceLayerModel[] {
    const serviceLayers = geoService.layers.map(layer => ({
      ...layer,
      id: `${geoService.id}_${layer.id}`,
      serviceId: `${geoService.id}`,
      catalogNodeId,
    }));
    return serviceLayers.map<ExtendedGeoServiceLayerModel>(layer => ({
      ...layer,
      children: layer.children // map children to point to ID instead of name
        ? layer.children.map<string>(id => `${geoService.id}_${id}`)
        : null,
    }));
  }

  public static getExtendedGeoService(geoService: GeoServiceWithLayersModel, catalogNodeId: string): [ ExtendedGeoServiceModel, ExtendedGeoServiceLayerModel[] ] {
    const serviceLayers = ExtendedCatalogModelHelper.getExtendedGeoServiceLayer(geoService, catalogNodeId);
    const service = {
      ...geoService,
      id: `${geoService.id}`,
      catalogNodeId,
      layers: serviceLayers.map(layer => layer.id),
      capabilities: undefined, // do not store Blob in the state, should not be loaded anyway
    };
    return [ service, serviceLayers ];
  }

  public static getExtendedFeatureSource(source: FeatureSourceModel, catalogNodeId: string): [ ExtendedFeatureSourceModel, ExtendedFeatureTypeModel[] ] {
    const featureTypes: ExtendedFeatureTypeModel[] = source.featureTypes.map<ExtendedFeatureTypeModel>(ft => {
      return ExtendedCatalogModelHelper.getExtendedFeatureType(ft, source.id, catalogNodeId);
    });
    const featureSource: ExtendedFeatureSourceModel & { allFeatureTypes?: FeatureTypeModel[] } = {
      ...source,
      id: `${source.id}`,
      catalogNodeId,
      featureTypes: [],
      allFeatureTypes: [],
      children: (featureTypes || []).map(ft => ft.id),
    };
    return [ featureSource, featureTypes ];
  }

  public static getExtendedFeatureType(featureType: FeatureTypeModel, featureSourceId: string, catalogNodeId?: string): ExtendedFeatureTypeModel {
    return {
      ...featureType,
      id: `${featureSourceId}_${featureType.id}`,
      originalId: featureType.id,
      catalogNodeId: catalogNodeId || '',
      featureSourceId: `${featureSourceId}`,
    };
  }

}
