import { render, screen } from '@testing-library/angular';
import { GroupEditComponent } from './group-edit.component';

describe('GroupEditComponent', () => {

  test('should render', async () => {
    await render(GroupEditComponent);
    expect(screen.getByText('group-edit works!'));
  });

});
