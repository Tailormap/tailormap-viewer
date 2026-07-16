import { render, screen } from '@testing-library/angular';
import { ViewerAppComponent } from './viewer-app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { of } from 'rxjs';
import { ErrorMessageComponent, LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectViewerErrorMessage, selectViewerLoadingState, selectViewerTitle } from '../../state/core.selectors';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getMapServiceMock } from '../../test-helpers/map-service.mock.spec';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { LoadViewerService } from '../../services/load-viewer.service';

export const getActivatedRouteProvider = (segments: string[], fragment = '') => {
  return { provide: ActivatedRoute, useValue: {
      url: of(segments.map(s => new UrlSegment(s, {}))),
      fragment: of(fragment),
    } };
};

export const getMockedRouterProvider = () => {
  return { provide: Router, useValue: { navigate: jest.fn() } };
};

const setup = async (loadingState?: LoadingStateEnum, errorMessage?: string) => {
  const loadViewer = jest.fn();
  const { container } = await render(ViewerAppComponent, {
    declarations: [ ViewerAppComponent, ErrorMessageComponent ],
    imports: [MatProgressSpinnerModule],
    providers: [
      getActivatedRouteProvider([ 'app', 'default' ]),
      getMockedRouterProvider(),
      getMapServiceMock().provider,
      provideMockStore({
        initialState: {},
        selectors: [
          { selector: selectViewerErrorMessage, value: errorMessage || undefined },
          { selector: selectViewerLoadingState, value: loadingState || LoadingStateEnum.LOADED },
          { selector: selectViewerTitle, value: 'my fancy title' },
        ],
      }),
      { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
      { provide: LoadViewerService, useValue: { loadViewer } },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
