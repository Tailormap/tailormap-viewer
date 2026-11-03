import { describe, test, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { LayerDescriptionDialogService } from '../services/layer-description-dialog.service';
import { render, screen } from '@testing-library/angular';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { TreeModel } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { TocNodeDetailsMobileComponent } from './toc-node-details-mobile.component';

const setup = async (withLayer: boolean, descriptionInPopup?: boolean) => {
  const dialogServiceMock = { open: vi.fn() };
  const node: TreeModel<AppLayerModel> = {
    id: 'applayer-1',
    label: '',
    metadata: {
      id: '',
      layerName: '',
      title: 'The Layer',
      serviceId: '',
      visible: false,
      hasAttributes: false,
      editable: false,
      opacity: 0,
      searchIndex: null,
      description: 'layer description',
      descriptionInPopup,
    },
  };
  const appLayer = getAppLayerModel({ title: 'The Layer' });
  await render(TocNodeDetailsMobileComponent, {
    imports: [],
    providers: [
      getMapServiceMock().provider,
      { provide: LayerDescriptionDialogService, useValue: dialogServiceMock },
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
  return { dialogServiceMock };
};

describe('TocNodeDetailsMobileComponent', () => {

  test('should render nothing if no layer is passed', async () => {
    await setup(false);
    expect(screen.queryByText('layer description')).not.toBeInTheDocument();
  });

  test('should render if layer is passed', async () => {
    await setup(true);
    expect(screen.queryByText('layer description')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show information about this layer' })).not.toBeInTheDocument();
  });

  test('should render button to open description in a pop-up', async () => {
    const { dialogServiceMock } = await setup(true, true);
    expect(screen.queryByText('layer description')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Show information about this layer' });
    await vi.waitFor(() => expect(button).toHaveAccessibleDescription('Show information about The Layer'));
    await userEvent.click(button);
    expect(dialogServiceMock.open).toHaveBeenCalledWith('The Layer', 'layer description');
  });

});
