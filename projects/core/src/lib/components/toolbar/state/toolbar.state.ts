import { ToolbarToolModel } from '../models/toolbar-tool.model';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';

export const toolbarStateKey = 'toolbar';

export interface ToolbarState {
  activeTool: ToolbarComponentEnum | null;
  tools: ToolbarToolModel[];
}

export const initialToolbarState: ToolbarState = {
  activeTool: null,
  tools: [],
};
