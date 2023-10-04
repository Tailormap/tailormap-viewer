import { render, screen, waitFor } from '@testing-library/angular';
import { LayerSettingsFormComponent } from './layer-settings-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { TriStateBooleanComponent } from '../../shared/components/tri-state-boolean/tri-state-boolean.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { AuthorizationEditComponent } from '../../shared/components/authorization-edit/authorization-edit.component';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';

describe('LayerSettingsFormComponent', () => {

  test('should render', async () => {
    const store = provideMockStore({
      initialState: { [userStateKey]: initialUserState, [adminCoreStateKey]: initialAdminCoreState },
      selectors: [
      ],
    });

    const changedFn = jest.fn();
    await render(LayerSettingsFormComponent, {
      imports: [SharedModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [ TriStateBooleanComponent, AuthorizationEditComponent ],
      providers: [
        store,
        { provide: TailormapAdminApiV1Service, useValue: { getGroups$: jest.fn(() => of(null)) } },
      ],
      componentInputs: {
        isLayerSpecific: true,
      },
      componentProperties: {
        changed: {
          emit: changedFn,
        } as any,
      },
    });
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'Some title');
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({
        authorizationRules: [],
        title: 'Some title',
        hiDpiMode: 'showNextZoomLevel',
        hiDpiDisabled: undefined,
        tilingDisabled: undefined,
        tilingGutter: undefined,
      });
    });
    await userEvent.click(await screen.findByText('Disabled'));
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenNthCalledWith(2, {
        authorizationRules: [],
        title: 'Some title',
        hiDpiDisabled: true,
        hiDpiMode: 'showNextZoomLevel',
        tilingDisabled: undefined,
        tilingGutter: undefined,
      });
    });
  });

});
