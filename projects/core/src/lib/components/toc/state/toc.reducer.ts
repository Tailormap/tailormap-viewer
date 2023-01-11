import * as TocActions from './toc.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { TocState, initialTocState } from './toc.state';

const onSetFilterEnabled = (
  state: TocState,
  payload: ReturnType<typeof TocActions.setFilterEnabled>,
): TocState => ({
  ...state,
  filterEnabled: payload.filterEnabled,
});
const onSetFilterTerm = (
  state: TocState,
  payload: ReturnType<typeof TocActions.setFilterTerm>,
): TocState => ({
  ...state,
  filterTerm: payload.filterTerm,
});

const onSetInfoTreeNodeId = (
  state: TocState,
  payload: ReturnType<typeof TocActions.setInfoTreeNodeId>,
): TocState => ({
  ...state,
  infoTreeNodeId: payload.infoTreeNodeId,
});

const tocReducerImpl = createReducer<TocState>(
  initialTocState,
  on(TocActions.setFilterEnabled, onSetFilterEnabled),
  on(TocActions.setFilterTerm, onSetFilterTerm),
  on(TocActions.setInfoTreeNodeId, onSetInfoTreeNodeId),
);
export const tocReducer = (state: TocState | undefined, action: Action) => tocReducerImpl(state, action);
