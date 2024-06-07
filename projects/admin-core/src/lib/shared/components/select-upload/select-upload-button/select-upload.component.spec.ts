import { render, screen } from '@testing-library/angular';
import { SelectUploadComponent } from './select-upload.component';

describe('SelectUploadButtonComponent', () => {

  test('should render', async () => {
    await render(SelectUploadComponent);
    expect(screen.getByText('select-upload-button works!'));
  });

});
