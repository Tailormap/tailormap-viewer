import { render, screen } from '@testing-library/angular';
import { TaskDetailsRowComponent } from './task-details-row.component';

describe('TaskDetailsRowComponent', () => {

  test('should render', async () => {
    await render(TaskDetailsRowComponent);
    expect(screen.getByText('task-details-row works!'));
  });

});
