import { describe, test, expect, vi } from 'vitest';
import { LegendMenuButtonComponent } from './legend-menu-button.component';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { MenubarService } from '../../menubar';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';
import { provideMockStore } from '@ngrx/store/testing';
import { coreStateKey, initialCoreState } from '../../../state/core.state';
import { MatBadge } from '@angular/material/badge';

describe('LegendMenuButtonComponent', () => {

  test('renders', async () => {
    const toggleVisibleFn = vi.fn();
    const menubarServiceMock = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    await render(LegendMenuButtonComponent, {
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
