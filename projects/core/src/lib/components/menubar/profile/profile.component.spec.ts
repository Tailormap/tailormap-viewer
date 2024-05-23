import { fireEvent, render, screen } from '@testing-library/angular';
import { ProfileComponent } from './profile.component';
import { MenubarButtonComponent } from '../menubar-button/menubar-button.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import { selectShowLanguageSwitcher, selectShowLoginButton } from '../../../state/core.selectors';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { APP_BASE_HREF } from '@angular/common';
import { AuthenticatedUserTestHelper } from '../../../test-helpers/authenticated-user-test.helper';

const setup = async (loggedIn: boolean, showLoginButton = true) => {
  const navigateFn = jest.fn();
  const store = provideMockStore({
    selectors: [
      { selector: selectShowLoginButton, value: showLoginButton },
      { selector: selectShowLanguageSwitcher, value: false },
    ],
  });
  const userService = AuthenticatedUserTestHelper.getAuthenticatedUserService(loggedIn, [], loggedIn ? 'testusername' : undefined);
  await render(ProfileComponent, {
    declarations: [
      MenubarButtonComponent,
    ],
    providers: [
      { provide: APP_BASE_HREF, useValue: '' },
      store,
      { provide: AuthenticatedUserService, useValue: userService },
      { provide: Router, useValue: { navigateByUrl: navigateFn } },
    ],
    imports: [
      MatIconTestingModule,
      SharedModule,
      NoopAnimationsModule,
    ],
  });
  return { navigateFn, userService };
};

describe('ProfileComponent', () => {

  const { location } = window;

  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { reload: jest.fn() };
  });

  afterAll(() => {
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
    jest.spyOn(window.location, 'reload');
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
