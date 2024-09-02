import { render, screen } from '@testing-library/angular';
import { TocNodeDetailsComponent } from './toc-node-details.component';
import { getAppLayerModel, getLayerTreeNode, getServiceModel } from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';
import { LegendService } from '../../legend/services/legend.service';
import { LegendLayerComponent } from '../../legend/legend-layer/legend-layer.component';
import { provideMockStore } from '@ngrx/store/testing';
import { LayerDetailsComponent } from './layer-details/layer-details.component';
import { LayerTransparencyComponent } from './layer-transparency/layer-transparency.component';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const setup = async (withLayer: boolean) => {
  const closeMock = jest.fn();
  const node = getLayerTreeNode({ id: 'applayer-1', appLayerId: '1', name: 'The Layer', root: false });
  const appLayer = getAppLayerModel({ title: 'The Layer' });
  const legendServiceMock = {
    getLegendInfo$: jest.fn(() => of([
      {
        layer: { ...appLayer, service: getServiceModel() },
        url: 'http://some-url/geoserver/wms?REQUEST=GetLegendGraphic',
        isInScale: true,
      },
    ])),
  };
  await render(TocNodeDetailsComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ LegendLayerComponent, LayerDetailsComponent, LayerTransparencyComponent ],
    providers: [
      getMapServiceMock().provider,
      { provide: LegendService, useValue: legendServiceMock },
      provideMockStore({
        initialState: {
          map: {
            layers: [appLayer],
            layerTreeNodes: [node],
          },
        },
      }),
    ],
    inputs: { node: withLayer ? node : undefined },
    on: { closeDetails: closeMock },
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
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  test('should trigger close', async () => {
    const { close } = await setup(true);
    await userEvent.click(screen.getByLabelText('Close details'));
    expect(close).toHaveBeenCalled();
  });

});
