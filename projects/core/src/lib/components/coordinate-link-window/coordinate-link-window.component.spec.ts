import { render, screen } from '@testing-library/angular';
import { CoordinateLinkWindowComponent } from './coordinate-link-window.component';

describe('CoordinateLinkWindowComponent', () => {

  test('should render', async () => {
    await render(CoordinateLinkWindowComponent);
    expect(screen.getByText('coordinate-link-window works!'));
  });

});
