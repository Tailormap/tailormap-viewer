import { render, screen } from '@testing-library/angular';
import { EditComponent } from './edit.component';

describe('EditButtonComponent', () => {

  test('should render', async () => {
    await render(EditComponent);
    expect(screen.getByText('edit-button works!'));
  });

});
