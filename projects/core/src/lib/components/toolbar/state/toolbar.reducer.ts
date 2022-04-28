import * as ToolbarActions from './toolbar.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { ToolbarState, initialToolbarState } from './toolbar.state';

const onRegisterTool = (
  state: ToolbarState,
  payload: ReturnType<typeof ToolbarActions.registerTool>,
): ToolbarState => {
  const idx = state.tools.findIndex(t => t.id === payload.tool.id);
  if (idx === -1) {
    return {
      ...state,
      tools: [
        ...state.tools,
        { ...payload.tool },
      ],
    };
  }
  return {
    ...state,
    tools: [
      ...state.tools.slice(0, idx),
      { ...payload.tool },
      ...state.tools.slice(idx + 1),
    ],
  };
};

const onDeregisterTool = (
  state: ToolbarState,
  payload: ReturnType<typeof ToolbarActions.deregisterTool>,
): ToolbarState => {
  const idx = state.tools.findIndex(t => t.id === payload.tool);
  return idx === -1 ? state : {
    ...state,
    tools: [
      ...state.tools.slice(0, idx),
      ...state.tools.slice(idx + 1),
    ],
    activeTool: state.activeTool === payload.tool ? null : state.activeTool,
  };
};

const onActivateTool = (
  state: ToolbarState,
  payload: ReturnType<typeof ToolbarActions.activateTool>,
): ToolbarState => ({
  ...state,
  activeTool: payload.tool,
});

const onDeactivateTool = (
  state: ToolbarState,
  payload: ReturnType<typeof ToolbarActions.deactivateTool>,
): ToolbarState => ({
  ...state,
  activeTool: state.activeTool === payload.tool ? null : state.activeTool,
});

const toolbarReducerImpl = createReducer<ToolbarState>(
  initialToolbarState,
  on(ToolbarActions.registerTool, onRegisterTool),
  on(ToolbarActions.deregisterTool, onDeregisterTool),
  on(ToolbarActions.activateTool, onActivateTool),
  on(ToolbarActions.deactivateTool, onDeactivateTool),
);
export const toolbarReducer = (state: ToolbarState | undefined, action: Action) => toolbarReducerImpl(state, action);
