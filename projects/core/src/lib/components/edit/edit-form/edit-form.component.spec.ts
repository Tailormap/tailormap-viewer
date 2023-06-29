import { render, screen } from '@testing-library/angular';
import { EditFormComponent } from './edit-form.component';

describe('EditFormComponent', () => {

  test('should render', async () => {
    await render(EditFormComponent);
    expect(screen.getByText('edit-form works!'));
  });

});
