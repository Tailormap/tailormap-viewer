import * as FilterComponentActions from './filter-component.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FilterComponentState, initialFilterComponentState } from './filter-component.state';

const onCreateFilter = (
  state: FilterComponentState,
  payload: ReturnType<typeof FilterComponentActions.createFilter>,
): FilterComponentState => ({
  ...state,
  createFilterType: payload.filterType,
});

const filterComponentReducerImpl = createReducer<FilterComponentState>(
  initialFilterComponentState,
  on(FilterComponentActions.createFilter, onCreateFilter),
);
export const filterComponentReducer = (state: FilterComponentState | undefined, action: Action) => filterComponentReducerImpl(state, action);
