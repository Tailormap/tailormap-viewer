import { TaskDetailsModel, TaskModel } from '@tailormap-admin/admin-api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';


export const tasksStateKey = 'admin-tasks';

export interface TasksState {
  tasksLoadStatus: LoadingStateEnum;
  tasksLoadError?: string;
  tasks: TaskModel[];
  taskDetails?: TaskDetailsModel;
}

export const initialTasksState: TasksState = {
  tasksLoadStatus: LoadingStateEnum.INITIAL,
  tasks: [],
};
