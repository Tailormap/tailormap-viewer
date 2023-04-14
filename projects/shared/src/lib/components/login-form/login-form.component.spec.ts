import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { LoginFormComponent } from './login-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { AutoFocusDirective } from '../../directives';

describe('LoginFormComponent', () => {

  test('should render', async () => {
    await render(LoginFormComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        ReactiveFormsModule,
      ],
      declarations: [
        AutoFocusDirective,
      ],
    });
    expect(screen.getByText('Username'));
    expect(screen.getByText('Password'));
    expect(screen.findByRole('button', { name: /login/i }));
  });

  test('triggers login method', async () => {
    const loginFn = jest.fn(() => of(true));
    const loggedIn = { emit: jest.fn() } as any;
    await render(LoginFormComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      componentOutputs: {
        loggedIn,
      },
      componentInputs: {
        login$: loginFn,
      },
      imports: [
        ReactiveFormsModule,
      ],
      declarations: [
        AutoFocusDirective,
      ],
    });
    const nameControl = await screen.getByLabelText('Username');
    const passwordControl = await screen.getByLabelText('Password');
    await userEvent.type(nameControl, 'my_username');
    await userEvent.type(passwordControl, 'p@ssw0rd');
    await userEvent.click(await screen.findByRole('button', { name: /login/i }));
    expect(loginFn).toHaveBeenCalledWith('my_username', 'p@ssw0rd');
    expect(loggedIn.emit).toHaveBeenCalledWith({ loggedIn: true, user: { username: 'my_username' } });
  });

});
