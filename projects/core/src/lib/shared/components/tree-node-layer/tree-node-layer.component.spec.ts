import { TreeNodeLayerComponent } from './tree-node-layer.component';
import { render, screen } from '@testing-library/angular';

describe('TreeNodeLayerComponent', () => {
  test('renders', async () => {
    await render(TreeNodeLayerComponent, {
      componentProperties: {
        node: {
          id: '1',
          label: 'Item 1',
        },
      },
    });
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
  });
});
