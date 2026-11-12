import { describe, it, expect } from 'vitest';
import { AppTreeLayerNodeModel, AppTreeNodeModel, getApplication, getGeoServiceLayer } from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';
import { ApplicationModelHelper } from './application-model.helper';
import { CatalogExtendedTypeEnum } from '../../catalog/models/catalog-extended.model';

describe('ApplicationModelHelper', () => {

  it('creates admin urls for applications and stories', () => {
    expect(ApplicationModelHelper.getApplicationUrl(getApplication({ id: '5', name: 'app' }), 'layers')).toEqual('/admin/applications/application/5/layers');
    expect(ApplicationModelHelper.getApplicationUrl(getApplication({ id: '6', name: 'my story', applicationType: 'stories' }), 'layers')).toEqual('/stories-admin/my%20story');
  });

  it('labels stories applications', () => {
    expect(ApplicationModelHelper.getApplicationLabel(getApplication({ name: 'app', title: 'My app' }))).toEqual('My app');
    expect(ApplicationModelHelper.getApplicationLabel(getApplication({ name: 'story', title: '', applicationType: 'stories' }))).toEqual('story (Stories)');
  });

  it ('creates a new layer model', () => {
    const extendedLayer: ExtendedGeoServiceLayerModel = {
      ...getGeoServiceLayer(),
      name: 'layer1',
      serviceId: '1',
      catalogNodeId: '1',
      type: CatalogExtendedTypeEnum.SERVICE_LAYER_TYPE,
      originalId: '1',
      expanded: undefined,
      layerSettings: undefined,
      layerTitle: "",
      parentId: undefined,
      protocol: undefined,
    };
    const appLayerNodes: AppTreeNodeModel[] = [];
    const layerNode = ApplicationModelHelper.newApplicationTreeLayerNode(extendedLayer, appLayerNodes);
    expect(layerNode).toEqual({
      id: 'lyr:1:layer1',
      description: '',
      objectType: 'AppTreeLayerNode',
      layerName: 'layer1',
      serviceId: '1',
      visible: true,
    });
  });

  it ('creates a new layer model when layer already exists in application', () => {
    const extendedLayer: ExtendedGeoServiceLayerModel = {
      ...getGeoServiceLayer(),
      name: 'layer1',
      serviceId: '1',
      catalogNodeId: '1',
      type: CatalogExtendedTypeEnum.SERVICE_LAYER_TYPE,
      originalId: '1',
      expanded: undefined,
      layerSettings: undefined,
      layerTitle: "",
      parentId: undefined,
      protocol: undefined,
    };
    const appLayerNodes: AppTreeLayerNodeModel[] = [
      { id: 'lyr:1:layer1', serviceId: '1', layerName: 'layer1', objectType: 'AppTreeLayerNode', visible: true },
      { id: 'lyr:1:layer1_1', serviceId: '1', layerName: 'layer1', objectType: 'AppTreeLayerNode', visible: true },
      { id: 'lyr:1:layer1_3', serviceId: '1', layerName: 'layer1', objectType: 'AppTreeLayerNode', visible: true },
    ];
    const layerNode = ApplicationModelHelper.newApplicationTreeLayerNode(extendedLayer, appLayerNodes);
    expect(layerNode).toEqual({
      id: 'lyr:1:layer1_2',
      description: '',
      objectType: 'AppTreeLayerNode',
      layerName: 'layer1',
      serviceId: '1',
      visible: true,
    });
  });

});
