import { render, screen } from '@testing-library/angular';
import { BaseLayoutComponent } from './base-layout.component';

describe('BaseLayoutComponent', () => {

  test('should render', async () => {
    await render(BaseLayoutComponent);
    expect(screen.getByText('base-layout works!'));
  });

});
