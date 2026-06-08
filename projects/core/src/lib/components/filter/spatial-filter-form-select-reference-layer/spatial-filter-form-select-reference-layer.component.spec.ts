import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormSelectReferenceLayerComponent } from './spatial-filter-form-select-reference-layer.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import { selectReferenceLayer, selectSelectedLayers } from '../state/filter-component.selectors';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { of } from 'rxjs';
import { FilterManagerService } from '../../../filter/services/filter-manager.service';
import { FilterableLayerModel } from '../../../filter/models/filter-source.model';

const availableLayers: FilterableLayerModel[] = [
  { id: '1', label: 'Layer 1', filterable: true, referencable: true },
  { id: '2', label: 'Layer 2', filterable: true, referencable: true },
];

const setup = async (
  layers: FilterableLayerModel[],
  selectedLayer?: string,
  selectedFilterLayers?: string[],
) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectReferenceLayer, value: selectedLayer },
      { selector: selectSelectedLayers, value: selectedFilterLayers || [] },
    ],
  });
  const filterManagerService = { referencableLayers$: of(layers) };
  const mockSpatialCrudService = { updateReferenceLayer: jest.fn() };
  await render(SpatialFilterFormSelectReferenceLayerComponent, {
    imports: [SharedImportsModule],
    providers: [
      store,
      { provide: SpatialFilterCrudService, useValue: mockSpatialCrudService },
      { provide: FilterManagerService, useValue: filterManagerService },
    ],
  });
  return { updateReferenceLayer: mockSpatialCrudService.updateReferenceLayer };
};

describe('SpatialFilterFormSelectReferenceLayerComponent', () => {

  test('should render', async () => {
    await setup([]);
    expect(screen.getByText('Select layer to use as filter')).toBeInTheDocument();
  });

  test('should select reference layers from list', async () => {
    const { updateReferenceLayer } = await setup(availableLayers);
    expect(screen.getByText('Select layer to use as filter')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Layer 1'));
    expect(updateReferenceLayer).toHaveBeenCalledWith('1');
  });

  test('should not render already selected layers for filtering', async () => {
    await setup(availableLayers, undefined, ['2']);
    expect(screen.getByText('Select layer to use as filter')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.queryByText('Layer 1')).toBeInTheDocument();
    expect(screen.queryByText('Layer 2')).not.toBeInTheDocument();
  });

  test('patch value with initial value', async () => {
    await setup(availableLayers, '1');
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
  });

});
