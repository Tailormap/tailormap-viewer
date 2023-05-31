import { AppTreeLayerNodeModel, getGeoServiceLayer } from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';
import { ApplicationModelHelper } from './application-model.helper';

describe('ApplicationModelHelper', () => {

  it ('creates a new layer model', () => {
    const extendedLayer: ExtendedGeoServiceLayerModel = {
      ...getGeoServiceLayer(),
      name: 'layer1',
      serviceId: '1',
      catalogNodeId: '1',
    };
    const appLayerNodes = [];
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
