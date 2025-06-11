import { render, screen } from '@testing-library/angular';
import { BottomPanelComponent } from './bottom-panel.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const setup = async (inputs: Partial<BottomPanelComponent>) => {
  await render(BottomPanelComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [getMapServiceMock().provider],
    inputs,
  });
};

describe('BottomPanelComponent', () => {

  test('should render nothing if not visible', async () => {
    await setup({
      isVisible$: of(false),
      title$: of(''),
    });
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  test('should render', async () => {
    await setup({
      isVisible$: of(true),
      title$: of('test panel'),
    });
    expect(screen.queryByRole('tabpanel')).toBeInTheDocument();
    expect(screen.queryByText('test panel')).toBeInTheDocument();
  });

  test('starts with initial height', async () => {
    await setup({
      isVisible$: of(true),
      title$: of('test panel'),
      initialHeight: 500,
    });
    expect(screen.queryByRole('tabpanel')).toBeInTheDocument();
    const panel = screen.queryByRole('tabpanel')?.querySelector<HTMLDivElement>('.panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveStyle('height: 500px');
  });

  test('starts maximized', async () => {
    await setup({
      isVisible$: of(true),
      title$: of('test panel'),
      maximized: true,
    });
    expect(screen.queryByRole('tabpanel')).toBeInTheDocument();
    const panel = screen.queryByRole('tabpanel')?.querySelector<HTMLDivElement>('.panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('panel--maximized');
  });

  test('starts maximized', async () => {
    await setup({
      isVisible$: of(true),
      title$: of('test panel'),
      minimized: true,
    });
    expect(screen.queryByRole('tabpanel')).toBeInTheDocument();
    const panel = screen.queryByRole('tabpanel')?.querySelector<HTMLDivElement>('.panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('panel--minimized');
  });

});
