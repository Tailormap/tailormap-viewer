import { render, screen, waitFor } from '@testing-library/angular';
import { UserFormComponent } from './user-form.component';
import { of } from 'rxjs';
import { TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import userEvent from '@testing-library/user-event';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../state/user.state';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';
import { MatIconTestingModule } from '@angular/material/icon/testing';


const setup = async (isValidPassword: boolean) => {
  const mockApiService = {
    getGroups$: jest.fn(() => of([])),
    getUsers$: jest.fn(() => of([])),
    validatePasswordStrength$: jest.fn(() => of(isValidPassword)),
  };
  const userUpdated = jest.fn();
  await render(UserFormComponent, {
    imports: [ SharedImportsModule, MatIconTestingModule ],
    declarations: [PasswordFieldComponent],
    componentOutputs: {
      userUpdated: {
        emit: userUpdated,
      } as any,
    },
    providers: [
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
      provideMockStore({ initialState: { [userStateKey]: initialUserState, [adminCoreStateKey]: initialAdminCoreState } }),
    ],
  });
  return { userUpdated, mockApiService };
};

describe('UserFormComponent', () => {

  test('should trigger user updated for a valid form', async () => {
    const { userUpdated } = await setup(true);
    await userEvent.type(screen.getByLabelText('Username'), 'user1');
    await userEvent.type(screen.getByLabelText('Name'), 'Real name');
    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-secret');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'secret-secret');
    await waitFor(() => {
      expect(userUpdated).toHaveBeenCalledWith({
        username: 'user1',
        email: 'test@test.com',
        name: 'Real name',
        enabled: true,
        validUntil: null,
        groups: [],
        password: 'secret-secret',
      });
    });
  });

  test('gives warning for weak password', async () => {
    const { mockApiService } = await setup(false);
    await userEvent.type(screen.getByLabelText('Password'), 'secret-secret');
    await userEvent.tab();
    await waitFor(() => {
      expect(mockApiService.validatePasswordStrength$).toHaveBeenCalled();
      expect(screen.getByText('Password too short or too easily guessable')).toBeInTheDocument();
    });
  });

});
