import { render, screen } from '@testing-library/angular';
import { LayerDetailsComponent } from './layer-details.component';
import { getAppLayerModel, getServiceModel } from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { LegendService } from '../../legend/services/legend.service';
import { LegendLayerComponent } from '../../legend/legend-layer/legend-layer.component';

const setup = async (withLayer: boolean) => {
  const closeMock = jest.fn();
  const appLayer = getAppLayerModel({ title: 'The Layer' });
  const mapServiceMock = {
    getMapViewDetails$: jest.fn(),
  };
  const legendServiceMock = {
    getLegendInfo$: jest.fn(() => of([
      {
        layer: { ...appLayer, service: getServiceModel() },
        url: 'http://some-url/geoserver/wms?REQUEST=GetLegendGraphic',
        isInScale: true,
      },
    ])),
  };
  await render(LayerDetailsComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [LegendLayerComponent],
    providers: [
      { provide: MapService, useValue: mapServiceMock },
      { provide: LegendService, useValue: legendServiceMock },
    ],
    componentProperties: {
      layer: withLayer ? appLayer : undefined,
      closeDetails: { emit: closeMock } as any,
    },
  });
  return { close: closeMock };
};

describe('LayerDetailsComponent', () => {

  test('should render nothing if no layer is passed', async () => {
    await setup(false);
    expect(screen.queryByText('Details for')).not.toBeInTheDocument();
  });

  test('should render layer name', async () => {
    await setup(true);
    expect(screen.getByText('Details for The Layer')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  test('should trigger close', async () => {
    const { close } = await setup(true);
    await userEvent.click(screen.getByLabelText('Close details'));
    expect(close).toHaveBeenCalled();
  });

});
