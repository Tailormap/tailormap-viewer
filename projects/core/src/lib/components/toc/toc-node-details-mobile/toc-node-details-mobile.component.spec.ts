import { render, screen } from '@testing-library/angular';
import { getAppLayerModel, getLayerTreeNode } from '@tailormap-viewer/api';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { TocNodeDetailsMobileComponent } from './toc-node-details-mobile.component';
import { LayerDetailsComponent } from '../toc-node-details/layer-details/layer-details.component';
import { LayerTransparencyComponent } from '../toc-node-details/layer-transparency/layer-transparency.component';

const setup = async (withLayer: boolean) => {
  const node = getLayerTreeNode({ id: 'applayer-1', appLayerId: '1', name: 'The Layer', root: false, description: 'layer description' });
  const appLayer = getAppLayerModel({ title: 'The Layer' });
  await render(TocNodeDetailsMobileComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ LayerDetailsComponent, LayerTransparencyComponent ],
    providers: [
      getMapServiceMock().provider,
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
  });
};

describe('TocNodeDetailsMobileComponent', () => {

  test('should render nothing if no layer is passed', async () => {
    await setup(false);
    expect(screen.queryByText('layer description')).not.toBeInTheDocument();
  });

  test('should render if layer is passed', async () => {
    await setup(true);
    expect(screen.queryByText('layer description')).toBeInTheDocument();
  });

});
