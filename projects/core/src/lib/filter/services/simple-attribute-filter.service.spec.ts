import { TestBed } from '@angular/core/testing';
import { SimpleAttributeFilterService } from './simple-attribute-filter.service';
import { AppLayerModel, AttributeType } from '@tailormap-viewer/api';
import { FilterConditionEnum, AttributeFilterModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { selectActiveFilterGroups, selectVerifiedCurrentFilterGroups } from '../../state/filter-state/filter.selectors';
import { provideStore, Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { addAppLayers } from '../../map/state/map.actions';
import { mapStateKey } from '../../map/state/map.state';
import { mapReducer } from '../../map/state/map.reducer';
import { coreStateKey } from '../../state';
import { coreReducer } from '../../state/core.reducer';

// `vi.mock` factories are hoisted above the rest of the file, so a plain outer `let` they close
// over is not reliably connected to the factory (Vitest only special-cases `mock`-prefixed
// bindings, or ones declared through `vi.hoisted`) - use `vi.hoisted` to share the counter safely.
const idState = vi.hoisted(() => ({ count: 0 }));
vi.mock('nanoid', () => ({
  nanoid: () => `id-${++idState.count}`,
}));

const createService = () => {
  idState.count = 0;
  TestBed.configureTestingModule({
    providers: [ SimpleAttributeFilterService, provideStore({ [coreStateKey]: coreReducer, [mapStateKey]: mapReducer }) ],
  });
  const service = TestBed.inject(SimpleAttributeFilterService);
  const store = TestBed.inject(Store);
  addMockLayers(store); // Add mock layers to the state
  return { service, store };
};

const createFilter = (attribute = 'attribute', value = 'value', featureType?: string): AttributeFilterModel => ({
  attribute,
  id: '',
  type: FilterTypeEnum.ATTRIBUTE,
  value: [value],
  attributeType: AttributeType.STRING,
  caseSensitive: false,
  condition: FilterConditionEnum.STRING_LIKE_KEY,
  invertCondition: false,
  featureType,
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

  test('should create filter', async () => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    const filterGroups = await firstValueFrom(store.select(selectVerifiedCurrentFilterGroups));
    expect(filterGroups.length).toEqual(1);
    expect(filterGroups[0].id).toEqual('id-1');
    expect(filterGroups[0].filters.length).toEqual(1);
    expect((filterGroups[0].filters[0] as AttributeFilterModel).attribute).toEqual('attribute');
  });

  test('should update an existing filter', async () => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '1', createFilter('attribute2'));
    service.setFilter('source', '1', createFilter('attribute', 'other_value'));
    const filterGroups = await firstValueFrom(store.select(selectActiveFilterGroups));
    expect(filterGroups.length).toEqual(1);
    expect(filterGroups[0].id).toEqual('id-1');
    expect(filterGroups[0].filters.length).toEqual(2);
    const filters = filterGroups[0].filters as AttributeFilterModel[];
    expect(filters[0].attribute).toEqual('attribute');
    expect(filters[0].value).toEqual(['other_value']);
    expect(filters[1].attribute).toEqual('attribute2');
    expect(filters[1].value).toEqual(['value']);
  });

  test('should remove filter and group', async () => {
    const { service, store } = createService();
    // remove from empty state to make sure we don't get errors here
    service.removeFilter('source', '1', 'attribute');
    // add a filter first
    service.setFilter('source', '1', createFilter());
    // now remove that filter
    service.removeFilter('source', '1', 'attribute');
    const filterGroups = await firstValueFrom(store.select(selectActiveFilterGroups));
    expect(filterGroups.length).toEqual(0);
  });

  test('should remove single filter', async () => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '1', createFilter('attribute2'));
    service.removeFilter('source', '1', 'attribute');
    const filterGroups = await firstValueFrom(store.select(selectActiveFilterGroups));
    expect(filterGroups.length).toEqual(1);
    expect(filterGroups[0].id).toEqual('id-1');
    expect(filterGroups[0].filters.length).toEqual(1);
    expect((filterGroups[0].filters[0] as AttributeFilterModel).attribute).toEqual('attribute2');
  });

  test('should remove filters for a layer', async () => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '2', createFilter());
    service.setFilter('source', '2', createFilter('attribute2'));
    service.setFilter('source', '2', createFilter('attribute3'));
    service.setFilter('source', '3', createFilter());
    service.removeFiltersForLayer('source', '2');
    const filterGroups = await firstValueFrom(store.select(selectActiveFilterGroups));
    expect(filterGroups.length).toEqual(2);
    expect(filterGroups[0].layerIds).toEqual(['1']);
    expect(filterGroups[1].layerIds).toEqual(['3']);
  });

  test('should remove filters for a layer - keep other feature types', async () => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '2', createFilter());
    service.setFilter('source', '2', createFilter('attribute2', 'other_value'));
    service.setFilter('source', '2', createFilter('attribute3', 'other_value2', 'other_feature_type'));
    service.setFilter('source', '3', createFilter());
    service.removeFiltersForLayer('source', '2');
    const filterGroups = await firstValueFrom(store.select(selectActiveFilterGroups));
    expect(filterGroups.length).toEqual(3);
    expect(filterGroups[0].layerIds).toEqual(['1']);
    expect(filterGroups[1].layerIds).toEqual(['2']);
    expect(filterGroups[1].filters.length).toEqual(1);
    expect(filterGroups[1].filters[0].featureType).toEqual('other_feature_type');
    expect(filterGroups[2].layerIds).toEqual(['3']);
  });

  test('should remove filters for a layer - remove specific feature type', async () => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '2', createFilter());
    service.setFilter('source', '2', createFilter('attribute2', 'other_value'));
    service.setFilter('source', '2', createFilter('attribute3', 'other_value', 'other_feature_type'));
    service.setFilter('source', '3', createFilter());
    service.removeFiltersForLayer('source', '2', 'other_feature_type');
    const filterGroups = await firstValueFrom(store.select(selectActiveFilterGroups));
    expect(filterGroups.length).toEqual(3);
    expect(filterGroups[0].layerIds).toEqual(['1']);
    expect(filterGroups[1].layerIds).toEqual(['2']);
    expect(filterGroups[1].filters.length).toEqual(2);
    expect(filterGroups[1].filters[0].featureType).toEqual(undefined);
    expect(filterGroups[1].filters[1].featureType).toEqual(undefined);
    expect(filterGroups[2].layerIds).toEqual(['3']);
  });

  test('should remove all filters for a layer', async () => {
    const { service, store } = createService();
    service.setFilter('source', '1', createFilter());
    service.setFilter('source', '2', createFilter());
    service.setFilter('source', '3', createFilter());
    service.removeAllFiltersForLayer('source', '2');
    const filterGroups = await firstValueFrom(store.select(selectActiveFilterGroups));
    expect(filterGroups.length).toEqual(2);
    expect(filterGroups[0].layerIds).toEqual(['1']);
    expect(filterGroups[1].layerIds).toEqual(['3']);
  });

});
