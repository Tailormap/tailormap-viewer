import { TaskDetailsModel, TaskModel } from '@tailormap-admin/admin-api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';


export const tasksStateKey = 'admin-tasks';

export interface TasksState {
  tasksLoadStatus: LoadingStateEnum;
  tasksLoadError?: string;
  tasks: TaskModel[];
  taskDetailsLoadStatus: LoadingStateEnum;
  taskDetailsLoadError?: string;
  taskDetails?: TaskDetailsModel;
  monitoring: boolean;
  deleteTaskError?: string;
}

export const initialTasksState: TasksState = {
  tasksLoadStatus: LoadingStateEnum.INITIAL,
  tasks: [],
  taskDetailsLoadStatus: LoadingStateEnum.INITIAL,
  monitoring: false,
};
