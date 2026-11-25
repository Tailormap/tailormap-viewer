import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatetimeFieldComponent } from './datetime-field.component';

const setup = async (value: string | Date | null, required = false) => {
  const control = new FormControl<string | Date | null>(value);
  const { detectChanges } = await render(
    `<tm-datetime-field [formControl]="control" [required]="required">Timestamp</tm-datetime-field>`,
    {
      imports: [ DatetimeFieldComponent, ReactiveFormsModule ],
      componentProperties: { control, required },
    },
  );
  // A datetime-local input has no ARIA role, so find it by its label
  const input = screen.getByLabelText(/Timestamp/) as HTMLInputElement;
  return { control, input, detectChanges };
};

/** userEvent.type() can't type in a datetime-local input, so set the value as the browser picker would. */
const setNativeValue = (input: HTMLInputElement, value: string) => fireEvent.input(input, { target: { value } });

// Tests run with TZ=UTC (see test-globals.ts), so the local time is the UTC time
describe('DatetimeFieldComponent', () => {

  test('shows the value in the native input in local time', async () => {
    const { input } = await setup('2026-10-21T12:30:00.000+02:00');
    expect(input).toHaveAttribute('type', 'datetime-local');
    expect(input).toHaveValue('2026-10-21T10:30');
  });

  test('accepts a Date value', async () => {
    const { input } = await setup(new Date('2026-10-21T10:30:00.000Z'));
    expect(input).toHaveValue('2026-10-21T10:30');
  });

  test('sets an ISO timestamp when a date and time is picked', async () => {
    const { control, input } = await setup(null);
    setNativeValue(input, '2026-11-05T14:15');
    expect(control.value).toBe('2026-11-05T14:15:00.000+00:00');
  });

  test('is null when the input is cleared', async () => {
    const { control, input } = await setup('2026-10-21T10:30:00.000Z');
    setNativeValue(input, '');
    expect(control.value).toBeNull();
  });

  test('is required with the required input and shows the error after touching', async () => {
    const { control, input } = await setup(null, true);
    expect(input).toBeRequired();
    expect(control.hasError('required')).toBe(true);
    expect(input.closest('mat-form-field')).not.toHaveClass('mat-form-field-invalid');
    await userEvent.click(input);
    await userEvent.tab();
    expect(input.closest('mat-form-field')).toHaveClass('mat-form-field-invalid');
    expect(control.touched).toBe(true);
  });

  test('is valid when required and a value is picked', async () => {
    const { control, input } = await setup(null, true);
    setNativeValue(input, '2026-11-05T14:15');
    expect(control.valid).toBe(true);
  });

  test('disables the input when the control is disabled', async () => {
    const { control, input, detectChanges } = await setup('2026-10-21T10:30:00.000Z');
    control.disable();
    detectChanges();
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Open date and time picker' })).toBeDisabled();
  });

  test('opens the browser picker with the picker button', async () => {
    const { input } = await setup(null);
    const showPicker = vi.fn();
    Object.defineProperty(input, 'showPicker', { value: showPicker, configurable: true });
    await userEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }));
    expect(showPicker).toHaveBeenCalled();
  });

  test('focuses the input when the browser picker can not be opened', async () => {
    const { input } = await setup(null);
    Object.defineProperty(input, 'showPicker', {
      value: () => { throw new DOMException('Not allowed', 'NotAllowedError'); },
      configurable: true,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Open date and time picker' }));
    expect(input).toHaveFocus();
  });
});
