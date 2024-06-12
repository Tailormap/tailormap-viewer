import { render, screen } from '@testing-library/angular';
import { FeatureTypeSelectorComponent } from './feature-type-selector.component';
import { CatalogState, catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { createMockStore } from '@ngrx/store/testing';
import { LoadingStateEnum, SharedImportsModule } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { FeatureSourceProtocolEnum, getFeatureSource, getFeatureTypeSummary } from '@tailormap-admin/admin-api';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import userEvent from '@testing-library/user-event';
import { CatalogExtendedTypeEnum } from '../models/catalog-extended.model';

const setup = async (status: LoadingStateEnum, layerName?: string) => {
  const featureTypeModel: ExtendedFeatureTypeModel = {
    ...getFeatureTypeSummary({ name: 'ft_1', title: 'some table' }),
    id: '1_ft_1',
    originalId: 'ft_1',
    featureSourceId: '1',
    catalogNodeId: '',
    type: CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE,
  };
  const featureSourceModel: ExtendedFeatureSourceModel = {
    ...getFeatureSource({ id: '1', title: 'JDBC source', protocol: FeatureSourceProtocolEnum.JDBC }),
    featureTypesIds: ['ft_1'],
    catalogNodeId: '',
    type: CatalogExtendedTypeEnum.FEATURE_SOURCE_TYPE,
  };
  const catalogState: CatalogState = {
    ...initialCatalogState,
    featureTypes: [featureTypeModel],
    featureSources: [featureSourceModel],
  };
  const store = createMockStore({ initialState: { [catalogStateKey]: catalogState } });
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
