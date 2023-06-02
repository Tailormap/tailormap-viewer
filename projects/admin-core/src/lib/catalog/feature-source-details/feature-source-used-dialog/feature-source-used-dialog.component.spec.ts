import { render, screen } from '@testing-library/angular';
import { FeatureSourceUsedDialogComponent } from './feature-source-used-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { getFeatureSource, getGeoServiceLayer } from '@tailormap-admin/admin-api';
import userEvent from '@testing-library/user-event';

describe('FeatureSourceUsedDialogComponent', () => {

  test('should render', async () => {
    const featureSource = getFeatureSource({ title: 'Obsolete source' });
    const layers = [
      getGeoServiceLayer({ title: 'Layer 1' }),
      getGeoServiceLayer({ title: 'Layer 2' }),
    ];
    const closeFn = jest.fn();
    await render(FeatureSourceUsedDialogComponent, {
      imports: [MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeFn } },
        { provide: MAT_DIALOG_DATA, useValue: { layers, featureSource } },
      ],
    });
    expect(await screen.findByText('Source is used in applications')).toBeInTheDocument();
    expect(await screen.findByText('The source Obsolete source is used in the following layers.')).toBeInTheDocument();
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
    expect(await screen.findByText('Layer 2')).toBeInTheDocument();
    expect(await screen.findByText('Please remove the feature type from this source from the layers first')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Ok'));
    expect(closeFn).toBeCalledWith(true);
  });

});
