import { render, screen } from '@testing-library/angular';
import { TasksHomeComponent } from './tasks-home.component';

describe('TasksHomeComponent', () => {

  test('should render', async () => {
    await render(TasksHomeComponent);
    expect(screen.getByText('tasks-home works!'));
  });

});
