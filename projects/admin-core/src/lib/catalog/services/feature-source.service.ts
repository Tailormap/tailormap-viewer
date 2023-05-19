import { Store } from '@ngrx/store';
import { Inject, Injectable } from '@angular/core';
import {
  CatalogItemKindEnum, FeatureSourceModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { CatalogService } from './catalog.service';
import { catchError, concatMap, filter, map, of, take } from 'rxjs';
import { addFeatureSources, updateFeatureSource } from '../state/catalog.actions';
import { FeatureSourceCreateModel, FeatureSourceUpdateModel, FeatureTypeUpdateModel } from '../models/feature-source-update.model';
import { selectFeatureSourceById, selectFeatureTypeById } from '../state/catalog.selectors';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class FeatureSourceService {

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private adminSnackbarService: AdminSnackbarService,
    private catalogService: CatalogService,
  ) { }

  public createFeatureSource$(source: FeatureSourceCreateModel, catalogNodeId: string) {
    const featureSource: Omit<FeatureSourceModel, 'id' | 'type' | 'featureTypes'> = { ...source };
    return this.adminApiService.createFeatureSource$({ featureSource }).pipe(
      catchError(() => {
        this.adminSnackbarService.showMessage($localize `Error while creating feature source.`);
        return of(null);
      }),
      concatMap(createdFeatureSource => {
        if (createdFeatureSource) {
          this.store$.dispatch(addFeatureSources({ featureSources: [createdFeatureSource], parentNode: catalogNodeId }));
          return this.catalogService.addNodeToCatalog$(catalogNodeId, createdFeatureSource.id, CatalogItemKindEnum.FEATURE_SOURCE)
            .pipe(
              map(() => createdFeatureSource),
            );
        }
        return of(null);
      }),
    );
  }

  public updateFeatureSource$(
    featureSourceId: string,
    updatedSource: FeatureSourceUpdateModel,
  ) {
    return this.store$.select(selectFeatureSourceById(featureSourceId))
      .pipe(
        take(1),
        filter((featureSource): featureSource is ExtendedFeatureSourceModel => !!featureSource),
        concatMap(featureSource => {
          return this.adminApiService.updateFeatureSource$({ id: featureSource.id, featureSource: { id: featureSource.id, ...updatedSource } }).pipe(
            catchError(() => {
              this.adminSnackbarService.showMessage($localize `Error while updating feature source.`);
              return of(null);
            }),
            map(updatedFeatureSource => {
              if (updatedFeatureSource) {
                this.store$.dispatch(updateFeatureSource({ featureSource: updatedFeatureSource, parentNode: featureSource.catalogNodeId }));
                return updatedFeatureSource;
              }
              return null;
            }),
          );
        }),
      );
  }

  public updateFeatureType$(
    featureSourceId: string,
    featureTypeId: string,
    updatedFeatureType: FeatureTypeUpdateModel,
  ) {
    return this.store$.select(selectFeatureTypeById(featureTypeId))
      .pipe(
        take(1),
        filter((featureType): featureType is ExtendedFeatureTypeModel => !!featureType),
        concatMap(featureType => {
          return of({ ...featureType, ...updatedFeatureType });
        }),
      );
  }

}
