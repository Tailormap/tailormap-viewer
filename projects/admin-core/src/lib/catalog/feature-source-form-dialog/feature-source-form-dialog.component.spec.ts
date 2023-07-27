import { render, screen, waitFor } from '@testing-library/angular';
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
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';

const setup = async (editMode = false) => {
  const dialogRefMock = { close: jest.fn() };
  const featureServiceMock = { createFeatureSource$: jest.fn(() => of({})), updateFeatureSource$: jest.fn(() => of({})) };
  await render(FeatureSourceFormDialogComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ FeatureSourceFormComponent, PasswordFieldComponent, SaveButtonComponent ],
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

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should render and handle cancel', async () => {
    const ue = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
    const { dialogRefMock } = await setup();
    expect(screen.getByText('Create new feature source')).toBeInTheDocument();
    await ue.click(screen.getByText('Cancel'));
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should save new node', async () => {
    jest.useFakeTimers();
    const ue = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });

    const { featureServiceMock, dialogRefMock } = await setup();
    expect(screen.getByText('Create new feature source')).toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('URL')).not.toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('Database')).not.toBeInTheDocument();
    await ue.type(await screen.findByPlaceholderText('Title'), 'My WFS service');
    await ue.click(await screen.findByPlaceholderText('Protocol'));
    await ue.click(await screen.findByText('WFS'));
    expect(await screen.queryByPlaceholderText('URL')).toBeInTheDocument();
    expect(await screen.queryByPlaceholderText('Database')).not.toBeInTheDocument();
    await ue.type(await screen.findByPlaceholderText('URL'), 'http://localhost.test');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', undefined, ue);
    await waitFor(() => {
      expect(featureServiceMock.createFeatureSource$).toHaveBeenCalledWith({
        title: 'My WFS service',
        protocol: 'WFS',
        url: 'http://localhost.test',
        jdbcConnection: undefined,
        authentication: undefined,
      }, '1');
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should edit node', async () => {
    const ue = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
    const { featureServiceMock, dialogRefMock } = await setup(true);
    expect(screen.getByText('Edit wfs source')).toBeInTheDocument();
    await ue.type(await screen.findByPlaceholderText('URL'), '/path');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', undefined, ue);
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
