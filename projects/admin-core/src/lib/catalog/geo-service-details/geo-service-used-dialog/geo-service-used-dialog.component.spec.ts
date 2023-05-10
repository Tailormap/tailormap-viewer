import { render, screen } from '@testing-library/angular';
import { GeoServiceUsedDialogComponent } from './geo-service-used-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { getApplication, getGeoService } from '@tailormap-admin/admin-api';
import userEvent from '@testing-library/user-event';

describe('GeoServiceUsedDialogComponent', () => {

  test('should render', async () => {
    const geoService = getGeoService({ title: 'Obsolete service' });
    const applications = [
      getApplication({ title: 'Application 1' }),
    ];
    const closeFn = jest.fn();
    await render(GeoServiceUsedDialogComponent, {
      imports: [MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeFn } },
        { provide: MAT_DIALOG_DATA, useValue: { service: geoService, applications } },
      ],
    });
    expect(await screen.findByText('Service is used in applications')).toBeInTheDocument();
    expect(await screen.findByText('The service Obsolete service is used in the following applications.')).toBeInTheDocument();
    expect(await screen.findByText('Application 1')).toBeInTheDocument();
    expect(await screen.findByText('Please remove the layers from this service from the applications first')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Ok'));
    expect(closeFn).toBeCalledWith(true);
  });

});
