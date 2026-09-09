import { vi, describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { SimpleSearchComponent } from './simple-search.component';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SimpleSearchService } from './simple-search.service';
import { ProjectionCodesEnum } from '@tailormap-viewer/map';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SearchResultModel } from './models';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { provideMockStore } from '@ngrx/store/testing';
import { coreStateKey, initialCoreState } from '../../../state/core.state';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';

const setup = async () => {
  const mockedSearchService = {
    search$: vi.fn(() => of<SearchResultModel[]>([{
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
  const mockMobileLayoutService = { isMobileLayoutEnabled$: of(false) };
  await render(SimpleSearchComponent, {
    imports: [MatIconTestingModule],
    providers: [
      { provide: SimpleSearchService, useValue: mockedSearchService },
      mockedMapService.provider,
      provideMockStore({ initialState: {
        [coreStateKey]: {
          ...initialCoreState,
          viewer: {
            components: [{ type: 'SIMPLE_SEARCH', config: { enabled: true, municipalities: ['Utrecht'] } }],
          },
        },
      } }),
      { provide: MobileLayoutService, useValue: mockMobileLayoutService },
    ],
  });
  return {
    searchService: TestBed.inject(SimpleSearchService),
    mapService: mockedMapService.mapService,
  };
};

describe('SimpleSearchComponent', () => {

  test('should render', async () => {
    vi.useFakeTimers();
    const ue = userEvent.setup({ advanceTimers: vi.advanceTimersByTimeAsync });
    const { mapService, searchService } = await setup();
    await ue.click(await screen.findByLabelText('Search location'));
    await ue.type(await screen.findByRole('combobox'), 'St');
    vi.advanceTimersByTime(1500);
    expect(searchService.search$).not.toHaveBeenCalled();
    await ue.type(await screen.findByRole('combobox'), 'reet');
    vi.advanceTimersByTime(1500);
    expect(searchService.search$).toHaveBeenCalledWith('EPSG:28992', 'Street', { enabled: true, municipalities: ['Utrecht'] });
    expect(await screen.findByText('Test Searcher')).toBeInTheDocument();
    expect(await screen.findByText('Better result')).toBeInTheDocument();
    await ue.click(await screen.findByText('Better result'));
    expect(mapService.renderFeatures$).toHaveBeenCalled();
    const renderFeaturesCall = (mapService.renderFeatures$ as Mock).mock.calls[0];
    expect(renderFeaturesCall[0]).toEqual('search-result-highlight');
    vi.useRealTimers();
  });

});
