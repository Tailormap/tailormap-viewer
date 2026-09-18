import { BehaviorSubject, combineLatest, Observable, of, switchMap, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataSourceApiServiceModel, DataSourceLayerModel, DataSourceModel } from '../models/data-source.model';
import { Service } from '@angular/core';
import { GetFeaturesParams, GetLayerDetailsParams } from '../models';
import { FeaturesResponseModel, LayerDetailsModel } from '@tailormap-viewer/api';

type DataLoaderAction = keyof DataSourceApiServiceModel;
type DataLoaderParams<K extends DataLoaderAction> = Parameters<DataSourceApiServiceModel[K]>[0];
type DataLoaderResult<K extends DataLoaderAction> =
  DataSourceApiServiceModel[K] extends (params: DataLoaderParams<K>) => Observable<infer R> ? R : never;

@Service()
export class DataSourceManagerService {

  private sources$ = new BehaviorSubject<DataSourceModel[]>([]);

  protected sourcesWithLayer$: Observable<Array<{ source: DataSourceModel; layers: DataSourceLayerModel[] }>> = this.sources$.asObservable().pipe(
    switchMap(sources => {
      if (sources.length === 0) {
        return of([]);
      }
      return combineLatest(sources.map(source => source.availableLayers$.pipe(map(layers => ({
        source,
        layers,
      })))));
    }),
  );

  public filterableLayers$: Observable<DataSourceLayerModel[]> = this.getLayers$(l => l.filterable);
  public layersWithAttributes$: Observable<DataSourceLayerModel[]> = this.getLayers$(l => l.hasAttributes);

  public addSource(source: DataSourceModel): void {
    this.sources$.next([
      ...this.sources$.getValue(),
      source,
    ]);
  }

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

  public getLayers$(layerFilter: (layer: DataSourceLayerModel) => boolean): Observable<DataSourceLayerModel[]> {
    return this.sourcesWithLayer$.pipe(
      map(sourcesWithLayers => sourcesWithLayers.map(s => s.layers.filter(l => layerFilter(l))).flat()),
    );
  }

  private executeDataLoaderAction<K extends DataLoaderAction, E = DataLoaderResult<K>>(
    layerId: string,
    dataLoaderAction: K,
    params: DataLoaderParams<K>,
    emptyValue: DataLoaderResult<K> | E,
  ): Observable<DataLoaderResult<K> | E> {
    return this.sourcesWithLayer$
      .pipe(
        take(1),
        switchMap(sourcesWithLayers => {
          const source = sourcesWithLayers.find(s => s.layers.some(l => l.id === layerId));
          if (!source) {
            return of(emptyValue);
          }
          const action = source.source.dataLoader[dataLoaderAction] as
            (actionParams: DataLoaderParams<K>) => Observable<DataLoaderResult<K>>;
          return action.call(source.source.dataLoader, params);
        }),
      );
  }

}
