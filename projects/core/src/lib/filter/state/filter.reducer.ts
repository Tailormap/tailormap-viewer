import * as FilterActions from './filter.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FilterState, initialFilterState } from './filter.state';
import { FilterGroupModel } from '@tailormap-viewer/api';

const updateFilterGroup = (
  state: FilterState,
  filterGroupId: string,
  updateFn: (filterGroup: FilterGroupModel) => FilterGroupModel,
): FilterState => {
  const idx = state.filterGroups.findIndex(fg => fg.id === filterGroupId);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    filterGroups: [
      ...state.filterGroups.slice(0, idx),
      updateFn(state.filterGroups[idx]),
      ...state.filterGroups.slice(idx + 1),
    ],
  };
};

const onAddFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.addFilterGroup>,
): FilterState => ({
  ...state,
  filterGroups: [
    ...state.filterGroups,
    payload.filterGroup,
  ],
});

const onRemoveFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.removeFilterGroup>,
): FilterState => {
  const idx = state.filterGroups.findIndex(fg => fg.id === payload.filterGroupId);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    filterGroups: [
      ...state.filterGroups.slice(0, idx),
      ...state.filterGroups.slice(idx + 1),
    ],
  };
};

const onUpdateFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.updateFilterGroup>,
): FilterState => {
  return updateFilterGroup(state, payload.filterGroup.id, () => payload.filterGroup);
};

const onAddFilter = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.addFilter>,
): FilterState => {
  return updateFilterGroup(state, payload.filterGroupId, fg => {
    return {
      ...fg,
      filters: [ ...fg.filters, payload.filter ],
    };
  });
};

const onRemoveFilter = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.removeFilter>,
): FilterState => {
  return updateFilterGroup(state, payload.filterGroupId, fg => {
    const filterIdx = fg.filters.findIndex(f => f.id === payload.filterId);
    if (filterIdx === -1) {
      return fg;
    }
    return {
      ...fg,
      filters: [
        ...fg.filters.slice(0, filterIdx),
        ...fg.filters.slice(filterIdx + 1),
      ],
    };
  });
};

const onUpdateFilter = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.updateFilter>,
): FilterState => {
  return updateFilterGroup(state, payload.filterGroupId, fg => {
    const filterIdx = fg.filters.findIndex(f => f.id === payload.filter.id);
    if (filterIdx === -1) {
      return fg;
    }
    return {
      ...fg,
      filters: [
        ...fg.filters.slice(0, filterIdx),
        payload.filter,
        ...fg.filters.slice(filterIdx + 1),
      ],
    };
  });
};

const onToggleFilterDisabled = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.toggleFilterDisabled>,
): FilterState => {
  return updateFilterGroup(state, payload.filterGroupId, fg => {
    return {
      ...fg,
      disabled: !fg.disabled,
    };
  });
};

const onSetSingleFilterDisabled = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.setSingleFilterDisabled>,
): FilterState => {
  return updateFilterGroup(state, payload.filterGroupId, fg => {
    const filterIdx = fg.filters.findIndex(f => f.id === payload.filterId);
    if (filterIdx === -1) {
      return fg;
    }
    const filter = fg.filters[filterIdx];
    return {
      ...fg,
      filters: [
        ...fg.filters.slice(0, filterIdx),
        { ...filter, disabled: payload.disabled },
        ...fg.filters.slice(filterIdx + 1),
      ],
    };
  });
};

const filterReducerImpl = createReducer<FilterState>(
  initialFilterState,
  on(FilterActions.addFilterGroup, onAddFilterGroup),
  on(FilterActions.removeFilterGroup, onRemoveFilterGroup),
  on(FilterActions.updateFilterGroup, onUpdateFilterGroup),
  on(FilterActions.addFilter, onAddFilter),
  on(FilterActions.removeFilter, onRemoveFilter),
  on(FilterActions.updateFilter, onUpdateFilter),
  on(FilterActions.toggleFilterDisabled, onToggleFilterDisabled),
  on(FilterActions.setSingleFilterDisabled, onSetSingleFilterDisabled),
);
export const filterReducer = (state: FilterState | undefined, action: Action) => filterReducerImpl(state, action);
