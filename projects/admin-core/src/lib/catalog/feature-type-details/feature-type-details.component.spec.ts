import { render, screen } from '@testing-library/angular';
import { FeatureTypeDetailsComponent } from './feature-type-details.component';
import { of } from 'rxjs';
import { FeatureSourceProtocolEnum, getFeatureSource, getFeatureType, getFeatureTypeSummary } from '@tailormap-admin/admin-api';
import { createMockStore } from '@ngrx/store/testing';
import { CatalogState, catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { FeatureSourceService } from '../services/feature-source.service';
import { FeatureTypeAttributesComponent } from '../feature-type-attributes/feature-type-attributes.component';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { FeatureTypeFormComponent } from '../feature-type-form/feature-type-form.component';
import { SpinnerButtonComponent } from '@tailormap-viewer/shared';
import { CatalogExtendedTypeEnum } from '../models/catalog-extended.model';

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
  const featureTypeModel: ExtendedFeatureTypeModel = {
    ...getFeatureTypeSummary({ name: 'ft_1', title: 'some table' }),
    id: '1_ft_1',
    type: CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE,
    originalId: 'ft_1',
    featureSourceId: '1',
    catalogNodeId: 'node-1',
  };
  const featureSourceModel: ExtendedFeatureSourceModel = {
    ...getFeatureSource({ id: '1', title: 'JDBC source', protocol: FeatureSourceProtocolEnum.JDBC }),
    featureTypesIds: ['ft_1'],
    featureTypeOriginalIds: [],
    catalogNodeId: 'node-1',
    type: CatalogExtendedTypeEnum.FEATURE_SOURCE_TYPE,
  };
  const catalogState: CatalogState = {
    ...initialCatalogState,
    featureTypes: [featureTypeModel],
    featureSources: [featureSourceModel],
  };
  const featureType = getFeatureType({ name: 'ft_1', title: 'some table' });
  const featureSourceService = {
    updateFeatureSource$: jest.fn(() => of({})),
    getDraftFeatureSource$: jest.fn(() => of({
      ...getFeatureSource({ id: '1', title: 'JDBC source', protocol: FeatureSourceProtocolEnum.JDBC, featureTypes: [featureType] }),
    })),
    getDraftFeatureType$: jest.fn(() => of({ ...featureType })),
  };
  const store = createMockStore({ initialState: { [catalogStateKey]: catalogState } });
  await render(FeatureTypeDetailsComponent, {
    declarations: [ FeatureTypeFormComponent, FeatureTypeAttributesComponent, SaveButtonComponent, SpinnerButtonComponent ],
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
