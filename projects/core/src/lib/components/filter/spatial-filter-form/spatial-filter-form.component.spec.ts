import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormComponent } from './spatial-filter-form.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectFilterableLayers, selectIn3DView } from '../../../map/state/map.selectors';
import {
  hasSelectedLayersAndGeometry, selectSelectedFilterGroupError, selectSelectedFilterGroupId,
  selectSelectedLayersCount,
} from '../state/filter-component.selectors';
import { getFilterGroup } from '../../../filter/helpers/attribute-filter.helper.spec';
import { SharedModule } from '@tailormap-viewer/shared';
import { RemoveFilterService } from '../services/remove-filter.service';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { createMapServiceMock } from '../../../map/components/map-drawing-buttons/map-drawing-buttons.component.spec';
import { TestBed } from '@angular/core/testing';
import { FilterGroupModel } from '../../../filter/models/filter-group.model';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { closeForm } from '../state/filter-component.actions';
import { of } from 'rxjs';
import { SpatialFilterReferenceLayerService } from '../../../filter/services/spatial-filter-reference-layer.service';
import { FilterFeaturesService } from '../services/filter-features.service';

const setup = async (conf: {
  layers?: AppLayerModel[];
  selectedLayers?: boolean;
  selectedLayersAndGeometry?: boolean;
  selectedFilterGroup?: FilterGroupModel;
}) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectFilterableLayers, value: conf.layers || [] },
      { selector: selectSelectedLayersCount, value: conf.selectedLayers ? 1 : 0 },
      { selector: hasSelectedLayersAndGeometry, value: conf.selectedLayersAndGeometry || false },
      { selector: selectSelectedFilterGroupId, value: conf.selectedFilterGroup?.id || null },
      { selector: selectSelectedFilterGroupError, value: conf.selectedFilterGroup?.error || undefined },
      { selector: selectIn3DView, value: false },
    ],
  });
  const mapServiceMock = createMapServiceMock();
  const removeFilterServiceMock = { removeFilter$: jest.fn(() => of(true)) };
  const { container } = await render(SpatialFilterFormComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [SharedModule],
    providers: [
      store,
      mapServiceMock.provider,
      { provide: RemoveFilterService, useValue: removeFilterServiceMock },
      { provide: SpatialFilterReferenceLayerService, useValue: { isLoadingGeometryForGroup$: () => of(false) } },
      { provide: FilterFeaturesService, useValue: { getFilterFeatures$: () => of([]) } },
    ],
  });
  const injectedStore = TestBed.inject(MockStore);
  injectedStore.dispatch = jest.fn();
  return {
    dispatch: injectedStore.dispatch,
    removeFilter$: removeFilterServiceMock.removeFilter$,
    container,
  };
};

const layers = [
  getAppLayerModel({ id: '1', title: 'Layer 1' }),
  getAppLayerModel({ id: '2', title: 'Layer 2' }),
];

describe('SpatialFilterFormComponent', () => {

  test('should render', async () => {
    await setup({});
    expect(await screen.findByText('Add spatial filter'));
    expect(await screen.findByText('No layers available to filter on'));
  });

  test('should show layer selector', async () => {
    const { container, dispatch } = await setup({
      layers,
    });
    expect(container.querySelector('tm-spatial-filter-form-select-layers')).toBeInTheDocument();
    expect(await screen.findByText('Cancel')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Cancel'));
    expect(dispatch).toHaveBeenCalledWith(closeForm());
  });

  test('should show geometry drawing buttons', async () => {
    await setup({
      layers,
      selectedLayers: true,
    });
    expect(await screen.findByText('Draw filter geometry')).toBeInTheDocument();
  });

  test('should show buffer field', async () => {
    await setup({
      layers,
      selectedLayers: true,
      selectedLayersAndGeometry: true,
    });
    expect(await screen.findByText('Optionally you can buffer the geometry')).toBeInTheDocument();
  });

  test('should save/remove buttons', async () => {
    const group = getFilterGroup();
    const { dispatch, removeFilter$ } = await setup({
      layers,
      selectedFilterGroup: group,
    });
    expect(await screen.findByText('Save')).toBeInTheDocument();
    expect(await screen.findByText('Delete')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Save'));
    expect(dispatch).toHaveBeenCalledWith(closeForm());
    await userEvent.click(await screen.findByText('Delete'));
    expect(removeFilter$).toHaveBeenCalledWith(group.id);
  });

  test('shows an error message for a filter group', async () => {
    const group = getFilterGroup();
    await setup({
      layers,
      selectedFilterGroup: { ...group, error: 'This group has some error' },
    });
    expect(await screen.findByText('This group has some error')).toBeInTheDocument();
  });

});
