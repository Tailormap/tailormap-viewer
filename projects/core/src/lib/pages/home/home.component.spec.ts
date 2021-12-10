import { render, screen } from '@testing-library/angular';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {

  test('should render', async () => {
    const { container } = await render(HomeComponent);
    expect(container.querySelector('.map-container')).not.toBeNull();
  });

});
