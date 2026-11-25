import { Injectable, inject } from '@angular/core';
import { catchError, combineLatest, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProjectionCodesEnum } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { SearchResultModel, NominatimResponseModel, LocationServerResponseModel, SearchResultItemModel } from './models';
import { SearchResponseModel, SimpleSearchConfigModel, TAILORMAP_API_V1_SERVICE } from '@tailormap-viewer/api';
import { ExtendedAppLayerModel } from '../../../map/models';
import { selectViewerId } from '../../../state/core.selectors';
import { take } from 'rxjs/operators';
import { selectSearchableLayers } from '../../../map/state/map.selectors';

@Injectable({
  providedIn: 'root',
})
export class SimpleSearchService {
  private httpClient = inject(HttpClient);
  private store$ = inject(Store);
  private api = inject(TAILORMAP_API_V1_SERVICE);


  private static readonly LOCATION_LABEL = $localize `:@@core.search.location:Location`;
  private static readonly CADASTRAL_PARCELS_LABEL = $localize `:@@core.search.cadastral-parcels:Cadastral parcels`;
  private static readonly MAX_RESULTS = 5;
  private static readonly PDOK_LOCATION_SERVER_SUGGEST_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest';

  public search$(projection: string, searchTerm: string, config: SimpleSearchConfigModel | undefined): Observable<SearchResultModel[]> {
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
            ? this.searchPdokLocationServer$(searchTerm, config, false)
            : this.searchOSMNominatim$(searchTerm);
          const searches$: Array<Observable<SearchResultModel | null>> = [locationSearch$];
          if (projection === ProjectionCodesEnum.RD && config?.searchCadastralParcels === true) {
            searches$.push(this.searchPdokLocationServer$(searchTerm, config, true));
          }
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
      query: `(*${searchTerm}*)`,
    }).pipe(
      catchError(() => of({ documents: [], maxScore: 0, start: 0, total: 0 })),
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

  /**
   * Searches the PDOK Locatieserver for locations or, when `cadastralParcels` is true, for kadastrale percelen (parcels).
   * Parcels are filtered on `kadastrale_gemeentecode`. `kadastrale_gemeentenaam` is tokenized, so a name filter also matches
   * longer names containing it (e.g. "Alphen" matches "Alphen aan den Rijn"), while the code field matches exactly.
   * The "Perceel " prefix is removed from parcel labels because the result group already says the results are parcels:
   * "Perceel Aalten (ATN02) K 2838" -> "Aalten (ATN02) K 2838".
   */
  private searchPdokLocationServer$(
    searchTerm: string,
    config: SimpleSearchConfigModel | undefined,
    cadastralParcels: boolean,
  ): Observable<SearchResultModel> {
    const filter: string[] = [];
    if (cadastralParcels) {
      filter.push('type:perceel');
      const codes = (config?.cadastralMunicipalities ?? []).flatMap(m => m.codes);
      if (codes.length > 0) {
        filter.push(`kadastrale_gemeentecode:(${codes.join(' OR ')})`);
      }
    } else if (config?.municipalities && config.municipalities.length > 0) {
      filter.push(`gemeentecode:(${config.municipalities.join(' OR ')})`);
    }
    return this.httpClient.get<LocationServerResponseModel>(SimpleSearchService.PDOK_LOCATION_SERVER_SUGGEST_URL, {
      params: {
        q: searchTerm,
        rows: SimpleSearchService.MAX_RESULTS.toString(),
        fl: 'id,weergavenaam,geometrie_rd,centroide_rd',
        fq: filter,
      },
    }).pipe(
      catchError(() => of({ response: { docs: [] } })),
      map(result => ({
        id: cadastralParcels ? 'pdok-cadastral-parcels' : 'pdok-locatie-server',
        name: cadastralParcels ? SimpleSearchService.CADASTRAL_PARCELS_LABEL : SimpleSearchService.LOCATION_LABEL,
        attribution: cadastralParcels
          ? $localize `:@@core.toolbar.search-cadastral-parcels-pdok-attribution:Data by [PDOK](https://pdok.nl) / [Kadaster](https://www.kadaster.nl)`
          : $localize `:@@core.toolbar.search-location-pdok-attribution:Data by [PDOK](https://pdok.nl)`,
        results: result.response.docs.slice(0, SimpleSearchService.MAX_RESULTS).map(doc => ({
          id: doc.id,
          label: cadastralParcels ? doc.weergavenaam.replace(/^Perceel\s+/i, '') : doc.weergavenaam,
          geometry: doc.geometrie_rd || doc.centroide_rd,
          projectionCode: ProjectionCodesEnum.RD,
        })),
      })),
    );
  }

}
