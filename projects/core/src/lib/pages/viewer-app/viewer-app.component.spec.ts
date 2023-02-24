import { render, screen } from '@testing-library/angular';
import { ViewerAppComponent } from './viewer-app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ErrorMessageComponent, LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectViewerErrorMessage, selectViewerLoadingState } from '../../state/core.selectors';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export const getActivatedRouteProvider = (segments: string[], fragment: string = '') => {
  return { provide: ActivatedRoute, useValue: {
      // eslint-disable-next-line rxjs/finnish
      url: of(segments.map(s => new UrlSegment(s, {}))),
      // eslint-disable-next-line rxjs/finnish
      fragment: of(fragment),
    } };
};

export const getMockedRouterProvider = () => {
  return { provide: Router, useValue: { navigate: jest.fn() } };
};

const setup = async (loadingState?: LoadingStateEnum, errorMessage?: string) => {
  const { container } = await render(ViewerAppComponent, {
    declarations: [ ViewerAppComponent, ErrorMessageComponent ],
    imports: [MatProgressSpinnerModule],
    providers: [
      getActivatedRouteProvider([ 'app', 'default' ]),
      getMockedRouterProvider(),
      provideMockStore({
        initialState: {},
        selectors: [
          { selector: selectViewerErrorMessage, value: errorMessage || undefined },
          { selector: selectViewerLoadingState, value: loadingState || LoadingStateEnum.LOADED },
        ],
      }),
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  });
  const store = TestBed.inject(MockStore);
  return { container, store };
};

describe('ViewerAppComponent', () => {

  test('should render', async () => {
    const { container, store } = await setup();
    expect(container.querySelector('tm-base-layout')).toBeInTheDocument();
    expect(await firstValueFrom(store.scannedActions$)).toEqual({ type: '[Core] Load Viewer', id: 'app/default' });
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
