import { describe, test, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom } from 'rxjs';
import { ProjectionCodesEnum } from '@tailormap-viewer/map';
import { SimpleSearchConfigModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { SimpleSearchService } from './simple-search.service';
import { selectViewerId } from '../../../state/core.selectors';
import { selectSearchableLayers } from '../../../map/state/map.selectors';
import { SearchResultModel } from './models';

const SUGGEST_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest';

const setup = () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideMockStore({
        selectors: [
          { selector: selectViewerId, value: 'app/default' },
          { selector: selectSearchableLayers, value: [] },
        ],
      }),
      { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
    ],
  });
  return {
    service: TestBed.inject(SimpleSearchService),
    httpTestingController: TestBed.inject(HttpTestingController),
  };
};

const isParcelRequest = (req: TestRequest) => (req.request.params.getAll('fq') || []).includes('type:perceel');

const parcelResponse = {
  response: {
    docs: [{
      id: 'adr-1',
      weergavenaam: 'Perceel Aalten (ATN02) K 2838',
      geometrie_rd: 'POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))',
      centroide_rd: 'POINT(0.5 0.5)',
    }],
  },
};

const locationResponse = {
  response: {
    docs: [{
      id: 'loc-1',
      weergavenaam: 'Dorpsstraat 1, Aalten',
      geometrie_rd: '',
      centroide_rd: 'POINT(1 1)',
    }],
  },
};

/**
 * Starts a search, flushes all PDOK requests (parcel requests get parcelResponse, others locationResponse)
 * and returns the search results and the requests that were made.
 */
const search = async (
  config: SimpleSearchConfigModel | undefined,
  searchTerm = 'ATN02K02838',
  projection: string = ProjectionCodesEnum.RD,
  parcelError = false,
) => {
  const { service, httpTestingController } = setup();
  const result$ = firstValueFrom(service.search$(projection, searchTerm, config));
  const requests = httpTestingController.match(() => true);
  requests.forEach(req => {
    if (isParcelRequest(req) && parcelError) {
      req.flush('error', { status: 500, statusText: 'Server error' });
      return;
    }
    req.flush(isParcelRequest(req) ? parcelResponse : locationResponse);
  });
  const results: SearchResultModel[] = await result$;
  httpTestingController.verify();
  return {
    results,
    parcelRequests: requests.filter(isParcelRequest),
    locationRequests: requests.filter(req => !isParcelRequest(req)),
  };
};

describe('SimpleSearchService', () => {

  test('searches cadastral parcels when enabled', async () => {
    const { results, parcelRequests } = await search({ enabled: true, searchCadastralParcels: true });
    expect(parcelRequests.length).toBe(1);
    const params = parcelRequests[0].request.params;
    expect(parcelRequests[0].request.url).toBe(SUGGEST_URL);
    expect(params.get('q')).toBe('ATN02 K 2838');
    expect(params.getAll('fq')).toEqual(['type:perceel']);
    expect(results.map(r => r.id)).toEqual([ 'pdok-locatie-server', 'pdok-cadastral-parcels' ]);
    expect(results[1].name).toBe('Cadastral parcels');
    expect(results[1].results).toEqual([{
      id: 'adr-1',
      label: 'Aalten (ATN02) K 2838',
      geometry: 'POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))',
      projectionCode: ProjectionCodesEnum.RD,
    }]);
  });

  test('filters parcels on kadastrale gemeente names', async () => {
    const { parcelRequests } = await search({ enabled: true, searchCadastralParcels: true, cadastralMunicipalities: [ 'Aalten', "'s-Gravenhage", 'Bergen (NH)' ] });
    expect(parcelRequests[0].request.params.getAll('fq'))
      .toEqual([ 'type:perceel', 'kadastrale_gemeentenaam:("Aalten" OR "\'s-Gravenhage" OR "Bergen (NH)")' ]);
    expect(parcelRequests[0].request.params.get('fl')).toContain('kadastrale_gemeentenaam');
  });

  test('drops parcels of a longer kadastrale gemeente name that contains a selected name', async () => {
    const { service, httpTestingController } = setup();
    const result$ = firstValueFrom(service.search$(ProjectionCodesEnum.RD, 'Alphen', {
      enabled: true, searchCadastralParcels: true, cadastralMunicipalities: ['Alphen'],
    }));
    const requests = httpTestingController.match(() => true);
    requests.filter(req => !isParcelRequest(req)).forEach(req => req.flush(locationResponse));
    requests.filter(isParcelRequest).forEach(req => req.flush({
      response: {
        docs: [
          { ...parcelResponse.response.docs[0], id: 'p-1', weergavenaam: 'Perceel Alphen (APH00) A 1', kadastrale_gemeentenaam: 'Alphen' },
          { ...parcelResponse.response.docs[0], id: 'p-2', weergavenaam: 'Perceel Alphen aan den Rijn (APN00) A 1', kadastrale_gemeentenaam: 'Alphen aan den Rijn' },
        ],
      },
    }));
    const results = await result$;
    expect(results[1].results.map(r => r.id)).toEqual(['p-1']);
  });

  test('does not apply the municipality filter to parcels', async () => {
    const { parcelRequests, locationRequests } = await search({ enabled: true, searchCadastralParcels: true, municipalities: ['GM0197'] });
    expect(parcelRequests[0].request.params.getAll('fq')).toEqual(['type:perceel']);
    expect(locationRequests[0].request.params.getAll('fq')).toEqual(['gemeentecode:(GM0197)']);
  });

  test('does not search parcels when the option is off or not set', async () => {
    const off = await search({ enabled: true, searchCadastralParcels: false });
    expect(off.parcelRequests.length).toBe(0);
    expect(off.results.map(r => r.id)).toEqual(['pdok-locatie-server']);
    TestBed.resetTestingModule();
    const notSet = await search({ enabled: true });
    expect(notSet.parcelRequests.length).toBe(0);
  });

  test('does not search parcels for maps that are not in RD', async () => {
    const { service, httpTestingController } = setup();
    const result$ = firstValueFrom(service.search$(ProjectionCodesEnum.WGS84, 'ATN02 K 2838', { enabled: true, searchCadastralParcels: true }));
    const requests = httpTestingController.match(() => true);
    expect(requests.length).toBe(1);
    expect(requests[0].request.url).toBe('https://nominatim.openstreetmap.org/search');
    requests[0].flush([]);
    expect((await result$).map(r => r.id)).toEqual(['osm-nominatim']);
  });

  test('always searches parcels, also for input that is not a cadastral designation', async () => {
    const { results, parcelRequests } = await search({ enabled: true, searchCadastralParcels: true }, 'Amsterdam');
    expect(parcelRequests.length).toBe(1);
    expect(parcelRequests[0].request.params.get('q')).toBe('Amsterdam');
    expect(results.map(r => r.id)).toEqual([ 'pdok-locatie-server', 'pdok-cadastral-parcels' ]);
    expect(results[0].results[0].label).toBe('Dorpsstraat 1, Aalten');
  });

  test('returns an empty parcel group on an HTTP error, other results still work', async () => {
    const { results } = await search({ enabled: true, searchCadastralParcels: true }, 'ATN02 K 2838', ProjectionCodesEnum.RD, true);
    expect(results.map(r => r.id)).toEqual([ 'pdok-locatie-server', 'pdok-cadastral-parcels' ]);
    expect(results[0].results.length).toBe(1);
    expect(results[1].results).toEqual([]);
  });

});
