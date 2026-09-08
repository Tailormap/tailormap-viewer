import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/angular';
import { ProfileComponent } from './profile.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { selectShowLanguageSwitcher, selectShowLoginButton } from '../../../state/core.selectors';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { APP_BASE_HREF } from '@angular/common';
import { AuthenticatedUserTestHelper } from '../../../test-helpers/authenticated-user-test.helper';
import { of } from 'rxjs';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';

const setup = async (loggedIn: boolean, showLoginButton = true) => {
  const navigateFn = vi.fn();
  const store = provideMockStore({
    selectors: [
      { selector: selectShowLoginButton, value: showLoginButton },
      { selector: selectShowLanguageSwitcher, value: false },
    ],
  });
  const userService = AuthenticatedUserTestHelper.getAuthenticatedUserService(loggedIn, [], loggedIn ? 'testusername' : undefined);
  const mockMobileLayoutService = { isMobileLayoutEnabled$: of(false) };
  await render(ProfileComponent, {
    providers: [
      { provide: APP_BASE_HREF, useValue: '' },
      store,
      { provide: AuthenticatedUserService, useValue: userService },
      { provide: Router, useValue: { navigateByUrl: navigateFn } },
      { provide: MobileLayoutService, useValue: mockMobileLayoutService },
    ],
    imports: [
      MatIconTestingModule,
      NoopAnimationsModule,
    ],
  });
  return { navigateFn, userService };
};

describe('ProfileComponent', () => {

  const { location } = window;

  beforeAll(() => {
    // @ts-expect-error deleting location is allowed in testing env, restored after tests
    delete window.location;
    // @ts-expect-error overwriting location is allowed in testing env, restored after tests
    window.location = { reload: vi.fn() };
  });

  afterAll(() => {
    // @ts-expect-error restoring the original location, allowed in testing env
    window.location = location;
  });

  test('should render without login', async () => {
    const { navigateFn } = await setup(false);
    const button = await screen.getByRole('button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    const menuItem = await screen.findByText(/Login/);
    fireEvent.click(menuItem);
    expect(navigateFn).toHaveBeenCalledWith('/login', { 'state': { 'routeBeforeLogin': undefined } });
  });

  test('should render when logged in', async () => {
    const { userService } = await setup(true);
    vi.spyOn(window.location, 'reload');
    const button = await screen.getByRole('button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(await screen.findByText('Logged in as')).toBeInTheDocument();
    expect(await screen.findByText(/testusername/)).toBeInTheDocument();
    const menuItem = await screen.findByText(/Logout/);
    fireEvent.click(menuItem);
    expect(userService.logout$).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
    userService.getUserDetailsMock.next({ isAuthenticated: false, roles: [], username: undefined });
    fireEvent.click(button);
    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  test('should render without login button if configured to hide login button', async () => {
    await setup(false, false);
    expect(screen.queryByText(/Login/)).not.toBeInTheDocument();
  });

});
