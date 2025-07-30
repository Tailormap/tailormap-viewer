import { render, screen } from '@testing-library/angular';
import { InfoComponent } from './info.component';

describe('InfoComponent', () => {

  test('should render', async () => {
    await render(InfoComponent);
    expect(screen.getByText('info works!'));
  });

});
