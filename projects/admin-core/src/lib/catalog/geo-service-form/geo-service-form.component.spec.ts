import { afterEach, beforeEach, describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { GeoServiceFormComponent } from './geo-service-form.component';
import { of, Subject } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { AdminServerType, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { AdminSseService, EventType, SSECapabilitiesLoadingProgressEvent } from '../../shared/services/admin-sse.service';

const createAdminSseServiceMock = () => ({
  listenForCapabilitiesLoadingProgressEventsById$: vi.fn(() => of()),
  listenForCapabilitiesLoadingProgressEventsByTitle$: vi.fn(() => of()),
});

describe('GeoServiceFormComponent', () => {

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('should render', async () => {
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    const changedFn = vi.fn();
    await render(GeoServiceFormComponent, {
      imports: [],
      on: { changed: changedFn },
      providers: [
        { provide: TailormapAdminApiV1Service, useValue: { getGroups$: vi.fn(() => of([])) } },
        provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
        AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
        { provide: AdminSseService, useValue: createAdminSseServiceMock() },
      ],
    });
    await ue.type(await screen.findByPlaceholderText('URL'), 'http://localhost.test');
    await vi.waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({
        authorizationRules: [],
        title: '',
        url: 'http://localhost.test',
        protocol: 'wms',
        authentication: null,
        settings: { useProxy: false, xyzCrs: null, serverType: AdminServerType.AUTO },
      });
    });
    await ue.click(await screen.findByText('wms'));
    await ue.click(await screen.findByText('wmts'));
    await vi.waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenNthCalledWith(2, {
        authorizationRules: [],
        title: '',
        url: 'http://localhost.test',
        protocol: 'wmts',
        authentication: null,
        settings: { useProxy: false, xyzCrs: null, serverType: AdminServerType.AUTO },
      });
    });
  });

  test('should subscribe to capabilities loading progress using the url when title is blank', async () => {
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    const capabilitiesLoadingProgress$ = new Subject<SSECapabilitiesLoadingProgressEvent>();
    const adminSseService = {
      listenForCapabilitiesLoadingProgressEventsById$: vi.fn(() => capabilitiesLoadingProgress$.asObservable()),
      listenForCapabilitiesLoadingProgressEventsByTitle$: vi.fn(() => capabilitiesLoadingProgress$.asObservable()),
    };

    await render(GeoServiceFormComponent, {
      providers: [
        { provide: TailormapAdminApiV1Service, useValue: { getGroups$: vi.fn(() => of([])) } },
        provideMockStore({ initialState: { [userStateKey]: initialUserState } }),
        AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
        { provide: AdminSseService, useValue: adminSseService },
      ],
    });

    await ue.type(await screen.findByPlaceholderText('URL'), 'https://example.com/wms');

    await vi.waitFor(() => {
      expect(adminSseService.listenForCapabilitiesLoadingProgressEventsByTitle$).toHaveBeenLastCalledWith('https://example.com/wms');
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    capabilitiesLoadingProgress$.next({
      eventType: EventType.CAPABILITIES_LOADING_PROGRESS,
      details: {
        id: '123',
        title: 'https://example.com/wms',
        progress: 1,
        total: 2,
        startedAt: '2026-09-24T00:00:00.000Z',
      },
    });

    const progressBar = await screen.findByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

});
