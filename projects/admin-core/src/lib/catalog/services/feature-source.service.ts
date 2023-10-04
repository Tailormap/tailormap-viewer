import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import {
  ApiResponseHelper,
  CatalogItemKindEnum, CatalogModelHelper, FeatureSourceModel, FeatureTypeModel, TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { CatalogService } from './catalog.service';
import { catchError, concatMap, filter, map, MonoTypeOperatorFunction, Observable, of, pipe, switchMap, take, tap } from 'rxjs';
import {
  addFeatureSources, deleteFeatureSource, updateFeatureSource, updateFeatureType,
} from '../state/catalog.actions';
import { FeatureSourceCreateModel, FeatureSourceUpdateModel, FeatureTypeUpdateModel } from '../models/feature-source-update.model';
import { selectFeatureSourceById, selectFeatureTypeById, selectFeatureTypesForSource } from '../state/catalog.selectors';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { GeoServiceService } from './geo-service.service';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { DebounceHelper } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class FeatureSourceService {

  constructor(
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
    private adminSnackbarService: AdminSnackbarService,
    private catalogService: CatalogService,
    private geoServiceService: GeoServiceService,
    private sseService: AdminSseService,
  ) { }

  public createFeatureSource$(source: FeatureSourceCreateModel, catalogNodeId: string) {
    const featureSource: Omit<FeatureSourceModel, 'id' | 'type' | 'featureTypes'> = { ...source };
    return this.adminApiService.createFeatureSource$({ featureSource, refreshCapabilities: true }).pipe(
      catchError((errorResponse) => {
        const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
        this.adminSnackbarService.showMessage($localize `Error while creating feature source: ${message}`);
        return of(null);
      }),
      concatMap(createdFeatureSource => {
        if (createdFeatureSource) {
          this.updateFeatureSourceState(createdFeatureSource.id, 'add', createdFeatureSource, catalogNodeId);
          return this.catalogService.addItemToCatalog$(catalogNodeId, createdFeatureSource.id, CatalogItemKindEnum.FEATURE_SOURCE)
            .pipe(
              map(() => createdFeatureSource),
            );
        }
        return of(null);
      }),
    );
  }

  public listenForFeatureSourceChanges() {
    this.sseService.listenForEvents$<FeatureSourceModel>('TMFeatureSource')
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
          this.updateFeatureSourceState(event.details.object.id, 'add', CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceModel(event.details.object));
        }
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateFeatureSourceState(event.details.object.id, 'update', CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceModel(event.details.object));
        }
        if (event.eventType === EventType.ENTITY_DELETED) {
          this.updateFeatureSourceState(event.details.id, 'remove');
        }
      });
    this.sseService.listenForEvents$<FeatureTypeModel>('TMFeatureType')
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateFeatureTypeState(event.details.object);
        }
      });
  }

  public updateFeatureSource$(
    featureSourceId: string,
    updatedSource: FeatureSourceUpdateModel,
  ) {
    return this.getFeatureSourceById$(featureSourceId)
      .pipe(
        concatMap(featureSource => {
          return this.adminApiService.updateFeatureSource$({ id: featureSource.id, featureSource: { id: featureSource.id, ...updatedSource } })
            .pipe(
              this.handleUpdateFeatureSource($localize `Error while updating feature source: `, featureSource.catalogNodeId),
            );
        }),
      );
  }

  public updateFeatureType$(
    featureTypeId: string,
    updatedFeatureType: FeatureTypeUpdateModel,
  ): Observable<FeatureTypeModel | null> {
    return this.store$.select(selectFeatureTypeById(featureTypeId))
      .pipe(
        take(1),
        filter((featureType): featureType is ExtendedFeatureTypeModel => !!featureType),
        concatMap(featureType => {
          return this.adminApiService.updateFeatureType$({ id: featureType.originalId, featureType: updatedFeatureType })
            .pipe(
              catchError((errorResponse) => {
                const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
                this.adminSnackbarService.showMessage($localize `Error while updating feature type: ${message}`);
                return of(null);
              }),
              tap((updateResult: FeatureTypeModel | null) => {
                if (updateResult) {
                  this.updateFeatureTypeState(updateResult, featureType.catalogNodeId);
                }
              }),
            );
        }),
      );
  }

  public deleteFeatureSource$(featureSourceId: string, catalogNodeId: string) {
    return this.adminApiService.deleteFeatureSource$({ id: featureSourceId }).pipe(
      catchError((errorResponse) => {
        const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
        this.adminSnackbarService.showMessage($localize `Error while deleting source: ${message}`);
        return of(null);
      }),
      tap(success => {
        if (success) {
          // Remove the service from the store
          this.updateFeatureSourceState(featureSourceId, 'remove');
        }
      }),
      concatMap(success => {
        // Remove the service from the catalog
        if (success) {
          return this.catalogService.removeItemFromCatalog$(catalogNodeId, featureSourceId, CatalogItemKindEnum.FEATURE_SOURCE)
            .pipe(map(response => !!response && !!success));
        }
        return of(false);
      }),
      // Return whether everything was successful
      map(success => ({ success: !!success })),
    );
  }

  public refreshFeatureSource$(featureSourceId: string): Observable<FeatureSourceModel | null> {
    return this.getFeatureSourceById$(featureSourceId)
      .pipe(
        concatMap(featureSource => {
          return this.adminApiService.refreshFeatureSource$({ id: featureSource.id })
            .pipe(
              this.handleUpdateFeatureSource($localize `Error while refreshing feature source: `, featureSource.catalogNodeId),
            );
        }),
      );
  }

  private getFeatureSourceById$(featureTypeId: string) {
    return this.store$.select(selectFeatureSourceById(featureTypeId))
      .pipe(
        take(1),
        filter((featureType): featureType is ExtendedFeatureSourceModel => !!featureType),
      );
  }

  private handleUpdateFeatureSource(errorMsg: string, catalogNodeId: string): MonoTypeOperatorFunction<FeatureSourceModel | null> {
    return pipe(
      catchError((errorResponse) => {
        const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
        this.adminSnackbarService.showMessage(errorMsg + message);
        return of(null);
      }),
      tap((updatedFeatureSource: FeatureSourceModel | null) => {
        if (updatedFeatureSource) {
          this.updateFeatureSourceState(updatedFeatureSource.id, 'update', updatedFeatureSource, catalogNodeId);
        }
      }),
    );
  }

  public getGeoServiceLayersUsingFeatureSource$(featureSourceId: string): Observable<ExtendedGeoServiceLayerModel[]> {
    return this.store$.select(selectFeatureTypesForSource(featureSourceId))
      .pipe(
        take(1),
        switchMap((featureTypes: ExtendedFeatureTypeModel[]) => {
          const featureTypesSet = new Set(featureTypes.map(ft => ft.name));
          return this.geoServiceService.getGeoServiceLayers$()
            .pipe(
              map(layers => {
                return layers.filter(layer => {
                  if (!layer.settings?.featureType) {
                    return false;
                  }
                  return `${layer.settings.featureType.featureSourceId}` === featureSourceId
                    && featureTypesSet.has(layer.settings.featureType.featureTypeName);
                });
              }),
            );
        }),
      );
  }

  private updateFeatureSourceState(
    id: string,
    type: 'add' | 'update' | 'remove',
    featureSource?: FeatureSourceModel | null,
    catalogNodeId?: string,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`feature-source-${type}-${id}`, () => {
      if (type === 'add' && featureSource) {
        this.store$.dispatch(addFeatureSources({ featureSources: [featureSource], parentNode: catalogNodeId || '' }));
      }
      if (type === 'update' && featureSource) {
        this.store$.dispatch(updateFeatureSource({ featureSource: featureSource, parentNode: catalogNodeId || '' }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteFeatureSource({ id }));
      }
    }, 50);
  }

  private updateFeatureTypeState(featureType: FeatureTypeModel, catalogNodeId?: string) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`feature-type-update-${featureType.id}`, () => {
      this.store$.dispatch(updateFeatureType({ featureType, parentNode: catalogNodeId || '' }));
    }, 50);
  }

}
