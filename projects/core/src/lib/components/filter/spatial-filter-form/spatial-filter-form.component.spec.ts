import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormComponent } from './spatial-filter-form.component';
import { provideMockStore } from '@ngrx/store/testing';
import { selectFilterableLayers } from '../../../map/state/map.selectors';
import { selectSelectedFilterGroup } from '../state/filter-component.selectors';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';
import { CreateFilterService } from '../services/create-filter.service';
import { getFilterGroup } from '../../../filter/helpers/attribute-filter.helper.spec';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { RemoveFilterService } from '../services/remove-filter.service';

const setup = async () => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectFilterableLayers, value: [] },
      { selector: selectSelectedFilterGroup, value: undefined },
    ],
  });
  const mapServiceMock = {
    renderFeatures$: jest.fn(() => of([])),
  };
  const createFilterServiceMock = {
    createSpatialFilter$: jest.fn(() => of(getFilterGroup())),
    updateSpatialFilter$: jest.fn(() => of(getFilterGroup())),
  };
  const removeFilterServiceMock = {
    removeFilter$: jest.fn(),
  };
  await render(SpatialFilterFormComponent, {
    imports: [SharedImportsModule],
    providers: [
      store,
      { provide: MapService, useValue: mapServiceMock },
      { provide: CreateFilterService, useValue: createFilterServiceMock },
      { provide: RemoveFilterService, useValue: removeFilterServiceMock },
    ],
  });
};

describe('SpatialFilterFormComponent', () => {

  test('should render', async () => {
    await setup();
    expect(screen.getByText('No layers available to filter on'));
  });

});
