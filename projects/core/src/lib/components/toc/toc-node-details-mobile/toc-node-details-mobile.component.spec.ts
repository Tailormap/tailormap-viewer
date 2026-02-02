import { render, screen } from '@testing-library/angular';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { SharedModule, TreeModel } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { TocNodeDetailsMobileComponent } from './toc-node-details-mobile.component';
import { LayerDetailsComponent } from '../toc-node-details/layer-details/layer-details.component';
import { LayerTransparencyComponent } from '../toc-node-details/layer-transparency/layer-transparency.component';

const setup = async (withLayer: boolean) => {
  const node: TreeModel<AppLayerModel> = {
    id: 'applayer-1',
    label: '',
    metadata: {
      id: '',
      layerName: '',
      title: '',
      serviceId: '',
      visible: false,
      hasAttributes: false,
      editable: false,
      opacity: 0,
      searchIndex: null,
      description: 'layer description',
    },
  };
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
    inputs: { treeNode: withLayer ? node : undefined },
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
