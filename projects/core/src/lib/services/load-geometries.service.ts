import { inject, Injectable } from '@angular/core';
import { FeatureModel, TAILORMAP_API_V1_SERVICE } from '@tailormap-viewer/api';
import { catchError, filter, map, Observable, of, switchMap, take } from 'rxjs';
import { selectViewerId } from '../state';
import { TypesHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';

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
  private api = inject(TAILORMAP_API_V1_SERVICE);
  public loadGeometries$(maxFeatures: number, layerId: string, cqlFilter: string | undefined): Observable<LoadedFeaturesResponse> {
    return this.store$.select(selectViewerId)
      .pipe(
        take(1),
        filter(TypesHelper.isDefined),
        switchMap(applicationId => {
          return this.api.getFeatures$({
            layerId,
            applicationId,
            page: 1,
            pageSize: maxFeatures,
            filter: cqlFilter === '' ? undefined : cqlFilter,
            simplify: false,
            onlyGeometries: true,
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
        map((response): LoadedFeaturesResponse => {
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
