import { render, screen, waitFor } from '@testing-library/angular';
import { LayerSettingsFormComponent } from './layer-settings-form.component';
import userEvent from '@testing-library/user-event';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GeoServiceProtocolEnum, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';

describe('LayerSettingsFormComponent', () => {

  test('should render', async () => {
    const store = provideMockStore({
      initialState: { [userStateKey]: initialUserState },
    });

    const changedFn = vi.fn();
    await render(LayerSettingsFormComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        store,
        { provide: TailormapAdminApiV1Service, useValue: { getGroups$: vi.fn(() => of(null)) } },
        AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
      ],
      inputs: { isLayerSpecific: true, protocol: GeoServiceProtocolEnum.WMTS },
      on: { changed: changedFn },
    });
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'Some title');
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({
        attribution: undefined,
        authorizationRules: [],
        description: undefined,
        extraKeywords: [],
        featureType: undefined,
        hiDpiDisabled: undefined,
        hiDpiMode: undefined,
        tilingDisabled: undefined,
        tilingGutter: undefined,
        hiDpiSubstituteLayer: undefined,
        hiddenKeywords: [],
        legendImageId: undefined,
        title: 'Some title',
      });
    });
    await userEvent.click(await screen.findByText('Disabled'));
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenNthCalledWith(2, {
        attribution: undefined,
        authorizationRules: [],
        description: undefined,
        extraKeywords: [],
        featureType: undefined,
        hiDpiDisabled: true,
        hiDpiMode: undefined,
        tilingDisabled: undefined,
        tilingGutter: undefined,
        hiDpiSubstituteLayer: undefined,
        hiddenKeywords: [],
        legendImageId: undefined,
        title: 'Some title',
      });
    });
  });

});
