import { TocMenuButtonComponent } from './toc-menu-button.component';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { MenubarButtonComponent, MenubarService } from '../../menubar';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';

describe('TocMenuButtonComponent', () => {

  test('renders', async () => {
    const toggleVisibleFn = jest.fn();
    const menubarService = {
      toggleActiveComponent: toggleVisibleFn,
      isComponentVisible$: () => of(false),
    };
    await render(TocMenuButtonComponent, {
      declarations: [ MenubarButtonComponent ],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MenubarService, useValue: menubarService },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    userEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
