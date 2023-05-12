import { render, screen } from '@testing-library/angular';
import { GroupHomeComponent } from './group-home.component';

describe('GroupHomeComponent', () => {

  test('should render', async () => {
    await render(GroupHomeComponent);
    expect(screen.getByText('group-home works!'));
  });

});
