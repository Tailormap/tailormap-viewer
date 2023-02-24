import { render, screen } from '@testing-library/angular';
import { GeoServiceLayerDetailsComponent } from './geo-service-layer-details.component';
import { of } from 'rxjs';
import { getGeoService, getGeoServiceLayer } from '@tailormap-admin/admin-api';
import { getMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { GeoServiceDetailsComponent } from '../geo-service-details/geo-service-details.component';
import { GeoServiceFormComponent } from '../geo-service-form/geo-service-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { ActivatedRoute } from '@angular/router';
import { GeoServiceService } from '../services/geo-service.service';
import { Store } from '@ngrx/store';
import { LayerSettingsFormComponent } from '../layer-settings-form/layer-settings-form.component';

const setup = async () => {
  const updateGeoServiceMock = jest.fn(() => of(true));
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
  const geoServiceService = {
    updateGeoService$: updateGeoServiceMock,
  };
  const geoServiceModel = getGeoService({ id: '1', title: 'The Service' });
  const layerModel = getGeoServiceLayer({ name: 'layer_2', title: 'The Layer' });
  const store = getMockStore({
    initialState: { [catalogStateKey]: {
      ...initialCatalogState,
      geoServices: [{ ...geoServiceModel, catalogNodeId: 'node-1', layers: ['2'] }],
      geoServiceLayers: [{ ...layerModel, catalogNodeId: 'node-1', id: '2', serviceId: '1' }],
    } },
  });
  await render(GeoServiceLayerDetailsComponent, {
    declarations: [LayerSettingsFormComponent],
    imports: [SharedModule],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: Store, useValue: store },
    ],
  });
  return { updateGeoServiceMock, geoServiceModel };
};

describe('GeoServiceLayerDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findByText('Edit settings for layer The Layer')).toBeInTheDocument();
  });

});
