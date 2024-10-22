import { render, screen } from '@testing-library/angular';
import { TaskDetailsComponent } from './task-details.component';

describe('TaskDetailsComponent', () => {

  test('should render', async () => {
    await render(TaskDetailsComponent);
    expect(screen.getByText('task-details works!'));
  });

});
