import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ExtendedAppLayerModel, selectOrderedVisibleLayersWithServices } from '../map';
import {
  DescribeAppLayerService, FeaturesResponseModel, ServerType, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { GetFeaturesParams } from '../models/get-features-param.model';
import { map, Observable } from 'rxjs';
import { FeaturesFilterHelper } from '../filter/helpers/features-filter.helper';
import { GetLayerDetailsParams } from '../models/get-layer-details-param.model';
import { DataSourceManagerService } from './index';
import { DataSourceApiServiceModel, DataSourceLayerModel } from '../models';

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
      id: 'tm-default-layers',
      availableLayers$: this.store$.select(selectOrderedVisibleLayersWithServices)
        .pipe(map(DefaultDataSourceApiService.mapLayersToDataSourceLayer)),
      dataLoader: this,
    });
  }

  public getFeatures$(params: GetFeaturesParams): Observable<FeaturesResponseModel> {
    const { filter, ...getFeatureParams } = params;
    const cqlFilter = filter
      ? FeaturesFilterHelper.getFilter(filter) || undefined
      : undefined;
    const apiGetFeatureParams: Parameters<TailormapApiV1ServiceModel['getFeatures$']>[0] = { ...getFeatureParams, filter: cqlFilter };
    if (getFeatureParams.includeGeometry) {
      apiGetFeatureParams.simplify = false;
      apiGetFeatureParams.onlyGeometries = true;
    }
    return this.api.getFeatures$(apiGetFeatureParams)
      .pipe(map((response): FeaturesResponseModel => {
        return {
          ...response,
          page: response.page ? response.page : null,
        };
      }));
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
    })).filter(layer => layer.filterable || layer.hasAttributes);
  }

}
