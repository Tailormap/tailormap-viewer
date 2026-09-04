import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { GeoServiceFormDialogComponent } from './geo-service-form-dialog.component';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TailormapAdminApiV1Service, getGeoService, AUTHORIZATION_RULE_ANONYMOUS, AdminServerType } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { GeoServiceService } from '../services/geo-service.service';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { TestSaveHelper } from '../../test-helpers/test-save.helper.spec';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';

const setup = async (editMode = false) => {
  const dialogRefMock = { close: vi.fn() };
  const geoServiceModelMock = getGeoService({ id: '2', title: 'my service', url: 'http://test.service' });
  const { geoServiceService, updateGeoService$, updateGeoServiceDetails } = createGeoServiceMock(geoServiceModelMock);
  await render(GeoServiceFormDialogComponent, {
    imports: [MatIconTestingModule],
    providers: [
      provideMockStore(),
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: MAT_DIALOG_DATA, useValue: { geoService: editMode ? geoServiceModelMock : null, parentNode: '1' } },
      { provide: TailormapAdminApiV1Service, useValue: { getGroups$: vi.fn(() => of([])) } },
      provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
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
        xyzCrs: null,
        serverType: AdminServerType.AUTO,
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
        xyzCrs: null,
        serverType: AdminServerType.GEOSERVER,
      },
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

});
