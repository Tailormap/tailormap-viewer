import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { FeatureTypeFormComponent } from './feature-type-form.component';
import { of } from 'rxjs';
import { FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FeatureSourceService } from '../services/feature-source.service';
import { createMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { Store } from '@ngrx/store';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideHttpClient } from '@angular/common/http';

const setup = async () => {
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
  const mockStore = createMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState } },
  });
  await render(FeatureTypeFormComponent, {
    imports: [MatIconTestingModule],
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

});
