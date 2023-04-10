import { render, screen } from '@testing-library/angular';
import { ApplicationFolderNodeNameComponent } from './application-folder-node-name.component';

describe('CreateSubfolderComponent', () => {

  test('should render', async () => {
    await render(ApplicationFolderNodeNameComponent);
    expect(screen.getByText('create-subfolder works!'));
  });

});
