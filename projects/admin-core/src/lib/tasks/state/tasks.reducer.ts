import * as TasksActions from './tasks.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { initialTasksState, TasksState } from './tasks.state';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

const onLoadTasksStart = (state: TasksState): TasksState => ({
  ...state,
  tasksLoadStatus: LoadingStateEnum.LOADING,
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
    tasksLoadError: undefined,
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

const onLoadTaskDetailsStart = (state: TasksState): TasksState => ({
  ...state,
  taskDetailsLoadStatus: LoadingStateEnum.LOADING,
  taskDetails: undefined,
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

const onDeleteTaskFailed = (
  state: TasksState,
  payload: ReturnType<typeof TasksActions.deleteTaskFailed>,
): TasksState => ({
  ...state,
  deleteTaskError: payload.error,
});

const tasksReducerImpl = createReducer<TasksState>(
  initialTasksState,
  on(TasksActions.loadTasksStart, onLoadTasksStart),
  on(TasksActions.loadTasksSuccess, onLoadTasksSuccess),
  on(TasksActions.loadTasksFailed, onLoadTasksFailed),
  on(TasksActions.loadTaskDetailsStart, onLoadTaskDetailsStart),
  on(TasksActions.loadTaskDetailsSuccess, onLoadTaskDetailsSuccess),
  on(TasksActions.loadTaskDetailsFailed, onLoadTaskDetailsFailed),
  on(TasksActions.deleteTaskSuccess, onDeleteTaskSuccess),
  on(TasksActions.deleteTaskFailed, onDeleteTaskFailed),
);
export const tasksReducer = (state: TasksState | undefined, action: Action) => tasksReducerImpl(state, action);
