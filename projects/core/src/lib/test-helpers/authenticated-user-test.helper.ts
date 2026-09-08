import { AuthenticatedUserService, SecurityModel } from '@tailormap-viewer/api';
import { BehaviorSubject, map, of } from 'rxjs';

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
      useValue: AuthenticatedUserTestHelper.getAuthenticatedUserService(isAuthenticated, roles, username),
    };
  }

  public static getAuthenticatedUserService(isAuthenticated: boolean, roles: string[], username?: string) {
    const getUserDetailsMock = new BehaviorSubject<SecurityModel>({ isAuthenticated, roles, username });
    return {
      getUserDetailsMock,
      getUserDetails$: vi.fn(() => getUserDetailsMock.asObservable()),
      isAdminUser$: vi.fn(() => getUserDetailsMock.asObservable().pipe(map(user => (user.roles || []).includes('admin')))),
      logout$: vi.fn(() => of(true)),
    };
  }

}
