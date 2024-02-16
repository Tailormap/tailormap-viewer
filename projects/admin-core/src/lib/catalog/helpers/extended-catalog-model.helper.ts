import {
  FeatureSourceModel, FeatureSourceSummaryWithFeatureTypesModel, FeatureTypeModel, FeatureTypeSummaryModel,
  GeoServiceLayerModel, GeoServiceSummaryWithLayersModel, GeoServiceWithLayersModel, LayerSettingsModel,
} from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { CatalogExtendedModel, CatalogExtendedTypeEnum } from '../models/catalog-extended.model';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';

export class ExtendedCatalogModelHelper {

  public static getGeoServiceSummaryModel(service: GeoServiceWithLayersModel): GeoServiceSummaryWithLayersModel {
    return {
      id: service.id,
      type: CatalogExtendedTypeEnum.SERVICE_TYPE,
      protocol: service.protocol,
      settings: service.settings,
      authorizationRules: service.authorizationRules,
      title: service.title,
      layers: service.layers,
    };
  }

  public static getFeatureSourceSummaryModel(featureSource: FeatureSourceModel): FeatureSourceSummaryWithFeatureTypesModel {
    return {
      id: `${featureSource.id}`,
      type: CatalogExtendedTypeEnum.FEATURE_SOURCE_TYPE,
      protocol: featureSource.protocol,
      title: featureSource.title,
      featureTypes: featureSource.featureTypes.map(ExtendedCatalogModelHelper.getFeatureTypeSummaryModel),
    };
  }

  public static getFeatureTypeSummaryModel(featureType: FeatureTypeModel): FeatureTypeSummaryModel {
    return {
      id: `${featureType.id}`,
      type: CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE,
      title: featureType.title,
      name: featureType.name,
      hasAttributes: (featureType.attributes || []).length > 0,
      writeable: featureType.writeable,
    };
  }

  public static getExtendedGeoServiceLayer(
    layers: GeoServiceLayerModel[],
    geoServiceId: string,
    catalogNodeId: string,
    layerSettings: Record<string, LayerSettingsModel> | undefined,
  ): ExtendedGeoServiceLayerModel[] {
    return layers.map<ExtendedGeoServiceLayerModel>(layer => {
      const parent = ExtendedCatalogModelHelper.findLayerParent(`${layer.id}`, layers);
      return {
        id: `${geoServiceId}_${layer.id}`,
        type: CatalogExtendedTypeEnum.SERVICE_LAYER_TYPE,
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
        layerSettings: layerSettings?.[layer.name],
      };
    });
  }

  private static findLayerParent(layerId: string, allLayers: GeoServiceLayerModel[]) {
    return allLayers.find(l => (l.children || []).find(c => `${c}` === layerId));
  }

  public static getExtendedGeoService(geoServiceWithLayers: GeoServiceSummaryWithLayersModel, catalogNodeId: string): [ ExtendedGeoServiceModel, ExtendedGeoServiceLayerModel[] ] {
    const serviceId = `${geoServiceWithLayers.id}`;
    const serviceLayers = ExtendedCatalogModelHelper.getExtendedGeoServiceLayer(
      geoServiceWithLayers.layers,
      serviceId,
      catalogNodeId,
      geoServiceWithLayers.settings?.layerSettings,
    );
    const service: ExtendedGeoServiceModel = {
      id: serviceId,
      title: geoServiceWithLayers.title,
      type: CatalogExtendedTypeEnum.SERVICE_TYPE,
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
      type: CatalogExtendedTypeEnum.FEATURE_SOURCE_TYPE,
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
      type: CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE,
      name: featureType.name,
      title: featureType.title,
      writeable: featureType.writeable,
      hasAttributes: featureType.hasAttributes,
      originalId: `${featureType.id}`,
      catalogNodeId: catalogNodeId || '',
      featureSourceId,
    };
  }

  public static getFeatureTypeId(extendedId: string, featureSourceId: string): string {
    return ExtendedCatalogModelHelper.getOriginalId(extendedId, featureSourceId);
  }

  public static isCatalogTypeModel(model: CatalogExtendedModel): model is ExtendedCatalogNodeModel {
    return !!model && model.type && model.type === CatalogExtendedTypeEnum.CATALOG_NODE_TYPE;
  }

  public static isGeoServiceModel(model: CatalogExtendedModel): model is ExtendedGeoServiceModel {
    return !!model && model.type && model.type === CatalogExtendedTypeEnum.SERVICE_TYPE;
  }

  public static isGeoServiceLayerModel(model: CatalogExtendedModel): model is ExtendedGeoServiceLayerModel {
    return !!model && model.type && model.type === CatalogExtendedTypeEnum.SERVICE_LAYER_TYPE;
  }

  public static isFeatureSourceModel(model: CatalogExtendedModel): model is ExtendedFeatureSourceModel {
    return !!model && model.type && model.type === CatalogExtendedTypeEnum.FEATURE_SOURCE_TYPE;
  }

  public static isFeatureTypeModel(model: CatalogExtendedModel): model is ExtendedFeatureTypeModel {
    return !!model && model.type && model.type === CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE;
  }

  private static getOriginalId(extendedId: string, sourceId: string): string {
    if (extendedId.startsWith(`${sourceId}_`)) {
      return extendedId.replace(`${sourceId}_`, '');
    }
    return extendedId;
  }

}
