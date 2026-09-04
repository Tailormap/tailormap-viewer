import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { GroupEditComponent } from './group-edit.component';
import { of } from 'rxjs';
import { getGroup } from '@tailormap-admin/admin-api';
import { GroupService } from '../services/group.service';
import { ActivatedRoute, Router } from '@angular/router';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper.spec';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { OIDCConfigurationService } from '../../oidc/services/oidc-configuration.service';

const setup = async (hasGroup?: boolean) => {
  const activeRoute = {
    paramMap: of({ get: () => 'secret-group' }),
  };
  const groupService = {
    selectGroup: vi.fn(),
    getGroups$: () => of([]),
    getGroupByName$: () => hasGroup ? of(getGroup({ name: 'secret-group', description: 'some secret group' })) : of(null),
    deleteGroup$: vi.fn(() => of(true)),
    addOrUpdateGroup$: vi.fn(() => of(true)),
  };
  const oidcConfigurationService = {
    getOIDCConfigurations$: vi.fn(() => of([])),
  };
  const router = {
    navigateByUrl: vi.fn(),
  };
  await render(GroupEditComponent, {
    imports: [MatIconTestingModule],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: GroupService, useValue: groupService },
      { provide: Router, useValue: router },
      { provide: OIDCConfigurationService, useValue: oidcConfigurationService },
    ],
  });
  return { groupService, router };
};

describe('GroupEditComponent', () => {

  test('should render empty', async () => {
    await setup();
    expect(await screen.queryByText('Edit secret-group')).not.toBeInTheDocument();
  });

  test('should render selected group', async () => {
    const { groupService } = await setup(true);
    expect(await screen.queryByText('Edit secret-group')).toBeInTheDocument();
    expect(groupService.selectGroup).toHaveBeenCalledWith('secret-group');
  });

  test('should update group', async () => {
    const { groupService } = await setup(true);
    await userEvent.type(screen.getByLabelText('Notes'), 'some extra notes');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(groupService.addOrUpdateGroup$).toHaveBeenCalledWith(false, {
      name: 'secret-group',
      description: 'some secret group',
      notes: 'some extra notes',
      systemGroup: true,
      aliasForGroup: null,
      additionalProperties: [],
    });
  });

  test('should delete group', async () => {
    const { groupService } = await setup(true);
    await userEvent.click(await screen.findByText('Delete'));
    expect(await screen.findByText('Are you sure you want to delete the group with name secret-group? All users will be removed from this group. This action cannot be undone.'))
      .toBeInTheDocument();
    await userEvent.click(await screen.findByText('Yes'));
    expect(groupService.deleteGroup$).toHaveBeenCalledWith('secret-group');
  });

});
