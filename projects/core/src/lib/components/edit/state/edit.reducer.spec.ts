import * as EditActions from './edit.actions';
import { EditState, initialEditState } from './edit.state';
import { editReducer } from './edit.reducer';

describe('EditReducer', () => {

  test('sets edit active', () => {
    const initialState: EditState = { ...initialEditState };
    const action = EditActions.setEditActive({ active: true });
    expect(initialState.isActive).toEqual(false);
    const updatedState = editReducer(initialState, action);
    expect(updatedState.isActive).toEqual(true);
  });

});
