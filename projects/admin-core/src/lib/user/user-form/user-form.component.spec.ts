import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/angular';
import { UserFormComponent } from './user-form.component';
import { of } from 'rxjs';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import userEvent from '@testing-library/user-event';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper';
import { TailormapSecurityApiV1Service } from '@tailormap-viewer/api';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';

const setup = async (isValidPassword: boolean) => {
  const mockAdminApiService = {
    getGroups$: vi.fn(() => of([])),
    getUsers$: vi.fn(() => of([])),
  };
  const mockApiService = {
    validatePasswordStrength$: vi.fn(() => of(isValidPassword)),
  };
  const userUpdated = vi.fn();
  await render(UserFormComponent, {
    imports: [],
    on: { userUpdated },
    providers: [
      { provide: TailormapAdminApiV1Service, useValue: mockAdminApiService },
      { provide: TailormapSecurityApiV1Service, useValue: mockApiService },
      provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
      provideLuxonDateAdapter(),
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
    await vi.waitFor(() => {
      expect(userUpdated).toHaveBeenCalledWith({
        username: 'user1',
        email: 'test@test.com',
        name: 'Real name',
        organisation: null,
        enabled: true,
        validUntil: null,
        groups: [],
        password: 'secret-secret',
        notes: null,
        additionalProperties: [],
      });
    });
  });

  test('gives warning for weak password', async () => {
    const { mockApiService } = await setup(false);
    await userEvent.type(screen.getByLabelText('Password'), 'secret-secret');
    await userEvent.tab();
    await vi.waitFor(() => {
      expect(mockApiService.validatePasswordStrength$).toHaveBeenCalled();
      expect(screen.getByText('Password too short or too easily guessable')).toBeInTheDocument();
    });
  });

  test('sets valid until with the datetime input', async () => {
    const { userUpdated } = await setup(true);
    await userEvent.type(screen.getByLabelText('Username'), 'user1');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-secret');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'secret-secret');
    // userEvent.type() can't type in a datetime-local input, so set the value as the browser picker would
    fireEvent.input(screen.getByLabelText('Valid until'), { target: { value: '2026-12-31T23:30' } });
    await vi.waitFor(() => {
      expect(userUpdated).toHaveBeenLastCalledWith(expect.objectContaining({
        username: 'user1',
        validUntil: new Date('2026-12-31T23:30:00.000Z'),
      }));
    });
  });

});
