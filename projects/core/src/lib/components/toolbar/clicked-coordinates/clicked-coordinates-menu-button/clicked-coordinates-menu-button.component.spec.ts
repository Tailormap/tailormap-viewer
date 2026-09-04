import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { ClickedCoordinatesMenuButtonComponent } from './clicked-coordinates-menu-button.component';
import { of } from 'rxjs';
import { MenubarService } from '../../../menubar';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatBadge } from '@angular/material/badge';
import { provideMockStore } from '@ngrx/store/testing';
import { coreStateKey, initialCoreState } from '../../../../state';
import userEvent from '@testing-library/user-event/dist/cjs/index.js';

describe('ClickedCoordinatesMenuButtonComponent', () => {

  test('renders', async () => {
    const toggleVisibleFn = vi.fn();
    const menubarServiceMock = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    await render(ClickedCoordinatesMenuButtonComponent, {
      imports: [ MatIconTestingModule, MatBadge ],
      providers: [
        provideMockStore({ initialState: { [coreStateKey]: initialCoreState } }),
        { provide: MenubarService, useValue: menubarServiceMock },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
