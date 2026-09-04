import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { PrintMenuButtonComponent } from './print-menu-button.component';
import { MenubarService } from '../../menubar';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { provideMockStore } from '@ngrx/store/testing';
import { coreStateKey, initialCoreState } from '../../../state/core.state';
import { MatBadge } from '@angular/material/badge';

describe('PrintMenuButtonComponent', () => {

  test('should render', async () => {
    const toggleVisibleFn = vi.fn();
    const menubarService = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    await render(PrintMenuButtonComponent, {
      imports: [ MatIconTestingModule, MatBadge ],
      providers: [
        provideMockStore({ initialState: { [coreStateKey]: initialCoreState } }),
        { provide: MenubarService, useValue: menubarService },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
