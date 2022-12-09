import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormSelectReferenceLayerComponent } from './spatial-filter-form-select-reference-layer.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { provideMockStore } from '@ngrx/store/testing';
import { selectReferencableLayers, selectReferenceLayer, selectSelectedLayers } from '../state/filter-component.selectors';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';

const availableLayers = [
  getAppLayerModel({ id: 1, title: 'Layer 1' }),
  getAppLayerModel({ id: 2, title: 'Layer 2' }),
];

const setup = async (layers: AppLayerModel[], selectedLayer?: number) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectReferencableLayers, value: layers },
      { selector: selectReferenceLayer, value: selectedLayer },
    ],
  });
  const mockSpatialCrudService = { updateReferenceLayer: jest.fn() };
  await render(SpatialFilterFormSelectReferenceLayerComponent, {
    imports: [SharedImportsModule],
    providers: [ store, { provide: SpatialFilterCrudService, useValue: mockSpatialCrudService }],
  });
  return { updateReferenceLayer: mockSpatialCrudService.updateReferenceLayer };
};

describe('SpatialFilterFormSelectReferenceLayerComponent', () => {

  test('should render', async () => {
    await setup([]);
    expect(screen.getByText('Select layer to use as filter')).toBeInTheDocument();
  });

  test('select layers from list', async () => {
    const { updateReferenceLayer } = await setup(availableLayers);
    expect(screen.getByText('Select layer to use as filter')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Layer 1'));
    expect(updateReferenceLayer).toHaveBeenCalledWith(1);
  });

  test('patch value with initial value', async () => {
    await setup(availableLayers, 1);
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
  });

});
