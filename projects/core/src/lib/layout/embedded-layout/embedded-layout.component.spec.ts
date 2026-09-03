import { render } from '@testing-library/angular';
import { EmbeddedLayoutComponent } from './embedded-layout.component';
import { provideMockStore } from '@ngrx/store/testing';
import { selectComponentsConfig } from '../../state/core.selectors';
import { BaseComponentTypeEnum, TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { selectIn3dView } from '../../map/state/map.selectors';
import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper';
import { getFullInitialAppState } from '../../test-helpers/full-app-state.mock';
import { ICON_SERVICE_ICON_LOCATION } from '@tailormap-viewer/shared';
import { APP_BASE_HREF, AsyncPipe } from '@angular/common';
import { getMapServiceMock } from '../../test-helpers/map-service.mock';

describe('EmbeddedLayoutComponent', () => {

  const setup = async (disabledComponents?: BaseComponentTypeEnum[]) => {
    const store = provideMockStore({
      initialState: getFullInitialAppState(),
      selectors: [
        {
          selector: selectComponentsConfig,
          value: (disabledComponents || []).map(type => ({ type, config: { enabled: false } } )),
        },
        { selector: selectIn3dView, value: false },
      ],
    });
    const { container } = await render(EmbeddedLayoutComponent, {
      providers: [
        store,
        { provide: HttpXsrfTokenExtractor, useValue: {} as HttpXsrfTokenExtractor },
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(false, []),
        { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
        getMapServiceMock().provider,
      ],
      configureTestBed: testBed => {
        testBed.overrideComponent(EmbeddedLayoutComponent, {
          set: {
            imports: [AsyncPipe],
            schemas: [NO_ERRORS_SCHEMA],
          },
        });
      },
    });
    return container;
  };

  test('should render', async () => {
    const container = await setup();
    expect(container.querySelector('tm-map')).toBeInTheDocument();
    expect(container.querySelector('tm-simple-search')).toBeInTheDocument();
  });

  test('does not render disabled components', async () => {
    const container = await setup([BaseComponentTypeEnum.SIMPLE_SEARCH]);
    expect(container.querySelector('tm-map')).toBeInTheDocument();
    expect(container.querySelector('tm-simple-search')).not.toBeInTheDocument();
  });

});
