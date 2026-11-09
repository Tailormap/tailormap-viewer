import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { TocNodeDetailsComponent } from './toc-node-details.component';
import { AppLayerModel, getAppLayerModel, getLayerTreeNode, getServiceModel } from '@tailormap-viewer/api';
import { LayerTreeNodeWithLayerModel } from '../../../map/models/layer-tree-node-with-layer.model';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { LegendService } from '../../legend/services/legend.service';
import { provideMockStore } from '@ngrx/store/testing';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { Component, input } from '@angular/core';
import { LegendImageComponent, LegendImageSettingsModel } from '@tailormap-viewer/shared';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { LayerDescriptionDialogComponent } from './layer-description-dialog/layer-description-dialog.component';

@Component({
  selector: 'tm-image-with-description',
  template: '<img [src]="src()" [srcset]="legendSettings()?.srcset ?? \'\'" [alt]="legendSettings()?.altText ?? \'\'" />',
})
class MockImageWithDescriptionComponent {
  public src = input<string>('');
  public legendSettings = input<LegendImageSettingsModel | null>(null);
}

const setup = async (withLayer: boolean, layerOverrides?: Partial<AppLayerModel>) => {
  const closeMock = vi.fn();
  const appLayer = getAppLayerModel({ title: 'The Layer', ...layerOverrides });
  const node: LayerTreeNodeWithLayerModel = {
    ...getLayerTreeNode({ id: 'applayer-1', appLayerId: '1', name: 'The Layer', root: false }),
    is3dLayer: false,
    layer: appLayer,
  };
  const dialogMock = { open: vi.fn() };
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
  await render(TocNodeDetailsComponent, {
    imports: [],
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
      { provide: MatDialog, useValue: dialogMock },
    ],
    inputs: { node: withLayer ? node : undefined },
    on: { closeDetails: closeMock },
  });
  return { close: closeMock, dialogMock };
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

  test('should render description inline', async () => {
    await setup(true, { description: 'The layer description' });
    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByText('The layer description')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show information about The Layer' })).not.toBeInTheDocument();
  });

  test('should render button to open description in a pop-up', async () => {
    const { dialogMock } = await setup(true, { description: 'The layer description', descriptionInPopup: true });
    expect(screen.queryByText('The layer description')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Description' })).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Show information about The Layer' });
    await userEvent.click(button);
    expect(dialogMock.open).toHaveBeenCalledWith(LayerDescriptionDialogComponent, expect.objectContaining({
      data: { title: 'The Layer', description: 'The layer description' },
    }));
  });

});
