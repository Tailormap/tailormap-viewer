import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormSelectReferenceLayerComponent } from './spatial-filter-form-select-reference-layer.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectFilterableLayers } from '../../../map/state/map.selectors';
import { selectSelectedLayers } from '../state/filter-component.selectors';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { setSelectedLayers } from '../state/filter-component.actions';

const setup = async (layers: AppLayerModel[], selectedLayers: number[]) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectFilterableLayers, value: layers },
      { selector: selectSelectedLayers, value: selectedLayers },
    ],
  });
  await render(SpatialFilterFormSelectReferenceLayerComponent, {
    imports: [SharedImportsModule],
    providers: [store],
  });
  const injectedStore = TestBed.inject(MockStore);
  injectedStore.dispatch = jest.fn();
  return { dispatch: injectedStore.dispatch };
};

describe('SpatialFilterFormSelectLayersComponent', () => {

  test('should render', async () => {
    await setup([], []);
    expect(screen.getByText('Select layer(s)')).toBeInTheDocument();
  });

  test('select layers from list', async () => {
    const availableLayers = [
      getAppLayerModel({ id: 1, title: 'Layer 1' }),
      getAppLayerModel({ id: 2, title: 'Layer 2' }),
    ];
    const { dispatch } = await setup(availableLayers, []);
    expect(screen.getByText('Select layer(s)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Layer 1'));
    expect(dispatch).toHaveBeenCalledWith(setSelectedLayers({ layers: [1] }));
  });

  test('patch value with initial value', async () => {
    const availableLayers = [
      getAppLayerModel({ id: 1, title: 'Layer 1' }),
      getAppLayerModel({ id: 2, title: 'Layer 2' }),
    ];
    await setup(availableLayers, [1]);
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
  });

});
