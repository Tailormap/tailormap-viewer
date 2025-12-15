import { render, screen } from '@testing-library/angular';
import { MobileMenubarPanelComponent } from './mobile-menubar-panel.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { of } from 'rxjs';
import { MenubarService } from '../../menubar';

const setup = async (ac: { componentId: string; dialogTitle: string } | null) => {
  const mockMenubarService = {
    getActiveComponent$: () => of(ac),
    closePanel: () => {},
    getMobilePanelHeight$: () => of(null),
  };

  await render(MobileMenubarPanelComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      getMapServiceMock().provider,
      { provide: MenubarService, useValue: mockMenubarService },
    ],
  });
};

describe('MobileMenubarPanelComponent', () => {

  test('should render', async () => {
    await setup({ componentId: 'testpanel', dialogTitle: 'test panel' });
    expect(screen.queryByText('test panel')).toBeInTheDocument();
  });

  test('should not render', async () => {
    await setup(null);
    expect(screen.queryByText('test panel')).not.toBeInTheDocument();
  });

});
