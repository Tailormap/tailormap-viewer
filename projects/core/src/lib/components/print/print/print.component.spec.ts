import { render, screen } from '@testing-library/angular';
import { PrintComponent } from './print.component';

describe('PrintComponent', () => {

  test('should render', async () => {
    await render(PrintComponent);
    expect(screen.getByText('print works!'));
  });

});
