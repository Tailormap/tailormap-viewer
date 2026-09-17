import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { LayerDetailsComponent } from './layer-details.component';
import { getAppLayerModel, getServiceModel } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { LegendService } from '../../../legend/services/legend.service';
import { provideMockStore } from '@ngrx/store/testing';
import { getMapServiceMock } from '../../../../test-helpers/map-service.mock';
import { Component, input } from '@angular/core';
import { LegendImageComponent, LegendImageSettingsModel } from '@tailormap-viewer/shared';
import { TestBed } from '@angular/core/testing';

@Component({
  selector: 'tm-image-with-description',
  template: '<img [src]="src()" [srcset]="legendSettings()?.srcset ?? \'\'" [alt]="legendSettings()?.altText ?? \'\'" />',
})
class MockImageWithDescriptionComponent {
  public src = input<string>('');
  public legendSettings = input<LegendImageSettingsModel | null>(null);
}

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
  TestBed.overrideComponent(LegendImageComponent, {
    set: { imports: [MockImageWithDescriptionComponent] },
  });
  await render(LayerDetailsComponent, {
    imports: [],
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
