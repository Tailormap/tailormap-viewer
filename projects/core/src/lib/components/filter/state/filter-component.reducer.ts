import * as FilterComponentActions from './filter-component.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FilterComponentState, initialFilterComponentState } from './filter-component.state';
import { closeForm } from './filter-component.actions';

const onCreateFilter = (
  state: FilterComponentState,
  payload: ReturnType<typeof FilterComponentActions.createFilter>,
): FilterComponentState => ({
  ...state,
  createFilterType: payload.filterType,
});

const onSetSelectedFilterGroup = (
  state: FilterComponentState,
  payload: ReturnType<typeof FilterComponentActions.setSelectedFilterGroup>,
): FilterComponentState => ({
  ...state,
  selectedFilterGroup: payload.id,
});

const onCloseForm = (
  state: FilterComponentState,
): FilterComponentState => ({
  ...state,
  createFilterType: undefined,
  selectedFilterGroup: undefined,
});

const filterComponentReducerImpl = createReducer<FilterComponentState>(
  initialFilterComponentState,
  on(FilterComponentActions.createFilter, onCreateFilter),
  on(FilterComponentActions.setSelectedFilterGroup, onSetSelectedFilterGroup),
  on(FilterComponentActions.closeForm, onCloseForm),
);
export const filterComponentReducer = (state: FilterComponentState | undefined, action: Action) => filterComponentReducerImpl(state, action);
