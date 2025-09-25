import { TestBed } from '@angular/core/testing';
import { SimpleAttributeFilterService } from './simple-attribute-filter.service';
import { AppLayerModel, AttributeType } from '@tailormap-viewer/api';
import { FilterConditionEnum, AttributeFilterModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { filterStateKey } from '../state/filter.state';
import { selectActiveFilterGroups, selectVerifiedCurrentFilterGroups } from '../state/filter.selectors';
import { Store, StoreModule } from '@ngrx/store';
import { filterReducer } from '../state/filter.reducer';
import { addAppLayers } from '../../map/state/map.actions';
import { mapStateKey } from '../../map/state/map.state';
import { mapReducer } from '../../map/state/map.reducer';

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
    imports: [StoreModule.forRoot({ [filterStateKey]: filterReducer, [mapStateKey]: mapReducer })],
    providers: [SimpleAttributeFilterService],
  });
  const service = TestBed.inject(SimpleAttributeFilterService);
  const store = TestBed.inject(Store);
  addMockLayers(store); // Add mock layers to the state
  return { service, store };
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

const mockLayers: AppLayerModel[] = [
  {
    id: '1',
    layerName: 'layer_1',
    title: 'Layer 1',
    serviceId: 'service-1',
    visible: true,
    hasAttributes: true,
    editable: false,
    opacity: 1,
    searchIndex: null,
  },
  {
    id: '2',
    layerName: 'layer_2',
    title: 'Layer 2',
    serviceId: 'service-2',
    visible: true,
    hasAttributes: true,
    editable: false,
    opacity: 1,
    searchIndex: null,
  },
  {
    id: '3',
    layerName: 'layer_3',
    title: 'Layer 3',
    serviceId: 'service-3',
    visible: true,
    hasAttributes: true,
    editable: false,
    opacity: 1,
    searchIndex: null,
  },
];

const addMockLayers = (store: Store) => {
  store.dispatch(addAppLayers({ appLayers: mockLayers }));
};

describe('SimpleAttributeFilterService', () => {

  test('should create filter', (done) => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    store.select(selectVerifiedCurrentFilterGroups).subscribe(filterGroups => {
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
    store.select(selectActiveFilterGroups).subscribe(filterGroups => {
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
    store.select(selectActiveFilterGroups).subscribe(filterGroups => {
      expect(filterGroups.length).toEqual(0);
      done();
    });
  });

  test('should remove single filter', (done) => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '1', createFilter('attribute2'));
    service.removeFilter('source', '1', 'attribute');
    store.select(selectActiveFilterGroups).subscribe(filterGroups => {
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
    store.select(selectActiveFilterGroups).subscribe(filterGroups => {
      expect(filterGroups.length).toEqual(2);
      expect(filterGroups[0].layerIds).toEqual(['1']);
      expect(filterGroups[1].layerIds).toEqual(['3']);
      done();
    });
  });

});
