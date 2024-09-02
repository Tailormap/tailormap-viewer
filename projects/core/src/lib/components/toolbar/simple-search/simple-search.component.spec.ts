import { render, screen, waitFor } from '@testing-library/angular';
import { SimpleSearchComponent } from './simple-search.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { SimpleSearchService } from './simple-search.service';
import { ProjectionCodesEnum } from '@tailormap-viewer/map';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SearchResultModel } from './models';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const setup = async () => {
  const mockedSearchService = {
    search$: jest.fn(() => of<SearchResultModel[]>([{
      id: 'test',
      name: 'Test Searcher',
      results: [
        { id: '1', label: 'Some result', geometry: 'POINT(1 1)', projectionCode: ProjectionCodesEnum.RD },
        { id: '2', label: 'Better result', geometry: 'POINT(2 2)', projectionCode: ProjectionCodesEnum.RD },
      ],
      attribution: 'Some Random Data Provider',
    }])),
  };
  const mockedMapService = getMapServiceMock(null, 'EPSG:28992');
  await render(SimpleSearchComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: SimpleSearchService, useValue: mockedSearchService },
      mockedMapService.provider,
    ],
  });
  return {
    searchService: TestBed.inject(SimpleSearchService),
    mapService: mockedMapService.mapService,
  };
};

describe('SimpleSearchComponent', () => {

  test('should render', async () => {
    const { mapService, searchService } = await setup();
    await userEvent.click(await screen.findByLabelText('Search location'));
    await userEvent.type(await screen.findByRole('combobox'), 'Str');
    await waitFor(() => {
      expect(searchService.search$).not.toHaveBeenCalled();
    }, { timeout: 1100 });
    await userEvent.type(await screen.findByRole('combobox'), 'eet');
    await waitFor(() => {
      expect(searchService.search$).toHaveBeenCalledWith('EPSG:28992', 'Street');
      expect(screen.getByText('Test Searcher')).toBeInTheDocument();
      expect(screen.getByText('Better result')).toBeInTheDocument();
    }, { timeout: 1100 });
    await userEvent.click(await screen.findByText('Better result'));
    expect(mapService.renderFeatures$).toHaveBeenCalled();
    const renderFeaturesCall = (mapService.renderFeatures$ as jest.Mock).mock.calls[0];
    expect(renderFeaturesCall[0]).toEqual('search-result-highlight');
  });

});
