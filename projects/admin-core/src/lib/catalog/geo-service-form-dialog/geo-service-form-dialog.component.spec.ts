import { render, screen } from '@testing-library/angular';
import { GeoServiceFormDialogComponent } from './geo-service-form-dialog.component';
import userEvent from '@testing-library/user-event';
import { SharedModule } from '@tailormap-viewer/shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TailormapAdminApiV1Service, getGeoService, AUTHORIZATION_RULE_ANONYMOUS } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { GeoServiceFormComponent } from '../geo-service-form/geo-service-form.component';
import { GeoServiceService } from '../services/geo-service.service';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AuthorizationEditComponent } from '../../shared/components/authorization-edit/authorization-edit.component';
import { LayerSettingsFormComponent } from '../layer-settings-form/layer-settings-form.component';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';

const setup = async (editMode = false) => {
  const dialogRefMock = { close: jest.fn() };
  const geoServiceModelMock = getGeoService({ id: '2', title: 'my service', url: 'http://test.service' });
  const { geoServiceService, updateGeoService$, updateGeoServiceDetails } = createGeoServiceMock(geoServiceModelMock);
  await render(GeoServiceFormDialogComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ GeoServiceFormComponent, LayerSettingsFormComponent, PasswordFieldComponent, SaveButtonComponent, AuthorizationEditComponent ],
    providers: [
      provideMockStore(),
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: MAT_DIALOG_DATA, useValue: { geoService: editMode ? geoServiceModelMock : null, parentNode: '1' } },
      { provide: TailormapAdminApiV1Service, useValue: { getGroups$: jest.fn(() => of(null)) } },
      provideMockStore({ initialState: { [userStateKey]: initialUserState, [adminCoreStateKey]: initialAdminCoreState } }),
    ],
  });
  return {
    geoServiceService,
    dialogRefMock,
    updateGeoService$,
    updateGeoServiceDetails,
  };
};

describe('GeoServiceFormDialogComponent', () => {

  test('should render and handle cancel', async () => {
    const { dialogRefMock } = await setup();
    expect(screen.getByText('Create new service')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancel'));
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should save new node', async () => {
    const { geoServiceService, dialogRefMock } = await setup();
    expect(screen.getByText('Create new service')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('URL'), 'http://www.super-service.com');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(geoServiceService.createGeoService$).toHaveBeenCalledWith({
      authorizationRules: [AUTHORIZATION_RULE_ANONYMOUS],
      url: 'http://www.super-service.com',
      title: '',
      protocol: 'wms',
      authentication: null,
      settings: {
        useProxy: false,
      },
    }, '1');
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should edit node', async () => {
    const { updateGeoService$, updateGeoServiceDetails, dialogRefMock } = await setup(true);
    expect(screen.getByText('Edit my service')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('URL'), '?123');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(updateGeoService$).toHaveBeenCalledWith('2', expect.anything(), expect.anything());
    expect(updateGeoServiceDetails).toHaveBeenCalledWith({
      url: 'http://test.service?123',
      authorizationRules: [],
      title: 'my service',
      protocol: 'wms',
      authentication: null,
      settings: {
        useProxy: false,
      },
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

});
