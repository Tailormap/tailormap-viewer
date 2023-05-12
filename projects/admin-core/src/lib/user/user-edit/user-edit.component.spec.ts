import { render, screen } from '@testing-library/angular';
import { UserEditComponent } from './user-edit.component';

describe('UserEditComponent', () => {

  test('should render', async () => {
    await render(UserEditComponent);
    expect(screen.getByText('user-edit works!'));
  });

});
