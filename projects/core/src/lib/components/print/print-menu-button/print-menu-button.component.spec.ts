import { render, screen } from '@testing-library/angular';
import { PrintMenuButtonComponent } from './print-menu-button.component';
import { MenubarButtonComponent, MenubarService } from '../../menubar';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { provideMockStore } from '@ngrx/store/testing';
import { coreStateKey, initialCoreState } from '../../../state/core.state';
import { selectIn3DView } from '../../../map/state/map.selectors';

describe('PrintMenuButtonComponent', () => {

  test('should render', async () => {
    const toggleVisibleFn = jest.fn();
    const menubarService = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    await render(PrintMenuButtonComponent, {
      declarations: [MenubarButtonComponent],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        provideMockStore({
          initialState: { [coreStateKey]: initialCoreState },
          selectors: [{ selector: selectIn3DView, value: false }],
        }),
        { provide: MenubarService, useValue: menubarService },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
