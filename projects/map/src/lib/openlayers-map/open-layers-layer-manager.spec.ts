import { Map as OlMap } from 'ol';
import { Image as ImageLayer } from 'ol/layer';
import { ImageWMS } from 'ol/source';
import { get as getProjection } from 'ol/proj';
import { OpenLayersLayerManager } from './open-layers-layer-manager';
import { LayerTypesEnum } from '../models/layer-types.enum';
import { WMSLayerModel } from '../models/wms-layer.model';
import { ServerType } from '@tailormap-viewer/api';

const mockNgZone = { run: (cb: () => void) => cb(), runOutsideAngular: (cb: () => void) => cb() } as any;
const mockHttpXsrfTokenExtractor = { getToken: () => null } as any;

function createMockOlMap(): OlMap {
  return {
    getView: () => ({ getProjection: () => getProjection('EPSG:3857') }),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  } as any;
}

function createWmsLayer(overrides: Partial<WMSLayerModel> = {}): WMSLayerModel {
  return {
    id: 'layer-1',
    name: 'test-layer',
    layerType: LayerTypesEnum.WMS,
    visible: true,
    url: 'https://example.com/wms',
    layers: 'test-layer',
    serverType: ServerType.GEOSERVER,
    filter: undefined,
    selectedStyleName: undefined,
    styles: undefined,
    tilingDisabled: true,
    ...overrides,
  };
}

function createLayerManagerWithLayer(layer: WMSLayerModel): { manager: OpenLayersLayerManager; olSource: ImageWMS } {
  const olMap = createMockOlMap();
  const manager = new OpenLayersLayerManager(olMap, mockNgZone, mockHttpXsrfTokenExtractor);
  manager.init();
  manager.setLayers([ layer ]);
  const olLayer = manager.getLayer(layer.id) as ImageLayer<ImageWMS>;
  const olSource = olLayer.getSource() as ImageWMS;
  return { manager, olSource };
}

describe('OpenLayersLayerManager - updatePropertiesIfChanged', () => {

  test('does not call updateParams when WMS params have not changed', () => {
    const layer = createWmsLayer({ filter: 'prop=1', opacity: 100 });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = jest.spyOn(olSource, 'updateParams');

    // Change only opacity so the layer identifier differs, but WMS params stay the same
    manager.setLayers([ { ...layer, opacity: 50 } ]);

    expect(updateParamsSpy).not.toHaveBeenCalled();
  });

  test('calls updateParams exactly once with all changed WMS params batched together', () => {
    const layer = createWmsLayer({ filter: 'prop=1', selectedStyleName: 'style1', styles: [ { name: 'style1', title: 'Style 1' } ] });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = jest.spyOn(olSource, 'updateParams');

    manager.setLayers([ { ...layer, name: 'new-layer', layers: 'new-layer', filter: 'prop=2', selectedStyleName: 'style2' } ]);

    expect(updateParamsSpy).toHaveBeenCalledTimes(1);
    expect(updateParamsSpy).toHaveBeenCalledWith(expect.objectContaining({ LAYERS: 'new-layer', STYLES: 'style2', CQL_FILTER: 'prop=2' }));
  });

  test('clears STYLES param when selectedStyleName is removed', () => {
    const layer = createWmsLayer({ selectedStyleName: 'style1', styles: [ { name: 'style1', title: 'Style 1' } ] });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = jest.spyOn(olSource, 'updateParams');

    manager.setLayers([ { ...layer, selectedStyleName: undefined } ]);

    expect(updateParamsSpy).toHaveBeenCalledTimes(1);
    expect(updateParamsSpy).toHaveBeenCalledWith(expect.objectContaining({ STYLES: '' }));
  });

  test('clears CQL_FILTER param when filter is removed for GeoServer', () => {
    const layer = createWmsLayer({ filter: 'prop=1' });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = jest.spyOn(olSource, 'updateParams');

    manager.setLayers([ { ...layer, filter: undefined, opacity: 50 } ]);

    expect(updateParamsSpy).toHaveBeenCalledTimes(1);
    expect(updateParamsSpy).toHaveBeenCalledWith(expect.objectContaining({ CQL_FILTER: '' }));
  });

  test('does not update CQL_FILTER for non-GeoServer layers when filter changes', () => {
    const layer = createWmsLayer({ serverType: ServerType.GENERIC, filter: undefined });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = jest.spyOn(olSource, 'updateParams');

    manager.setLayers([ { ...layer, filter: 'prop=1', opacity: 50 } ]);

    expect(updateParamsSpy).not.toHaveBeenCalled();
  });

  test('updates CQL_FILTER param when filter changes for GeoServer', () => {
    const layer = createWmsLayer({ filter: 'prop=1' });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = jest.spyOn(olSource, 'updateParams');

    manager.setLayers([ { ...layer, filter: 'prop=2' } ]);

    expect(updateParamsSpy).toHaveBeenCalledTimes(1);
    expect(updateParamsSpy).toHaveBeenCalledWith(expect.objectContaining({ CQL_FILTER: 'prop=2' }));
  });

});
