import { render, screen } from '@testing-library/angular';
import { MenubarPanelComponent } from './menubar-panel.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarService } from '../menubar.service';
import { BehaviorSubject, of } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';
import { CoreSharedModule } from '../../../shared';

const getMenuBarServiceMock = (initialValue: { componentId: string; dialogTitle: string } | null = null) => {
  const activeComponent$ = new BehaviorSubject(initialValue);
  return {
    provide: MenubarService,
    useValue: {
      activeComponent$,
      getActiveComponent$: () => activeComponent$.asObservable(),
      closePanel: jest.fn().mockImplementation(() => activeComponent$.next(null)),
    },
  };
};

describe('MenubarPanelComponent', () => {

  test('does not render panel contents if active component is false', async () => {
    await render(MenubarPanelComponent, {
      imports: [ SharedModule, CoreSharedModule ],
      providers: [
        getMenuBarServiceMock(),
        { provide: ViewerLayoutService, useValue: { setLeftPadding: jest.fn(), setRightPadding: jest.fn() } },
      ],
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders active component', async () => {
    const menubarServiceMock = getMenuBarServiceMock({ componentId: 'TOC', dialogTitle: 'Available layers' });
    const closePanelFn = menubarServiceMock.useValue.closePanel;
    await render(MenubarPanelComponent, {
      imports: [ SharedModule, MatIconTestingModule, CoreSharedModule ],
      providers: [
        menubarServiceMock,
        { provide: ViewerLayoutService, useValue: { setLeftPadding: jest.fn(), setRightPadding: jest.fn() } },
      ],
    });
    expect(screen.getByText('Available layers')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(closePanelFn).toHaveBeenCalled();
  });

});
