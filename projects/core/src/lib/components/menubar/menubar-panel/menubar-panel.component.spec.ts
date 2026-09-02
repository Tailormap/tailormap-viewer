import { render, screen } from '@testing-library/angular';
import { MenubarPanelComponent } from './menubar-panel.component';
import { MenubarService } from '../menubar.service';
import { BehaviorSubject } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';

const getMenuBarServiceMock = (initialValue: { componentId: string; dialogTitle: string } | null = null) => {
  const activeComponent$ = new BehaviorSubject(initialValue);
  return {
    provide: MenubarService,
    useValue: {
      activeComponent$,
      panelWidth: 300,
      setPanelWidth: vi.fn(),
      getActiveComponent$: () => activeComponent$.asObservable(),
      closePanel: vi.fn().mockImplementation(() => activeComponent$.next(null)),
    },
  };
};

describe('MenubarPanelComponent', () => {

  test('does not render panel contents if active component is false', async () => {
    await render(MenubarPanelComponent, {
      imports: [],
      providers: [
        getMenuBarServiceMock(),
        { provide: ViewerLayoutService, useValue: { setLeftPadding: vi.fn(), setRightPadding: vi.fn() } },
      ],
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders active component', async () => {
    const menubarServiceMock = getMenuBarServiceMock({ componentId: 'TOC', dialogTitle: 'Available layers' });
    const closePanelFn = menubarServiceMock.useValue.closePanel;
    const { fixture } = await render(MenubarPanelComponent, {
      imports: [MatIconTestingModule],
      providers: [
        menubarServiceMock,
        { provide: ViewerLayoutService, useValue: { setLeftPadding: vi.fn(), setRightPadding: vi.fn() } },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(screen.getByText('Available layers')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(closePanelFn).toHaveBeenCalled();
  });


  test('onPanelWidthChanged updates panelWidth and calls MenubarService.setPanelWidth', async () => {
    const menubarServiceMock = getMenuBarServiceMock({ componentId: 'TOC', dialogTitle: 'Available layers' });
    const setPanelWidthFn = menubarServiceMock.useValue.setPanelWidth;
    const { fixture } = await render(MenubarPanelComponent, {
      imports: [MatIconTestingModule],
      providers: [
        menubarServiceMock,
        { provide: ViewerLayoutService, useValue: { setLeftPadding: vi.fn(), setRightPadding: vi.fn() } },
      ],
    });
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const initialWidth = component.panelWidth;

    const newWidth = 450;
    component.onPanelWidthChanged(newWidth);

    expect(component.panelWidth).toBe(newWidth);
    expect(setPanelWidthFn).toHaveBeenCalledWith(newWidth);
    expect(component.panelWidth).not.toBe(initialWidth);
  });
});
