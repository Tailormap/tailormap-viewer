import { render, screen } from '@testing-library/angular';
import { Component } from '@angular/core';
import { ViewerAppComponent } from './viewer-app.component';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { of } from 'rxjs';
import { ICON_SERVICE_ICON_LOCATION, LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectViewerErrorMessage, selectViewerLoadingState, selectViewerTitle } from '../../state/core.selectors';
import { getMapServiceMock } from '../../test-helpers/map-service.mock';
import {
  TAILORMAP_API_V1_SERVICE, TAILORMAP_SECURITY_API_V1_SERVICE, TailormapApiV1MockService, TailormapSecurityApiV1MockService,
} from '@tailormap-viewer/api';
import { CrossOriginPostMessageApiService } from '@tailormap-viewer/api';
import { TAILORMAP_CROSS_ORIGIN_API_SERVICE } from '@tailormap-viewer/api';
import { LoadViewerService } from '../../services/load-viewer.service';
import { getFullInitialAppState } from '../../test-helpers/full-app-state.mock';
import { APP_BASE_HREF } from '@angular/common';
import { MobileLayoutService } from '../../services/viewer-layout/mobile-layout.service';
import { BaseLayoutComponent } from '../../layout/base-layout/base-layout.component';

export const getActivatedRouteProvider = (segments: string[], fragment = '') => {
  return { provide: ActivatedRoute, useValue: {
      url: of(segments.map(s => new UrlSegment(s, {}))),
      fragment: of(fragment),
    } };
};

export const getMockedRouterProvider = () => {
  return { provide: Router, useValue: { navigate: vi.fn() } };
};

@Component({
  selector: 'tm-base-layout',
  template: '<div>Base Layout</div>',
})
class MockBaseLayoutComponent {}

const setup = async (loadingState?: LoadingStateEnum, errorMessage?: string) => {
  const loadViewer = vi.fn();
  const { container } = await render(ViewerAppComponent, {
    importOverrides: [
      { replace: BaseLayoutComponent, with: MockBaseLayoutComponent },
    ],
    providers: [
      getActivatedRouteProvider([ 'app', 'default' ]),
      getMockedRouterProvider(),
      getMapServiceMock().provider,
      { provide: MobileLayoutService, useValue: { isMobileLayoutEnabled$: of(false), setMobileLayoutBookmark: vi.fn() } },
      provideMockStore({
        initialState: getFullInitialAppState(),
        selectors: [
          { selector: selectViewerErrorMessage, value: errorMessage || undefined },
          { selector: selectViewerLoadingState, value: loadingState || LoadingStateEnum.LOADED },
          { selector: selectViewerTitle, value: 'my fancy title' },
        ],
      }),
      { provide: TAILORMAP_CROSS_ORIGIN_API_SERVICE, useClass: CrossOriginPostMessageApiService },
      { provide: TAILORMAP_SECURITY_API_V1_SERVICE, useClass: TailormapSecurityApiV1MockService },
      { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
      { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
      { provide: APP_BASE_HREF, useValue: '/' },
      { provide: LoadViewerService, useValue: { loadViewer } },
    ],
  });
  return { container, loadViewer };
};

describe('ViewerAppComponent', () => {

  test('should render', async () => {
    const { container, loadViewer } = await setup();
    expect(container.querySelector('tm-base-layout')).toBeInTheDocument();
    expect(loadViewer).toHaveBeenCalledWith('app/default');
    expect(document.title).toEqual('my fancy title');
  });

  test('should render an error', async () => {
    const { container } = await setup(LoadingStateEnum.FAILED, 'Some error occurred');
    expect(container.querySelector('tm-map')).not.toBeInTheDocument();
    expect(await screen.findByText('Some error occurred')).toBeInTheDocument();
  });

  test('should render a loading screen', async () => {
    const { container } = await setup(LoadingStateEnum.LOADING);
    expect(container.querySelector('tm-map')).not.toBeInTheDocument();
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

});
