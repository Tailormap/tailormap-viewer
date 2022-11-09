import { render, screen } from '@testing-library/angular';
import { LegendComponent } from './legend.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MenubarService } from '../../menubar';
import { Observable, of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { selectOrderedVisibleLayersWithServices } from '../../../map/state/map.selectors';
import { BaseComponentTypeEnum, getAppLayerModel, getServiceModel } from '@tailormap-viewer/api';
import { MapViewDetailsModel, MapService } from '@tailormap-viewer/map';
import { TestBed } from '@angular/core/testing';
import { LegendLayerComponent } from '../legend-layer/legend-layer.component';

const getMapService = () => {
  return {
    provide: MapService, useValue: {
      getLayerManager$: () => of({ getLegendUrl: (layerId: string) => `layer-${layerId}-url-from-service` }),
      getMapViewDetails$: (): Observable<MapViewDetailsModel> => of({
        zoomLevel: 0, resolution: 1, maxResolution: 100, minResolution: 0.001, maxZoomLevel: 20, minZoomLevel: 0, scale: 1000, size: undefined, extent: null,
      }),
    },
  };
};

const getMockStore = () => {
  const layersAndServices = [
    { ...getAppLayerModel({ title: 'Layer 1', layerName: 'layer1' }), service: getServiceModel() },
    { ...getAppLayerModel({ id: 2, title: 'Layer 2', layerName: 'layer2' }), service: getServiceModel() },
    { ...getAppLayerModel({ id: 3, title: 'Layer 3', layerName: 'layer3',
        legendImageUrl: 'https://layer-3-url/wms/?REQUEST=GetLegendGraphic' }), service: getServiceModel() },
    { ...getAppLayerModel({ id: 4, title: 'Layer 4', layerName: 'layer4',
        legendImageUrl: 'https://layer-4-weird-case-url/wms/?ReQuEST=GetLeGeNdGraphic' }), service: getServiceModel() },
  ];
  return provideMockStore({
    selectors: [
      { selector: selectOrderedVisibleLayersWithServices, value: layersAndServices },
    ],
  });
};

describe('LegendComponent', () => {

  test('renders Legend with visible false', async () => {
    const registerComponentFn = jest.fn();
    await render(LegendComponent, {
      declarations: [ LegendComponent, LegendLayerComponent ],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        getMapService(),
        getMockStore(),
        { provide: MenubarService, useValue: { registerComponent: registerComponentFn, isComponentVisible$: () => of(false) } },
      ],
    });
    expect(await screen.queryByText('Legend')).toBeNull();
    expect(registerComponentFn).toHaveBeenCalled();
  });

  test('renders Legend with visible true', async () => {
    await render(LegendComponent, {
      declarations: [ LegendComponent, LegendLayerComponent ],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        getMapService(),
        getMockStore(),
      ],
    });
    TestBed.inject(MenubarService).toggleActiveComponent(BaseComponentTypeEnum.LEGEND, 'Legend');
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
    expect(await screen.findByText('Layer 2')).toBeInTheDocument();
    expect(await screen.findByText('Layer 3')).toBeInTheDocument();
    const images = await screen.findAllByRole('img');
    expect(images.length).toEqual(4);
    expect(images[0].getAttribute('src')).toEqual('layer-1-url-from-service');
    expect(images[1].getAttribute('src')).toEqual('layer-2-url-from-service');
    const url3 = new URL(images[2].getAttribute('src') || '');
    expect(url3.host).toEqual('layer-3-url');
    expect(url3.searchParams.get('SCALE')).toEqual('1000');
    expect(url3.searchParams.get('LEGEND_OPTIONS')).toBeTruthy();
    const url4 = new URL(images[3].getAttribute('src') || '');
    expect(url4.host).toEqual('layer-4-weird-case-url');
    expect(url4.searchParams.get('SCALE')).toEqual('1000');
    expect(url4.searchParams.get('LEGEND_OPTIONS')).toBeTruthy(); // Should be case-insensitive to REQUEST=GetLegendGrapic URL param
  });
});
