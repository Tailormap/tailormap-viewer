import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateTime } from 'luxon';
import { AttributeType, FormFieldControlTypeEnum } from '@tailormap-viewer/api';
import { DatetimeFieldComponent } from './datetime-field.component';
import { ViewerEditFormFieldModel } from '../../models/viewer-edit-form-field.model';

const getItem = (required = false): ViewerEditFormFieldModel => ({
  name: 'ts',
  label: 'Timestamp',
  value: undefined,
  attributeType: AttributeType.TIMESTAMP,
  controlType: FormFieldControlTypeEnum.DATETIME,
  required,
});

const setup = async (value: string | null, required = false) => {
  const control = new FormControl<string | null>(value);
  const { detectChanges } = await render('<tm-datetime-field [formControl]="control" [item]="item"></tm-datetime-field>', {
    imports: [ DatetimeFieldComponent, ReactiveFormsModule ],
    providers: [provideLuxonDateAdapter()],
    componentProperties: { control, item: getItem(required) },
  });
  const dateInput = screen.getByPlaceholderText('Timestamp');
  const timeInput = screen.getByRole('combobox', { name: 'Time' });
  return { control, dateInput, timeInput, detectChanges };
};

/** Tests run with TZ=UTC (see test-globals.ts), so the local time is the UTC time. */
const toUtcIso = (value: string | null) => value ? DateTime.fromISO(value).toUTC().toISO() : value;

describe('DatetimeFieldComponent', () => {

  test('shows the date and time of the value', async () => {
    const { dateInput, timeInput } = await setup('2026-10-21T10:30:00.000Z');
    expect(screen.getByRole('group', { name: 'Timestamp' })).toBeInTheDocument();
    expect(dateInput).toHaveValue('10/21/2026');
    expect(timeInput).toHaveValue('10:30 AM');
  });

  test('keeps the time when changing the date', async () => {
    const { control, dateInput } = await setup('2026-10-21T10:30:15.000Z');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '11/5/2026');
    expect(toUtcIso(control.value)).toBe('2026-11-05T10:30:15.000Z');
    expect(control.valid).toBe(true);
  });

  test('keeps the date when changing the time', async () => {
    const { control, timeInput } = await setup('2026-10-21T10:30:00.000Z');
    await userEvent.clear(timeInput);
    await userEvent.type(timeInput, '2:15 PM');
    expect(toUtcIso(control.value)).toBe('2026-10-21T14:15:00.000Z');
  });

  test('uses midnight when only a date is entered', async () => {
    const { control, dateInput } = await setup(null);
    await userEvent.type(dateInput, '11/5/2026');
    expect(toUtcIso(control.value)).toBe('2026-11-05T00:00:00.000Z');
  });

  test('is null when the date is cleared', async () => {
    const { control, dateInput } = await setup('2026-10-21T10:30:00.000Z');
    await userEvent.clear(dateInput);
    expect(control.value).toBeNull();
    expect(control.valid).toBe(true);
  });

  test('is invalid when the date can not be parsed', async () => {
    const { control, dateInput } = await setup(null);
    await userEvent.type(dateInput, 'not a date');
    expect(control.value).toBeNull();
    expect(control.hasError('invalidDateTime')).toBe(true);
  });

  test('disables the inputs when the control is disabled', async () => {
    const { control, dateInput, timeInput, detectChanges } = await setup('2026-10-21T10:30:00.000Z');
    control.disable();
    detectChanges();
    expect(dateInput).toBeDisabled();
    expect(timeInput).toBeDisabled();
  });
});
