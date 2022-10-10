import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProjectionCodesEnum } from '@tailormap-viewer/map';

export interface SearchResultModel {
  results: SearchResult[];
  attribution: string;
}

export interface SearchResult {
  label: string;
  geometry: string;
  projectionCode: string;
}

interface LocationServerResponse {
  response: {
    docs: Array<{
      weergavenaam: string;
      geometrie_rd: string;
      centroide_rd: string;
    }>;
  };
}

interface NomatimResponse {
  display_name: string;
  geotext: string;
}

@Injectable({
  providedIn: 'root',
})
export class SimpleSearchService {

  private static readonly MAX_RESULTS = 5;

  private httpClient = inject(HttpClient);

  public search$(projection: string, searchTerm: string): Observable<SearchResultModel> {
    if (projection === ProjectionCodesEnum.RD) {
      return this.searchRd$(searchTerm);
    }
    return this.searchOSMNomatim$(searchTerm);
  }

  private searchOSMNomatim$(searchTerm: string): Observable<SearchResultModel> {
    return this.httpClient.get<NomatimResponse[]>(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: searchTerm,
        format: 'jsonv2',
        polygon_text: '1',
      },
    }).pipe(
      catchError(() => of([])),
      map(result => ({
        attribution: $localize `Data by [OpenStreetMap](https://www.openstreetmap.org/copyright)`,
        results: result.slice(0, SimpleSearchService.MAX_RESULTS).map(res => ({
          label: res.display_name,
          geometry: res.geotext,
          projectionCode: ProjectionCodesEnum.WGS84,
        })),
      })),
    );
  }

  private searchRd$(searchTerm: string): Observable<SearchResultModel> {
    return this.httpClient.get<LocationServerResponse>(`https://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest`, {
      params: {
        q: searchTerm,
        rows: SimpleSearchService.MAX_RESULTS.toString(),
        fl: 'weergavenaam,centroide_rd,geometrie_rd',
      },
    }).pipe(
      catchError(() => of({ response: { docs: [] } })),
      map(result => ({
        attribution: $localize `Data by [PDOK](https://geodata.nationaalgeoregister.nl)`,
        results: result.response.docs.slice(0, SimpleSearchService.MAX_RESULTS).map(doc => ({
          label: doc.weergavenaam,
          geometry: doc.geometrie_rd || doc.centroide_rd,
          projectionCode: ProjectionCodesEnum.RD,
        })),
      })),
    );
  }
}
