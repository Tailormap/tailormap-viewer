import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState, tasksStateKey } from './tasks.state';

const selectTasksState = createFeatureSelector<TasksState>(tasksStateKey);

export const selectTasks = createSelector(selectTasksState, state => state.tasks);
export const selectTaskDetails = createSelector(selectTasksState, state => state.taskDetails);
export const selectTasksLoadError = createSelector(selectTasksState, state => state.tasksLoadError);
export const selectTaskDetailsLoadError = createSelector(selectTasksState, state => state.taskDetailsLoadError);
export const selectDeleteTaskError = createSelector(selectTasksState, state => state.deleteTaskError);
export const selectTasksLoadStatus = createSelector(selectTasksState, state => state.tasksLoadStatus);
export const selectTaskDetailsLoadStatus = createSelector(selectTasksState, state => state.taskDetailsLoadStatus);

export const selectTask = (taskUuid: string | null) => createSelector(
  selectTasks,
  tasks => {
    return tasks.filter( task => task.uuid === taskUuid)[0];
  },
);
