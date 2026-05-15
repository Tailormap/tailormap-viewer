import { render, screen } from '@testing-library/angular';
import { Switch3dComponent } from './switch3d.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { createMockStore } from '@ngrx/store/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectEnable3d } from '../../../state/core.selectors';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { selectIn3dView } from '../../../map/state/map.selectors';
import userEvent from '@testing-library/user-event';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';

const setup = async (enable3d: boolean, toolsEnabled = false) => {
  const mapServiceMock = getMapServiceMock(undefined, undefined, {
    someToolsEnabled$: jest.fn(() => of(toolsEnabled)),
  });
  const mockStore = createMockStore({
    selectors: [
      { selector: selectEnable3d, value: enable3d },
      { selector: selectIn3dView, value: false },
    ],
  });
  const mockDispatch = jest.fn();
  mockStore.dispatch = mockDispatch;
  const mockMobileLayoutService = { isMobileLayoutEnabled$: of(false) };
  await render(Switch3dComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: MatSnackBar, useValue: { dismiss: jest.fn() } },
      mapServiceMock.provider,
      { provide: Store, useValue: mockStore },
      { provide: MobileLayoutService, useValue: mockMobileLayoutService },
    ],
  });
  return { mapServiceMock, mockDispatch };
};

describe('Switch3dComponent', () => {

  test('should render', async () => {
    await setup(true);
    expect(screen.getByLabelText('Switch to 3D')).toBeInTheDocument();
  });

  test('should not render', async () => {
    await setup(false);
    expect(screen.queryByLabelText('Switch to 3D')).not.toBeInTheDocument();
  });

  test('should render when (measure) tool is enabled', async () => {
    await setup(true, true);
    expect(screen.queryByLabelText('Switch to 3D')).not.toBeInTheDocument();
  });

  test('toggle between 2D and 3D', async () => {
    const { mapServiceMock, mockDispatch } = await setup(true);
    await userEvent.click(await screen.findByRole('button'));
    expect(mapServiceMock.mapService.switch3D).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });

});
