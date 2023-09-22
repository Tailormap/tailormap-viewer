import { render, screen } from '@testing-library/angular';
import { BottomPanelComponent } from './bottom-panel.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';

describe('BottomPanelComponent', () => {

  test('should render nothing if not visible', async () => {
    await render(BottomPanelComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentInputs: {
        isVisible$: of(false),
        title$: of(''),
      },
    });
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  test('should render', async () => {
    await render(BottomPanelComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentInputs: {
        isVisible$: of(true),
        title$: of('test panel'),
      },
    });
    expect(screen.queryByRole('tabpanel')).toBeInTheDocument();
    expect(screen.queryByText('test panel')).toBeInTheDocument();
  });

  test('starts with initial height', async () => {
    await render(BottomPanelComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentInputs: {
        isVisible$: of(true),
        title$: of('test panel'),
        initialHeight: 500,
      },
    });
    expect(screen.queryByRole('tabpanel')).toBeInTheDocument();
    const panel = screen.queryByRole('tabpanel')?.querySelector<HTMLDivElement>('.panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveStyle('height: 500px');
  });

  test('starts maximized', async () => {
    await render(BottomPanelComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentInputs: {
        isVisible$: of(true),
        title$: of('test panel'),
        initiallyMaximized: true,
      },
    });
    expect(screen.queryByRole('tabpanel')).toBeInTheDocument();
    const panel = screen.queryByRole('tabpanel')?.querySelector<HTMLDivElement>('.panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveStyle('height: 100vh');
  });

});
