import { render, screen } from '@testing-library/angular';
import { TasksPageComponent } from './tasks-page.component';

describe('TasksPageComponent', () => {

  test('should render', async () => {
    await render(TasksPageComponent);
    expect(screen.getByText('tasks-page works!'));
  });

});
