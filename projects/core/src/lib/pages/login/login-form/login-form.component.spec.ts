import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { LoginFormComponent } from './login-form.component';
import { SecurityService } from '../../../services/security.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('LoginFormComponent', () => {

  test('should render', async () => {
    await render(LoginFormComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      imports: [
        ReactiveFormsModule,
      ],
    });
    expect(screen.getByText('Username'));
    expect(screen.getByText('Password'));
    expect(screen.findByRole('button', { name: /login/i }));
  });

  test('triggers login method', async () => {
    const loginFn = jest.fn();
    await render(LoginFormComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        { provide: SecurityService, useValue: { login$: loginFn }},
      ],
    });
    const nameControl = await screen.getByLabelText('Username');
    const passwordControl = await screen.getByLabelText('Password');
    userEvent.type(nameControl, 'my_username');
    userEvent.type(passwordControl, 'p@ssw0rd');
    userEvent.click(await screen.findByRole('button', { name: /login/i }));
    expect(loginFn).toHaveBeenCalledWith('my_username', 'p@ssw0rd');
  });

});
