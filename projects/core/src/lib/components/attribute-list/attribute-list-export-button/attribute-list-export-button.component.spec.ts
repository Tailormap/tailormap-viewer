import { render, screen } from '@testing-library/angular';
import { AttributeListExportButtonComponent } from './attribute-list-export-button.component';
import { provideMockStore } from '@ngrx/store/testing';
import { selectSelectedTab, selectSelectedTabLayerId } from '../state/attribute-list.selectors';
import { of } from 'rxjs';
import { AttributeListExportService, SupportedExportFormats } from '../services/attribute-list-export.service';
import userEvent from '@testing-library/user-event';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const setup = async (layerId: number | null = null, supportedFormats: SupportedExportFormats[] = []) => {
  const store = provideMockStore({
    initialState: {},
    selectors: [
      { selector: selectSelectedTabLayerId, value: layerId },
      { selector: selectSelectedTab, value: layerId ? { layerId, label: 'Some layer' } : null },
    ],
  });
  const exportService = {
    getExportFormats$: jest.fn().mockReturnValue(of(supportedFormats)),
    export$: jest.fn().mockReturnValue(of(true)),
  };
  await render(AttributeListExportButtonComponent, {
    imports: [ SharedImportsModule, MatIconTestingModule ],
    providers: [ store, { provide: AttributeListExportService, useValue: exportService }],
  });
  return { exportService };
};

describe('AttributeListExportButtonComponent', () => {

  test('should render nothing without layer or supported formats', async () => {
    await setup();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('should render nothing with layer but without supported formats', async () => {
    await setup(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('should render button for selected layer and supported formats', async () => {
    const { exportService } = await setup(1, [ SupportedExportFormats.CSV, SupportedExportFormats.XLSX ]);
    expect(screen.getByRole('button')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.queryByText('GeoPackage')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('CSV'));
    expect(exportService.export$).toHaveBeenCalledWith(1, 'Some layer', SupportedExportFormats.CSV);
  });

});
