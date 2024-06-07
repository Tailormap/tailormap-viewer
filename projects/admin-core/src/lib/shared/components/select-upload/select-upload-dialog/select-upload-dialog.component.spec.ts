import { render, screen } from '@testing-library/angular';
import { SelectUploadDialogComponent } from './select-upload-dialog.component';

describe('SelectUploadComponent', () => {

  test('should render', async () => {
    await render(SelectUploadDialogComponent);
    expect(screen.getByText('select-upload works!'));
  });

});
