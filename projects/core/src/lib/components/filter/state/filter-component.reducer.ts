import * as FilterComponentActions from './filter-component.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FilterComponentState, initialFilterComponentState } from './filter-component.state';

const onCreateFilter = (
  state: FilterComponentState,
  payload: ReturnType<typeof FilterComponentActions.createFilter>,
): FilterComponentState => ({
  ...state,
  createFilterType: payload.filterType,
  selectedFilterGroup: undefined,
  selectedLayers: undefined,
});

const onSetSelectedFilterGroup = (
  state: FilterComponentState,
  payload: ReturnType<typeof FilterComponentActions.setSelectedFilterGroup>,
): FilterComponentState => ({
  ...state,
  selectedFilterGroup: payload.filterGroup.id,
  selectedLayers: payload.filterGroup.layerIds,
  createFilterType: undefined,
});

const onCloseForm = (
  state: FilterComponentState,
): FilterComponentState => ({
  ...state,
  createFilterType: undefined,
  selectedFilterGroup: undefined,
});

const onSetSelectedLayers = (
  state: FilterComponentState,
  payload: ReturnType<typeof FilterComponentActions.setSelectedLayers>,
): FilterComponentState => ({
  ...state,
  selectedLayers: payload.layers,
});

const filterComponentReducerImpl = createReducer<FilterComponentState>(
  initialFilterComponentState,
  on(FilterComponentActions.createFilter, onCreateFilter),
  on(FilterComponentActions.setSelectedFilterGroup, onSetSelectedFilterGroup),
  on(FilterComponentActions.closeForm, onCloseForm),
  on(FilterComponentActions.setSelectedLayers, onSetSelectedLayers),
);
export const filterComponentReducer = (state: FilterComponentState | undefined, action: Action) => filterComponentReducerImpl(state, action);
