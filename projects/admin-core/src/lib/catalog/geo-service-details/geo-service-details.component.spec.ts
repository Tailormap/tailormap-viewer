import { render, screen } from '@testing-library/angular';
import { GeoServiceDetailsComponent } from './geo-service-details.component';

describe('GeoServiceDetailsComponent', () => {

  test('should render', async () => {
    await render(GeoServiceDetailsComponent);
    expect(screen.getByText('geo-service-details works!'));
  });

});
