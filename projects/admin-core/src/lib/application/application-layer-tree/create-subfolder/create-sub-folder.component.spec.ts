import { render, screen } from '@testing-library/angular';
import { CreateSubFolderComponent } from './create-sub-folder.component';

describe('CreateSubfolderComponent', () => {

  test('should render', async () => {
    await render(CreateSubFolderComponent);
    expect(screen.getByText('create-subfolder works!'));
  });

});
