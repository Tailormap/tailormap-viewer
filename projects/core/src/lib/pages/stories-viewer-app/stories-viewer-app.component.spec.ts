import { render, screen } from '@testing-library/angular';
import { StoriesViewerAppComponent } from './stories-viewer-app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { provideMockStore } from '@ngrx/store/testing';
import { LoadingStateEnum, SharedModule } from '@tailormap-viewer/shared';
import { selectViewerErrorMessage, selectViewerLoadingState } from '../../state/core.selectors';
import { getMapServiceMock } from '../../test-helpers/map-service.mock.spec';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { LayoutModule } from '../../layout/layout.module';
import { LoadViewerService } from '../../services/load-viewer.service';

const setup = async (viewerId?: string, loadingState?: LoadingStateEnum, errorMessage?: string) => {
  const loadViewer = jest.fn();
  const { container } = await render(StoriesViewerAppComponent, {
    inputs: {
      viewerId,
    },
    providers: [
      getMapServiceMock().provider,
      provideMockStore({
        initialState: {},
        selectors: [
          { selector: selectViewerErrorMessage, value: errorMessage || undefined },
          { selector: selectViewerLoadingState, value: loadingState || LoadingStateEnum.LOADED },
        ],
      }),
      { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
      { provide: LoadViewerService, useValue: { loadViewer } },
    ],
    // StoriesViewerAppComponent is standalone, so CUSTOM_ELEMENTS_SCHEMA must be set on the component
    // itself (not via the render `schemas` option). Drop the heavy layout/shared imports so the
    // layout components, mat-icon and tm-error-message render as custom elements instead.
    configureTestBed: testBed => {
      testBed.overrideComponent(StoriesViewerAppComponent, {
        add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
        remove: { imports: [ SharedModule, LayoutModule, MatIconModule ] },
      });
    },
  });
  return { container, loadViewer };
};

describe('StoriesViewerAppComponent', () => {

  test('should render and load the given viewer', async () => {
    const { container, loadViewer } = await setup('app/default');
    expect(container.querySelector('tm-base-layout')).toBeInTheDocument();
    expect(loadViewer).toHaveBeenCalledWith('app/default');
  });

  test('should load the default viewer when no id is given', async () => {
    const { loadViewer } = await setup();
    expect(loadViewer).toHaveBeenCalledWith(undefined);
  });

  test('should render an error', async () => {
    const { container } = await setup('app/default', LoadingStateEnum.FAILED, 'Some error occurred');
    expect(container.querySelector('tm-base-layout')).not.toBeInTheDocument();
    expect(container.querySelector('tm-error-message')).toBeInTheDocument();
  });

  test('should render a loading screen', async () => {
    const { container } = await setup('app/default', LoadingStateEnum.LOADING);
    expect(container.querySelector('tm-base-layout')).not.toBeInTheDocument();
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

});
