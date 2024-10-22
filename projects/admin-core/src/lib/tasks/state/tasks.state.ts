import { TaskSchedule } from '@tailormap-admin/admin-api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';


export const tasksStateKey = 'admin-tasks';

export interface TasksState {
  tasksLoadStatus: LoadingStateEnum;
  tasksLoadError?: string;
  tasks: TaskSchedule[];
}

export const initialTasksState: TasksState = {
  tasksLoadStatus: LoadingStateEnum.INITIAL,
  tasks: [],
};
