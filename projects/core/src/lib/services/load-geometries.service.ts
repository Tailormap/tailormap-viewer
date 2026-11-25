import { inject, Injectable } from '@angular/core';
import { FeatureModel, FilterGroupModel } from '@tailormap-viewer/api';
import { catchError, combineLatest, filter, map, Observable, of, switchMap, take } from 'rxjs';
import { selectEnabledFilterGroups, selectViewerId } from '../state';
import { TypesHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { DataSourceManagerService } from '../services';
import { GetFeaturesParams } from '../models/get-features-param.model';

interface LoadFeaturesResponse {
  features: FeatureModel[];
  error: boolean;
  exceededMaxFeatures: boolean;
}

interface LoadedFeature {
  __fid: string;
  geometry: string;
}

interface LoadedFeaturesResponse {
  features: LoadedFeature[];
  error: boolean;
  exceededMaxFeatures: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LoadGeometriesService {
  private store$ = inject(Store);
  private dataSourceManagerService = inject(DataSourceManagerService);
  public loadGeometries$(
    maxFeatures: number,
    layerId: string,
    layerName: string,
    bbox?: GetFeaturesParams['bbox'],
  ): Observable<LoadedFeaturesResponse> {
    return combineLatest([ this.store$.select(selectViewerId), this.store$.select(selectEnabledFilterGroups) ])
      .pipe(
        filter((result): result is [ string, FilterGroupModel[] ] => TypesHelper.isDefined(result[0])),
        take(1),
        switchMap(([ applicationId, filterGroups ]) => {
          return this.dataSourceManagerService.getFeatures$({
            layerId,
            applicationId,
            layerName,
            page: 1,
            pageSize: maxFeatures,
            filterGroups,
            bbox,
            includeGeometry: true,
          }).pipe(
            map((response): LoadFeaturesResponse => ({
              features: response.features,
              error: false,
              exceededMaxFeatures: response.features.length < (response.total || 0),
            })),
            catchError(() => {
              return of<LoadFeaturesResponse>(({ features: [], error: true, exceededMaxFeatures: false }));
            }),
          );
        }),
        map((response: LoadFeaturesResponse): LoadedFeaturesResponse => {
          const features: LoadedFeature[] = response.features.map<LoadedFeature | undefined>(feat => {
            if (!feat.geometry) {
              return undefined;
            }
            return {
              __fid: feat.__fid,
              geometry: feat.geometry,
            };
          }).filter(TypesHelper.isDefined);
          return {
            features,
            error: response.error,
            exceededMaxFeatures: response.exceededMaxFeatures,
          };
        }),
      );
  }

}
