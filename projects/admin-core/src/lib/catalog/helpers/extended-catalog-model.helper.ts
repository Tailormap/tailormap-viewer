import {
  CatalogModelHelper, FeatureSourceModel,
  FeatureSourceSummaryWithFeatureTypesModel, FeatureTypeModel, FeatureTypeSummaryModel,
  GeoServiceLayerModel,
  GeoServiceSummaryWithLayersModel,
  GeoServiceWithLayersModel,
} from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';

export class ExtendedCatalogModelHelper {

  public static getGeoServiceSummaryModel(service: GeoServiceWithLayersModel): GeoServiceSummaryWithLayersModel {
    return {
      id: service.id,
      type: 'geo-service',
      protocol: service.protocol,
      settings: service.settings,
      authorizationRules: service.authorizationRules,
      title: service.title,
      layers: service.layers,
    };
  }

  public static getFeatureSourceSummaryModel(featureSource: FeatureSourceModel): FeatureSourceSummaryWithFeatureTypesModel {
    return {
      id: featureSource.id,
      type: 'feature-source',
      protocol: featureSource.protocol,
      title: featureSource.title,
      featureTypes: featureSource.featureTypes.map(ExtendedCatalogModelHelper.getFeatureTypeSummaryModel),
    };
  }

  public static getFeatureTypeSummaryModel(featureType: FeatureTypeModel): FeatureTypeSummaryModel {
    return {
      id: featureType.id,
      type: 'feature-type',
      title: featureType.title,
      name: featureType.name,
      hasAttributes: (featureType.attributes || []).length > 0,
      writeable: featureType.writeable,
    };
  }

  public static getExtendedGeoServiceLayer(layers: GeoServiceLayerModel[], geoServiceId: string, catalogNodeId: string): ExtendedGeoServiceLayerModel[] {
    return layers.map<ExtendedGeoServiceLayerModel>(layer => {
      const parent = ExtendedCatalogModelHelper.findLayerParent(`${layer.id}`, layers);
      return {
        id: `${geoServiceId}_${layer.id}`,
        name: layer.name,
        root: layer.root,
        title: layer.title,
        virtual: layer.virtual,
        crs: layer.crs,
        maxScale: layer.maxScale,
        minScale: layer.minScale,
        abstractText: layer.abstractText,
        serviceId: geoServiceId,
        originalId: layer.id,
        catalogNodeId,
        children: layer.children // map children to point to ID instead of name
          ? layer.children.map<string>(id => `${geoServiceId}_${id}`)
          : null,
        parentId: parent ? `${geoServiceId}_${parent.id}` : undefined,
      };
    });
  }

  private static findLayerParent(layerId: string, allLayers: GeoServiceLayerModel[]) {
    return allLayers.find(l => (l.children || []).find(c => `${c}` === layerId));
  }

  public static getExtendedGeoService(geoServiceWithLayers: GeoServiceSummaryWithLayersModel, catalogNodeId: string): [ ExtendedGeoServiceModel, ExtendedGeoServiceLayerModel[] ] {
    const serviceId = `${geoServiceWithLayers.id}`;
    const serviceLayers = ExtendedCatalogModelHelper.getExtendedGeoServiceLayer(geoServiceWithLayers.layers, serviceId, catalogNodeId);
    const service: ExtendedGeoServiceModel = {
      id: serviceId,
      title: geoServiceWithLayers.title,
      type: 'geo-service',
      protocol: geoServiceWithLayers.protocol,
      settings: geoServiceWithLayers.settings,
      authorizationRules: geoServiceWithLayers.authorizationRules,
      catalogNodeId,
      layerIds: serviceLayers.map(layer => layer.id),
    };
    return [ service, serviceLayers ];
  }

  public static getExtendedFeatureSource(source: FeatureSourceSummaryWithFeatureTypesModel, catalogNodeId: string): [ ExtendedFeatureSourceModel, ExtendedFeatureTypeModel[] ] {
    const sourceId = `${source.id}`;
    const featureTypes: ExtendedFeatureTypeModel[] = source.featureTypes.map<ExtendedFeatureTypeModel>(ft => {
      return ExtendedCatalogModelHelper.getExtendedFeatureType(ft, sourceId, catalogNodeId);
    });
    const featureSource: ExtendedFeatureSourceModel = {
      id: sourceId,
      type: 'feature-source',
      title: source.title,
      protocol: source.protocol,
      catalogNodeId,
      featureTypesIds: (featureTypes || []).map(ft => ft.id),
    };
    return [ featureSource, featureTypes ];
  }

  public static getExtendedFeatureType(featureType: FeatureTypeSummaryModel, featureSourceId: string, catalogNodeId?: string): ExtendedFeatureTypeModel {
    return {
      id: `${featureSourceId}_${featureType.id}`,
      type: 'feature-type',
      name: featureType.name,
      title: featureType.title,
      writeable: featureType.writeable,
      hasAttributes: featureType.hasAttributes,
      originalId: featureType.id,
      catalogNodeId: catalogNodeId || '',
      featureSourceId,
    };
  }

  public static getFeatureTypeId(extendedId: string, featureSourceId: string): string {
    return ExtendedCatalogModelHelper.getOriginalId(extendedId, featureSourceId);
  }

  public static isGeoServiceModel(model: any): model is ExtendedGeoServiceModel {
    return !!model && model.type && model.type === CatalogModelHelper.GEO_SERVICE_TYPE;
  }

  public static isFeatureSourceModel(model: any): model is ExtendedFeatureSourceModel {
    return !!model && model.type && model.type === CatalogModelHelper.FEATURE_SOURCE_TYPE;
  }

  private static getOriginalId(extendedId: string, sourceId: string): string {
    if (extendedId.startsWith(`${sourceId}_`)) {
      return extendedId.replace(`${sourceId}_`, '');
    }
    return extendedId;
  }

}
