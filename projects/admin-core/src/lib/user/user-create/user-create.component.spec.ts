import { render, screen } from '@testing-library/angular';
import { UserCreateComponent } from './user-create.component';

describe('UserCreateComponent', () => {

  test('should render', async () => {
    await render(UserCreateComponent);
    expect(screen.getByText('user-create works!'));
  });

});
