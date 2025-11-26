import { render, screen } from '@testing-library/angular';
import { FilterMenuButtonComponent } from './filter-menu-button.component';
import { of } from 'rxjs';
import { MenubarButtonComponent, MenubarService } from '../../menubar';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';
import { provideMockStore } from '@ngrx/store/testing';
import { coreStateKey, initialCoreState } from '../../../state/core.state';
import { MatBadge } from '@angular/material/badge';
import { selectActiveFilterGroups, selectVerifiedCurrentFilterGroups } from '../../../state/filter-state/filter.selectors';

describe('FilterMenuButtonComponent', () => {

  test('should render', async () => {
    const toggleVisibleFn = jest.fn();
    const menubarService = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    await render(FilterMenuButtonComponent, {
      declarations: [MenubarButtonComponent],
      imports: [ SharedModule, MatIconTestingModule, MatBadge ],
      providers: [
        provideMockStore({
          initialState: { [coreStateKey]: initialCoreState },
          selectors: [
            { selector: selectActiveFilterGroups, value: [] },
          ],
        }),
        { provide: MenubarService, useValue: menubarService },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
