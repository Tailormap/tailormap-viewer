import { render, screen } from '@testing-library/angular';
import { ProfileMenuButtonComponent } from './profile-menu-button.component';
import { of } from 'rxjs';
import { MenubarButtonComponent } from '../../menubar-button/menubar-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatBadge } from '@angular/material/badge';
import { provideMockStore } from '@ngrx/store/testing';
import { coreStateKey, initialCoreState, selectShowLoginButton } from '../../../../state';
import { MenubarService } from '../../menubar.service';
import userEvent from '@testing-library/user-event';
import { AuthenticatedUserService } from '@tailormap-viewer/api';

describe('ProfileMenuButtonComponent', () => {

  test('renders', async () => {
    const toggleVisibleFn = jest.fn();
    const menubarServiceMock = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    const authenticatedUserServiceMock = {
      getUserDetails$: () => of({ isAuthenticated: false }),
    };
    await render(ProfileMenuButtonComponent, {
      declarations: [MenubarButtonComponent],
      imports: [ SharedModule, MatIconTestingModule, MatBadge ],
      providers: [
        provideMockStore({
          initialState: { [coreStateKey]: initialCoreState },
          selectors: [{ selector: selectShowLoginButton, value: true }],
        }),
        { provide: MenubarService, useValue: menubarServiceMock },
        { provide: AuthenticatedUserService, useValue: authenticatedUserServiceMock },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
