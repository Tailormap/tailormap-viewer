import { render, screen, waitFor } from '@testing-library/angular';
import { SpatialFilterFormComponent } from './spatial-filter-form.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectFilterableLayers } from '../../../map/state/map.selectors';
import { selectSelectedFilterGroup } from '../state/filter-component.selectors';
import { of } from 'rxjs';
import { CreateFilterService } from '../services/create-filter.service';
import { getFilterGroup } from '../../../filter/helpers/attribute-filter.helper.spec';
import { SharedModule } from '@tailormap-viewer/shared';
import { RemoveFilterService } from '../services/remove-filter.service';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { MapDrawingButtonsComponent } from '../../../map/components/map-drawing-buttons/map-drawing-buttons.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { createMapServiceMock } from '../../../map/components/map-drawing-buttons/map-drawing-buttons.component.spec';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { SpatialFilterModel } from '../../../filter/models/spatial-filter.model';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';

let idCount = 0;
jest.mock('nanoid', () => ({
  nanoid: () => {
    idCount++;
    return `id-${idCount}`;
  },
}));

const setup = async (layers: AppLayerModel[] = []) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectFilterableLayers, value: layers },
      { selector: selectSelectedFilterGroup, value: undefined },
    ],
  });
  const mapServiceMock = createMapServiceMock();
  const createFilterServiceMock = {
    createSpatialFilterGroup$: jest.fn(() => of(getFilterGroup(undefined, undefined, 'CREATED'))),
    updateSpatialFilterGroup$: jest.fn(() => of(getFilterGroup(undefined, undefined, 'UPDATED'))),
  };
  const removeFilterServiceMock = {
    removeFilter$: jest.fn(),
  };
  await render(SpatialFilterFormComponent, {
    declarations: [MapDrawingButtonsComponent],
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      store,
      mapServiceMock.provider,
      { provide: CreateFilterService, useValue: createFilterServiceMock },
      { provide: RemoveFilterService, useValue: removeFilterServiceMock },
    ],
  });
  return {
    addDrawingEvent: mapServiceMock.addDrawingEvent,
    createFilterServiceMock,
  };
};

describe('SpatialFilterFormComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findByText('No layers available to filter on'));
  });

  test('should add and update a spatial filter', async () => {
    const userEvt = userEvent.setup();
    const { addDrawingEvent, createFilterServiceMock } = await setup([
      getAppLayerModel({ id: 1, title: 'Layer 1' }),
      getAppLayerModel({ id: 2, title: 'Layer 2' }),
    ]);
    const mockStore = TestBed.inject(Store) as MockStore;
    expect(await screen.findByText('Select layer(s)'));
    expect(await screen.findByText('Cancel'));
    await userEvt.click(screen.getByRole('combobox'));
    await userEvt.click(await screen.findByText('Layer 1'));
    await userEvt.click(screen.getByRole('combobox'));
    await userEvt.click(screen.getByLabelText('Draw circle'));
    addDrawingEvent({ type: 'end', geometry: 'CIRCLE(1,2,3)' });
    await waitFor(() => {
      const expectedGeom = { geometry: 'CIRCLE(1,2,3)', id: 'id-1' };
      expect(createFilterServiceMock.createSpatialFilterGroup$).toHaveBeenCalledWith([expectedGeom], [1]);
    });
    const filterGroup = getFilterGroup<SpatialFilterModel>([{
      id: 'id-1',
      type: FilterTypeEnum.SPATIAL,
      geometries: [{ geometry: 'CIRCLE(1,2,3)', id: 'id-1' }],
      geometryColumns: [{ layerId: 1, column: ['geom'] }],
    }], FilterTypeEnum.SPATIAL, 'CREATED');
    mockStore.overrideSelector(selectSelectedFilterGroup, filterGroup);
    mockStore.refreshState();
    await waitFor(() => {
      expect(screen.getByText('Save'));
    });
    await userEvt.click(screen.getByRole('combobox'));
    await userEvt.click(await screen.findByText('Layer 2'));
    await waitFor(() => {
      const expectedGeom = { geometry: 'CIRCLE(1,2,3)', id: 'id-1' };
      expect(createFilterServiceMock.updateSpatialFilterGroup$).toHaveBeenCalledWith(filterGroup, [expectedGeom], [ 1, 2 ]);
    });
  });

});
