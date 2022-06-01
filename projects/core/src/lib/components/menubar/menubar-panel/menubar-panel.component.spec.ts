import { render, screen } from '@testing-library/angular';
import { MenubarPanelComponent } from './menubar-panel.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarService } from '../menubar.service';
import { of } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('MenubarPanelComponent', () => {

  test('does not render panel contents if active component is false', async () => {
    await render(MenubarPanelComponent, {
      imports: [ SharedModule ],
      providers: [
        { provide: MenubarService, useValue: { getActiveComponent$: () => of(null) } },
      ],
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders active component', async () => {
    const menubarServiceMock = {
      getActiveComponent$: () => of({ componentId: 'TOC', dialogTitle: 'Available layers' }),
      closePanel: jest.fn(),
    };
    await render(MenubarPanelComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MenubarService, useValue: menubarServiceMock },
      ],
    });
    expect(screen.getByText('Available layers')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(menubarServiceMock.closePanel).toHaveBeenCalled();
  });

});
