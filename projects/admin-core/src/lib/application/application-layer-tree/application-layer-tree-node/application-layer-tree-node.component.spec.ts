import { ApplicationLayerTreeNodeComponent } from './application-layer-tree-node.component';
import { render, screen } from '@testing-library/angular';
import { TreeModel } from '@tailormap-viewer/shared';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatMenuModule } from '@angular/material/menu';
import { AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';

const setup = async (node: TreeModel<AppTreeNodeModel> | null) => {
  await render(ApplicationLayerTreeNodeComponent, {
    imports: [ MatIconModule, MatIconTestingModule, MatMenuModule ],
    inputs: { node },
  });
};

describe('ApplicationLayerTreeNodeComponent', () => {
  test('renders', async () => {
    await setup({ id: '1', label: 'Item 1' });
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
  });

  test('renders layer', async () => {
    const appLayer: AppTreeLayerNodeModel = {
      id: '1',
      layerName: 'layer',
      serviceId: '1',
      objectType: 'AppTreeLayerNode',
      visible: true,
    };
    const layer: TreeModel<AppTreeNodeModel> = {
      id: appLayer.id,
      label: appLayer.layerName,
      type: '',
      metadata: appLayer,
    };
    await setup(layer);
    expect(await screen.findByText(appLayer.layerName)).toBeInTheDocument();
    expect((await screen.findByText(appLayer.layerName)).closest('.tree-node')).toBeInTheDocument();
    expect((await screen.findByText(appLayer.layerName)).closest('.level')).not.toBeInTheDocument();
  });

  test('renders level', async () => {
    const appLevel: AppTreeLevelNodeModel = {
      id: '1',
      title: 'Level 1',
      root: false,
      childrenIds: [],
      objectType: 'AppTreeLevelNode',
    };
    const layer: TreeModel<AppTreeNodeModel> = {
      id: appLevel.id,
      label: appLevel.title,
      type: 'level',
      metadata: appLevel,
    };
    await setup(layer);
    expect(await screen.findByText('Level 1')).toBeInTheDocument();
    expect((await screen.findByText('Level 1')).closest('.tree-node')).toBeInTheDocument();
    expect((await screen.findByText('Level 1')).closest('.level')).toBeInTheDocument();
  });

});
