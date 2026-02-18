import { TocNodeLayerComponent } from './toc-node-layer.component';
import { render, screen } from '@testing-library/angular';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatRadioModule } from '@angular/material/radio';
import { SharedDirectivesModule } from '@tailormap-viewer/shared';

const setup = async (node: TreeModel, scale?: number ) => {
  await render(TocNodeLayerComponent, {
    imports: [ MatIconModule, MatIconTestingModule, MatRadioModule, SharedDirectivesModule ],
    inputs: { node, scale },
  });
};

describe('TocNodeLayerComponent', () => {
  test('renders', async () => {
    await setup({ id: '1', label: 'Item 1' });
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
    await setup(layer, 1000000);
    expect(await screen.findByText(appLayer.title)).toBeInTheDocument();
    expect((await screen.findByText(appLayer.title)).closest('.tree-node')).toBeInTheDocument();
    expect((await screen.findByText(appLayer.title)).closest('.level')).not.toBeInTheDocument();
    expect((await screen.findByText(appLayer.title)).closest('.not-visible-on-map')).not.toBeInTheDocument();
  });

  test('renders level', async () => {
    const layer: TreeModel<AppLayerModel> = {
      id: `1`,
      label: 'Level 1',
      type: 'level',
      metadata: undefined,
    };
    await setup(layer);
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
    await setup(layer, 2000);
    expect((await screen.findByText(appLayer.title)).closest('.not-visible-on-map')).toBeInTheDocument();
  });

  test('does not render styles UI when layer has no styles', async () => {
    const appLayer = getAppLayerModel({ styles: undefined });
    const layer: TreeModel<AppLayerModel> = {
      id: `${appLayer.id}`,
      label: appLayer.title,
      type: 'layer',
      metadata: appLayer,
    };
    await setup(layer);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  test('does not render styles UI when layer has empty styles array', async () => {
    const appLayer = getAppLayerModel({ styles: [] });
    const layer: TreeModel<AppLayerModel> = {
      id: `${appLayer.id}`,
      label: appLayer.title,
      type: 'layer',
      metadata: appLayer,
    };
    await setup(layer);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  test('does not render styles UI when layer has only one style', async () => {
    const appLayer = getAppLayerModel({ 
      styles: [{ name: 'default', title: 'Default Style' }], 
    });
    const layer: TreeModel<AppLayerModel> = {
      id: `${appLayer.id}`,
      label: appLayer.title,
      type: 'layer',
      metadata: appLayer,
    };
    await setup(layer);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  test('renders styles UI when layer has multiple styles', async () => {
    const appLayer = getAppLayerModel({ 
      styles: [
        { name: 'default', title: 'Default Style' },
        { name: 'alternate', title: 'Alternate Style' },
      ], 
    });
    const layer: TreeModel<AppLayerModel> = {
      id: `${appLayer.id}`,
      label: appLayer.title,
      type: 'layer',
      metadata: appLayer,
    };
    await setup(layer);
    expect(screen.queryByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByText('Default Style')).toBeInTheDocument();
    expect(screen.getByText('Alternate Style')).toBeInTheDocument();
  });

});
