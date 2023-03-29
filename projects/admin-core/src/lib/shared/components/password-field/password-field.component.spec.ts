import { render, screen } from '@testing-library/angular';
import { PasswordFieldComponent } from './password-field.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';

describe('PasswordFieldComponent', () => {

  test('should render', async () => {
    const changed = jest.fn();
    await render(PasswordFieldComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
      componentProperties: {
        value: 'secret',
        label: 'Password',
        changed: { emit: changed } as any,
      },
    });
    expect(await screen.findByText('Password')).toBeInTheDocument();
    expect(await screen.findByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
    expect(await screen.findByRole('textbox')).toHaveValue('secret');
    await userEvent.type(await screen.findByRole('textbox'), '123');
    expect(changed).toHaveBeenCalledWith('secret123');
  });

});
