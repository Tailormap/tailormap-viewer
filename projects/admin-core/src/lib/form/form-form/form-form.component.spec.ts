import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { provideMockStore } from '@ngrx/store/testing';
import { FormModel } from '@tailormap-admin/admin-api';
import { FormFormComponent } from './form-form.component';
import { FormService } from '../services/form.service';
import { selectForms } from '../state/form.selectors';

const forms = [
  { id: 1, name: 'Inspection', featureSourceId: 7, featureTypeName: 'inspections' },
  { id: 2, name: 'Existing', featureSourceId: 7, featureTypeName: 'inspections' },
  { id: 3, name: 'Other type', featureSourceId: 7, featureTypeName: 'other_type' },
];

const form: FormModel = {
  id: 1,
  name: 'Inspection',
  featureSourceId: 7,
  featureTypeName: 'inspections',
  fields: [],
  options: { tabs: [] },
};

const setup = async () => {
  const formServiceMock = { loadForms: vi.fn() };
  const validFormChanged = vi.fn();
  await render(FormFormComponent, {
    inputs: { form },
    on: { validFormChanged },
    providers: [
      { provide: FormService, useValue: formServiceMock },
      provideMockStore({ selectors: [{ selector: selectForms, value: forms }] }),
    ],
    configureTestBed: tb => tb.overrideComponent(FormFormComponent, {
      set: { imports: [ ReactiveFormsModule, MatFormField, MatLabel, MatHint, MatInput ], schemas: [NO_ERRORS_SCHEMA] },
    }),
  });
  return { formServiceMock, validFormChanged };
};

const nonUniqueMessage = 'A form with this name already exists for this feature type.';

describe('FormFormComponent', () => {

  test('loads the forms and accepts the current name of the form itself', async () => {
    const { formServiceMock } = await setup();
    expect(formServiceMock.loadForms).toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Inspection');
    expect(screen.queryByText(nonUniqueMessage)).not.toBeInTheDocument();
  });

  test('shows an error for a name used by another form of the same feature type', async () => {
    const { validFormChanged } = await setup();
    const input = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'existing');
    expect(await screen.findByText(nonUniqueMessage)).toBeInTheDocument();
    await vi.waitFor(() => expect(validFormChanged).toHaveBeenLastCalledWith(false));
  });

  test('allows a name used for another feature type', async () => {
    const { validFormChanged } = await setup();
    const input = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Other type');
    expect(screen.queryByText(nonUniqueMessage)).not.toBeInTheDocument();
    await vi.waitFor(() => expect(validFormChanged).toHaveBeenLastCalledWith(true));
  });

});
