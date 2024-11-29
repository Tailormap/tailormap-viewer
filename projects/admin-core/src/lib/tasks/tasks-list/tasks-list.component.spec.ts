import { render, screen } from '@testing-library/angular';
import { TasksListComponent } from './tasks-list.component';
import { createMockStore } from '@ngrx/store/testing';
import { initialTasksState, TasksState, tasksStateKey } from '../state/tasks.state';
import { getTasks } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { LoadingStateEnum, SharedModule } from '@tailormap-viewer/shared';

const setup = async () => {
  const testTasks = getTasks();
  const testTasksState: TasksState = {
    ...initialTasksState,
    tasks: testTasks,
    tasksLoadStatus: LoadingStateEnum.LOADED,
  };
  const mockStore = createMockStore({
    initialState: { [tasksStateKey]: testTasksState },
  });
  await render(TasksListComponent, {
    imports: [SharedModule],
    providers: [
      { provide: Store, useValue: mockStore },
    ],
  });
  return mockStore;
};

describe('TasksListComponent', () => {

  test('should render', async () => {
    const mockStore = await setup();
    expect(screen.getByText('Tasks'));
  });

  test('should render list of tasks', async () => {
    const mockStore = await setup();
    expect(screen.getByText('POC task that runs every hour'));
    expect(screen.getByText('POC task that runs every minute'));
  });

});
