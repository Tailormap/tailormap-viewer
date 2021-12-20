import { LayerTypesHelper } from './layer-types.helper';
import { LayerTypesEnum } from '@tailormap-viewer/map';

const getLayer = (type: LayerTypesEnum) => ({ layerType: type, id: '1', visible: true, name: 'test' });

describe('LayerTypesHelper', () => {

  test('checks isWmsLayer', () => {
    expect(LayerTypesHelper.isWmsLayer(getLayer(LayerTypesEnum.WMS))).toEqual(true);
    expect(LayerTypesHelper.isWmsLayer(getLayer(LayerTypesEnum.WMTS))).toEqual(false);
  });

  test('checks isTmsLayer', () => {
    expect(LayerTypesHelper.isTmsLayer(getLayer(LayerTypesEnum.TMS))).toEqual(true);
    expect(LayerTypesHelper.isTmsLayer(getLayer(LayerTypesEnum.WMS))).toEqual(false);
  });

  test('checks isVectorLayer', () => {
    expect(LayerTypesHelper.isVectorLayer(getLayer(LayerTypesEnum.Vector))).toEqual(true);
    expect(LayerTypesHelper.isVectorLayer(getLayer(LayerTypesEnum.WMS))).toEqual(false);
  });

  test('checks isWmtsLayer', () => {
    expect(LayerTypesHelper.isWmtsLayer(getLayer(LayerTypesEnum.WMTS))).toEqual(true);
    expect(LayerTypesHelper.isWmtsLayer(getLayer(LayerTypesEnum.WMS))).toEqual(false);
  });

});
