import { render, screen } from '@testing-library/angular';
import { InfoMenuButtonComponent } from './info-menu-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { MenubarButtonComponent, MenubarService } from '../../menubar';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { coreStateKey, initialCoreState } from '../../../state';

describe('InfoMenuButtonComponent', () => {

  test('should render', async () => {
    const toggleVisibleFn = jest.fn();
    const menubarService = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };

    await render(InfoMenuButtonComponent, {
      imports: [
        SharedModule,
        MatIconTestingModule,
      ],
      providers: [
        provideMockStore({ initialState: { [coreStateKey]: initialCoreState } }),
        { provide: MenubarService, useValue: menubarService },
      ],
      declarations: [
        MenubarButtonComponent,
      ],
    });
    expect(screen.getByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
