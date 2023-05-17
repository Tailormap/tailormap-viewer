import { render, screen } from '@testing-library/angular';
import { UserEditComponent } from './user-edit.component';
import { of } from 'rxjs';
import { getUser } from '@tailormap-admin/admin-api';
import { UserFormComponent } from '../user-form/user-form.component';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { UserDetailsService } from '../services/user-details.service';
import { GroupDetailsService } from '../services/group-details.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';

const setup = async (hasUser?: boolean) => {
  const activeRoute = {
    paramMap: of({ get: () => 'user1' }),
  };
  const userService = {
    selectUser: jest.fn(),
    selectedUser$: hasUser ? of(getUser({ username: 'user1', name: 'user 1', groups: [] })) : of(null),
    deleteUser$: jest.fn(() => of(true)),
    addOrUpdateUser$: jest.fn(() => of(true)),
  };
  const groupService = {
    getGroups$: jest.fn(() => of([])),
  };
  const router = {
    navigateByUrl: jest.fn(),
  };
  await render(UserEditComponent, {
    declarations: [ UserFormComponent, SaveButtonComponent, PasswordFieldComponent ],
    imports: [SharedImportsModule],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: UserDetailsService, useValue: userService },
      { provide: GroupDetailsService, useValue: groupService },
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
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(userService.addOrUpdateUser$).toHaveBeenCalledWith(false, getUser({ username: 'user1', name: 'user 123', groups: [] }));
  });

  test('should delete user', async () => {
    const { userService } = await setup(true);
    await userEvent.click(await screen.findByText('Delete'));
    expect(await screen.findByText('Are you sure you want to delete the user with username user1? This action cannot be undone.')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Yes'));
    expect(userService.deleteUser$).toHaveBeenCalledWith('user1');
  });

});
