import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { LoginFormComponent } from './login-form.component';
import { SecurityService } from '../../../services/security.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { selectRouteBeforeLogin } from '../../../state/core.selectors';
import { AutoFocusDirective } from '@tailormap-viewer/shared';

describe('LoginFormComponent', () => {

  test('should render', async () => {
    await render(LoginFormComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      imports: [
        ReactiveFormsModule,
      ],
      declarations: [
        AutoFocusDirective,
      ],
      providers: [
        { provide: SecurityService, useValue: { login$: jest.fn() }},
        { provide: Router, useValue: { navigateByUrl: jest.fn() }},
        provideMockStore({
          selectors: [{ selector: selectRouteBeforeLogin, value: '' }],
        }),
      ],
    });
    expect(screen.getByText('Username'));
    expect(screen.getByText('Password'));
    expect(screen.findByRole('button', { name: /login/i }));
  });

  test('triggers login method', async () => {
    const loginFn = jest.fn(() => of(true));
    const redirectFn = jest.fn();
    await render(LoginFormComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      imports: [
        ReactiveFormsModule,
      ],
      declarations: [
        AutoFocusDirective,
      ],
      providers: [
        { provide: SecurityService, useValue: { login$: loginFn }},
        { provide: Router, useValue: { navigateByUrl: redirectFn }},
        provideMockStore({
          selectors: [{ selector: selectRouteBeforeLogin, value: '' }],
        }),
      ],
    });
    const nameControl = await screen.getByLabelText('Username');
    const passwordControl = await screen.getByLabelText('Password');
    await userEvent.type(nameControl, 'my_username');
    await userEvent.type(passwordControl, 'p@ssw0rd');
    await userEvent.click(await screen.findByRole('button', { name: /login/i }));
    expect(loginFn).toHaveBeenCalledWith('my_username', 'p@ssw0rd');
    expect(redirectFn).toHaveBeenCalledWith('/');
  });

  test('redirects to login before URL', async () => {
    const loginFn = jest.fn(() => of(true));
    const redirectFn = jest.fn();
    await render(LoginFormComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      imports: [
        ReactiveFormsModule,
      ],
      declarations: [
        AutoFocusDirective,
      ],
      providers: [
        { provide: SecurityService, useValue: { login$: loginFn }},
        { provide: Router, useValue: { navigateByUrl: redirectFn }},
        provideMockStore({
          selectors: [{ selector: selectRouteBeforeLogin, value: '/app/some-app' }],
        }),
      ],
    });
    const nameControl = await screen.getByLabelText('Username');
    const passwordControl = await screen.getByLabelText('Password');
    await userEvent.type(nameControl, 'my_username');
    await userEvent.type(passwordControl, 'p@ssw0rd');
    await userEvent.click(await screen.findByRole('button', { name: /login/i }));
    expect(loginFn).toHaveBeenCalledWith('my_username', 'p@ssw0rd');
    expect(redirectFn).toHaveBeenCalledWith('/app/some-app');
  });

});
