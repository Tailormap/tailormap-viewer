import { describe, test, expect } from 'vitest';
import { render, waitFor } from '@testing-library/angular';
import { BaseLayoutComponent } from './base-layout.component';
import { provideMockStore } from '@ngrx/store/testing';
import { selectComponentsConfig } from '../../state/core.selectors';
import { BaseComponentTypeEnum, TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { selectIn3dView } from '../../map/state/map.selectors';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper';
import { ICON_SERVICE_ICON_LOCATION } from '@tailormap-viewer/shared';
import { APP_BASE_HREF, AsyncPipe } from '@angular/common';
import { getMapServiceMock } from '../../test-helpers/map-service.mock';
import { MenubarService } from '../../components/menubar/menubar.service';
import { TestBed } from '@angular/core/testing';

describe('BaseLayoutComponent', () => {

  const setup = async (disabledComponents?: BaseComponentTypeEnum[]) => {
    const store = provideMockStore({
      selectors: [
        {
          selector: selectComponentsConfig,
          value: (disabledComponents || []).map(type => ({ type, config: { enabled: false } } )),
        },
        { selector: selectIn3dView, value: false },
      ],
    });
    const { container, detectChanges } = await render(BaseLayoutComponent, {
      providers: [
        store,
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(false, []),
        { provide: ICON_SERVICE_ICON_LOCATION, useValue: 'icons/' },
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
        getMapServiceMock().provider,
      ],
      configureTestBed: testBed => {
        testBed.overrideComponent(BaseLayoutComponent, {
          set: {
            imports: [AsyncPipe],
            schemas: [NO_ERRORS_SCHEMA],
          },
        });
      },
    });
    return { container, detectChanges };
  };

  test('should render', async () => {
    const { container, detectChanges } = await setup();
    expect(container.querySelector('tm-map')).toBeInTheDocument();
    // The menubar panel only projects its content (info/toc/legend/drawing/print/filter) once a
    // menu item is "active" - open it via the real MenubarService so those children actually mount.
    // Its `activeComponent$` is debounced (debounceTime(0)), so wait for the resulting macrotask.
    TestBed.inject(MenubarService).toggleActiveComponent(BaseComponentTypeEnum.DRAWING, 'Drawing');
    detectChanges();
    await waitFor(() => expect(container.querySelector('tm-drawing')).toBeInTheDocument());
  });

  test('does not render disabled components', async () => {
    const { container } = await setup([BaseComponentTypeEnum.DRAWING]);
    expect(container.querySelector('tm-map')).toBeInTheDocument();
    expect(container.querySelector('tm-drawing')).not.toBeInTheDocument();
  });

});
