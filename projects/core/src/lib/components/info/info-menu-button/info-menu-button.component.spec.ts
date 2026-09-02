import { render, screen } from '@testing-library/angular';
import { InfoMenuButtonComponent } from './info-menu-button.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { coreStateKey, initialCoreState } from '../../../state';
import { MatBadge } from '@angular/material/badge';

describe('InfoMenuButtonComponent', () => {

  test('should render', async () => {
    const toggleVisibleFn = vi.fn();
    const menubarService = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };

    await render(InfoMenuButtonComponent, {
      imports: [
        MatIconTestingModule,
        MatBadge,
      ],
      providers: [
        provideMockStore({ initialState: { [coreStateKey]: initialCoreState } }),
        { provide: MenubarService, useValue: menubarService },
      ],
    });
    expect(screen.getByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
