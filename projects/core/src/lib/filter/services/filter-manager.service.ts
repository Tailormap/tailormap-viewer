import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, switchMap, take } from 'rxjs';
import { FilterableLayerModel, FilterApiServiceModel, FilterSourceModel } from '../models/filter-source.model';
import { map } from 'rxjs/operators';
import { GetFeaturesParams } from '../../models/get-features-param.model';
import { FeaturesResponseModel, LayerDetailsModel } from '@tailormap-viewer/api';
import { GetLayerDetailsParams } from '../../models/get-layer-details-param.model';

type FilterDataLoaderAction = keyof FilterApiServiceModel;
type FilterDataLoaderParams<K extends FilterDataLoaderAction> = Parameters<FilterApiServiceModel[K]>[0];
type FilterDataLoaderResult<K extends FilterDataLoaderAction> =
  FilterApiServiceModel[K] extends (params: FilterDataLoaderParams<K>) => Observable<infer R> ? R : never;

@Injectable({
  providedIn: 'root',
})
export class FilterManagerService {

  private sources$ = new BehaviorSubject<FilterSourceModel[]>([]);
  private sourcesWithLayer$: Observable<Array<{ source: FilterSourceModel; layers: FilterableLayerModel[] }>> = this.sources$.asObservable().pipe(
    switchMap(sources => {
      if (sources.length === 0) {
        return of([]);
      }
      return combineLatest(sources.map(source => {
        return source.availableLayers$.pipe(map(layers => ({
          source,
          layers,
        })));
      }));
    }),
  );

  public addFilterSource(source: FilterSourceModel): void {
    this.sources$.next([
      ...this.sources$.getValue(),
      source,
    ]);
  }

  public filterableLayers$: Observable<FilterableLayerModel[]> = this.getLayers$(l => l.filterable);
  public referencableLayers$: Observable<FilterableLayerModel[]> = this.getLayers$(l => l.referencable);

  public getFeatures$(params: GetFeaturesParams): Observable<FeaturesResponseModel> {
    return this.executeDataLoaderAction(
      params.layerId,
      'getFeatures$',
      params,
      { features: [], columnMetadata: [], total: null, page: null, pageSize: null, template: null },
    );
  }

  public getDescribeLayer$(params: GetLayerDetailsParams): Observable<LayerDetailsModel | null> {
    return this.executeDataLoaderAction(params.layerId, 'getLayerDetails$', params, null);
  }

  private executeDataLoaderAction<K extends FilterDataLoaderAction, E = FilterDataLoaderResult<K>>(
    layerId: string,
    dataLoaderAction: K,
    params: FilterDataLoaderParams<K>,
    emptyValue: FilterDataLoaderResult<K> | E,
  ): Observable<FilterDataLoaderResult<K> | E> {
    return this.sourcesWithLayer$
      .pipe(
        take(1),
        switchMap(sourcesWithLayers => {
          const source = sourcesWithLayers.find(s => s.layers.some(l => l.id === layerId));
          if (!source) {
            return of(emptyValue);
          }
          const action = source.source.dataLoader[dataLoaderAction] as (actionParams: FilterDataLoaderParams<K>) => Observable<FilterDataLoaderResult<K>>;
          return action.call(source.source.dataLoader, params);
        }),
      );
  }

  private getLayers$(layerFilter: (layer: FilterableLayerModel) => boolean): Observable<FilterableLayerModel[]> {
     return this.sourcesWithLayer$.pipe(
      map(sources => (sources.map(s => {
        return s.layers.filter(l => layerFilter(l));
      })).flat()),
    );
  }

}
