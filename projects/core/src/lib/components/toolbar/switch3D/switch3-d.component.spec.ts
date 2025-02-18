import { render, screen } from '@testing-library/angular';
import { Switch3DComponent } from './switch3-d.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { createMockStore } from '@ngrx/store/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectEnable3D } from '../../../state/core.selectors';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { selectActiveTool } from '../state/toolbar.selectors';
import { selectIn3DView } from '../../../map/state/map.selectors';
import userEvent from '@testing-library/user-event';
import { Store } from '@ngrx/store';

const setup = async (enable3D: boolean) => {
  const mapServiceMock = getMapServiceMock();
  const mockStore = createMockStore({
    selectors: [
      { selector: selectEnable3D, value: enable3D },
      { selector: selectActiveTool, value: null },
      { selector: selectIn3DView, value: false },
    ],
  });
  const mockDispatch = jest.fn();
  mockStore.dispatch = mockDispatch;
  await render(Switch3DComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: MatSnackBar, useValue: { dismiss: jest.fn() } },
      mapServiceMock.provider,
      { provide: Store, useValue: mockStore },
    ],
  });
  return { mapServiceMock, mockDispatch };
};

describe('Switch3DComponent', () => {

  test('should render', async () => {
    await setup(true);
    expect(screen.getByLabelText('Switch to 3D')).toBeInTheDocument();
  });

  test('should not render', async () => {
    await setup(false);
    expect(screen.queryByLabelText('Switch to 3D')).not.toBeInTheDocument();
  });

  test('toggle between 2D and 3D', async () => {
    const { mapServiceMock, mockDispatch } = await setup(true);
    await userEvent.click(await screen.findByRole('button'));
    expect(mapServiceMock.mapService.switch3D).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });

});
