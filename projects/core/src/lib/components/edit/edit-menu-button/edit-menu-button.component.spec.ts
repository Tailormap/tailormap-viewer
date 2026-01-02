import { render, screen } from '@testing-library/angular';
import { EditMenuButtonComponent } from './edit-menu-button.component';
import { of } from 'rxjs';
import { MenubarButtonComponent, MenubarService } from '../../menubar';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatBadge } from '@angular/material/badge';
import { provideMockStore } from '@ngrx/store/testing';
import { coreStateKey, initialCoreState } from '../../../state';
import userEvent from '@testing-library/user-event';

describe('EditMenuButtonComponent', () => {

  test('renders', async () => {
    const toggleVisibleFn = jest.fn();
    const menubarServiceMock = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    await render(EditMenuButtonComponent, {
      declarations: [MenubarButtonComponent],
      imports: [ SharedModule, MatIconTestingModule, MatBadge ],
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
