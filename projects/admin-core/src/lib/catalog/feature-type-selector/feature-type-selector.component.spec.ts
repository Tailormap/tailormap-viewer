import { render, screen, waitFor } from '@testing-library/angular';
import { FeatureTypeSelectorComponent } from './feature-type-selector.component';
import { CatalogState, catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { getMockStore } from '@ngrx/store/testing';
import { LoadingStateEnum, SharedImportsModule } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { loadFeatureSources } from '../state/catalog.actions';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { FeatureSourceProtocolEnum, getFeatureSource, getFeatureType } from '@tailormap-admin/admin-api';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import userEvent from '@testing-library/user-event';

const setup = async (status: LoadingStateEnum, layerName?: string) => {
  const featureTypeModel: ExtendedFeatureTypeModel = {
    ...getFeatureType({ name: 'ft_1', title: 'some table' }),
    id: 'ft_1',
    originalId: 'ft_1',
    featureSourceId: '1',
    catalogNodeId: '',
  };
  const featureSourceModel: ExtendedFeatureSourceModel = {
    ...getFeatureSource({ id: '1', title: 'JDBC source', protocol: FeatureSourceProtocolEnum.JDBC }),
    children: ['ft_1'],
    catalogNodeId: '',
  };
  const catalogState: CatalogState = {
    ...initialCatalogState,
    featureTypes: [featureTypeModel],
    featureSources: [featureSourceModel],
    featureSourcesLoadStatus: status,
  };
  const store = getMockStore({ initialState: { [catalogStateKey]: catalogState } });
  const dispatch = jest.fn();
  store.dispatch = dispatch;
  const featureTypeSelected = jest.fn();
  await render(FeatureTypeSelectorComponent, {
    imports: [SharedImportsModule],
    providers: [
      { provide: Store, useValue: store },
    ],
    componentInputs: { layerName },
    componentProperties: {
      featureTypeSelected: {
        emit: featureTypeSelected,
      } as any,
    },
  });
  return { dispatch, featureTypeSelected };
};

describe('FeatureTypeSelectorComponent', () => {

  test('should render and trigger load', async () => {
    const { dispatch } = await setup(LoadingStateEnum.INITIAL);
    expect(dispatch).toHaveBeenCalledWith(loadFeatureSources());
    expect(await screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.queryAllByRole('combobox')).toHaveLength(2);
  });

  test('should render spinner while loading', async () => {
    const { dispatch } = await setup(LoadingStateEnum.LOADING);
    expect(dispatch).not.toHaveBeenCalled();
    expect(await screen.queryByRole('progressbar')).toBeInTheDocument();
    expect(await screen.queryAllByRole('combobox')).toHaveLength(0);
  });

  test('should trigger change when selecting source & feature type', async () => {
    const { dispatch, featureTypeSelected } = await setup(LoadingStateEnum.LOADED);
    expect(dispatch).not.toHaveBeenCalled();
    expect(await screen.queryAllByRole('combobox')).toHaveLength(2);
    await userEvent.click((await screen.findAllByRole('combobox'))[0]);
    await userEvent.click(await screen.findByRole('option', { name: 'JDBC source' }));
    await userEvent.click((await screen.findAllByRole('combobox'))[1]);
    await userEvent.click(await screen.findByRole('option', { name: 'some table' }));
    expect(featureTypeSelected).toHaveBeenCalledWith({
      featureSourceId: 1,
      featureTypeName: 'ft_1',
    });
  });

  test('should trigger change when selecting source & having layerName with corresponding feature type', async () => {
    const { featureTypeSelected } = await setup(LoadingStateEnum.LOADED, 'ft_1');
    await userEvent.click((await screen.findAllByRole('combobox'))[0]);
    await userEvent.click(await screen.findByRole('option', { name: 'JDBC source' }));
    expect(featureTypeSelected).toHaveBeenNthCalledWith(1, {
      featureSourceId: 1,
      featureTypeName: undefined,
    });
    expect(featureTypeSelected).toHaveBeenNthCalledWith(2, {
      featureSourceId: 1,
      featureTypeName: 'ft_1',
    });
  });

});
