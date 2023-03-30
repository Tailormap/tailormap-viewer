import { render, screen } from '@testing-library/angular';
import { FeatureSourceFormDialogComponent } from './feature-source-form-dialog.component';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { SharedModule } from '@tailormap-viewer/shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FeatureSourceProtocolEnum, getFeatureSource } from '@tailormap-admin/admin-api';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { FeatureSourceService } from '../services/feature-source.service';
import { FeatureSourceFormComponent } from '../feature-source-form/feature-source-form.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const setup = async (editMode = false) => {
  const dialogRefMock = { close: jest.fn() };
  const featureServiceMock = { createFeatureSource$: jest.fn(() => of({})), updateFeatureSource$: jest.fn(() => of({})) };
  await render(FeatureSourceFormDialogComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ FeatureSourceFormComponent, PasswordFieldComponent ],
    providers: [
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: FeatureSourceService, useValue: featureServiceMock },
      { provide: MAT_DIALOG_DATA, useValue: {
          featureSource: editMode ? getFeatureSource({ id: '2', title: 'wfs source', protocol: FeatureSourceProtocolEnum.WFS, url: 'http://test-wfs.service' }) : null,
          parentNode: '1',
      } },
    ],
  });
  return {
    featureServiceMock,
    dialogRefMock,
  };
};

describe('FeatureSourceFormDialogComponent', () => {

  test('should render and handle cancel', async () => {
    const { dialogRefMock } = await setup();
    expect(screen.getByText('Create new feature source')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancel'));
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should save new node', async () => {
    const { featureServiceMock, dialogRefMock } = await setup();
    expect(screen.getByText('Create new feature source')).toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('URL')).not.toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('Database')).not.toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'My WFS service');
    await userEvent.click(await screen.findByPlaceholderText('Protocol'));
    await userEvent.click(await screen.findByText('WFS'));
    expect(await screen.queryByPlaceholderText('URL')).toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('Database')).not.toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('URL'), 'http://localhost.test');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(featureServiceMock.createFeatureSource$).toHaveBeenCalledWith({
      title: 'My WFS service',
      protocol: 'WFS',
      url: 'http://localhost.test',
      jdbcConnection: undefined,
      authentication: undefined,
    }, '1');
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should edit node', async () => {
    const { featureServiceMock, dialogRefMock } = await setup(true);
    expect(screen.getByText('Edit wfs source')).toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('URL'), '/path');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(featureServiceMock.updateFeatureSource$).toHaveBeenCalledWith('2', {
      title: 'wfs source',
      protocol: 'WFS',
      url: 'http://test-wfs.service/path',
      jdbcConnection: undefined,
      authentication: undefined,
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

});