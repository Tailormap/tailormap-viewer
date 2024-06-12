import { render, screen, waitFor } from '@testing-library/angular';
import { FeatureSourceDetailsComponent } from './feature-source-details.component';
import { of } from 'rxjs';
import { FeatureSourceProtocolEnum, getFeatureSource, JdbcDatabaseType } from '@tailormap-admin/admin-api';
import { createMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { FeatureSourceService } from '../services/feature-source.service';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper.spec';
import { FeatureSourceFormComponent } from '../feature-source-form/feature-source-form.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';

const setup = async (protocol: FeatureSourceProtocolEnum) => {
  const activeRoute = {
    paramMap: of({ get: () => '1' }),
  };
  const featureSourceModel = getFeatureSource({
    id: '1',
    title: `Some ${protocol} source`,
    protocol,
    jdbcConnection: protocol === FeatureSourceProtocolEnum.JDBC ? {
      dbtype: JdbcDatabaseType.POSTGIS.type,
      host: '',
      port: 0,
      database: '',
      schema: '',
    } : undefined,
  });
  const featureServiceMock = {
    getDraftFeatureSource$: jest.fn(() => of(featureSourceModel)),
    updateFeatureSource$: jest.fn((_id, updatedSource) => of({
      ...featureSourceModel,
      ...updatedSource,
    })),
    refreshFeatureSource$: jest.fn(() => of({
      ...featureSourceModel,
    })),
  };
  const store = createMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState } },
  });
  await render(FeatureSourceDetailsComponent, {
    declarations: [ FeatureSourceFormComponent, PasswordFieldComponent, SaveButtonComponent ],
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: FeatureSourceService, useValue: featureServiceMock },
      { provide: Store, useValue: store },
    ],
  });
  return { featureSourceModel, featureServiceMock };
};

describe('FeatureSourceDetailsComponent', () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should render and handle editing JDBC source', async () => {
    const ue = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
    const { featureSourceModel, featureServiceMock } = await setup(FeatureSourceProtocolEnum.JDBC);
    expect(await screen.findByText('Edit Some JDBC source')).toBeInTheDocument();
    expect(await screen.findByLabelText('Save')).toBeDisabled();
    expect(await screen.queryByText('URL')).not.toBeInTheDocument();
    await ue.type(await screen.findByPlaceholderText('Title'), '___');
    await ue.type(await screen.findByPlaceholderText('Database'), 'geo_db');
    await ue.type(await screen.findByPlaceholderText('Host'), 'localhost');
    await ue.type(await screen.findByPlaceholderText('Port'), '[Backspace]5432');
    await ue.type(await screen.findByPlaceholderText('Schema'), 'roads');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', undefined, ue);
    await waitFor(() => {
      expect(featureServiceMock.updateFeatureSource$).toHaveBeenCalledWith('1', {
        title: featureSourceModel.title + '___',
        protocol: featureSourceModel.protocol,
        url: featureSourceModel.url,
        jdbcConnection: {
          additionalProperties: {
            connectionOptions: "",
          },
          dbtype: featureSourceModel.jdbcConnection?.dbtype,
          database: 'geo_db',
          port: 5432,
          host: 'localhost',
          schema: 'roads',
        },
        authentication: undefined,
      });
    });
    expect(await screen.findByText('Refresh feature source?')).toBeInTheDocument();
    await ue.click(await screen.findByText('Yes'));
    expect(featureServiceMock.refreshFeatureSource$).toHaveBeenCalled();
  });

  test('should not ask to refresh when just updating title', async () => {
    const ue = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
    const { featureSourceModel, featureServiceMock } = await setup(FeatureSourceProtocolEnum.WFS);
    await ue.type(await screen.findByPlaceholderText('Title'), '___');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', undefined, ue);
    await waitFor(() => {
      expect(featureServiceMock.updateFeatureSource$).toHaveBeenCalledWith('1', {
        title: featureSourceModel.title + '___',
        protocol: featureSourceModel.protocol,
        url: featureSourceModel.url,
        jdbcConnection: undefined,
        authentication: undefined,
      });
    });
    expect(await screen.queryByText('Refresh feature source?')).not.toBeInTheDocument();
  });

  test('should render and handle editing WFS source', async () => {
    const ue = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
    const { featureSourceModel, featureServiceMock } = await setup(FeatureSourceProtocolEnum.WFS);
    expect(await screen.findByText('Edit Some WFS source')).toBeInTheDocument();
    expect(await screen.findByLabelText('Save')).toBeDisabled();
    expect(await screen.queryByText('Database')).not.toBeInTheDocument();
    await ue.type(await screen.findByPlaceholderText('URL'), '/path');
    await ue.type(await screen.findByPlaceholderText('Username'), 'some_user');
    const passwordField = await screen.findByLabelText('Password');
    expect(passwordField).toBeInTheDocument();
    await ue.type(passwordField, 'secret');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', undefined, ue);
    await waitFor(() => {
      expect(featureServiceMock.updateFeatureSource$).toHaveBeenCalledWith('1', {
        title: featureSourceModel.title,
        protocol: featureSourceModel.protocol,
        url: featureSourceModel.url + '/path',
        jdbcConnection: undefined,
        authentication: {
          method: 'password',
          username: 'some_user',
          password: 'secret',
        },
      });
    });
    expect(await screen.findByText('Refresh feature source?')).toBeInTheDocument();
    await ue.click(await screen.findByText('No'));
    expect(featureServiceMock.refreshFeatureSource$).not.toHaveBeenCalled();
  });

  test('should refresh', async () => {
    const ue = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
    const { featureServiceMock } = await setup(FeatureSourceProtocolEnum.JDBC);
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Refresh feature source', undefined, ue);
    expect(featureServiceMock.refreshFeatureSource$).toHaveBeenCalled();
  });

});
