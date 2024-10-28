import * as TasksActions from './tasks.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { initialTasksState, TasksState } from './tasks.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const onLoadTasksStart = (state: TasksState): TasksState => ({
  ...state,
  tasks: [],
});

const onLoadTasksSuccess = (
  state: TasksState,
  payload: ReturnType<typeof TasksActions.loadTasksSuccess>,
): TasksState => {
  const tasks = payload.tasks;
  return {
    ...state,
    tasksLoadStatus: LoadingStateEnum.LOADED,
    tasks,
  };
};

const onLoadTasksFailed = (
  state: TasksState,
  payload: ReturnType<typeof TasksActions.loadTasksFailed>,
): TasksState => ({
  ...state,
  tasksLoadStatus: LoadingStateEnum.FAILED,
  tasksLoadError: payload.error,
  tasks: [],
});

const onLoadTaskDetailsSuccess = (
  state: TasksState,
  payload: ReturnType<typeof TasksActions.loadTaskDetailsSuccess>,
): TasksState => {
  const taskDetails = payload.taskDetails;
  return {
    ...state,
    taskDetailsLoadStatus: LoadingStateEnum.LOADED,
    taskDetails,
  };
};

const onLoadTaskDetailsFailed = (
  state: TasksState,
  payload: ReturnType<typeof TasksActions.loadTaskDetailsFailed>,
): TasksState => ({
  ...state,
  taskDetailsLoadStatus: LoadingStateEnum.FAILED,
  taskDetailsLoadError: payload.error,
  taskDetails: undefined,
});

const onStartMonitoringTask = (state: TasksState): TasksState => ({
  ...state,
  monitoring: true,
});

const onStopMonitoringTask = (state: TasksState): TasksState => ({
  ...state,
  monitoring: false,
});

const onDeleteTaskSuccess = (
  state: TasksState,
  payload: ReturnType<typeof TasksActions.deleteTaskSuccess>,
): TasksState => {
  const uuid = payload.taskUuid;
  return {
    ...state,
    tasks: state.tasks.filter(task => task.uuid !== uuid),
    taskDetails: undefined,
  };
};

const tasksReducerImpl = createReducer<TasksState>(
  initialTasksState,
  on(TasksActions.loadTasksStart, onLoadTasksStart),
  on(TasksActions.loadTasksSuccess, onLoadTasksSuccess),
  on(TasksActions.loadTasksFailed, onLoadTasksFailed),
  on(TasksActions.loadTaskDetailsSuccess, onLoadTaskDetailsSuccess),
  on(TasksActions.loadTaskDetailsFailed, onLoadTaskDetailsFailed),
  on(TasksActions.startMonitoringTask, onStartMonitoringTask),
  on(TasksActions.stopMonitoringTask, onStopMonitoringTask),
  on(TasksActions.deleteTaskSuccess, onDeleteTaskSuccess),
);
export const tasksReducer = (state: TasksState | undefined, action: Action) => tasksReducerImpl(state, action);
