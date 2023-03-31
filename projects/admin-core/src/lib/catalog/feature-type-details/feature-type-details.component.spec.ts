import { render, screen } from '@testing-library/angular';
import { FeatureTypeDetailsComponent } from './feature-type-details.component';
import { of } from 'rxjs';
import { FeatureSourceProtocolEnum, getFeatureSource, getFeatureType } from '@tailormap-admin/admin-api';
import { getMockStore } from '@ngrx/store/testing';
import { CatalogState, catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { FeatureSourceService } from '../services/feature-source.service';

const setup = async () => {
  const activeRoute = {
    paramMap: of({
      get: (param: string) => {
        if (param === 'featureSourceId') {
          return '1';
        }
        if (param === 'featureTypeId') {
          return 'ft_1';
        }
        return null;
      },
    }),
  };
  const featureSourceService = { updateFeatureSource$: jest.fn(() => of({})) };
  const featureTypeModel: ExtendedFeatureTypeModel = {
    ...getFeatureType({ name: 'ft_1', title: 'some table' }),
    id: 'ft_1',
    originalId: 'ft_1',
    featureSourceId: '1',
    catalogNodeId: 'node-1',
  };
  const featureSourceModel: ExtendedFeatureSourceModel = {
    ...getFeatureSource({ id: '1', title: 'JDBC source', protocol: FeatureSourceProtocolEnum.JDBC }),
    children: ['ft_1'],
    catalogNodeId: 'node-1',
  };
  const catalogState: CatalogState = {
    ...initialCatalogState,
    featureTypes: [featureTypeModel],
    featureSources: [featureSourceModel],
  };
  const store = getMockStore({ initialState: { [catalogStateKey]: catalogState } });
  await render(FeatureTypeDetailsComponent, {
    imports: [SharedModule],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: FeatureSourceService, useValue: featureSourceService },
      { provide: Store, useValue: store },
    ],
  });
  return { featureSourceService, featureTypeModel };
};

describe('FeatureTypeDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findByText('Details for feature type some table')).toBeInTheDocument();
  });

});
