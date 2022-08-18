import { render, screen } from '@testing-library/angular';
import { LegendComponent } from './legend.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { SharedCoreComponentsModule } from '../../../shared/components/shared-core-components.module';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { selectOrderedVisibleLayers } from '../../../map/state/map.selectors';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';
import { TestBed } from '@angular/core/testing';
import { LegendLayerComponent } from '../legend-layer/legend-layer.component';
import { LEGEND_ID } from '../legend-identifier';

const getMapService = () => {
  return { provide: MapService, useValue: { getLayerManager$: () => of({ getLegendUrl: (layerId: string) => `layer-${layerId}-url-from-service` }) } };
};

const getMockStore = () => {
  const layers = [
    getAppLayerModel({ title: 'Layer 1', layerName: 'layer1' }),
    getAppLayerModel({ id: 2, title: 'Layer 2', layerName: 'layer2' }),
    getAppLayerModel({ id: 3, title: 'Layer 3', layerName: 'layer3', legendImageUrl: 'layer-3-url' }),
  ];
  return provideMockStore({
    selectors: [
      { selector: selectOrderedVisibleLayers, value: layers },
    ],
  });
};

describe('LegendComponent', () => {

  test('renders Legend with visible false', async () => {
    const registerComponentFn = jest.fn();
    await render(LegendComponent, {
      declarations: [ LegendComponent, LegendLayerComponent ],
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
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
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
      providers: [
        getMapService(),
        getMockStore(),
      ],
    });
    TestBed.inject(MenubarService).toggleActiveComponent(LEGEND_ID, 'Legend');
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
    expect(await screen.findByText('Layer 2')).toBeInTheDocument();
    expect(await screen.findByText('Layer 3')).toBeInTheDocument();
    const images = await screen.findAllByRole('img');
    expect(images.length).toEqual(3);
    expect(images.map(i => i.getAttribute('src'))).toEqual([ 'layer-1-url-from-service', 'layer-2-url-from-service', 'layer-3-url' ]);
  });

});
