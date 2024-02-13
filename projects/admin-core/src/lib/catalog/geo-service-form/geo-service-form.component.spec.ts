import { render, screen, waitFor } from '@testing-library/angular';
import { GeoServiceFormComponent } from './geo-service-form.component';
import { of } from 'rxjs';
import { AuthorizationEditComponent } from '../../shared/components/authorization-edit/authorization-edit.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';

describe('GeoServiceFormComponent', () => {

  test('should render', async () => {
    const changedFn = jest.fn();
    await render(GeoServiceFormComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ PasswordFieldComponent, AuthorizationEditComponent ],
      componentProperties: {
        changed: {
          emit: changedFn,
        } as any,
      },
      providers: [
        { provide: TailormapAdminApiV1Service, useValue: { getGroups$: jest.fn(() => of(null)) } },
        provideMockStore({ initialState: { [userStateKey]: initialUserState, [adminCoreStateKey]: initialAdminCoreState } }),
      ],
    });
    await userEvent.type(await screen.findByPlaceholderText('URL'), 'http://localhost.test');
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({
        authorizationRules: [],
        title: '',
        url: 'http://localhost.test',
        protocol: 'wms',
        authentication: null,
        settings: { useProxy: false, xyzCrs: null },
      });
    });
    await userEvent.click(await screen.findByText('wms'));
    await userEvent.click(await screen.findByText('wmts'));
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenNthCalledWith(2, {
        authorizationRules: [],
        title: '',
        url: 'http://localhost.test',
        protocol: 'wmts',
        authentication: null,
        settings: { useProxy: false, xyzCrs: null },
      });
    });
  });

});
