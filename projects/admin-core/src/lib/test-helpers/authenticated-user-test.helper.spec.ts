import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { of } from 'rxjs';

export class AuthenticatedUserTestHelper {

  public static provideAuthenticatedUserServiceWithUser() {
    return AuthenticatedUserTestHelper.provideAuthenticatedUserService(true, ['some-user']);
  }

  public static provideAuthenticatedUserServiceWithAdminUser() {
    return AuthenticatedUserTestHelper.provideAuthenticatedUserService(true, ['admin']);
  }

  public static provideAuthenticatedUserService(isAuthenticated: boolean, roles: string[], username?: string) {
    return {
      provide: AuthenticatedUserService,
      useValue: { getUserDetails$: jest.fn(() => of({ isAuthenticated, roles, username })) },
    };
  }

}

// Dummy test to prevent "Your test suite must contain at least one test." error
describe('AuthenticatedUserTestHelper', () => {
  test('provideAuthenticatedUserServiceWithUser', () => {
    expect(1).toEqual(1);
  });
});
