import { render, screen, waitFor } from '@testing-library/angular';
import { SimpleSearchComponent } from './simple-search.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { SimpleSearchService } from './simple-search.service';
import { MapService } from '@tailormap-viewer/map';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const setup = async (projection = 'EPSG:28992') => {
  const mockedSearchService = {
    search$: jest.fn(() => of([
      { label: 'Some result', geometry: 'POINT(1 1)' },
      { label: 'Better result', geometry: 'POINT(2 2)' },
    ])),
  };
  const mockedMapService = {
    getProjectionCode$: jest.fn(() => of(projection)),
    zoomTo: jest.fn(),
  };
  await render(SimpleSearchComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: SimpleSearchService, useValue: mockedSearchService },
      { provide: MapService, useValue: mockedMapService },
    ],
  });
  return {
    searchService: TestBed.inject(SimpleSearchService),
    mapService: TestBed.inject(MapService),
  };
};

describe('SimpleSearchComponent', () => {

  test('should render', async () => {
    const { mapService, searchService } = await setup();
    await userEvent.click(await screen.findByLabelText('Search location'));
    await userEvent.type(await screen.findByRole('combobox'), 'Str');
    await waitFor(() => {
      expect(searchService.search$).not.toHaveBeenCalled();
    }, { timeout: 300 });
    await userEvent.type(await screen.findByRole('combobox'), 'eet');
    await waitFor(() => {
      expect(searchService.search$).toHaveBeenCalledWith('EPSG:28992', 'Street');
      expect(screen.getByText('Better result')).toBeInTheDocument();
    });
    await userEvent.click(await screen.findByText('Better result'));
    expect(mapService.zoomTo).toHaveBeenCalledWith('POINT(2 2)');
  });

  test('should not render for unsupported projection', async () => {
    await setup('UNSUPPORTED');
    expect(await screen.queryByLabelText('Search location')).not.toBeInTheDocument();
  });

});
