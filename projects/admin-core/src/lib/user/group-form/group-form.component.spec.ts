import { render, screen, waitFor } from '@testing-library/angular';
import { GroupFormComponent } from './group-form.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { SharedAdminComponentsModule } from '../../shared/components/shared-admin-components.module';
import { of } from 'rxjs';
import { GroupService } from '../services/group.service';
import { OIDCConfigurationService } from '../../oidc/services/oidc-configuration.service';

const setup = async () => {
  const groupUpdated = jest.fn();
  const groupService = {
    getGroups$: () => of([]),
  };
  const oidcConfigurationService = {
    getOIDCConfigurations$: jest.fn(() => of([])),
  };
  await render(GroupFormComponent, {
    imports: [ SharedImportsModule, SharedAdminComponentsModule ],
    on: { groupUpdated: groupUpdated },
    providers: [
      { provide: GroupService, useValue: groupService },
      { provide: OIDCConfigurationService, useValue: oidcConfigurationService },
    ],
  });
  return { groupUpdated };
};

describe('GroupFormComponent', () => {

  test('should trigger group updated for a valid form', async () => {
    const { groupUpdated } = await setup();
    await userEvent.type(screen.getByLabelText('Name'), 'secret-group');
    await userEvent.type(screen.getByLabelText('Description'), 'A very secret group');
    await waitFor(() => {
      expect(groupUpdated).toHaveBeenCalledWith({
        name: 'secret-group',
        description: 'A very secret group',
        notes: null,
        systemGroup: false,
        aliasForGroup: null,
        additionalProperties: [],
      });
    });
  });

});
