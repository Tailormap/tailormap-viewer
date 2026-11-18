import { describe, test, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/angular';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { TreeModel } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { TocNodeDetailsMobileComponent } from './toc-node-details-mobile.component';
import { MatDialog } from '@angular/material/dialog';
import { LayerDescriptionDialogComponent } from '../toc-node-details/layer-description-dialog/layer-description-dialog.component';

const setup = async (withLayer: boolean, descriptionInPopup?: boolean) => {
  const dialogMock = { open: vi.fn() };
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
      provideMockStore({
        initialState: {
          map: {
            layers: [appLayer],
            layerTreeNodes: [node],
          },
        },
      }),
      { provide: MatDialog, useValue: dialogMock },
    ],
    inputs: { treeNode: withLayer ? node : undefined },
  });
  return { dialogMock };
};

describe('TocNodeDetailsMobileComponent', () => {

  test('should render nothing if no layer is passed', async () => {
    await setup(false);
    expect(screen.queryByText('layer description')).not.toBeInTheDocument();
  });

  test('should render if layer is passed', async () => {
    await setup(true);
    expect(await screen.findByText('layer description')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show information about The Layer' })).not.toBeInTheDocument();
  });

  test('should render button to open description in a pop-up', async () => {
    const { dialogMock } = await setup(true, true);
    expect(screen.queryByText('layer description')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Show information about The Layer' });
    await userEvent.click(button);
    expect(dialogMock.open).toHaveBeenCalledWith(LayerDescriptionDialogComponent, expect.objectContaining({
      data: { title: 'The Layer', description: 'layer description' },
    }));
  });

});
