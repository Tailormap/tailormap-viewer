import { ToolbarState, toolbarStateKey } from './toolbar.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';

const selectToolbarState = createFeatureSelector<ToolbarState>(toolbarStateKey);

export const selectToolbarTool = (toolId: string) => createSelector(selectToolbarState, state => state.tools.find(t => t.id === toolId));
export const selectTools = createSelector(selectToolbarState, state => state.tools);
export const selectActiveTool = createSelector(selectToolbarState, state => state.activeTool);
export const isActiveToolbarTool = (componentId: ToolbarComponentEnum) => createSelector(selectActiveTool, activeTool => activeTool === componentId);
