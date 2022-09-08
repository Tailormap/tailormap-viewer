import { fireEvent, render, screen } from '@testing-library/angular';
import { ProfileComponent } from './profile.component';
import { MenubarButtonComponent } from '../menubar-button/menubar-button.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectUserDetails } from '../../../state/core.selectors';
import { Router } from '@angular/router';
import { SecurityService } from '../../../services/security.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

const getMockStore = (loggedIn: boolean) => {
  return provideMockStore({
    selectors: [
      { selector: selectUserDetails, value: { loggedIn, user: loggedIn ? { username: 'testusername' } : undefined } },
    ],
  });
};

describe('ProfileComponent', () => {

  test('should render without login', async () => {
    const navigateFn = jest.fn();
    const logoutFn = jest.fn(() => of(true));
    await render(ProfileComponent, {
      declarations: [
        MenubarButtonComponent,
      ],
      providers: [
        getMockStore(false),
        { provide: Router, useValue: { navigateByUrl: navigateFn } },
        { provide: SecurityService, useValue: { logout$: logoutFn } },
      ],
      imports: [
        MatIconTestingModule,
        SharedModule,
        NoopAnimationsModule,
      ],
    });
    const button = await screen.getByRole('button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    const menuItem = await screen.findByText(/Login/);
    fireEvent.click(menuItem);
    expect(navigateFn).toHaveBeenCalledWith('/login');
  });

  test('should render when logged in', async () => {
    const navigateFn = jest.fn();
    const logoutFn = jest.fn(() => of(true));
    const { fixture } = await render(ProfileComponent, {
      declarations: [
        MenubarButtonComponent,
      ],
      providers: [
        getMockStore(true),
        { provide: Router, useValue: { navigateByUrl: navigateFn } },
        { provide: SecurityService, useValue: { logout$: logoutFn } },
      ],
      imports: [
        MatIconTestingModule,
        SharedModule,
        NoopAnimationsModule,
      ],
    });
    const button = await screen.getByRole('button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(await screen.findByText('Logged in as')).toBeInTheDocument();
    expect(await screen.findByText(/testusername/)).toBeInTheDocument();
    const menuItem = await screen.findByText(/Logout/);
    fireEvent.click(menuItem);
    expect(logoutFn).toHaveBeenCalled();
    const store = (TestBed.inject(Store) as MockStore);
    store.overrideSelector(selectUserDetails, { loggedIn: false });
    store.refreshState();
    fireEvent.click(button);
    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

});
