import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { LayerDetailsComponent } from './layer-details.component';
import { getAppLayerModel, getServiceModel } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { LegendService } from '../../../legend/services/legend.service';
import { provideMockStore } from '@ngrx/store/testing';
import { getMapServiceMock } from '../../../../test-helpers/map-service.mock';

const setup = async () => {
  const appLayer = getAppLayerModel({ title: 'The Layer' });
  const legendServiceMock = {
    getLegendInfo$: vi.fn(() => of([
      {
        layer: { ...appLayer, service: getServiceModel() },
        url: 'http://some-url/geoserver/wms?REQUEST=GetLegendGraphic',
        isInScale: true,
      },
    ])),
  };
  await render(LayerDetailsComponent, {
    imports: [MatIconTestingModule],
    providers: [
      getMapServiceMock().provider,
      { provide: LegendService, useValue: legendServiceMock },
      provideMockStore({
        initialState: { map: { layers: [appLayer] } },
      }),
    ],
    inputs: {
      layerId: appLayer.id,
    },
  });
};

describe('LayerDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

});
