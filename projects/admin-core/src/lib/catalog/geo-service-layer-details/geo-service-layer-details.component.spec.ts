import { render, screen } from '@testing-library/angular';
import { GeoServiceLayerDetailsComponent } from './geo-service-layer-details.component';

describe('GeoServiceLayerDetailsComponent', () => {

  test('should render', async () => {
    await render(GeoServiceLayerDetailsComponent);
    expect(screen.getByText('geo-service-layer-details works!'));
  });

});
