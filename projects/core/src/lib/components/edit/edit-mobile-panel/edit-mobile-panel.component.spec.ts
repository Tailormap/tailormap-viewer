import { EditMobilePanelComponent } from './edit-mobile-panel.component';
import { render } from '@testing-library/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { ComponentRegistrationService } from '../../../services';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';
import { MapService } from '@tailormap-viewer/map';
import { selectEditOpenedFromFeatureInfo } from '../state/edit.selectors';

const setup = async (visible: boolean) => {
  const menubarServiceMock = {
    isComponentVisible$: jest.fn(() => of(visible)),
    setMobilePanelHeight: jest.fn(),
    toggleActiveComponent: jest.fn(),
  };

  const authenticatedUserServiceMock = {
    getUserDetails$: jest.fn(() => of({ isAuthenticated: true })),
  };

  const componentRegistrationServiceMock = {
    registerComponent: jest.fn(),
    deregisterComponent: jest.fn(),
  };

  const mobileLayoutServiceMock = {
    isMobileLayoutEnabled$: of(true),
  };

  const mapServiceMock = {
    someToolsEnabled$: jest.fn(() => of(false)),
  };

  const { container } = await render(EditMobilePanelComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      provideMockStore({
        initialState: {},
        selectors: [{ selector: selectEditOpenedFromFeatureInfo, value: false }],
      }),
      { provide: MenubarService, useValue: menubarServiceMock },
      { provide: AuthenticatedUserService, useValue: authenticatedUserServiceMock },
      { provide: ComponentRegistrationService, useValue: componentRegistrationServiceMock },
      { provide: MobileLayoutService, useValue: mobileLayoutServiceMock },
      { provide: MapService, useValue: mapServiceMock },
    ],
  });

  return { container };
};

describe('EditMobilePanelComponent', () => {

  test('should render edit panel contents when visible', async () => {
    const { container } = await setup(true);
    expect(container.querySelector('tm-edit')).toBeInTheDocument();
    expect(container.querySelector('tm-edit-dialog')).toBeInTheDocument();
  });

  test('should not render edit panel contents when not visible', async () => {
    const { container } = await setup(false);
    expect(container.querySelector('tm-edit')).not.toBeInTheDocument();
    expect(container.querySelector('tm-edit-dialog')).not.toBeInTheDocument();
  });

});
