import { render, screen } from '@testing-library/angular';
import { AttributeListExportButtonComponent } from './attribute-list-export-button.component';
import { provideMockStore } from '@ngrx/store/testing';
import {
  selectColumnsForSelectedTab, selectSelectedTab, selectSelectedTabLayerId, selectSortForSelectedTab,
} from '../state/attribute-list.selectors';
import { BehaviorSubject, of } from 'rxjs';
import { AttributeListExportService, SupportedExtractFormats } from '../services/attribute-list-export.service';
import userEvent from '@testing-library/user-event';
import { FileHelper, SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectCQLFilters } from '../../../state/filter-state/filter.selectors';
import { selectLayers } from '../../../map/state/map.selectors';
import { DownloadLayerExtractResponse } from '../models/attribute-list-api-service.model';
import { LayerExtractResponseModel } from '@tailormap-viewer/api';

const setup = async (
  layerId: string | null = null,
  supportedFormats: SupportedExtractFormats[] = [],
  progress = 0,
  exportResult: BehaviorSubject<any> = new BehaviorSubject(null),
) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectLayers, value: [{ id: '2', hiddenFunctionality: ['export'] }] },
      { selector: selectSelectedTabLayerId, value: layerId },
      { selector: selectSelectedTab, value: layerId ? { layerId, label: 'Some layer' } : null },
      { selector: selectCQLFilters, value: new Map() },
      { selector: selectColumnsForSelectedTab, value: [] },
      { selector: selectSortForSelectedTab, value: null },
    ],
  });
  const exportService = {
    getExportFormats$: jest.fn().mockReturnValue(of(supportedFormats)),
    export$: jest.fn().mockReturnValue(exportResult.asObservable()),
    extractProgress$: of(progress),
  };
  await render(AttributeListExportButtonComponent, {
    imports: [ SharedImportsModule, MatIconTestingModule ],
    providers: [ store, { provide: AttributeListExportService, useValue: exportService }],
  });
  return { exportService };
};

describe('AttributeListExportButtonComponent', () => {

  let saveAsFile: (data: object | Blob, filename: string) => void;

  beforeEach(() => {
    // Keep original method in a var to restore after testing
    saveAsFile = FileHelper.saveAsFile;
    // Replace by mock fn to prevent URL.createObjectURL on empty blobs
    FileHelper.saveAsFile = jest.fn();
  });

  afterEach(() => {
    FileHelper.saveAsFile = saveAsFile;
  });

  test('should render nothing without layer or supported formats', async () => {
    await setup();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('should render nothing with layer but without supported formats', async () => {
    await setup('1');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('should render nothing with layer but with export functionality hidden', async () => {
    await setup('2');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('should render button for selected layer and supported formats, CSV, XLSX', async () => {
    const { exportService } = await setup('1', [ SupportedExtractFormats.CSV, SupportedExtractFormats.XLSX ]);
    expect(screen.getByRole('button')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.queryByText('GeoPackage')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('CSV'));
    expect(exportService.export$).toHaveBeenCalledWith({ layerId: '1', serviceLayerName: 'Some layer', format: 'csv', filter: undefined, sort: null, attributes: [] });
  });

  test('should render button for selected layer and supported formats, CSV, XLSX, DFX', async () => {
    const { exportService } = await setup('1', [ SupportedExtractFormats.CSV, SupportedExtractFormats.XLSX, SupportedExtractFormats.DXF ]);
    expect(screen.getByRole('button')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('DXF')).toBeInTheDocument();
    expect(screen.queryByText('GeoPackage')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('DXF'));
    expect(exportService.export$).toHaveBeenCalledWith({ layerId: '1', serviceLayerName: 'Some layer', format: 'dxf', filter: undefined, sort: null, attributes: [] });
  });

  it('should show spinner when progress is 0 and export is started', async () => {
    const exportResponse = new BehaviorSubject<LayerExtractResponseModel | DownloadLayerExtractResponse>({
      message: '',
      downloadId: '',
    });
    await setup('1', [ SupportedExtractFormats.CSV, SupportedExtractFormats.XLSX ], 0, exportResponse);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('CSV'));
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByRole('progressbar')).toHaveAttribute('mode', 'indeterminate');
    exportResponse.next({ message: '', downloadId: '' });
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
    const download: DownloadLayerExtractResponse = { file: new Blob(), fileName: 'export.csv' };
    exportResponse.next(download);
    expect(await screen.findByText('Export')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should show spinner when progress is 20 and export is started', async () => {
    const exportResponse = new BehaviorSubject<LayerExtractResponseModel | DownloadLayerExtractResponse>({
      message: '',
      downloadId: '',
    });
    await setup('1', [ SupportedExtractFormats.CSV, SupportedExtractFormats.XLSX ], 20, exportResponse);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('CSV'));
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByRole('progressbar')).toHaveAttribute('mode', 'determinate');
    expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
    exportResponse.next({ message: '', downloadId: '' });
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
    const download: DownloadLayerExtractResponse = { file: new Blob(), fileName: 'export.csv' };
    exportResponse.next(download);
    expect(await screen.findByText('Export')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

});
