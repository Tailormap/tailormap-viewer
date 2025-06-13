import { createAction, props } from '@ngrx/store';
import { ToolbarToolModel } from '../models/toolbar-tool.model';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';

const toolbarActionsPrefix = '[Toolbar]';

export const registerTool = createAction(
  `${toolbarActionsPrefix} Register tool`,
  props<{ tool: ToolbarToolModel }>(),
);

export const deregisterTool = createAction(
  `${toolbarActionsPrefix} Deregister tool`,
  props<{ tool: ToolbarComponentEnum }>(),
);

export const activateTool = createAction(
  `${toolbarActionsPrefix} Activate tool`,
  props<{ tool: ToolbarComponentEnum; enableArguments?: Record<string, unknown>; preventMapToolActivation?: boolean }>(),
);

export const deactivateTool = createAction(
  `${toolbarActionsPrefix} Deactivate tool`,
  props<{ tool: ToolbarComponentEnum }>(),
);

export const deactivateToolButtonOnly = createAction(
  `${toolbarActionsPrefix} Deactivate tool button only`,
  props<{ tool: ToolbarComponentEnum }>(),
);

export const toggleTool = createAction(
  `${toolbarActionsPrefix} Toggle tool`,
  props<{ tool: ToolbarComponentEnum; enableArguments?: Record<string, unknown> }>(),
);
