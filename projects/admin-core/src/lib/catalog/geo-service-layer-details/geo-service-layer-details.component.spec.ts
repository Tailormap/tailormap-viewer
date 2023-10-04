import { render, screen } from '@testing-library/angular';
import { GeoServiceLayerDetailsComponent } from './geo-service-layer-details.component';
import { of } from 'rxjs';
import { getGeoService, getGeoServiceLayer, TailormapAdminApiV1Service, } from '@tailormap-admin/admin-api';
import { createMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { ActivatedRoute } from '@angular/router';
import { GeoServiceService } from '../services/geo-service.service';
import { Store } from '@ngrx/store';
import { LayerSettingsFormComponent } from '../layer-settings-form/layer-settings-form.component';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { TriStateBooleanComponent } from '../../shared/components/tri-state-boolean/tri-state-boolean.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthorizationEditComponent } from '../../shared/components/authorization-edit/authorization-edit.component';

const setup = async () => {
  const activeRoute = {
    paramMap: of({
      get: (param: string) => {
        if (param === 'serviceId') {
          return '1';
        }
        if (param === 'layerId') {
          return '2';
        }
        return null;
      },
    }),
  };
  const geoServiceModel = getGeoService({ id: '1', title: 'The Service' });
  const layerModel = getGeoServiceLayer({ name: 'layer_2', title: 'The Layer' });
  const { geoServiceService, updateGeoService$ } = createGeoServiceMock(geoServiceModel);
  const store = createMockStore({
    initialState: { [catalogStateKey]: {
      ...initialCatalogState,
      geoServices: [{ ...geoServiceModel, catalogNodeId: 'node-1', layers: ['2'] }],
      geoServiceLayers: [{ ...layerModel, catalogNodeId: 'node-1', id: '2', serviceId: '1' }],
    } },
  });
  await render(GeoServiceLayerDetailsComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [ LayerSettingsFormComponent, TriStateBooleanComponent, AuthorizationEditComponent ],
    imports: [SharedModule],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: Store, useValue: store },
      { provide: TailormapAdminApiV1Service, useValue: { getGroups$: jest.fn(() => of(null)) } },
    ],
  });
  return { updateGeoService$, geoServiceModel };
};

describe('GeoServiceLayerDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findByText('Edit settings for layer The Layer')).toBeInTheDocument();
  });

});
