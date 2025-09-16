import * as FilterActions from './filter.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FilterState, initialFilterState } from './filter.state';
import { FilterGroupModel } from '@tailormap-viewer/api';

const onAddAllFilterGroupsInConfig = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.addAllFilterGroupsInConfig>,
): FilterState => {
  return {
    ...state,
    allFilterGroupsInConfig: payload.filterGroups,
  };
};

const updateFilterGroup = (
  state: FilterState,
  filterGroupId: string,
  updateFn: (filterGroup: FilterGroupModel) => FilterGroupModel,
): FilterState => {
  const idx = state.activeFilterGroups.findIndex(fg => fg.id === filterGroupId);
  const idxInAllFilterGroups = state.allFilterGroupsInConfig.findIndex(fg => fg.id === filterGroupId);
  if (idx === -1 && idxInAllFilterGroups === -1) {
    return state;
  }
  const newFilterGroups = idx === -1
    ? state.activeFilterGroups
    : [
      ...state.activeFilterGroups.slice(0, idx),
      updateFn(state.activeFilterGroups[idx]),
      ...state.activeFilterGroups.slice(idx + 1),
    ];
  const newAllFilterGroupsInConfig = idxInAllFilterGroups === -1
    ? state.allFilterGroupsInConfig
    : [
      ...state.allFilterGroupsInConfig.slice(0, idxInAllFilterGroups),
      updateFn(state.allFilterGroupsInConfig[idxInAllFilterGroups]),
      ...state.allFilterGroupsInConfig.slice(idxInAllFilterGroups + 1),
    ];
  return {
    ...state,
    activeFilterGroups: newFilterGroups,
    allFilterGroupsInConfig: newAllFilterGroupsInConfig,
  };
};

const onAddFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.addFilterGroup>,
): FilterState => {
  if (state.activeFilterGroups.find(fg => fg.id === payload.filterGroup.id)) {
    return state;
  }
  return {
    ...state,
    activeFilterGroups: [
      ...state.activeFilterGroups,
      payload.filterGroup,
    ],
  };
};

const onRemoveFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.removeFilterGroup>,
): FilterState => {
  const idx = state.activeFilterGroups.findIndex(fg => fg.id === payload.filterGroupId);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    activeFilterGroups: [
      ...state.activeFilterGroups.slice(0, idx),
      ...state.activeFilterGroups.slice(idx + 1),
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
  on(FilterActions.addAllFilterGroupsInConfig, onAddAllFilterGroupsInConfig),
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
