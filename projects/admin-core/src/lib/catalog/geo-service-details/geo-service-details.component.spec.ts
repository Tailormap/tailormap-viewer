import { render, screen } from '@testing-library/angular';
import { GeoServiceDetailsComponent } from './geo-service-details.component';
import { of } from 'rxjs';
import { createMockStore, provideMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { TailormapAdminApiV1Service, getGeoService } from '@tailormap-admin/admin-api';
import { ActivatedRoute } from '@angular/router';
import { GeoServiceService } from '../services/geo-service.service';
import { Store } from '@ngrx/store';
import { GeoServiceFormComponent } from '../geo-service-form/geo-service-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { LayerSettingsFormComponent } from '../layer-settings-form/layer-settings-form.component';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AuthorizationEditComponent } from '../../shared/components/authorization-edit/authorization-edit.component';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';

const setup = async () => {
  const activeRoute = {
    paramMap: of({ get: () => '1' }),
  };
  const geoServiceModel = getGeoService({ id: '1', title: 'The Service' });
  const { geoServiceService, updateGeoService$, refreshGeoService$, updateGeoServiceDetails, updateGeoServiceSettings } = createGeoServiceMock(geoServiceModel);
  const store = createMockStore({
    initialState: {
      [catalogStateKey]: { ...initialCatalogState, geoServices: [{ ...geoServiceModel, catalogNodeId: 'node-1' }] },
      [userStateKey]: initialUserState,
      [adminCoreStateKey]: initialAdminCoreState,
    },
  });
  await render(GeoServiceDetailsComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [ GeoServiceFormComponent, PasswordFieldComponent, LayerSettingsFormComponent, SaveButtonComponent, AuthorizationEditComponent ],
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: Store, useValue: store },
      { provide: TailormapAdminApiV1Service, useValue: { getGroups$: jest.fn(() => of(null)) } },
    ],
  });
  return { updateGeoServiceDetails, updateGeoServiceSettings, updateGeoService$, refreshGeoService$, geoServiceModel };
};

describe('GeoServiceDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findByText('Edit The Service')).toBeInTheDocument();
    expect(await screen.findByLabelText('Save')).toBeDisabled();
  });

  test('should handle editing', async () => {
    const { updateGeoService$, refreshGeoService$, updateGeoServiceDetails, updateGeoServiceSettings, geoServiceModel } = await setup();
    expect(await screen.findByText('Edit The Service')).toBeInTheDocument();

    // Update title
    await userEvent.type(await screen.findByPlaceholderText('Title'), '___');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(updateGeoService$).toHaveBeenNthCalledWith(1, '1', expect.anything(), expect.anything());
    expect(updateGeoServiceDetails).toHaveBeenNthCalledWith(1, {
      authorizationRules: [],
      title: geoServiceModel.title + '___',
      url: geoServiceModel.url,
      protocol: geoServiceModel.protocol,
      authentication: null,
      settings: { useProxy: false },
    });
    expect(updateGeoServiceSettings).toHaveBeenNthCalledWith(1, {
      defaultLayerSettings: {},
      useProxy: false,
    });
    expect(await screen.queryByText('Refresh service?')).not.toBeInTheDocument();
    TestSaveHelper.waitForButtonToBeDisabled('Save');

    // Update layer settings
    await userEvent.click(await screen.findByText('High-DPI enabled'));
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(updateGeoService$).toHaveBeenNthCalledWith(2, '1', expect.anything(), expect.anything());
    expect(updateGeoServiceDetails).toHaveBeenNthCalledWith(2, {});
    expect(updateGeoServiceSettings).toHaveBeenNthCalledWith(2, {
      defaultLayerSettings: { hiDpiDisabled: true, tilingDisabled: false, tilingGutter: undefined },
    });
    expect(await screen.queryByText('Refresh service?')).not.toBeInTheDocument();
    TestSaveHelper.waitForButtonToBeDisabled('Save');

    // Ask to refresh after updating URL
    await userEvent.type(await screen.findByPlaceholderText('URL'), '?test=test');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(updateGeoService$).toHaveBeenNthCalledWith(3, '1', expect.anything(), expect.anything());
    expect(updateGeoServiceDetails).toHaveBeenNthCalledWith(3, {
      authorizationRules: [],
      title: geoServiceModel.title + '___',
      url: geoServiceModel.url + '?test=test',
      protocol: geoServiceModel.protocol,
      authentication: null,
      settings: { useProxy: false },
    });
    expect(await screen.queryByText('Refresh service?')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Yes'));
    expect(refreshGeoService$).toHaveBeenCalled();
  });

  test('should refresh', async () => {
    const { refreshGeoService$ } = await setup();
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Refresh service');
    expect(refreshGeoService$).toHaveBeenCalled();
  });

});
