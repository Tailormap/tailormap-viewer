import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormSelectLayersComponent } from './spatial-filter-form-select-layers.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import { selectSelectedLayers } from '../state/filter-component.selectors';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { FilterableLayerModel, FilterManagerService } from '../../../filter';
import { of } from 'rxjs';

const availableLayers: FilterableLayerModel[] = [
  { id: '1', label: 'Layer 1', filterable: true, referencable: true },
  { id: '2', label: 'Layer 2', filterable: true, referencable: true },
];

const setup = async (layers: FilterableLayerModel[], selectedLayers: string[]) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectSelectedLayers, value: selectedLayers },
    ],
  });
  const mockSpatialCrudService = { updateSelectedLayers: jest.fn() };
  const mockFilterManagerService = { filterableLayers$: of(layers) };
  await render(SpatialFilterFormSelectLayersComponent, {
    imports: [SharedImportsModule],
    providers: [ store,
      { provide: SpatialFilterCrudService, useValue: mockSpatialCrudService },
      { provide: FilterManagerService, useValue: mockFilterManagerService },
    ],
  });
  return { updateLayers: mockSpatialCrudService.updateSelectedLayers };
};

describe('SpatialFilterFormSelectLayersComponent', () => {

  test('should render', async () => {
    await setup([], []);
    expect(screen.queryByText('Select layer(s)')).not.toBeInTheDocument();
  });

  test('should select layers from list', async () => {
    const { updateLayers } = await setup(availableLayers, []);
    expect(screen.getByText('Select layer(s)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Layer 1'));
    expect(updateLayers).toHaveBeenCalledWith(['1']);
  });

  test('patch value with initial value', async () => {
    await setup(availableLayers, ['1']);
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
  });

});
