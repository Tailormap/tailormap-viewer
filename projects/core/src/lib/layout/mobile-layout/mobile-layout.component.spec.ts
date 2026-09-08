import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/angular';
import { BaseComponentTypeEnum, TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { provideMockStore } from '@ngrx/store/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { selectComponentsConfig } from '../../state/core.selectors';
import { selectIn3dView } from '../../map/state/map.selectors';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper';
import { getFullInitialAppState } from '../../test-helpers/full-app-state.mock';
import { ICON_SERVICE_ICON_LOCATION } from '@tailormap-viewer/shared';
import { APP_BASE_HREF, AsyncPipe } from '@angular/common';
import { getMapServiceMock } from '../../test-helpers/map-service.mock';
import { MobileLayoutComponent } from './mobile-layout.component';

describe('MobileLayoutComponent', () => {

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
    const { container } = await render(MobileLayoutComponent, {
      providers: [
        store,
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(false, []),
        { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
        getMapServiceMock().provider,
      ],
      configureTestBed: testBed => {
        testBed.overrideComponent(MobileLayoutComponent, {
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
  });

});
