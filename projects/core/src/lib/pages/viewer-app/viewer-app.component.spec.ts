import { render, screen } from '@testing-library/angular';
import { ViewerAppComponent } from './viewer-app.component';

describe('HomeComponent', () => {

  test('should render', async () => {
    const { container } = await render(ViewerAppComponent);
    expect(container.querySelector('.map-container')).not.toBeNull();
  });

});
