import { describe, test, expect } from 'vitest';
import { getAppLayerModel, getServiceModel, ServiceProtocol } from '@tailormap-viewer/api';
import {
  selectOrderedVisibleLayers, selectOrderedVisibleLayersWithLegend, selectOrderedVisibleLayersWithServices, selectSearchableLayers,
  selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes,
} from './map.selectors';
import { ExtendedAppLayerModel } from '../models';

const wmsService = getServiceModel({ id: 'wms', protocol: ServiceProtocol.WMS });
const serviceLayer: ExtendedAppLayerModel = { ...getAppLayerModel({ id: 'service-1', serviceId: 'wms', hasAttributes: true }), service: wmsService };
const wmsLayerWithoutAttributes: ExtendedAppLayerModel = {
  ...getAppLayerModel({ id: 'service-2', serviceId: 'wms', hasAttributes: false }),
  service: wmsService,
};
const userLayer: ExtendedAppLayerModel = {
  ...getAppLayerModel({ id: 'user-1', serviceId: '', hasAttributes: true, legendImageUrl: 'data:image/png;base64,' }),
  origin: 'user',
};

describe('Map selectors with user layers', () => {

  const visibleLayers = [ userLayer, serviceLayer, wmsLayerWithoutAttributes ];
  const orderedLayers = selectOrderedVisibleLayers.projector(visibleLayers, [ 'user-1', 'service-1', 'service-2' ]);

  test('selectOrderedVisibleLayers includes user layers in tree order', () => {
    expect(orderedLayers.map(l => l.id)).toEqual([ 'user-1', 'service-1', 'service-2' ]);
  });

  test('selectOrderedVisibleLayersWithServices excludes user layers', () => {
    expect(selectOrderedVisibleLayersWithServices.projector(orderedLayers).map(l => l.id)).toEqual([ 'service-1', 'service-2' ]);
  });

  test('selectors built on layers with services exclude user layers', () => {
    const withServices = selectOrderedVisibleLayersWithServices.projector(orderedLayers);
    expect(selectVisibleLayersWithAttributes.projector(withServices).map(l => l.id)).toEqual(['service-1']);
    expect(selectVisibleWMSLayersWithoutAttributes.projector(withServices).map(l => l.id)).toEqual(['service-2']);
    expect(selectSearchableLayers.projector(withServices).map(l => l.id)).not.toContain('user-1');
  });

  test('selectOrderedVisibleLayersWithLegend includes user layers with a legend image', () => {
    expect(selectOrderedVisibleLayersWithLegend.projector(orderedLayers).map(l => l.id)).toEqual([ 'user-1', 'service-1', 'service-2' ]);
  });

});
