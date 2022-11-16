import * as FilterComponentActions from './filter-component.actions';
import { FilterComponentState, initialFilterComponentState } from './filter-component.state';
import { filterComponentReducer } from './filter-component.reducer';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';

describe('FilterComponentReducer', () => {

  test('create filter', () => {
    const initialState: FilterComponentState = { ...initialFilterComponentState };
    const action = FilterComponentActions.createFilter({ filterType: FilterTypeEnum.SPATIAL });
    expect(initialState.createFilterType).toBeUndefined();
    const updatedState = filterComponentReducer(initialState, action);
    expect(updatedState.createFilterType).toEqual(FilterTypeEnum.SPATIAL);
  });

});
