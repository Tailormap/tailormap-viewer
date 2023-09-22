import { TestBed } from '@angular/core/testing';
import { SimpleAttributeFilterService } from './simple-attribute-filter.service';
import { AttributeType } from '@tailormap-viewer/api';
import { FilterConditionEnum } from '../models/filter-condition.enum';
import { filterStateKey } from '../state/filter.state';
import { selectFilterGroups } from '../state/filter.selectors';
import { Store, StoreModule } from '@ngrx/store';
import { filterReducer } from '../state/filter.reducer';
import { AttributeFilterModel } from '../models/attribute-filter.model';
import { FilterTypeEnum } from '../models/filter-type.enum';

let idCount = 0;
jest.mock('nanoid', () => ({
  nanoid: () => {
    idCount++;
    return `id-${idCount}`;
  },
}));

const createService = () => {
  idCount = 0;
  TestBed.configureTestingModule({
    imports: [StoreModule.forRoot({ [filterStateKey]: filterReducer })],
    providers: [SimpleAttributeFilterService],
  });
  return {
    service: TestBed.inject(SimpleAttributeFilterService),
    store: TestBed.inject(Store),
  };
};

const createFilter = (attribute = 'attribute', value = 'value'): AttributeFilterModel => ({
  attribute,
  id: '',
  type: FilterTypeEnum.ATTRIBUTE,
  value: [value],
  attributeType: AttributeType.STRING,
  caseSensitive: false,
  condition: FilterConditionEnum.STRING_LIKE_KEY,
  invertCondition: false,
});

describe('SimpleAttributeFilterService', () => {

  test('should create filter', (done) => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    store.select(selectFilterGroups).subscribe(filterGroups => {
      expect(filterGroups.length).toEqual(1);
      expect(filterGroups[0].id).toEqual('id-1');
      expect(filterGroups[0].filters.length).toEqual(1);
      expect((filterGroups[0].filters[0] as AttributeFilterModel).attribute).toEqual('attribute');
      done();
    });
  });

  test('should update an existing filter', (done) => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '1', createFilter('attribute2'));
    service.setFilter('source', '1', createFilter('attribute', 'other_value'));
    store.select(selectFilterGroups).subscribe(filterGroups => {
      expect(filterGroups.length).toEqual(1);
      expect(filterGroups[0].id).toEqual('id-1');
      expect(filterGroups[0].filters.length).toEqual(2);
      const filters = filterGroups[0].filters as AttributeFilterModel[];
      expect(filters[0].attribute).toEqual('attribute');
      expect(filters[0].value).toEqual(['other_value']);
      expect(filters[1].attribute).toEqual('attribute2');
      expect(filters[1].value).toEqual(['value']);
      done();
    });
  });

  test('should remove filter and group', (done) => {
    const { service, store } = createService();
    // remove from empty state to make sure we don't get errors here
    service.removeFilter('source', '1', 'attribute');
    // add a filter first
    service.setFilter('source', '1', createFilter());
    // now remove that filter
    service.removeFilter('source', '1', 'attribute');
    store.select(selectFilterGroups).subscribe(filterGroups => {
      expect(filterGroups.length).toEqual(0);
      done();
    });
  });

  test('should remove single filter', (done) => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '1', createFilter('attribute2'));
    service.removeFilter('source', '1', 'attribute');
    store.select(selectFilterGroups).subscribe(filterGroups => {
      expect(filterGroups.length).toEqual(1);
      expect(filterGroups[0].id).toEqual('id-1');
      expect(filterGroups[0].filters.length).toEqual(1);
      expect((filterGroups[0].filters[0] as AttributeFilterModel).attribute).toEqual('attribute2');
      done();
    });
  });

  test('should remove all filters for a layer', (done) => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '2', createFilter());
    service.setFilter('source', '3', createFilter());
    service.removeFiltersForLayer('source', '2');
    store.select(selectFilterGroups).subscribe(filterGroups => {
      expect(filterGroups.length).toEqual(2);
      expect(filterGroups[0].layerIds).toEqual(['1']);
      expect(filterGroups[1].layerIds).toEqual(['3']);
      done();
    });
  });

});
