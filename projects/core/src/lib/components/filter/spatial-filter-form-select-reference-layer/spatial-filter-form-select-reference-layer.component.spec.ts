import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormSelectReferenceLayerComponent } from './spatial-filter-form-select-reference-layer.component';
import { provideMockStore } from '@ngrx/store/testing';
import { selectReferenceLayer, selectSelectedLayers } from '../state/filter-component.selectors';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { of } from 'rxjs';
import { DataSourceLayerModel } from '../../../models';
import { DataSourceManagerService } from '../../../services';

const availableLayers: DataSourceLayerModel[] = [
  { id: '1', title: 'Layer 1', layerName: 'layer_1', filterable: true, hasAttributes: true },
  { id: '2', title: 'Layer 2', layerName: 'layer_2', filterable: true, hasAttributes: true },
];

const setup = async (
  layers: DataSourceLayerModel[],
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
  const dataSourceManagerService = { layersWithAttributes$: of(layers) };
  const mockSpatialCrudService = { updateReferenceLayer: vi.fn() };
  await render(SpatialFilterFormSelectReferenceLayerComponent, {
    providers: [
      store,
      { provide: SpatialFilterCrudService, useValue: mockSpatialCrudService },
      { provide: DataSourceManagerService, useValue: dataSourceManagerService },
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
