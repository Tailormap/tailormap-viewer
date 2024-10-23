import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState, tasksStateKey } from './tasks.state';

const selectTasksState = createFeatureSelector<TasksState>(tasksStateKey);

export const selectTasks = createSelector(selectTasksState, state => state.tasks);
export const selectTasksDetails = createSelector(selectTasksState, state => state.tasksDetails);

export const selectTask = (taskUuid: string | null) => createSelector(
  selectTasks,
  tasks => {
    return tasks.filter( task => task.uuid === taskUuid)[0];
  }
)

export const selectTaskDetails = (taskUuid: string | null) => createSelector(
  selectTasksDetails,
  tasks => {
    return tasks.filter( task => task.uuid === taskUuid)[0];
  }
)
