import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { FeatureSourceFormComponent } from './feature-source-form.component';
import userEvent from '@testing-library/user-event';
import { FeatureSourceModel, FeatureSourceProtocolEnum } from '@tailormap-admin/admin-api';
import { AdminSseService, EventType, SSECapabilitiesLoadingProgressEvent } from '../../shared/services/admin-sse.service';
import { of, Subject } from 'rxjs';

const createAdminSseServiceMock = () => ({
  listenForCapabilitiesLoadingProgressEventsById$: vi.fn(() => of()),
  listenForCapabilitiesLoadingProgressEventsByTitle$: vi.fn(() => of()),
});

describe('FeatureSourceFormComponent', () => {

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
    await render(FeatureSourceFormComponent, {
      imports: [],
      providers: [{ provide: AdminSseService, useValue: createAdminSseServiceMock() }],
      on: { changed: changedFn },
    });
    expect(await screen.queryByPlaceholderText('URL')).not.toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('Database')).not.toBeInTheDocument();
    await ue.type(await screen.findByPlaceholderText('Title'), 'Some WFS source');
    await ue.click(await screen.findByPlaceholderText('Protocol'));
    await ue.click(await screen.findByText('WFS'));
    expect(await screen.queryByPlaceholderText('URL')).toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('Database')).not.toBeInTheDocument();
    await ue.type(await screen.findByPlaceholderText('URL'), 'http://localhost.test');
    await vi.waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({ title: 'Some WFS source', url: 'http://localhost.test', protocol: 'WFS', authentication: undefined, jdbcConnection: undefined });
    });
  });

  test('should warn for a WFS version other than 2.0.0 in the URL', async () => {
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    await render(FeatureSourceFormComponent, {
      imports: [],
      providers: [{ provide: AdminSseService, useValue: createAdminSseServiceMock() }],
    });
    await ue.click(await screen.findByPlaceholderText('Protocol'));
    await ue.click(await screen.findByText('WFS'));
    const url = await screen.findByPlaceholderText('URL');
    await ue.type(url, 'https://example.com/wfs?VERSION=1.1.0');
    expect(await screen.findByText(/Only WFS version 2\.0\.0 is supported/)).toBeInTheDocument();
    await ue.clear(url);
    await ue.type(url, 'https://example.com/wfs?VERSION=2.0.0');
    expect(screen.queryByText(/Only WFS version 2\.0\.0 is supported/)).not.toBeInTheDocument();
  });

  test('should warn for an existing WFS feature source with version 1.1.0', async () => {
    const featureSource: FeatureSourceModel = {
      id: '123',
      type: 'feature-source',
      title: 'Some WFS source',
      protocol: FeatureSourceProtocolEnum.WFS,
      url: 'https://example.com/wfs?service=WFS&VERSION=1.1.0',
      featureTypes: [],
    };
    await render(FeatureSourceFormComponent, {
      imports: [],
      providers: [{ provide: AdminSseService, useValue: createAdminSseServiceMock() }],
      inputs: { featureSource },
    });
    expect(await screen.findByText(/Only WFS version 2\.0\.0 is supported/)).toBeInTheDocument();
  });

  test('should show JDBC fields in case of JDBC protocol', async () => {
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    await render(FeatureSourceFormComponent, {
      imports: [],
      providers: [{ provide: AdminSseService, useValue: createAdminSseServiceMock() }],
    });
    expect(await screen.queryByPlaceholderText('URL')).not.toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('Database')).not.toBeInTheDocument();
    await ue.click(await screen.findByPlaceholderText('Protocol'));
    await ue.click(await screen.findByText('JDBC'));
    expect(await screen.queryByPlaceholderText('URL')).not.toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('Database')).toBeInTheDocument();
  });

  test('should show capabilities loading progress from sse events', async () => {
    const capabilitiesLoadingProgress$ = new Subject<SSECapabilitiesLoadingProgressEvent>();
    const adminSseService = {
      listenForCapabilitiesLoadingProgressEventsById$: vi.fn(() => capabilitiesLoadingProgress$.asObservable()),
      listenForCapabilitiesLoadingProgressEventsByTitle$: vi.fn(() => capabilitiesLoadingProgress$.asObservable()),
    };
    const featureSource: FeatureSourceModel = {
      id: '123',
      type: 'feature-source',
      title: 'Some WFS source',
      protocol: FeatureSourceProtocolEnum.WFS,
      url: 'https://example.com/wfs',
      featureTypes: [],
    };

    await render(FeatureSourceFormComponent, {
      imports: [],
      providers: [
        {
          provide: AdminSseService,
          useValue: adminSseService,
        },
      ],
      inputs: { featureSource },
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    capabilitiesLoadingProgress$.next({
      eventType: EventType.CAPABILITIES_LOADING_PROGRESS,
      details: {
        id: '123',
        title: 'Some WFS source',
        progress: 2,
        total: 4,
        startedAt: '2026-09-23T00:00:00.000Z',
      },
    });

    const progressBar = await screen.findByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(adminSseService.listenForCapabilitiesLoadingProgressEventsById$).toHaveBeenCalledWith('123');
  });

  test('should listen for JDBC capabilities loading progress using database when title is empty', async () => {
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    const capabilitiesLoadingProgress$ = new Subject<SSECapabilitiesLoadingProgressEvent>();
    const adminSseService = {
      listenForCapabilitiesLoadingProgressEventsById$: vi.fn(() => capabilitiesLoadingProgress$.asObservable()),
      listenForCapabilitiesLoadingProgressEventsByTitle$: vi.fn(() => capabilitiesLoadingProgress$.asObservable()),
    };

    await render(FeatureSourceFormComponent, {
      imports: [],
      providers: [
        {
          provide: AdminSseService,
          useValue: adminSseService,
        },
      ],
    });

    await ue.click(await screen.findByPlaceholderText('Protocol'));
    await ue.click(await screen.findByText('JDBC'));
    await ue.type(await screen.findByPlaceholderText('Database'), 'tailormap');

    await vi.waitFor(() => {
      expect(adminSseService.listenForCapabilitiesLoadingProgressEventsByTitle$).toHaveBeenLastCalledWith('tailormap');
    });

    capabilitiesLoadingProgress$.next({
      eventType: EventType.CAPABILITIES_LOADING_PROGRESS,
      details: {
        title: 'tailormap',
        progress: 1,
        total: null,
        startedAt: '2026-09-23T00:00:00.000Z',
      },
    });

    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

});
