import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import {
  ApiResponseHelper,
  CatalogItemKindEnum, CatalogModelHelper, FeatureSourceModel, FeatureTypeModel,
  TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { CatalogService } from './catalog.service';
import { catchError, concatMap, filter, map, MonoTypeOperatorFunction, Observable, of, pipe, switchMap, take, tap, timer } from 'rxjs';
import {
  addFeatureSources, deleteFeatureSource, loadDraftFeatureSource, updateFeatureSource, updateFeatureType,
} from '../state/catalog.actions';
import { FeatureSourceCreateModel, FeatureSourceUpdateModel, FeatureTypeUpdateModel } from '../models/feature-source-update.model';
import {
  selectDraftFeatureSource, selectDraftFeatureSourceLoadStatus,
  selectFeatureSourceById, selectFeatureTypesForSource, selectGeoServiceLayers,
} from '../state/catalog.selectors';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminSseService, EventType, SSEEvent } from '../../shared/services/admin-sse.service';
import { DebounceHelper, LoadingStateEnum } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class FeatureSourceService {

  constructor(
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
    private adminSnackbarService: AdminSnackbarService,
    private catalogService: CatalogService,
    private sseService: AdminSseService,
  ) { }

  public getDraftFeatureSource$(id: string) {
      return this.store$.select(selectDraftFeatureSource)
        .pipe(
          tap(draftFeatureSource => {
            if (draftFeatureSource?.id !== id) {
              this.store$.dispatch(loadDraftFeatureSource({ id }));
            }
          }),
          switchMap(() => this.store$.select(selectDraftFeatureSourceLoadStatus)),
          filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
          switchMap(() => this.store$.select(selectDraftFeatureSource)),
        );
  }

  public getDraftFeatureType$(id: string, featureSourceId: string) {
    return this.getDraftFeatureSource$(featureSourceId)
      .pipe(
        map(featureSource => featureSource?.featureTypes.find(f => `${f.id}` === `${id}`) || null),
      );
  }

  public loadFeatureType$(featureTypeName: string, featureSourceId: string): Observable<FeatureTypeModel | null> {
    return this.adminApiService.getFeatureSource$({ id: featureSourceId })
      .pipe(
        take(1),
        catchError(() => of(null)),
        map(featureSource => {
          return featureSource?.featureTypes.find(f => f.name === featureTypeName) || null;
        }),
      );
  }

  public createFeatureSource$(source: FeatureSourceCreateModel, catalogNodeId: string) {
    const featureSource: Omit<FeatureSourceModel, 'id' | 'type' | 'featureTypes'> = { ...source };
    return this.adminApiService.createFeatureSource$({ featureSource, refreshCapabilities: true }).pipe(
      catchError((errorResponse) => {
        const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
        this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.error-creating-feature-source:Error while creating feature source: ${message}`);
        return of(null);
      }),
      concatMap(createdFeatureSource => {
        if (createdFeatureSource) {
          this.updateFeatureSourceState(createdFeatureSource.id, 'add', createdFeatureSource);
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
      .pipe(
        takeUntilDestroyed(),
        concatMap((event): Observable<SSEEvent<FeatureSourceModel>> => {
          if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
            return this.getFeatureSourceForCreateEvent$(event);
          }
          return of(event);
        }),
      )
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
    return this.adminApiService.updateFeatureSource$({ id: featureSourceId, featureSource: { id: featureSourceId, ...updatedSource } })
      .pipe(
        this.handleUpdateFeatureSource($localize `:@@admin-core.catalog.error-updating-feature-source:Error while updating feature source: `),
      );
  }

  public updateFeatureType$(
    featureTypeId: string,
    updatedFeatureType: FeatureTypeUpdateModel,
  ): Observable<FeatureTypeModel | null> {
    return this.adminApiService.updateFeatureType$({ id: featureTypeId, featureType: updatedFeatureType })
      .pipe(
        catchError((errorResponse) => {
          const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
          this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.error-updating-feature-type:Error while updating feature type: ${message}`);
          return of(null);
        }),
        tap((updateResult: FeatureTypeModel | null) => {
          if (updateResult) {
            this.updateFeatureTypeState(updateResult);
          }
        }),
      );
  }

  public deleteFeatureSource$(featureSourceId: string, catalogNodeId: string) {
    return this.adminApiService.deleteFeatureSource$({ id: featureSourceId }).pipe(
      catchError((errorResponse) => {
        const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
        this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.error-deleting-feature-source:Error while deleting source: ${message}`);
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
              // eslint-disable-next-line max-len
              this.handleUpdateFeatureSource($localize `:@@admin-core.catalog.error-refreshing-feature-source:Error while refreshing feature source: `),
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

  private handleUpdateFeatureSource(errorMsg: string): MonoTypeOperatorFunction<FeatureSourceModel | null> {
    return pipe(
      catchError((errorResponse) => {
        const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
        this.adminSnackbarService.showMessage(errorMsg + message);
        return of(null);
      }),
      tap((updatedFeatureSource: FeatureSourceModel | null) => {
        if (updatedFeatureSource) {
          this.updateFeatureSourceState(updatedFeatureSource.id, 'update', updatedFeatureSource);
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
          return this.store$.select(selectGeoServiceLayers)
            .pipe(
              map(layers => {
                return layers.filter(layer => {
                  if (!layer.layerSettings?.featureType) {
                    return false;
                  }
                  return `${layer.layerSettings.featureType.featureSourceId}` === featureSourceId
                    && featureTypesSet.has(layer.layerSettings.featureType.featureTypeName);
                });
              }),
            );
        }),
      );
  }

  private getFeatureSourceForCreateEvent$(event: SSEEvent<FeatureSourceModel>): Observable<SSEEvent<FeatureSourceModel>> {
    // When the event for new FeatureSource created is sent through SSE, the feature types do not yet have an id assigned.
    // After this event is sent, we wait for 1 second and then fetch the feature source manually,
    // so we are sure the feature source and the feature types are properly persisted. See issue HTM-966.
    return timer(1000)
      .pipe(
        switchMap(()  => this.adminApiService.getFeatureSource$({ id: event.details.object.id })),
        map((featureSource): SSEEvent<FeatureSourceModel> => ({
          ...event,
          details: {
            ...event.details,
            object: featureSource,
          },
        })),
      );
  }

  private updateFeatureSourceState(
    id: string,
    type: 'add' | 'update' | 'remove',
    featureSource?: FeatureSourceModel | null,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`feature-source-${type}-${id}`, () => {
      if (type === 'add' && featureSource) {
        this.store$.dispatch(addFeatureSources({ featureSource: CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceModel(featureSource) }));
      }
      if (type === 'update' && featureSource) {
        this.store$.dispatch(updateFeatureSource({ featureSource: CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceModel(featureSource) }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteFeatureSource({ id: `${id}` }));
      }
    }, 50);
  }

  private updateFeatureTypeState(featureType: FeatureTypeModel) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`feature-type-update-${featureType.id}`, () => {
      this.store$.dispatch(updateFeatureType({ featureType: { ...featureType, id: `${featureType.id}` } }));
    }, 50);
  }

}
