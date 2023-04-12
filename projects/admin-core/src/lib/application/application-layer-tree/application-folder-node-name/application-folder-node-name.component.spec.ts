import { render, screen } from '@testing-library/angular';
import { ApplicationFolderNodeNameComponent } from './application-folder-node-name.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';

describe('ApplicationFolderNodeNameComponent', () => {

  test('should render', async () => {
    const closeFn = jest.fn();
    await render(ApplicationFolderNodeNameComponent, {
      imports: [SharedImportsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeFn } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    });
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
    await userEvent.type(await screen.findByRole('textbox'), 'pretty folder');
    await userEvent.click(await screen.findByText('Create'));
    expect(closeFn).toHaveBeenCalledWith('pretty folder');
  });

});
