import { render, screen } from '@testing-library/angular';
import { TasksListComponent } from './tasks-list.component';

describe('TasksListComponent', () => {

  test('should render', async () => {
    await render(TasksListComponent);
    expect(screen.getByText('tasks-list works!'));
  });

});
