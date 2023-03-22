import { render, screen } from '@testing-library/angular';
import { PasswordFieldComponent } from './password-field.component';

describe('PasswordFieldComponent', () => {

  test('should render', async () => {
    await render(PasswordFieldComponent);
    expect(screen.getByText('password-field works!'));
  });

});
