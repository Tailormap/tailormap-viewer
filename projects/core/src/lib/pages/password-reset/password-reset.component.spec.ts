import { render, screen } from '@testing-library/angular';
import { PasswordResetComponent } from './password-reset.component';

describe('PasswordResetComponent', () => {

  test('should render', async () => {
    await render(PasswordResetComponent);
    expect(screen.getByText('password-reset works!'));
  });

});
