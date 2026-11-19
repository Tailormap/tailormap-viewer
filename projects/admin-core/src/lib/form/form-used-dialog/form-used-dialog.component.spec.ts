import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { getApplication } from '@tailormap-admin/admin-api';
import { FormUsedDialogComponent } from './form-used-dialog.component';

describe('FormUsedDialogComponent', () => {

  test('lists the application layers using the form with a link to the application layers', async () => {
    const close = vi.fn();
    await render(FormUsedDialogComponent, {
      providers: [
        provideRouter([]),
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: {
          formName: 'Inspection',
          usages: [{ application: getApplication({ id: '5', title: 'Field work' }), appLayerId: 'lyr1', layerTitle: 'Inspections' }],
        } },
      ],
    });
    expect(screen.getByText('Form is used in layers')).toBeInTheDocument();
    expect(screen.getByText('The form Inspection is used in the following application layers.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Field work: Inspections' })).toHaveAttribute('href', '/admin/applications/application/5/layers');
    await userEvent.click(screen.getByRole('button', { name: 'Ok' }));
    expect(close).toHaveBeenCalled();
  });

});
