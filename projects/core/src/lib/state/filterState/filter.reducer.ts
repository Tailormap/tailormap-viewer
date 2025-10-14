import * as FilterActions from './filter.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { FilterState, initialFilterState } from './filter.state';
import { FilterGroupModel } from '@tailormap-viewer/api';
import { FilterTypeHelper } from '../../filter/helpers/filter-type.helper';

export const onAddAllFilterGroupsInConfig = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.addAllFilterGroupsInConfig>,
): FilterState => {
  return {
    ...state,
    configuredFilterGroups: payload.filterGroups,
  };
};

const updateFilterGroup = (
  state: FilterState,
  filterGroupId: string,
  updateFn: (filterGroup: FilterGroupModel) => FilterGroupModel,
): FilterState => {
  const idx = state.currentFilterGroups.findIndex(fg => fg.id === filterGroupId);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    currentFilterGroups: [
      ...state.currentFilterGroups.slice(0, idx),
      updateFn(state.currentFilterGroups[idx]),
      ...state.currentFilterGroups.slice(idx + 1),
    ],
  };
};

export const onAddFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.addFilterGroup>,
): FilterState => {
  if (state.currentFilterGroups.find(fg => fg.id === payload.filterGroup.id)) {
    return state;
  }
  return {
    ...state,
    currentFilterGroups: [
      ...state.currentFilterGroups,
      payload.filterGroup,
    ],
  };
};

export const onRemoveFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.removeFilterGroup>,
): FilterState => {
  const idx = state.currentFilterGroups.findIndex(fg => fg.id === payload.filterGroupId);
  if (idx === -1) {
    return state;
  }
  return {
    ...state,
    currentFilterGroups: [
      ...state.currentFilterGroups.slice(0, idx),
      ...state.currentFilterGroups.slice(idx + 1),
    ],
  };
};

export const onUpdateFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.updateFilterGroup>,
): FilterState => {
  return updateFilterGroup(state, payload.filterGroup.id, () => payload.filterGroup);
};

export const onAddFilter = (
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

export const onRemoveFilter = (
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

export const onUpdateFilter = (
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

export const onToggleFilterDisabled = (
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

export const onSetSingleFilterDisabled = (
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

export const onAddLayerIdsToFilterGroup = (
  state: FilterState,
  payload: ReturnType<typeof FilterActions.addLayerIdsToFilterGroup>,
): FilterState => {
  return updateFilterGroup(state, payload.filterGroupId, fg => {
    const newLayerIds = payload.layerIds.filter(id => !fg.layerIds.includes(id));
    if (newLayerIds.length === 0) {
      return fg;
    }
    return {
      ...fg,
      layerIds: [ ...fg.layerIds, ...newLayerIds ],
    };
  });
};

export const onResetAttributeFilters = (
  state: FilterState,
): FilterState => {
  return {
    ...state,
    currentFilterGroups: state.currentFilterGroups
      .filter(fg => fg.source === "PRESET")
      .map(fg => {
        if (!FilterTypeHelper.isAttributeFilterGroup(fg)) {
          return fg;
        }
        return {
          ...fg,
          filters: fg.filters.map(f => {
            const configuredFilterGroup = state.configuredFilterGroups.find(cfg => cfg.id === fg.id);
            const configuredFilter = configuredFilterGroup?.filters.find(cf => cf.id === f.id) || f;
            if (!configuredFilter) {
              return f;
            }
            return configuredFilter;
          }),
        };
      }),
  };
};


export const filterReducerImpl = createReducer<FilterState>(
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
  on(FilterActions.addLayerIdsToFilterGroup, onAddLayerIdsToFilterGroup),
  on(FilterActions.resetAttributeFilters, onResetAttributeFilters),
);
export const filterReducer = (state: FilterState | undefined, action: Action) => filterReducerImpl(state, action);
