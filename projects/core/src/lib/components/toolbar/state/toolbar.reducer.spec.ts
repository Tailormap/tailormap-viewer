import * as ToolbarActions from './toolbar.actions';
import { ToolbarState, initialToolbarState } from './toolbar.state';
import { toolbarReducer } from './toolbar.reducer';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';

describe('ToolbarReducer', () => {

  test('register tool', () => {
    const initialState: ToolbarState = { ...initialToolbarState };
    const action = ToolbarActions.registerTool({ tool: { id: ToolbarComponentEnum.MEASURE, mapToolId: 'tool-123' } });
    expect(initialState.tools).toEqual([]);
    const updatedState = toolbarReducer(initialState, action);
    expect(updatedState.tools).toEqual([{ id: ToolbarComponentEnum.MEASURE, mapToolId: 'tool-123' }]);
  });

  test('re-register existing tool', () => {
    const initialState: ToolbarState = { ...initialToolbarState, tools: [{ id: ToolbarComponentEnum.MEASURE, mapToolId: 'tool-123' }] };
    const action = ToolbarActions.registerTool({ tool: { id: ToolbarComponentEnum.MEASURE, mapToolId: 'tool-456' } });
    expect(initialState.tools).toEqual([{ id: ToolbarComponentEnum.MEASURE, mapToolId: 'tool-123' }]);
    const updatedState = toolbarReducer(initialState, action);
    expect(updatedState.tools).toEqual([{ id: ToolbarComponentEnum.MEASURE, mapToolId: 'tool-456' }]);
  });

  test('deregister existing tool', () => {
    const initialState: ToolbarState = { ...initialToolbarState, tools: [{ id: ToolbarComponentEnum.MEASURE, mapToolId: 'tool-123' }] };
    const action = ToolbarActions.deregisterTool({ tool: ToolbarComponentEnum.MEASURE });
    expect(initialState.tools).toEqual([{ id: ToolbarComponentEnum.MEASURE, mapToolId: 'tool-123' }]);
    const updatedState = toolbarReducer(initialState, action);
    expect(updatedState.tools).toEqual([]);
  });

  test('activates tool', () => {
    const initialState: ToolbarState = { ...initialToolbarState };
    const action = ToolbarActions.activateTool({ tool: ToolbarComponentEnum.MEASURE });
    expect(initialState.activeTool).toEqual(null);
    const updatedState = toolbarReducer(initialState, action);
    expect(updatedState.activeTool).toEqual(ToolbarComponentEnum.MEASURE);
  });

  test('deactivates tool', () => {
    const initialState: ToolbarState = { ...initialToolbarState, activeTool: ToolbarComponentEnum.MEASURE };
    const action = ToolbarActions.deactivateTool({ tool: ToolbarComponentEnum.MEASURE });
    expect(initialState.activeTool).toEqual(ToolbarComponentEnum.MEASURE);
    const updatedState = toolbarReducer(initialState, action);
    expect(updatedState.activeTool).toEqual(null);
  });

});
