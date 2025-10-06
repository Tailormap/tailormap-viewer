import { render, screen } from '@testing-library/angular';
import { PasswordResetRequestFormComponent } from './password-reset-request-form.component';
import { AutoFocusDirective } from '../../../../../../shared/src/lib/directives';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import userEvent from '@testing-library/user-event';

describe('PasswordResetRequestFormComponent', () => {

  test('should render', async () => {
    await render(PasswordResetRequestFormComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [ReactiveFormsModule], declarations: [AutoFocusDirective],
    });
    expect(screen.getByText('Email'));
    expect(screen.findByRole('button', { name: /request password reset/i }));
  });

  test('triggers requestReset method', async () => {
    const requestResetFn = jest.fn(() => of<boolean>(true));
    await render(PasswordResetRequestFormComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [ReactiveFormsModule], declarations: [AutoFocusDirective], inputs: {
        requestReset$: requestResetFn,
      },
    });
    const emailInput = screen.getByLabelText('Email');
    await userEvent.type(emailInput, 'test@acme.com');
    const button = screen.getByRole('button', { name: /request password reset/i });
    await userEvent.click(button);
    expect(requestResetFn).toHaveBeenCalledWith('test@acme.com');
  });
});
