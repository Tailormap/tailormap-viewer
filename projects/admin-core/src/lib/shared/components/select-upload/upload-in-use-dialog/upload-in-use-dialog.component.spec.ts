import { render, screen } from '@testing-library/angular';
import { UploadInUseDialogComponent } from './upload-in-use-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import userEvent from '@testing-library/user-event';

describe('UploadInUseDialogComponent', () => {

  test('should render', async () => {
    const items = [
      { id: '1', name: 'Some place', url: 'somewhere' },
    ];
    const closeFn = jest.fn();
    await render(UploadInUseDialogComponent, {
      imports: [MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeFn } },
        { provide: MAT_DIALOG_DATA, useValue: { items } },
      ],
    });
    expect(await screen.findByText('File is still in use')).toBeInTheDocument();
    expect(await screen.findByText('This file cannot be removed because it is still used in the following places.')).toBeInTheDocument();
    expect(await screen.findByText('Some place')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Ok'));
    expect(closeFn).toBeCalledWith(true);
  });

});
