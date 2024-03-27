import { render, screen } from '@testing-library/angular';
import { FormPageComponent } from './form-page.component';

describe('FormPageComponent', () => {

  test('should render', async () => {
    await render(FormPageComponent);
    expect(screen.getByText('form-page works!'));
  });

});
