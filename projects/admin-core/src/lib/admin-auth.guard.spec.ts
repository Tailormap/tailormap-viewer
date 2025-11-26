import { TestBed } from '@angular/core/testing';
import { RedirectCommand, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { of } from 'rxjs';

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let authService: { isAdminUser$: jest.Mock };
  let router: Router;

  beforeEach(() => {
    const authServiceMock = {
      isAdminUser$: jest.fn(),
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
    authService.isAdminUser$.mockReturnValue(of(true));

    const mockRoute = {} as any;
    const mockState = { url: '/admin/dashboard' } as any;

    guard.canActivate(mockRoute, mockState).subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should block unauthenticated users and redirect to login', (done) => {
    authService.isAdminUser$.mockReturnValue(of(false));

    const mockRoute = {} as any;
    const mockState = { url: '/admin/settings' } as any;

    guard.canActivate(mockRoute, mockState).subscribe(result => {
      expect(result).not.toBe(true);
      expect(result).toBeInstanceOf(RedirectCommand);
      if (result instanceof RedirectCommand) {
        expect(result.redirectTo.toString()).toBe('/login');
        done();
      }
    });
  });

  it('should preserve the original route in the redirect state', (done) => {
    authService.isAdminUser$.mockReturnValue(of(false));

    const mockRoute = {} as any;
    const originalUrl = '/admin/users';
    const mockState = { url: originalUrl } as any;

    guard.canActivate(mockRoute, mockState).subscribe(result => {
      expect(result).not.toBe(true);
      expect(result).toBeInstanceOf(RedirectCommand);
      if (result instanceof RedirectCommand) {
        expect(result.navigationBehaviorOptions).toBeDefined();
        expect(result.navigationBehaviorOptions?.state).toBeDefined();
        expect(result.navigationBehaviorOptions?.state?.routeBeforeLogin).toBe(originalUrl);
        done();
      }
    });
  });
});
