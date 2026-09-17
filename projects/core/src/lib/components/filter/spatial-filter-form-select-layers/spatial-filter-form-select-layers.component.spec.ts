import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormSelectLayersComponent } from './spatial-filter-form-select-layers.component';
import { provideMockStore } from '@ngrx/store/testing';
import { selectSelectedLayers } from '../state/filter-component.selectors';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { DataSourceManagerService } from '../../../services';
import { of } from 'rxjs';
import { DataSourceLayerModel } from '../../../models';

const availableLayers: DataSourceLayerModel[] = [
  { id: '1', title: 'Layer 1', layerName: 'layer_1', filterable: true, hasAttributes: true },
  { id: '2', title: 'Layer 2', layerName: 'layer_2', filterable: true, hasAttributes: true },
];

const setup = async (layers: DataSourceLayerModel[], selectedLayers: string[]) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectSelectedLayers, value: selectedLayers },
    ],
  });
  const mockSpatialCrudService = { updateSelectedLayers: vi.fn() };
  const mockDataSourceManagerService = { filterableLayers$: of(layers) };
  await render(SpatialFilterFormSelectLayersComponent, {
    providers: [ store,
      { provide: SpatialFilterCrudService, useValue: mockSpatialCrudService },
      { provide: DataSourceManagerService, useValue: mockDataSourceManagerService },
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
