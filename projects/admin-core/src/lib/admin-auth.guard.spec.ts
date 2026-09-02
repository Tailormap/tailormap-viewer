import { TestBed } from '@angular/core/testing';
import { RedirectCommand, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { firstValueFrom, of } from 'rxjs';
import type { Mock } from 'vitest';

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let authService: { isAdminUser$: Mock };
  let router: Router;

  beforeEach(() => {
    const authServiceMock = {
      isAdminUser$: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
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

  it('should allow authenticated users', async () => {
    authService.isAdminUser$.mockReturnValue(of(true));

    const mockRoute = {} as any;
    const mockState = { url: '/admin/dashboard' } as any;

    const result = await firstValueFrom(guard.canActivate(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should block unauthenticated users and redirect to login', async () => {
    authService.isAdminUser$.mockReturnValue(of(false));

    const mockRoute = {} as any;
    const mockState = { url: '/admin/settings' } as any;

    const result = await firstValueFrom(guard.canActivate(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result).toBeInstanceOf(RedirectCommand);
    if (result instanceof RedirectCommand) {
      expect(result.redirectTo.toString()).toBe('/login');
    }
  });

  it('should preserve the original route in the redirect state', async () => {
    authService.isAdminUser$.mockReturnValue(of(false));

    const mockRoute = {} as any;
    const originalUrl = '/admin/users';
    const mockState = { url: originalUrl } as any;

    const result = await firstValueFrom(guard.canActivate(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result).toBeInstanceOf(RedirectCommand);
    if (result instanceof RedirectCommand) {
      expect(result.navigationBehaviorOptions).toBeDefined();
      expect(result.navigationBehaviorOptions?.state).toBeDefined();
      expect(result.navigationBehaviorOptions?.state?.routeBeforeLogin).toBe(originalUrl);
    }
  });
});
