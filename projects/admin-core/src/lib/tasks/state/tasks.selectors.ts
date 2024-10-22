import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState, tasksStateKey } from './tasks.state';

const selectTasksState = createFeatureSelector<TasksState>(tasksStateKey);

export const selectTasks = createSelector(selectTasksState, state => state.tasks);
export const selectTaskDetails = createSelector(selectTasksState, state => state.taskDetails);

export const selectTask = (taskUuid: string | null) => createSelector(
  selectTasks,
  tasks => {
    return tasks.filter( task => task.uuid === taskUuid)[0];
  },
);
