import { fireEvent, render, screen } from '@testing-library/angular';
import { ProfileComponent } from './profile.component';
import { MenubarButtonComponent } from '../menubar-button/menubar-button.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectShowLoginButton, selectUserDetails } from '../../../state/core.selectors';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1MockService } from '@tailormap-viewer/api';
import { APP_BASE_HREF } from '@angular/common';

const setup = async (loggedIn: boolean, showLoginButton = true) => {
  const navigateFn = jest.fn();
  const store = provideMockStore({
    selectors: [
      { selector: selectUserDetails, value: { isAuthenticated: loggedIn, username: loggedIn ? 'testusername' : undefined, roles: [] } },
      { selector: selectShowLoginButton, value: showLoginButton },
    ],
  });
  const service = {
    getUser$: jest.fn(() => of({})),
    login$: jest.fn(() => of({})),
    logout$: jest.fn(() => of(true)),
  };
  await render(ProfileComponent, {
    declarations: [
      MenubarButtonComponent,
    ],
    providers: [
      { provide: APP_BASE_HREF, useValue: '' },
      store,
      { provide: Router, useValue: { navigateByUrl: navigateFn } },
      { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useValue: service },
    ],
    imports: [
      MatIconTestingModule,
      SharedModule,
      NoopAnimationsModule,
    ],
  });
  return { navigateFn, securityService: service };
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
    const { securityService } = await setup(true);
    jest.spyOn(window.location, 'reload');
    const button = await screen.getByRole('button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(await screen.findByText('Logged in as')).toBeInTheDocument();
    expect(await screen.findByText(/testusername/)).toBeInTheDocument();
    const menuItem = await screen.findByText(/Logout/);
    fireEvent.click(menuItem);
    expect(securityService.logout$).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
    const store = (TestBed.inject(Store) as MockStore);
    store.overrideSelector(selectUserDetails, { isAuthenticated: false });
    store.refreshState();
    fireEvent.click(button);
    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  test('should render without login button if configured to hide login button', async () => {
    await setup(false, false);
    expect(screen.queryByText(/Login/)).not.toBeInTheDocument();
  });

});
