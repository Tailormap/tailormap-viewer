import { render, screen, waitFor } from '@testing-library/angular';
import { UserEditComponent } from './user-edit.component';
import { of } from 'rxjs';
import { getUser } from '@tailormap-admin/admin-api';
import { UserService } from '../services/user.service';
import { GroupService } from '../services/group.service';
import { ActivatedRoute, Router } from '@angular/router';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper.spec';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const setup = async (hasUser?: boolean) => {
  const activeRoute = {
    paramMap: of({ get: () => 'user1' }),
  };
  const userService = {
    selectUser: vi.fn(),
    getUserByName$: () => hasUser ? of(getUser({ username: 'user1', name: 'user 1', groupNames: [] })) : of(null),
    deleteUser$: vi.fn(() => of(true)),
    addOrUpdateUser$: vi.fn(() => of(true)),
    getUsers$: vi.fn(() => of([])),
  };
  const groupService = {
    getGroups$: vi.fn(() => of([])),
  };
  const router = {
    navigateByUrl: vi.fn(),
  };
  await render(UserEditComponent, {
    imports: [MatIconTestingModule],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: UserService, useValue: userService },
      { provide: GroupService, useValue: groupService },
      { provide: Router, useValue: router },
    ],
  });
  return { userService, groupService, router };
};

describe('UserEditComponent', () => {

  test('should render empty', async () => {
    await setup();
    expect(await screen.queryByText('Edit user1')).not.toBeInTheDocument();
  });

  test('should render selected user', async () => {
    const { userService } = await setup(true);
    expect(await screen.queryByText('Edit user1')).toBeInTheDocument();
    expect(userService.selectUser).toHaveBeenCalledWith('user1');
  });

  test('should update user', async () => {
    const { userService } = await setup(true);
    await userEvent.type(screen.getByLabelText('Name'), '23');
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('user 123');
    });
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    const { groupNames, ...user } = getUser({ username: 'user1', name: 'user 123', groupNames: [], additionalProperties: [] });
    expect(userService.addOrUpdateUser$).toHaveBeenCalledWith(false, { ...user, notes: null, groups: [] });
  });

  test('should delete user', async () => {
    const { userService } = await setup(true);
    await userEvent.click(await screen.findByText('Delete'));
    expect(await screen.findByText('Are you sure you want to delete the user with username user1? This action cannot be undone.')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Yes'));
    expect(userService.deleteUser$).toHaveBeenCalledWith('user1');
  });

});
