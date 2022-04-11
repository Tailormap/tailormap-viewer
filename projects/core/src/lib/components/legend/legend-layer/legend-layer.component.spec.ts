import { render, screen } from '@testing-library/angular';
import { LegendLayerComponent } from './legend-layer.component';
import { getAppLayerModel } from '@tailormap-viewer/api';

describe('LegendLayerComponent', () => {

  test('should render', async () => {
    await render(LegendLayerComponent, {
      componentProperties: {
        url: 'some-url',
        layer: getAppLayerModel({ title: 'Layer title' }),
      },
    });
    expect(await screen.getByText('Layer title')).toBeInTheDocument();
    const img = await screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toEqual('some-url');
    expect(img.getAttribute('alt')).toEqual('Failed to load legend for Layer title');
  });

});
