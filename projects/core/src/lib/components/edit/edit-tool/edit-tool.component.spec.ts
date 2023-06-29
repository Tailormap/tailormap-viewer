import { render, screen } from '@testing-library/angular';
import { EditToolComponent } from './edit-tool.component';

describe('EditToolComponent', () => {

  test('should render', async () => {
    await render(EditToolComponent);
    expect(screen.getByText('edit-tool works!'));
  });

});
