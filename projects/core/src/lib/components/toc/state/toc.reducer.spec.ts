import * as TocActions from './toc.actions';
import { TocState, initialTocState } from './toc.state';
import { tocReducer } from './toc.reducer';

describe('TocReducer', () => {

  test('sets filterTerm prop', () => {
    const initialState: TocState = { ...initialTocState };
    const action = TocActions.setFilterTerm({ filterTerm: 'test' });
    expect(initialState.filterTerm).toEqual(undefined);
    const updatedState = tocReducer(initialState, action);
    expect(updatedState.filterTerm).toEqual('test');
  });

});
