import { ApplicationLayerTreeNodeComponent } from './application-layer-tree-node.component';
import { render, screen } from '@testing-library/angular';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('TocNodeLayerComponent', () => {
  test('renders', async () => {
    await render(ApplicationLayerTreeNodeComponent, {
      imports: [ MatIconModule, MatIconTestingModule ],
      componentProperties: {
        node: {
          id: '1',
          label: 'Item 1',
        },
      },
    });
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
  });

  test('renders layer', async () => {
    const appLayer = getAppLayerModel();
    const layer: TreeModel<AppLayerModel> = {
      id: `${appLayer.id}`,
      label: appLayer.title,
      type: 'layer',
      metadata: appLayer,
    };
    await render(ApplicationLayerTreeNodeComponent, {
      imports: [ MatIconModule, MatIconTestingModule ],
      componentProperties: {
        node: layer,
        scale: 1000000,
      },
    });
    expect(await screen.findByText(appLayer.title)).toBeInTheDocument();
    expect((await screen.findByText(appLayer.title)).closest('.tree-node')).toBeInTheDocument();
    expect((await screen.findByText(appLayer.title)).closest('.level')).not.toBeInTheDocument();
    expect((await screen.findByText(appLayer.title)).closest('.out-of-scale')).not.toBeInTheDocument();
  });

  test('renders level', async () => {
    const layer: TreeModel<AppLayerModel> = {
      id: `1`,
      label: 'Level 1',
      type: 'level',
      metadata: undefined,
    };
    await render(ApplicationLayerTreeNodeComponent, {
      imports: [ MatIconModule, MatIconTestingModule ],
      componentProperties: {
        node: layer,
      },
    });
    expect(await screen.findByText('Level 1')).toBeInTheDocument();
    expect((await screen.findByText('Level 1')).closest('.tree-node')).toBeInTheDocument();
    expect((await screen.findByText('Level 1')).closest('.level')).toBeInTheDocument();
  });

  test('renders out-of-scale layer', async () => {
    const appLayer = getAppLayerModel({ maxScale: 1000 });
    const layer: TreeModel<AppLayerModel> = {
      id: `${appLayer.id}`,
      label: appLayer.title,
      type: 'layer',
      metadata: appLayer,
    };
    await render(ApplicationLayerTreeNodeComponent, {
      imports: [ MatIconModule, MatIconTestingModule ],
      componentProperties: {
        node: layer,
        scale: 2000,
      },
    });
    expect((await screen.findByText(appLayer.title)).closest('.out-of-scale')).toBeInTheDocument();
  });

});
