import { render, screen } from '@testing-library/angular';
import { SnackBarMessageComponent } from './snack-bar-message.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';

describe('SnackbarMessageComponent', () => {

  test('should render', async () => {
    await render(SnackBarMessageComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: { message: 'Here is a message' }},
        { provide: MatSnackBarRef, useValue: { dismiss: jest.fn() }},
      ],
    });
    expect(screen.getByText('Here is a message'));
  });

  test('renders close button and triggers close', async () => {
    const closeFn = jest.fn();
    const config: SnackBarMessageOptionsModel = {
      message: 'Some message',
      showCloseButton: true,
      closeButtonText: 'Close',
    };
    await render(SnackBarMessageComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: config },
        { provide: MatSnackBarRef, useValue: { dismiss: closeFn }},
      ],
    });
    expect(screen.getByText('Some message'));
    expect(screen.getByText('Close'));
    (await screen.getByText('Close')).click();
    expect(closeFn).toHaveBeenCalled();
  });

});
