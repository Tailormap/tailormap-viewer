import { render, screen } from '@testing-library/angular';
import { TaskDetailsComponent } from './task-details.component';
import { getTaskDetails, getTasks } from '@tailormap-admin/admin-api';
import { initialTasksState, TasksState, tasksStateKey } from '../state/tasks.state';
import { createMockStore } from '@ngrx/store/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { TaskMonitoringService } from '../services/task-monitoring.service';

const setup = async () => {
  const testTasks = getTasks();
  const testTaskDetails = getTaskDetails();
  const testTasksState: TasksState = {
    ...initialTasksState,
    tasks: testTasks,
    taskDetails: testTaskDetails,
  };
  const mockStore = createMockStore({
    initialState: { [tasksStateKey]: testTasksState },
  });
  const taskService = {
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
  };
  await render(TaskDetailsComponent, {
    imports: [SharedModule],
    providers: [
      { provide: Store, useValue: mockStore },
      { provide: TaskMonitoringService, useValue: taskService },
    ],
  });
  return mockStore;
};

describe('TaskDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(screen.getByText('Task Information'));
    expect(screen.getByText('Progress'));
  });

});
