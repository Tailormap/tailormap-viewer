import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/angular';
import { GeoServiceFormComponent } from './geo-service-form.component';
import { of } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminServerType, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';

describe('GeoServiceFormComponent', () => {

  test('should render', async () => {
    const changedFn = vi.fn();
    await render(GeoServiceFormComponent, {
      imports: [MatIconTestingModule],
      on: { changed: changedFn },
      providers: [
        { provide: TailormapAdminApiV1Service, useValue: { getGroups$: vi.fn(() => of([])) } },
        provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
        AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
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
        settings: { useProxy: false, xyzCrs: null, serverType: AdminServerType.AUTO },
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
        settings: { useProxy: false, xyzCrs: null, serverType: AdminServerType.AUTO },
      });
    });
  });

});
