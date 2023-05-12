import { render, screen } from '@testing-library/angular';
import { UserHomeComponent } from './user-home.component';

describe('UserHomeComponent', () => {

  test('should render', async () => {
    await render(UserHomeComponent);
    expect(screen.getByText('user-home works!'));
  });

});
