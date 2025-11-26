import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { of } from 'rxjs';
import { SecurityModel } from '@tailormap-viewer/api';

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let authService: { getUserDetails$: jest.Mock };
  let router: Router;

  beforeEach(() => {
    const authServiceMock = {
      getUserDetails$: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AdminAuthGuard,
        { provide: AuthenticatedUserService, useValue: authServiceMock },
      ],
    });

    guard = TestBed.inject(AdminAuthGuard);
    authService = TestBed.inject(AuthenticatedUserService) as any;
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow authenticated users', (done) => {
    const authenticatedUser: SecurityModel = {
      isAuthenticated: true,
      username: 'testuser',
      roles: ['admin'],
    };
    authService.getUserDetails$.mockReturnValue(of(authenticatedUser));

    const mockRoute = {} as any;
    const mockState = { url: '/admin/dashboard' } as any;

    guard.canActivate(mockRoute, mockState).subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should block unauthenticated users and redirect to login', (done) => {
    const unauthenticatedUser: SecurityModel = {
      isAuthenticated: false,
    };
    authService.getUserDetails$.mockReturnValue(of(unauthenticatedUser));

    const mockRoute = {} as any;
    const mockState = { url: '/admin/settings' } as any;

    guard.canActivate(mockRoute, mockState).subscribe(result => {
      expect(result).not.toBe(true);
      if (typeof result !== 'boolean') {
        expect(result.redirectTo.toString()).toBe('/login');
        done();
      }
    });
  });

  it('should preserve the original route in the redirect state', (done) => {
    const unauthenticatedUser: SecurityModel = {
      isAuthenticated: false,
    };
    authService.getUserDetails$.mockReturnValue(of(unauthenticatedUser));

    const mockRoute = {} as any;
    const originalUrl = '/admin/users';
    const mockState = { url: originalUrl } as any;

    guard.canActivate(mockRoute, mockState).subscribe(result => {
      expect(result).not.toBe(true);
      if (typeof result !== 'boolean') {
        // Access the navigation extras from the RedirectCommand
        const navigationExtras = (result as any).navigationBehaviorOptions;
        expect(navigationExtras).toBeDefined();
        expect(navigationExtras.state).toBeDefined();
        expect(navigationExtras.state.routeBeforeLogin).toBe(originalUrl);
        done();
      }
    });
  });
});
