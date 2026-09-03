import { EditMobilePanelComponent } from './edit-mobile-panel.component';
import { render } from '@testing-library/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { AuthenticatedUserService, TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { ComponentRegistrationService } from '../../../services';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';
import { selectEditOpenedFromFeatureInfo } from '../state/edit.selectors';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { getFullInitialAppState } from '../../../test-helpers/full-app-state.mock';

const setup = async (visible: boolean) => {
  const menubarServiceMock = {
    isComponentVisible$: vi.fn(() => of(visible)),
    setMobilePanelHeight: vi.fn(),
    toggleActiveComponent: vi.fn(),
    setDialogTitle: vi.fn(),
  };

  const authenticatedUserServiceMock = {
    getUserDetails$: vi.fn(() => of({ isAuthenticated: true })),
  };

  const componentRegistrationServiceMock = {
    registerComponent: vi.fn(),
    deregisterComponent: vi.fn(),
  };

  const mobileLayoutServiceMock = {
    isMobileLayoutEnabled$: of(true),
  };

  // EditComponent's constructor does `someToolsEnabled$(...).pipe(first(enabled => enabled))` when opened
  // from the mobile panel, so this must not complete without ever emitting `true` (of(false) would throw EmptyError).
  const someToolsEnabled$ = new BehaviorSubject(false);
  const mapServiceMock = getMapServiceMock(null, null, { someToolsEnabled$: vi.fn(() => someToolsEnabled$.asObservable()) });

  const { container } = await render(EditMobilePanelComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      provideMockStore({
        initialState: getFullInitialAppState(),
        selectors: [{ selector: selectEditOpenedFromFeatureInfo, value: false }],
      }),
      { provide: MenubarService, useValue: menubarServiceMock },
      { provide: AuthenticatedUserService, useValue: authenticatedUserServiceMock },
      { provide: ComponentRegistrationService, useValue: componentRegistrationServiceMock },
      { provide: MobileLayoutService, useValue: mobileLayoutServiceMock },
      mapServiceMock.provider,
      { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
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
