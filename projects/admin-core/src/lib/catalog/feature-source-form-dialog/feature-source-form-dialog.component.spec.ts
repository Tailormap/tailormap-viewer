import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/angular';
import { FeatureSourceFormDialogComponent } from './feature-source-form-dialog.component';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FeatureSourceProtocolEnum, getFeatureSource } from '@tailormap-admin/admin-api';
import { TestSaveHelper } from '../../test-helpers/test-save.helper.spec';
import { FeatureSourceService } from '../services/feature-source.service';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const setup = async (editMode = false) => {
  const dialogRefMock = { close: vi.fn() };
  const featureServiceMock = { createFeatureSource$: vi.fn(() => of({})), updateFeatureSource$: vi.fn(() => of({})) };
  await render(FeatureSourceFormDialogComponent, {
    imports: [MatIconTestingModule],
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('should render and handle cancel', async () => {
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    const { dialogRefMock } = await setup();
    expect(screen.getByText('Create new feature source')).toBeInTheDocument();
    await ue.click(screen.getByText('Cancel'));
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should save new node', async () => {
    vi.useFakeTimers();
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });

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
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
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
