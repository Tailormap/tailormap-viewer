import { describe, test, expect, vi } from 'vitest';
import { OpenLayersLayerManager } from './open-layers-layer-manager';
import { LayerTypesEnum, VectorLayerModel, WMSLayerModel } from '../models';
import { ServerType } from '@tailormap-viewer/api';

const mockNgZone = { run: (cb: () => void) => cb(), runOutsideAngular: (cb: () => void) => cb() } as any;
const mockHttpXsrfTokenExtractor = { getToken: () => null } as any;

function createMockOlMap() {
  return {
    getView: () => ({ getProjection: () => 'EPSG:3857' }),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
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

function createLayerManagerWithLayer(layer: WMSLayerModel): { manager: OpenLayersLayerManager; olLayer: any; olSource: any } {
  const olMap = createMockOlMap();
  const manager = new OpenLayersLayerManager(olMap, mockNgZone, mockHttpXsrfTokenExtractor);
  manager.init();
  manager.setLayers([layer]);
  const olLayer = manager.getLayer(layer.id);
  const olSource: any = olLayer?.getSource();
  return { manager, olLayer, olSource };
}

describe('OpenLayersLayerManager - updatePropertiesIfChanged', () => {

  test('does not call updateParams when WMS params have not changed', () => {
    const layer = createWmsLayer({ filter: 'prop=1', opacity: 100 });
    const { manager, olLayer, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = vi.spyOn(olSource, 'updateParams');
    const updateOpacitySpy = vi.spyOn(olLayer, 'setOpacity');

    // Change only opacity so the layer identifier differs, but WMS params stay the same
    manager.setLayers([{ ...layer, opacity: 50 }]);

    expect(updateOpacitySpy).toHaveBeenCalledTimes(1);
    expect(updateOpacitySpy).toHaveBeenCalledWith(0.5);
    expect(updateParamsSpy).not.toHaveBeenCalled();
  });

  test('calls updateParams exactly once with all changed WMS params batched together', () => {
    const layer = createWmsLayer({ filter: 'prop=1', selectedStyleName: 'style1', styles: [{ name: 'style1', title: 'Style 1' }] });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = vi.spyOn(olSource, 'updateParams');

    const newLayer: WMSLayerModel = { ...layer, name: 'new-layer', layers: 'new-layer', filter: 'prop=2', selectedStyleName: 'style2' };
    manager.setLayers([newLayer]);

    expect(updateParamsSpy).toHaveBeenCalledTimes(1);
    expect(updateParamsSpy).toHaveBeenCalledWith(expect.objectContaining({ LAYERS: 'new-layer', STYLES: 'style2', CQL_FILTER: 'prop=2' }));
  });

  test('clears STYLES param when selectedStyleName is removed', () => {
    const layer = createWmsLayer({ selectedStyleName: 'style1', styles: [{ name: 'style1', title: 'Style 1' }] });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = vi.spyOn(olSource, 'updateParams');

    const newLayer: WMSLayerModel = { ...layer, selectedStyleName: undefined };
    manager.setLayers([newLayer]);

    expect(updateParamsSpy).toHaveBeenCalledTimes(1);
    expect(updateParamsSpy).toHaveBeenCalledWith(expect.objectContaining({ STYLES: '' }));
  });

  test('clears CQL_FILTER param when filter is removed for GeoServer', () => {
    const layer = createWmsLayer({ filter: 'prop=1' });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = vi.spyOn(olSource, 'updateParams');

    const newLayer: WMSLayerModel = { ...layer, filter: undefined, opacity: 50 };
    manager.setLayers([newLayer]);

    expect(updateParamsSpy).toHaveBeenCalledTimes(1);
    expect(updateParamsSpy).toHaveBeenCalledWith(expect.objectContaining({ CQL_FILTER: '' }));
  });

  test('does not update CQL_FILTER for non-GeoServer layers when filter changes', () => {
    const layer = createWmsLayer({ serverType: ServerType.GENERIC, filter: undefined });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = vi.spyOn(olSource, 'updateParams');

    const newLayer: WMSLayerModel = { ...layer, filter: 'prop=1', opacity: 50 };
    manager.setLayers([newLayer]);

    expect(updateParamsSpy).not.toHaveBeenCalled();
  });

  test('updates CQL_FILTER param when filter changes for GeoServer', () => {
    const layer = createWmsLayer({ filter: 'prop=1' });
    const { manager, olSource } = createLayerManagerWithLayer(layer);
    const updateParamsSpy = vi.spyOn(olSource, 'updateParams');

    const newLayer = { ...layer, filter: 'prop=2' };
    manager.setLayers([newLayer]);

    expect(updateParamsSpy).toHaveBeenCalledTimes(1);
    expect(updateParamsSpy).toHaveBeenCalledWith(expect.objectContaining({ CQL_FILTER: 'prop=2' }));
  });

});

describe('OpenLayersLayerManager - ordered vector layers', () => {

  const vectorLayer = (id: string, followsLayerOrder?: boolean): VectorLayerModel => ({
    id, name: id, layerType: LayerTypesEnum.Vector, visible: true, followsLayerOrder,
  });
  const orderedStub = (id: string) => vectorLayer(id, true);

  const createManager = () => {
    const manager = new OpenLayersLayerManager(createMockOlMap(), mockNgZone, mockHttpXsrfTokenExtractor);
    manager.init();
    return manager;
  };
  const zIndex = (manager: OpenLayersLayerManager, id: string) => manager.getLayer(id)?.getZIndex();

  test('ordered vector layer added before setLayers gets its position from setLayers', () => {
    const manager = createManager();
    manager.addLayer(vectorLayer('user-1', true));
    manager.setLayers([ createWmsLayer({ id: 'wms-1' }), orderedStub('user-1'), createWmsLayer({ id: 'wms-2' }) ]);
    expect(zIndex(manager, 'wms-1')).toBe(2);
    expect(zIndex(manager, 'user-1')).toBe(1);
    expect(zIndex(manager, 'wms-2')).toBe(0);
  });

  test('ordered vector layer added after setLayers gets its remembered position', () => {
    const manager = createManager();
    manager.setLayers([ createWmsLayer({ id: 'wms-1' }), orderedStub('user-1'), createWmsLayer({ id: 'wms-2' }) ]);
    manager.addLayer(vectorLayer('user-1', true));
    expect(zIndex(manager, 'user-1')).toBe(1);
  });

  test('setLayers never creates an ordered vector layer', () => {
    const manager = createManager();
    manager.setLayers([ orderedStub('user-1'), createWmsLayer({ id: 'wms-1' }) ]);
    expect(manager.getLayer('user-1')).toBeUndefined();
  });

  test('ordered vector layer moves among WMS layers', () => {
    const manager = createManager();
    manager.addLayer(vectorLayer('user-1', true));
    manager.setLayers([ createWmsLayer({ id: 'wms-1' }), createWmsLayer({ id: 'wms-2' }), orderedStub('user-1') ]);
    expect(zIndex(manager, 'user-1')).toBe(0);
    manager.setLayers([ orderedStub('user-1'), createWmsLayer({ id: 'wms-1' }), createWmsLayer({ id: 'wms-2' }) ]);
    expect(zIndex(manager, 'user-1')).toBe(2);
    expect(zIndex(manager, 'wms-1')).toBe(1);
    expect(zIndex(manager, 'wms-2')).toBe(0);
  });

  test('unordered vector layers stay above service and ordered vector layers', () => {
    const manager = createManager();
    manager.addLayer(vectorLayer('drawing'));
    manager.addLayer(vectorLayer('user-1', true));
    manager.setLayers([ orderedStub('user-1'), createWmsLayer({ id: 'wms-1' }), orderedStub('user-2') ]);
    manager.addLayer(vectorLayer('user-2', true));
    expect(zIndex(manager, 'user-1')).toBe(2);
    expect(zIndex(manager, 'wms-1')).toBe(1);
    expect(zIndex(manager, 'user-2')).toBe(0);
    expect(zIndex(manager, 'drawing')).toBe(3);
  });

});
