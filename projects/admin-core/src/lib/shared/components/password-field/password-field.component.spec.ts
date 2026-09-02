import { render, screen } from '@testing-library/angular';
import { PasswordFieldComponent } from './password-field.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';

describe('PasswordFieldComponent', () => {

  test('should render', async () => {
    const changed = vi.fn();
    await render(PasswordFieldComponent, {
      imports: [MatIconTestingModule],
      inputs: {
        value: 'secret',
        label: 'Password',
      },
      on: { changed: changed },
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
