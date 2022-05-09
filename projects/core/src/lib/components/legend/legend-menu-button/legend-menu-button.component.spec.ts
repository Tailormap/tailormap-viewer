import { LegendMenuButtonComponent } from './legend-menu-button.component';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { MenubarButtonComponent, MenubarService } from '../../menubar';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';

describe('LegendMenuButtonComponent', () => {

  test('renders', async () => {
    const toggleVisibleFn = jest.fn();
    const menubarServiceMock = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    await render(LegendMenuButtonComponent, {
      declarations: [ MenubarButtonComponent ],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MenubarService, useValue: menubarServiceMock },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
