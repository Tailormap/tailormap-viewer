import { render, screen, waitFor } from '@testing-library/angular';
import { GeoServiceDetailsComponent } from './geo-service-details.component';
import { of } from 'rxjs';
import { getMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { getGeoService } from '@tailormap-admin/admin-api';
import { ActivatedRoute } from '@angular/router';
import { GeoServiceService } from '../services/geo-service.service';
import { Store } from '@ngrx/store';
import { GeoServiceFormComponent } from '../geo-service-form/geo-service-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { LayerSettingsFormComponent } from '../layer-settings-form/layer-settings-form.component';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';

const setup = async () => {
  const activeRoute = {
    paramMap: of({ get: () => '1' }),
  };
  const { geoServiceService, updateGeoService$, updateGeoServiceDetails, updateGeoServiceSettings } = createGeoServiceMock();
  const geoServiceModel = getGeoService({ id: '1', title: 'The Service' });
  const store = getMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, geoServices: [{ ...geoServiceModel, catalogNodeId: 'node-1' }] } },
  });
  await render(GeoServiceDetailsComponent, {
    declarations: [ GeoServiceFormComponent, LayerSettingsFormComponent ],
    imports: [SharedModule],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: Store, useValue: store },
    ],
  });
  return { updateGeoServiceDetails, updateGeoServiceSettings, updateGeoService$, geoServiceModel };
};

describe('GeoServiceDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findByText('Edit The Service')).toBeInTheDocument();
    expect(await screen.findByLabelText('Save')).toBeDisabled();
  });

  test('should handle editing', async () => {
    const { updateGeoService$, updateGeoServiceDetails, updateGeoServiceSettings, geoServiceModel } = await setup();
    expect(await screen.findByText('Edit The Service')).toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('Title'), '___');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(updateGeoService$).toHaveBeenNthCalledWith(1, '1', expect.anything(), expect.anything());
    expect(updateGeoServiceDetails).toHaveBeenNthCalledWith(1, {
      title: geoServiceModel.title + '___',
      url: geoServiceModel.url,
      protocol: geoServiceModel.protocol,
    });
    expect(updateGeoServiceSettings).toHaveBeenNthCalledWith(1, {
      defaultLayerSettings: {},
    });
    TestSaveHelper.waitForButtonToBeDisabled('Save');
    await userEvent.click(await screen.findByText('High-DPI enabled'));
    // @ts-ignore
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(updateGeoService$).toHaveBeenNthCalledWith(2, '1', expect.anything(), expect.anything());
    expect(updateGeoServiceDetails).toHaveBeenNthCalledWith(2, {});
    expect(updateGeoServiceSettings).toHaveBeenNthCalledWith(2, {
      defaultLayerSettings: { hiDpiDisabled: true },
    });
  });

});
