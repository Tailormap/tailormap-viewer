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
import { CADASTRAL_MUNICIPALITY_LIST } from '@tailormap-viewer/shared';

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
  private static readonly CADASTRAL_CODES_BY_NAME = new Map(CADASTRAL_MUNICIPALITY_LIST.map(m => [ m.name, m.codes ]));
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
            ? this.searchRd$(searchTerm, config)
            : this.searchOSMNominatim$(searchTerm);
          const searches$: Array<Observable<SearchResultModel | null>> = [locationSearch$];
          if (projection === ProjectionCodesEnum.RD && config?.searchCadastralParcels === true) {
            searches$.push(this.searchCadastralParcels$(searchTerm, config));
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

  private searchRd$(searchTerm: string, config: SimpleSearchConfigModel | undefined): Observable<SearchResultModel> {
    const filter = [];
    if (config && config.municipalities && config.municipalities.length > 0) {
      filter.push(`gemeentecode:(${config.municipalities.join(' OR ')})`);
    }
    return this.httpClient.get<LocationServerResponseModel>(SimpleSearchService.PDOK_LOCATION_SERVER_SUGGEST_URL, {
      params: {
        q: searchTerm,
        rows: SimpleSearchService.MAX_RESULTS.toString(),
        fl: 'weergavenaam,centroide_rd,geometrie_rd,id',
        fq: filter,
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

  /**
   * Searches the PDOK Locatieserver for kadastrale percelen.
   * The configured kadastrale gemeenten are stored by name, but the filter uses their AKR codes on
   * `kadastrale_gemeentecode`: `kadastrale_gemeentenaam` is tokenized, so a name filter also matches longer names
   * containing it (e.g. "Alphen" matches "Alphen aan den Rijn"), while the code field matches exactly.
   */
  private searchCadastralParcels$(searchTerm: string, config: SimpleSearchConfigModel): Observable<SearchResultModel | null> {
    const filter = ['type:perceel'];
    const names = config.cadastralMunicipalities ?? [];
    if (names.length > 0) {
      const codes = SimpleSearchService.toCadastralMunicipalityCodes(names);
      if (codes.length === 0) {
        return of(null);
      }
      filter.push(`kadastrale_gemeentecode:(${codes.join(' OR ')})`);
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
        id: 'pdok-cadastral-parcels',
        name: SimpleSearchService.CADASTRAL_PARCELS_LABEL,
        attribution: $localize `:@@core.toolbar.search-cadastral-parcels-pdok-attribution:Data by [PDOK](https://pdok.nl) / [Kadaster](https://www.kadaster.nl)`,
        results: result.response.docs.slice(0, SimpleSearchService.MAX_RESULTS).map(doc => ({
          id: doc.id,
          label: SimpleSearchService.toLabel(doc.weergavenaam),
          geometry: doc.geometrie_rd || doc.centroide_rd,
          projectionCode: ProjectionCodesEnum.RD,
        })),
      })),
    );
  }

  /** Looks up the AKR codes of kadastrale gemeente names. Unknown names are ignored. */
  private static toCadastralMunicipalityCodes(names: string[]): string[] {
    return [...new Set(names.flatMap(name => SimpleSearchService.CADASTRAL_CODES_BY_NAME.get(name) ?? []))];
  }

  /**
   * Removes the "Perceel " prefix from a Locatieserver `weergavenaam`, because the result group already says the
   * results are parcels. "Perceel Aalten (ATN02) K 2838" -> "Aalten (ATN02) K 2838".
   */
  private static toLabel(weergavenaam: string): string {
    return weergavenaam.replace(/^Perceel\s+/i, '');
  }

}
