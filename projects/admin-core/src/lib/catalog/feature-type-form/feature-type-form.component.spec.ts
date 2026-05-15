import { render, screen } from '@testing-library/angular';
import { FeatureTypeFormComponent } from './feature-type-form.component';
import { of } from 'rxjs';
import { FeatureTypeModel } from '@tailormap-admin/admin-api';
import { SharedModule } from '@tailormap-viewer/shared';
import { FeatureSourceService } from '../services/feature-source.service';
import { FeatureTypeAttributesComponent } from '../feature-type-attributes/feature-type-attributes.component';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { SpinnerButtonComponent } from '@tailormap-viewer/shared';
import { createMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { Store } from '@ngrx/store';
import {
  FeatureTypeAttachmentAttributesComponent,
} from '../feature-type-attachment-attributes/feature-type-attachment-attributes.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideHttpClient } from '@angular/common/http';

const setup = async () => {
  const featureSourceService = { updateFeatureSource$: jest.fn(() => of({})) };
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
    declarations: [
      FeatureTypeAttributesComponent,
      FeatureTypeAttachmentAttributesComponent,
      SaveButtonComponent,
      SpinnerButtonComponent,
    ],
    imports: [ SharedModule, MatIconTestingModule ],
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
