import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormSelectLayersComponent } from './spatial-filter-form-select-layers.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { provideMockStore } from '@ngrx/store/testing';
import { selectFilterableLayers } from '../../../map/state/map.selectors';
import { selectSelectedLayers } from '../state/filter-component.selectors';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';

const availableLayers = [
  getAppLayerModel({ id: '1', title: 'Layer 1' }),
  getAppLayerModel({ id: '2', title: 'Layer 2' }),
];

const setup = async (layers: AppLayerModel[], selectedLayers: string[]) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectFilterableLayers, value: layers },
      { selector: selectSelectedLayers, value: selectedLayers },
    ],
  });
  const mockSpatialCrudService = { updateSelectedLayers: jest.fn() };
  await render(SpatialFilterFormSelectLayersComponent, {
    imports: [SharedImportsModule],
    providers: [ store, { provide: SpatialFilterCrudService, useValue: mockSpatialCrudService }],
  });
  return { updateLayers: mockSpatialCrudService.updateSelectedLayers };
};

describe('SpatialFilterFormSelectLayersComponent', () => {

  test('should render', async () => {
    await setup([], []);
    expect(screen.getByText('Select layer(s)')).toBeInTheDocument();
  });

  test('select layers from list', async () => {
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
