import { render, screen } from '@testing-library/angular';
import { FeatureSourceDetailsComponent } from './feature-source-details.component';
import { of } from 'rxjs';
import { FeatureSourceProtocolEnum, getFeatureSource } from '@tailormap-admin/admin-api';
import { getMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { FeatureSourceService } from '../services/feature-source.service';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { FeatureSourceFormComponent } from '../feature-source-form/feature-source-form.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';

const setup = async (protocol: FeatureSourceProtocolEnum) => {
  const activeRoute = {
    paramMap: of({ get: () => '1' }),
  };
  const featureServiceMock = {
    updateFeatureSource$: jest.fn(() => of({})),
    refreshFeatureSource$: jest.fn(() => of({})),
  };
  const featureSourceModel = getFeatureSource({ id: '1', title: `Some ${protocol} source`, protocol });
  const store = getMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, featureSources: [{ ...featureSourceModel, catalogNodeId: 'node-1' }] } },
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

  test('should render and handle editing JDBC source', async () => {
    const { featureSourceModel, featureServiceMock } = await setup(FeatureSourceProtocolEnum.JDBC);
    expect(await screen.findByText('Edit Some JDBC source')).toBeInTheDocument();
    expect(await screen.findByLabelText('Save')).toBeDisabled();
    expect(await screen.queryByText('URL')).not.toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('Title'), '___');
    await userEvent.click(await screen.findByPlaceholderText('Database type'));
    await userEvent.click(await screen.findByText('postgis'));
    await userEvent.type(await screen.findByPlaceholderText('Database'), 'geo_db');
    await userEvent.type(await screen.findByPlaceholderText('Host'), 'localhost');
    await userEvent.type(await screen.findByPlaceholderText('Port'), '5432');
    await userEvent.type(await screen.findByPlaceholderText('Schema'), 'roads');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(featureServiceMock.updateFeatureSource$).toHaveBeenCalledWith('1', {
      title: featureSourceModel.title + '___',
      protocol: featureSourceModel.protocol,
      url: featureSourceModel.url,
      jdbcConnection: {
        dbtype: 'postgis',
        database: 'geo_db',
        port: 5432,
        host: 'localhost',
        schema: 'roads',
      },
      authentication: undefined,
    });
  });

  test('should render and handle editing WFS source', async () => {
    const { featureSourceModel, featureServiceMock } = await setup(FeatureSourceProtocolEnum.WFS);
    expect(await screen.findByText('Edit Some WFS source')).toBeInTheDocument();
    expect(await screen.findByLabelText('Save')).toBeDisabled();
    expect(await screen.queryByText('Database')).not.toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('URL'), '/path');
    await userEvent.type(await screen.findByPlaceholderText('Username'), 'some_user');
    const passwordField = (await screen.findByText('Password'))?.closest('div')?.querySelector('input') as Element;
    expect(passwordField).toBeInTheDocument();
    await userEvent.type(passwordField, 'secret');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
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

  test('should refresh', async () => {
    const { featureServiceMock } = await setup(FeatureSourceProtocolEnum.JDBC);
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Refresh feature source');
    expect(featureServiceMock.refreshFeatureSource$).toHaveBeenCalled();
  });

});
