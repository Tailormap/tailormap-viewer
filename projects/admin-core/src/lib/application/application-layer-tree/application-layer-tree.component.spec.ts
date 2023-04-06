import { render, screen } from '@testing-library/angular';
import { ApplicationLayerTreeComponent } from './application-layer-tree.component';

describe('ApplicationLayerTreeComponent', () => {

  test('should render', async () => {
    await render(ApplicationLayerTreeComponent);
    expect(screen.getByText('application-layer-tree works!'));
  });

});
