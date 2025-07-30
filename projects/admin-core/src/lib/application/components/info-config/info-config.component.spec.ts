import { render, screen } from '@testing-library/angular';
import { InfoConfigComponent } from './info-config.component';

describe('InfoConfigComponent', () => {

  test('should render', async () => {
    await render(InfoConfigComponent);
    expect(screen.getByText('info-config works!'));
  });

});
