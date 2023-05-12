import { render, screen } from '@testing-library/angular';
import { GroupCreateComponent } from './group-create.component';

describe('GroupCreateComponent', () => {

  test('should render', async () => {
    await render(GroupCreateComponent);
    expect(screen.getByText('group-create works!'));
  });

});
