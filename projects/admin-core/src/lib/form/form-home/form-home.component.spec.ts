import { render, screen } from '@testing-library/angular';
import { FormHomeComponent } from './form-home.component';

describe('FormHomeComponent', () => {

  test('should render', async () => {
    await render(FormHomeComponent);
    expect(screen.getByText('form-home works!'));
  });

});
