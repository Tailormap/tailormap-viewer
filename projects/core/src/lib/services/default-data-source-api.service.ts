import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ExtendedAppLayerModel, selectOrderedVisibleLayersWithServices } from '../map';
import {
  DescribeAppLayerService, FeaturesResponseModel, ServerType, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { GetFeaturesParams } from '../models/get-features-param.model';
import { map, Observable, of, switchMap } from 'rxjs';
import { CqlFilterHelper } from '../filter/helpers/cql-filter.helper';
import { GetLayerDetailsParams } from '../models/get-layer-details-param.model';
import { DataSourceManagerService } from './index';
import { DataSourceApiServiceModel, DataSourceLayerModel, DEFAULT_DATA_SOURCE_ID } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DefaultDataSourceApiService implements DataSourceApiServiceModel {

  private store$ = inject(Store);
  private dataSourceManager = inject(DataSourceManagerService);
  private api = inject(TAILORMAP_API_V1_SERVICE);
  private describeLayerService = inject(DescribeAppLayerService);

  public initDefaultDataSource(): void {
    this.dataSourceManager.addSource({
      id: DEFAULT_DATA_SOURCE_ID,
      availableLayers$: this.store$.select(selectOrderedVisibleLayersWithServices)
        .pipe(map(DefaultDataSourceApiService.mapLayersToDataSourceLayer)),
      dataLoader: this,
    });
  }

  public getFeatures$(params: GetFeaturesParams): Observable<FeaturesResponseModel> {
    const { filterGroups, bbox, ...getFeatureParams } = params;
    const bboxFilter$: Observable<string> = bbox
      ? this.describeLayerService.getDescribeAppLayer$(params.applicationId, params.layerId)
        .pipe(map(details => details.geometryAttribute ? `BBOX(${details.geometryAttribute}, ${bbox.join(',')})` : ''))
      : of('');
    return bboxFilter$.pipe(
      switchMap(bboxFilter => {
        const apiGetFeatureParams: Parameters<TailormapApiV1ServiceModel['getFeatures$']>[0] = {
          ...getFeatureParams,
          filter: CqlFilterHelper.getCqlFilterForLayer(filterGroups, params.layerId, bboxFilter),
        };
        if (getFeatureParams.includeGeometry) {
          apiGetFeatureParams.simplify = false;
          apiGetFeatureParams.onlyGeometries = true;
        }
        return this.api.getFeatures$(apiGetFeatureParams);
      }),
      map((response): FeaturesResponseModel => {
        return {
          ...response,
          page: response.page ? response.page : null,
        };
      }),
    );
  }

  public getLayerDetails$(params: GetLayerDetailsParams) {
    return this.describeLayerService.getDescribeAppLayer$(params.applicationId, params.layerId);
  }

  private static mapLayersToDataSourceLayer(layers: ExtendedAppLayerModel[]): DataSourceLayerModel[] {
    return layers.map(l => ({
      id: l.id,
      title: l.title || l.layerName,
      layerName: l.layerName,
      filterable: l.service?.serverType === ServerType.GEOSERVER && l.hasAttributes,
      hasAttributes: l.hasAttributes,
      // Never set featureInfo: FeatureInfoService already queries backend layers through the tailormap-api, so they would be queried twice
    })).filter(layer => layer.filterable || layer.hasAttributes);
  }

}
