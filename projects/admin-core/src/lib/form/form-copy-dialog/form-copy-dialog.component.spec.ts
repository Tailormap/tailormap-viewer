import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormModel } from '@tailormap-admin/admin-api';
import { FormFieldControlTypeEnum } from '@tailormap-viewer/api';
import { FormCopyDialogComponent } from './form-copy-dialog.component';
import { FormService } from '../services/form.service';
import { provideMockStore } from '@ngrx/store/testing';
import { selectForms } from '../state/form.selectors';

const original = {
  id: 3,
  name: 'Inspection',
  featureSourceId: 7,
  featureTypeName: 'inspections',
  fields: [{ name: 'status', label: 'Status', controlType: FormFieldControlTypeEnum.TEXT, tab: 'tab1' }],
  options: { adminComments: 'Admin notes', tabs: [{ id: 'tab1', label: 'General' }] },
  _links: { self: { href: '/forms/3' } },
} as FormModel;

const otherForms = [
  { id: 3, name: 'Inspection', featureSourceId: 7, featureTypeName: 'inspections' },
  { id: 5, name: 'Existing', featureSourceId: 7, featureTypeName: 'inspections' },
  { id: 6, name: 'Copy of Inspection', featureSourceId: 7, featureTypeName: 'other_type' },
];

const setup = async (getFormResult: FormModel | null = original, forms = otherForms) => {
  const dialogRefMock = { close: vi.fn() };
  const createdForm = { ...original, id: 4, name: 'Copy of Inspection' };
  const formServiceMock = {
    getForm$: vi.fn(() => of(getFormResult)),
    createForm$: vi.fn(() => of(createdForm)),
  };
  await render(FormCopyDialogComponent, {
    providers: [
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: FormService, useValue: formServiceMock },
      { provide: MAT_DIALOG_DATA, useValue: { formId: 3, formName: 'Inspection', featureSourceId: 7, featureTypeName: 'inspections' } },
      provideMockStore({ selectors: [{ selector: selectForms, value: forms }] }),
    ],
  });
  return { dialogRefMock, formServiceMock, createdForm };
};

describe('FormCopyDialogComponent', () => {

  test('prefills the name and cancels', async () => {
    const { dialogRefMock, formServiceMock } = await setup();
    expect(screen.getByText('Copy form Inspection')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Copy of Inspection');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
    expect(formServiceMock.createForm$).not.toHaveBeenCalled();
  });

  test('copies the saved form with a new name', async () => {
    const { dialogRefMock, formServiceMock, createdForm } = await setup();
    const input = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Inspection v2');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(formServiceMock.getForm$).toHaveBeenCalledWith(3);
    expect(formServiceMock.createForm$).toHaveBeenCalledWith({
      name: 'Inspection v2',
      featureSourceId: 7,
      featureTypeName: 'inspections',
      fields: original.fields,
      options: { adminComments: 'Admin notes', tabs: original.options.tabs },
    });
    expect(dialogRefMock.close).toHaveBeenCalledWith(createdForm);
  });

  test('does not save with an empty name', async () => {
    const { formServiceMock } = await setup();
    await userEvent.clear(screen.getByRole('textbox', { name: 'Name' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(formServiceMock.createForm$).not.toHaveBeenCalled();
  });

  test('prefills a name that is unique for the feature type', async () => {
    await setup(original, [ ...otherForms, { id: 4, name: 'Copy of Inspection', featureSourceId: 7, featureTypeName: 'inspections' }]);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Copy of Inspection (2)');
  });

  test('does not save with a name already used for the feature type', async () => {
    const { formServiceMock } = await setup();
    const input = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'existing');
    expect(await screen.findByText('A form with this name already exists for this feature type.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(formServiceMock.createForm$).not.toHaveBeenCalled();
  });

  test('shows an error and stays open when the form cannot be loaded', async () => {
    const { dialogRefMock, formServiceMock } = await setup(null);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Error while loading form');
    expect(formServiceMock.createForm$).not.toHaveBeenCalled();
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

});
