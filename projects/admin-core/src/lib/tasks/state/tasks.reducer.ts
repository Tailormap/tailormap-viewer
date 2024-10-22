import * as TasksActions from './tasks.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { TasksState, initialTasksState } from './tasks.state';
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
  return {
    ...state,
    tasksDetails: [...state.tasksDetails, payload.taskDetails],
  };
}

const tasksReducerImpl = createReducer<TasksState>(
  initialTasksState,
  on(TasksActions.loadTasksStart, onLoadTasksStart),
  on(TasksActions.loadTasksSuccess, onLoadTasksSuccess),
  on(TasksActions.loadTasksFailed, onLoadTasksFailed),
);
export const tasksReducer = (state: TasksState | undefined, action: Action) => tasksReducerImpl(state, action);
