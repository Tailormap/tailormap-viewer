import { Inject, Injectable } from '@angular/core';
import { catchError, combineLatest, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProjectionCodesEnum } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { SearchResultModel, NominatimResponseModel, LocationServerResponseModel, SearchResultItemModel } from './models';
import { SearchResponseModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { ExtendedAppLayerModel } from '../../../map/models';
import { selectViewerId } from '../../../state/core.selectors';
import { take } from 'rxjs/operators';
import { selectSearchableLayers } from '../../../map/state/map.selectors';

@Injectable({
  providedIn: 'root',
})
export class SimpleSearchService {

  private static readonly LOCATION_LABEL = $localize `:@@core.search.location:Location`;
  private static readonly MAX_RESULTS = 5;

  constructor(
    private httpClient: HttpClient,
    private store$: Store,
    @Inject(TAILORMAP_API_V1_SERVICE) private api: TailormapApiV1ServiceModel,
  ) {}

  public search$(projection: string, searchTerm: string): Observable<SearchResultModel[]> {
    return combineLatest([
      this.store$.select(selectViewerId),
      this.store$.select(selectSearchableLayers),
    ])
      .pipe(
        take(1),
        switchMap(([ viewerId, searchableLayers ]) => {
          if (viewerId === null) {
            return of([]);
          }
          const locationSearch$ = projection === ProjectionCodesEnum.RD
            ? this.searchRd$(searchTerm)
            : this.searchOSMNominatim$(searchTerm);
          const searches$: Array<Observable<SearchResultModel | null>> = [locationSearch$];
          searchableLayers.forEach(layer => {
            searches$.push(this.searchLayer$(viewerId, layer, searchTerm));
          });
          return forkJoin(searches$);
        }),
        map(results => results.filter((r): r is SearchResultModel => r !== null)),
      );
  }

  private searchLayer$(applicationId: string, layer: ExtendedAppLayerModel, searchTerm: string): Observable<SearchResultModel | null> {
    if (!layer) {
      return of(null);
    }
    return this.api.search$({
      applicationId,
      layerId: layer.id,
      query: searchTerm,
    }).pipe(
      map<SearchResponseModel, SearchResultModel | null>(searchResponse => {
        if (!searchResponse) {
          return null;
        }
        return {
          id: `${layer.searchIndex?.id ?? layer.id}`,
          attribution: '',
          name: layer.searchIndex?.name ?? layer.layerName,
          results: searchResponse.documents.slice(0, SimpleSearchService.MAX_RESULTS).map<SearchResultItemModel>(doc => ({
            id: doc.fid,
            geometry: doc.geometry,
            label: (doc.displayValues || []).join(', '),
          })),
        };
      }),
    );
  }

  private searchOSMNominatim$(searchTerm: string): Observable<SearchResultModel> {
    return this.httpClient.get<NominatimResponseModel[]>(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: searchTerm,
        format: 'jsonv2',
        polygon_text: '1',
      },
    }).pipe(
      catchError(() => of([])),
      map(result => ({
        id: 'osm-nominatim',
        name: SimpleSearchService.LOCATION_LABEL,
        attribution: result.length > 0 ? result[0].licence : '',
        results: result.slice(0, SimpleSearchService.MAX_RESULTS).map(res => ({
          id: `${res.place_id}`,
          label: res.display_name,
          geometry: res.geotext,
          projectionCode: ProjectionCodesEnum.WGS84,
        })),
      })),
    );
  }

  private searchRd$(searchTerm: string): Observable<SearchResultModel> {
    return this.httpClient.get<LocationServerResponseModel>(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest`, {
      params: {
        q: searchTerm,
        rows: SimpleSearchService.MAX_RESULTS.toString(),
        fl: 'weergavenaam,centroide_rd,geometrie_rd,id',
      },
    }).pipe(
      catchError(() => of({ response: { docs: [] } })),
      map(result => ({
        id: 'pdok-locatie-server',
        name: SimpleSearchService.LOCATION_LABEL,
        attribution: $localize `:@@core.toolbar.search-location-pdok-attribution:Data by [PDOK](https://pdok.nl)`,
        results: result.response.docs.slice(0, SimpleSearchService.MAX_RESULTS).map(doc => ({
          id: doc.id,
          label: doc.weergavenaam,
          geometry: doc.geometrie_rd || doc.centroide_rd,
          projectionCode: ProjectionCodesEnum.RD,
        })),
      })),
    );
  }
}
