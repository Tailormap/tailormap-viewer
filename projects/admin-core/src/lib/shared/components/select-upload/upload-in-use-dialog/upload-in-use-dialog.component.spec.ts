import { render, screen } from '@testing-library/angular';
import { UploadInUseDialogComponent } from './upload-in-use-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { getCatalogNode, getFeatureSource, getGeoService } from '@tailormap-admin/admin-api';
import userEvent from '@testing-library/user-event';

describe('CatalogItemsInFolderDialogComponent', () => {

  test('should render', async () => {
    const node = getCatalogNode({ title: 'Obsolete folder' });
    const items = [
      getFeatureSource({ title: 'Feature Source 1' }),
      getGeoService({ title: 'Geo Service 1' }),
    ];
    const closeFn = jest.fn();
    await render(UploadInUseDialogComponent, {
      imports: [MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeFn } },
        { provide: MAT_DIALOG_DATA, useValue: { node, items } },
      ],
    });
    expect(await screen.findByText('Folder is not empty')).toBeInTheDocument();
    expect(await screen.findByText('This folder Obsolete folder is not empty and contains the following items.')).toBeInTheDocument();
    expect(await screen.findByText('Feature Source 1')).toBeInTheDocument();
    expect(await screen.findByText('Geo Service 1')).toBeInTheDocument();
    expect(await screen.findByText('Please remove these items first before removing the folder')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Ok'));
    expect(closeFn).toBeCalledWith(true);
  });

});
