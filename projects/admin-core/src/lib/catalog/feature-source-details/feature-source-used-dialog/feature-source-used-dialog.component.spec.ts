import { render, screen } from '@testing-library/angular';
import { FeatureSourceUsedDialogComponent } from './feature-source-used-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { getFeatureSource, getGeoServiceLayer } from '@tailormap-admin/admin-api';
import userEvent from '@testing-library/user-event';
import { provideMockStore } from '@ngrx/store/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('FeatureSourceUsedDialogComponent', () => {

  test('should render', async () => {
    const featureSource = getFeatureSource({ title: 'Obsolete source' });
    const layers = [
      getGeoServiceLayer({ title: 'Layer 1' }),
      getGeoServiceLayer({ title: 'Layer 2' }),
    ];
    const closeFn = jest.fn();
    await render(FeatureSourceUsedDialogComponent, {
      imports: [ MatDialogModule, MatSnackBarModule, MatIconModule, MatIconTestingModule ],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeFn, afterClosed: () => (new Subject()).asObservable() } },
        { provide: MAT_DIALOG_DATA, useValue: { layers, featureSource } },
        provideMockStore(),
      ],
    });
    expect(await screen.findByText('Feature source is used in layers')).toBeInTheDocument();
    expect(await screen.findByText('The feature source Obsolete source is used in the following layers.')).toBeInTheDocument();
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
    expect(await screen.findByText('Layer 2')).toBeInTheDocument();
    expect(await screen.findByText('Please remove the feature source and type from these layers first')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Ok'));
    expect(closeFn).toBeCalledWith(true);
  });

});
