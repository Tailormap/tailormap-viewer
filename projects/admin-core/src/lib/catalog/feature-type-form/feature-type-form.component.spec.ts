import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { FeatureTypeFormComponent } from './feature-type-form.component';
import { of } from 'rxjs';
import { FeatureSourceModel, FeatureSourceProtocolEnum, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FeatureSourceService } from '../services/feature-source.service';
import { createMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { CatalogExtendedTypeEnum } from '../models/catalog-extended.model';
import { Store } from '@ngrx/store';
import { provideHttpClient } from '@angular/common/http';

const setup = async (wfsUrl?: string) => {
  const featureSourceService = { updateFeatureSource$: vi.fn(() => of({})) };
  const featureTypeModel: FeatureTypeModel = {
    attributes: [],
    defaultGeometryAttribute: null,
    primaryKeyAttribute: null,
    settings: {
      attributeSettings: {},
    },
    id: '1_ft_1',
    name: 'ft_1',
    title: 'some table',
  };
  const featureSources: ExtendedFeatureSourceModel[] = wfsUrl ? [{
    id: '1',
    type: CatalogExtendedTypeEnum.FEATURE_SOURCE_TYPE,
    title: 'Some WFS',
    protocol: FeatureSourceProtocolEnum.WFS,
    catalogNodeId: 'node-1',
    featureTypesIds: ['1_ft_1'],
    featureTypeOriginalIds: ['1_ft_1'],
  }] : [];
  const draftFeatureSource: FeatureSourceModel | null = wfsUrl ? {
    id: '1',
    type: 'feature-source',
    title: 'Some WFS',
    protocol: FeatureSourceProtocolEnum.WFS,
    url: wfsUrl,
    featureTypes: [featureTypeModel],
  } : null;
  const mockStore = createMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, featureSources, draftFeatureSource } },
  });
  await render(FeatureTypeFormComponent, {
    imports: [],
    inputs: {
      featureType: featureTypeModel,
    },
    providers: [
      { provide: FeatureSourceService, useValue: featureSourceService },
      { provide: Store, useValue: mockStore },
      provideHttpClient(),
    ],
  });
  return { featureSourceService, featureTypeModel };
};

describe('FeatureTypeFormComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findByText('Details for feature type some table')).toBeInTheDocument();
  });

  test('should warn for a WFS version other than 2.0.0', async () => {
    await setup('https://example.com/wfs?service=WFS&VERSION=1.1.0');
    expect(await screen.findByText(/Only WFS version 2\.0\.0 is supported/)).toBeInTheDocument();
  });

  test('should not warn for WFS 2.0.0', async () => {
    await setup('https://example.com/wfs?service=WFS&VERSION=2.0.0');
    expect(await screen.findByText(/not editable because editing is only supported for JDBC/)).toBeInTheDocument();
    expect(screen.queryByText(/Only WFS version 2\.0\.0 is supported/)).not.toBeInTheDocument();
  });

});
