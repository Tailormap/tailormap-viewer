import { render, screen } from '@testing-library/angular';
import { ApplicationListComponent } from './application-list.component';
import { getApplication } from '@tailormap-admin/admin-api';
import { LoadingStateEnum, SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';
import { createMockStore } from '@ngrx/store/testing';
import { ApplicationState, applicationStateKey, initialApplicationState } from '../state/application.state';
import { Store } from '@ngrx/store';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { ConfigService } from '../../config/services/config.service';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { ENVIRONMENT_CONFIG } from '@tailormap-viewer/api';
import { APP_BASE_HREF } from '@angular/common';
import { SharedAdminComponentsModule } from '../../shared/components/shared-admin-components.module';
import { ApplicationService } from '../services/application.service';

const setup = async (
  loadStatus: LoadingStateEnum = LoadingStateEnum.INITIAL,
  listFilter = '',
  errorMessage?: string,
  viewerUrl?: string,
  baseHref?: string,
) => {
  const appModels = [
    getApplication({ title: 'Amazing application' }),
    getApplication({ id: '2', name: 'app2', title: 'Something different' }),
  ];
  const applicationState: ApplicationState = {
    ...initialApplicationState,
    applicationsLoadStatus: loadStatus,
    applications: loadStatus === LoadingStateEnum.LOADED ? appModels : [],
    applicationListFilter: listFilter,
    applicationsLoadError: errorMessage,
  };
  const mockStore = createMockStore({
    initialState: { [applicationStateKey]: applicationState },
  });
  mockStore.dispatch = jest.fn();
  const configService = { getConfigValue$: jest.fn(() => of('app2')) };
  const loadApplications = jest.fn();
  await render(ApplicationListComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule, SharedAdminComponentsModule ],
    providers: [
      { provide: Store, useValue: mockStore },
      { provide: ConfigService, useValue: configService },
      { provide: ENVIRONMENT_CONFIG, useValue: { viewerBaseUrl: viewerUrl || '' } },
      { provide: APP_BASE_HREF, useValue: baseHref || '' },
      { provide: ApplicationService, useValue: { loadApplications } },
    ],
  });
  return { mockStore, appModels, loadApplications };
};

describe('ApplicationListComponent', () => {

  test('should render', async () => {
    const { loadApplications } = await setup();
    expect(await screen.findByText('Applications')).toBeInTheDocument();
    expect(loadApplications).toHaveBeenCalledTimes(1);
  });

  test('should render spinner', async () => {
    const { loadApplications } = await setup(LoadingStateEnum.LOADING);
    expect(await screen.findByText('Applications')).toBeInTheDocument();
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(loadApplications).not.toHaveBeenCalled();
  });

  test('should render list of applications', async () => {
    await setup(LoadingStateEnum.LOADED);
    expect(await screen.findByText('Something different')).toBeInTheDocument();
    expect(await screen.findByLabelText('Default application')).toBeInTheDocument();
    expect(await screen.findByText('Amazing application')).toBeInTheDocument();
  });

  test('should render filtered list of applications', async () => {
    await setup(LoadingStateEnum.LOADED, 'something');
    expect(await screen.queryByText('Amazing application')).not.toBeInTheDocument();
    expect(await screen.findByText('Something different')).toBeInTheDocument();
  });

  test('should render error message & retry loading', async () => {
    const { loadApplications } = await setup(LoadingStateEnum.FAILED, '', 'Something went wrong');
    expect(loadApplications).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(await screen.findByText('Retry')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Retry'));
    expect(loadApplications).toHaveBeenCalledTimes(2);
  });

  test('sets viewer url when on different base href', async () => {
    await setup(LoadingStateEnum.LOADED, '', undefined, '/app/', '/en/some-pr/');
    const openViewerBtns: HTMLAnchorElement[] = await screen.findAllByLabelText('Open application');
    expect(openViewerBtns).toHaveLength(2);
    expect(openViewerBtns.map(b => b.getAttribute('href'))).toEqual([
      '/en/some-pr/app/app2',
      '/en/some-pr/app/app1',
    ]);
  });

});
