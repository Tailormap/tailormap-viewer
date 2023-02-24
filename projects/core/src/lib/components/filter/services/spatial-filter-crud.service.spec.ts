import { TestBed } from '@angular/core/testing';
import { SpatialFilterCrudService } from './spatial-filter-crud.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { DescribeAppLayerService, LayerDetailsModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectSelectedFilterGroup, selectSelectedLayers } from '../state/filter-component.selectors';
import { selectViewerId } from '../../../state/core.selectors';
import { getSpatialFilterGroup } from '../../../filter/helpers/cql-filter.helper.spec';
import { setSelectedFilterGroup, setSelectedLayers } from '../state/filter-component.actions';
import { addFilterGroup, updateFilterGroup } from '../../../filter/state/filter.actions';
import { waitFor } from '@testing-library/angular';
import { FilterGroupModel } from '../../../filter/models/filter-group.model';
import { SpatialFilterModel } from '../../../filter/models/spatial-filter.model';

let idCount = 0;
jest.mock('nanoid', () => ({
  nanoid: () => {
    idCount++;
    return `id-${idCount}`;
  },
}));

const selectedGroup = getSpatialFilterGroup(['CIRCLE(1 2 3)'], [{ layerName: '1', column: ['geom'] }]);

const setup = (
  hasSelectedFilterGroup?: boolean,
  hasSelectedLayers?: boolean,
  overrideGroup?: FilterGroupModel<SpatialFilterModel>,
) => {
  const mockStore = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectSelectedFilterGroup, value: hasSelectedFilterGroup ? (overrideGroup || selectedGroup) : undefined },
      { selector: selectSelectedLayers, value: hasSelectedLayers ? ['1'] : [] },
      { selector: selectViewerId, value: '1' },
    ],
  });
  const describeLayerMock = {
    getDescribeAppLayer$: jest.fn((_appId, layerName): Observable<Partial<LayerDetailsModel>> => of({
      name: layerName,
      geometryAttribute: 'geom',
    })),
  };
  TestBed.configureTestingModule({
    providers: [
      SpatialFilterCrudService,
      mockStore,
      { provide: DescribeAppLayerService, useValue: describeLayerMock },
    ],
  });
  const service = TestBed.inject(SpatialFilterCrudService);
  const store = TestBed.inject(MockStore) as Store;
  store.dispatch = jest.fn();
  return { service, dispatch: store.dispatch };
};

describe('SpatialFilterCrudService', () => {

  test('should be created', () => {
    setup();
  });

  test('updates the selected layers', () => {
    const { service, dispatch } = setup();
    service.updateSelectedLayers([ '2', '3' ]);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(setSelectedLayers({ layers: [ '2', '3' ] }));
  });

  test('updates the selected layers and selected filter group', async () => {
    const { service, dispatch } = setup(true);
    service.updateSelectedLayers([ '2', '3' ]);
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledTimes(2);
    });
    expect(dispatch).toHaveBeenNthCalledWith(1, setSelectedLayers({ layers: [ '2', '3' ] }));
    const updatedGroup = getSpatialFilterGroup(
      ['CIRCLE(1 2 3)'],
      [{ layerName: '2', column: ['geom'] }, { layerName: '3', column: ['geom'] }],
    );
    expect(dispatch).toHaveBeenNthCalledWith(2, updateFilterGroup({ filterGroup: updatedGroup }));
  });

  test('adds geometry without selected layers, do nothing - should not happen in UI', async () => {
    const { service, dispatch } = setup();
    service.addGeometry({ id: '1', geometry: 'CIRCLE(1 2 3)' });
    await waitFor(() => {
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  test('adds geometry with selected layers, should create filter group', async () => {
    const { service, dispatch } = setup(false, true);
    service.addGeometry({ id: '1', geometry: 'CIRCLE(1 2 3)' });
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledTimes(2);
    });
    const spatialGroup = getSpatialFilterGroup(
      ['CIRCLE(1 2 3)'],
      [{ layerName: '1', column: ['geom'] }],
    );
    const createdGroup: FilterGroupModel<SpatialFilterModel> = {
      ...spatialGroup,
      id: 'id-2',
      source: 'SPATIAL_FILTER_FORM',
      filters: spatialGroup.filters.map((filter) => ({ ...filter, id: 'id-1' })),
    };
    expect(dispatch).toHaveBeenNthCalledWith(1, addFilterGroup({ filterGroup: createdGroup }));
    expect(dispatch).toHaveBeenNthCalledWith(2, setSelectedFilterGroup({ filterGroup: createdGroup }));
  });

  test('adds geometry with selected layers and selected group, should update filter group', async () => {
    const { service, dispatch } = setup(true, true);
    service.addGeometry({ id: '2', geometry: 'CIRCLE(4 5 6)' });
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
    const updatedGroup = getSpatialFilterGroup(
      [ 'CIRCLE(1 2 3)', 'CIRCLE(4 5 6)' ],
      [{ layerName: '1', column: ['geom'] }],
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, updateFilterGroup({ filterGroup: updatedGroup }));
  });

  test('removes geometry with selected group, should update filter group', async () => {
    const { service, dispatch } = setup(true, true);
    service.removeGeometry('1');
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
    const updatedGroup = getSpatialFilterGroup(
      [],
      [{ layerName: '1', column: ['geom'] }],
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, updateFilterGroup({ filterGroup: updatedGroup }));
  });

  test('removes geometry without selected group, should update filter group', async () => {
    const { service, dispatch } = setup(false, false);
    service.removeGeometry('1');
    await waitFor(() => {
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  test('updates buffer', async () => {
    const { service, dispatch } = setup(true, true);
    service.updateBuffer(10);
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
    const updatedGroup: FilterGroupModel<SpatialFilterModel> = {
      ...selectedGroup,
      filters: selectedGroup.filters.map((filter) => ({ ...filter, buffer: 10 })),
    };
    expect(dispatch).toHaveBeenNthCalledWith(1, updateFilterGroup({ filterGroup: updatedGroup }));
  });

  test('updates reference layer', async () => {
    const { service, dispatch } = setup(true, true);
    service.updateReferenceLayer('5');
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
    const updatedGroup: FilterGroupModel<SpatialFilterModel> = {
      ...selectedGroup,
      filters: selectedGroup.filters.map((filter) => ({ ...filter, baseLayerName: '5' })),
    };
    expect(dispatch).toHaveBeenNthCalledWith(1, updateFilterGroup({ filterGroup: updatedGroup }));
  });

  test('clear geometry after clearing reference layer', async () => {
    const group = getSpatialFilterGroup(['CIRCLE(1 2 3)'], [{ layerName: '1', column: ['geom'] }]);
    const groupWithReferenceGeom: FilterGroupModel<SpatialFilterModel> = {
      ...group,
      filters: group.filters.map((filter) => ({
        ...filter,
        baseLayerName: '5',
        geometries: filter.geometries.map((geom) => ({ ...geom, referenceLayerName: '5' })),
      })),
    };
    const { service, dispatch } = setup(true, true, groupWithReferenceGeom);
    service.updateReferenceLayer(undefined);
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
    const updatedGroup: FilterGroupModel<SpatialFilterModel> = {
      ...groupWithReferenceGeom,
      filters: groupWithReferenceGeom.filters.map((filter) => ({ ...filter, baseLayerName: undefined, geometries: [] })),
    };
    expect(dispatch).toHaveBeenNthCalledWith(1, updateFilterGroup({ filterGroup: updatedGroup }));
  });

});
