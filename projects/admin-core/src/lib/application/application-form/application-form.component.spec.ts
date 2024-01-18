import { render, screen, waitFor } from '@testing-library/angular';
import { ApplicationFormComponent } from './application-form.component';
import { TailormapAdminApiV1Service, getApplication, AUTHORIZATION_RULE_ANONYMOUS } from '@tailormap-admin/admin-api';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { getBoundsModel } from '@tailormap-viewer/api';
import { BoundsFieldComponent } from '../../shared/components/bounds-field/bounds-field.component';
import { AuthorizationEditComponent } from '../../shared/components/authorization-edit/authorization-edit.component';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const setup = async (hasApp?: boolean) => {
  const onUpdate = jest.fn();
  const application = getApplication({
    id: '1',
    title: 'Test application',
    initialExtent: getBoundsModel(),
    maxExtent: getBoundsModel(),
  });
  await render(ApplicationFormComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ BoundsFieldComponent, AuthorizationEditComponent ],
    componentInputs: {
      application: hasApp ? application : undefined,
    },
    componentProperties: {
      updateApplication: {
        emit: onUpdate,
      } as any,
    },
    providers: [
      { provide: TailormapAdminApiV1Service, useValue: { getGroups$: jest.fn(() => of(null)) } },
      provideMockStore({ initialState: { [userStateKey]: initialUserState, [adminCoreStateKey]: initialAdminCoreState } }),
    ],
  });
  return { application, onUpdate };
};

describe('ApplicationFormComponent', () => {

  test('should render', async () => {
    const { onUpdate } = await setup();
    expect(await screen.findByPlaceholderText('Name')).toHaveValue('');
    await userEvent.type(await screen.findByPlaceholderText('Name'), 'new-app');
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'Cool application');
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        application: {
          authorizationRules: [AUTHORIZATION_RULE_ANONYMOUS],
          name: 'new-app',
          title: 'Cool application',
          adminComments: '',
          crs: 'EPSG:28992',
          initialExtent: null,
          maxExtent: null,
        },
        i18nSettings: {
          defaultLanguage: null,
          hideLanguageSwitcher: false,
        },
        uiSettings: {
          hideLoginButton: false,
        },
      });
    });
  });

  test('should render form for existing application', async () => {
    const { onUpdate, application } = await setup(true);
    expect(await screen.findByPlaceholderText('Name')).toHaveValue(application.name);
    expect(await screen.findByPlaceholderText('Title')).toHaveValue(application.title);
    await userEvent.click(await screen.findByPlaceholderText('Projection'));
    await userEvent.click(await screen.findByText('EPSG:3857', { exact: false }));
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        application: {
          authorizationRules: [],
          name: application.name,
          title: application.title,
          adminComments: '',
          crs: 'EPSG:3857',
          initialExtent: application.initialExtent,
          maxExtent: application.maxExtent,
        },
        i18nSettings: {
          defaultLanguage: null,
          hideLanguageSwitcher: false,
        },
        uiSettings: {
          hideLoginButton: false,
        },
      });
    });
  });

});
