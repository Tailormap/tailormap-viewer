import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { FilterManagerService } from './filter-manager.service';
import { ExtendedAppLayerModel, selectOrderedVisibleLayersWithServices } from '../../map';
import { FilterableLayerModel, FilterApiServiceModel } from '../models/filter-source.model';
import {
  DescribeAppLayerService, FeaturesResponseModel, ServerType, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel,
} from '@tailormap-viewer/api';
import { GetFeaturesParams } from '../../models/get-features-param.model';
import { map, Observable } from 'rxjs';
import { FeaturesFilterHelper } from '../helpers/features-filter.helper';
import { GetLayerDetailsParams } from '../../models/get-layer-details-param.model';

@Injectable({
  providedIn: 'root',
})
export class FilterApiService implements FilterApiServiceModel {

  private store$ = inject(Store);
  private filterManagerService = inject(FilterManagerService);
  private api = inject(TAILORMAP_API_V1_SERVICE);
  private describeLayerService = inject(DescribeAppLayerService);

  public initDefaultFilterSource(): void {
    this.filterManagerService.addFilterSource({
      id: 'tm-default-layers',
      availableLayers$: this.store$.select(selectOrderedVisibleLayersWithServices)
        .pipe(map(FilterApiService.mapLayersToFilterLayer)),
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

  private static mapLayersToFilterLayer(layers: ExtendedAppLayerModel[]): FilterableLayerModel[] {
    return layers.map(l => ({
      id: l.id,
      label: l.title || l.layerName,
      filterable: l.service?.serverType === ServerType.GEOSERVER && l.hasAttributes,
      referencable: l.hasAttributes,
    })).filter(layer => layer.filterable || layer.referencable);
  }

}
