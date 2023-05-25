import { render, screen, waitFor } from '@testing-library/angular';
import { ApplicationFormComponent } from './application-form.component';
import { TAILORMAP_ADMIN_API_V1_SERVICE, getApplication, AUTHORIZATION_RULE_ANONYMOUS } from '@tailormap-admin/admin-api';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { BoundsModel, getBoundsModel } from '@tailormap-viewer/api';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BoundsFieldComponent } from '../../shared/components/bounds-field/bounds-field.component';
import { AuthorizationEditComponent } from '../../shared/components/authorization-edit/authorization-edit.component';
import { of } from 'rxjs';

const setup = async (hasApp?: boolean) => {
  const onUpdate = jest.fn();
  const application = getApplication({
    id: '1',
    title: 'Test application',
    initialExtent: getBoundsModel(),
    maxExtent: getBoundsModel(),
  });
  await render(ApplicationFormComponent, {
    imports: [SharedModule],
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
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: { getGroups$: jest.fn(() => of(null)) } },
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
        authorizationRules: [AUTHORIZATION_RULE_ANONYMOUS],
        name: 'new-app',
        title: 'Cool application',
        adminComments: '',
        crs: 'EPSG:28992',
        initialExtent: undefined,
        maxExtent: undefined,
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
        authorizationRules: [],
        name: application.name,
        title: application.title,
        adminComments: '',
        crs: 'EPSG:3857',
        initialExtent: application.initialExtent,
        maxExtent: application.maxExtent,
      });
    });
  });

});
