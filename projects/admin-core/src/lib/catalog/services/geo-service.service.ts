import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ApiResponseHelper,
  ApplicationModel,
  CatalogItemKindEnum, CatalogModelHelper,
  GeoServiceModel,
  GeoServiceProtocolEnum, GeoServiceSettingsModel, GeoServiceWithLayersModel, TailormapAdminApiV1Service,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, filter, map, MonoTypeOperatorFunction, Observable, of, pipe, switchMap, take, tap } from 'rxjs';
import { addGeoService, deleteGeoService, loadCatalog, loadDraftGeoService, updateGeoService } from '../state/catalog.actions';
import { CatalogService } from './catalog.service';
import { GeoServiceCreateModel, GeoServiceUpdateModel, GeoServiceWithIdUpdateModel } from '../models/geo-service-update.model';
import {
  selectCatalogLoadStatus,
  selectDraftGeoService, selectDraftGeoServiceLoadStatus,
  selectGeoServiceById, selectGeoServiceLayers, selectGeoServices, selectGeoServicesAndLayers,
} from '../state/catalog.selectors';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ApplicationService } from '../../application/services/application.service';
import { ApplicationModelHelper } from '../../application/helpers/application-model.helper';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { DebounceHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';

export interface DeleteGeoServiceResponse {
  success: boolean;
  applicationsUsingService?: ApplicationModel[];
}

@Injectable({
  providedIn: 'root',
})
export class GeoServiceService {

  constructor(
    private store$: Store,
    private adminApiService: TailormapAdminApiV1Service,
    private adminSnackbarService: AdminSnackbarService,
    private catalogService: CatalogService,
    private applicationService: ApplicationService,
    private sseService: AdminSseService,
  ) { }

  public listenForGeoServiceChanges() {
    this.sseService.listenForEvents$<GeoServiceWithLayersModel>('GeoService')
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
          this.updateGeoServiceState(event.details.object.id, 'add', CatalogModelHelper.addTypeToGeoServiceModel(event.details.object));
        }
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateGeoServiceState(event.details.object.id, 'update', CatalogModelHelper.addTypeToGeoServiceModel(event.details.object));
        }
        if (event.eventType === EventType.ENTITY_DELETED) {
          this.updateGeoServiceState(event.details.id, 'remove');
        }
      });
  }

  public getDraftGeoService$(id: string) {
    return this.store$.select(selectDraftGeoService)
      .pipe(
        tap(draftGeoService => {
          if (draftGeoService?.id !== id) {
            this.store$.dispatch(loadDraftGeoService({ id }));
          }
        }),
        switchMap(() => this.store$.select(selectDraftGeoServiceLoadStatus)),
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        switchMap(() => this.store$.select(selectDraftGeoService)),
      );
  }

  public createGeoService$(geoService: GeoServiceCreateModel, catalogNodeId: string) {
    const geoServiceModel: Omit<GeoServiceModel, 'id' | 'type'> = {
      ...geoService,
      settings: {
        ...geoService.settings,
        defaultLayerSettings: {
          hiDpiDisabled: geoService.protocol === GeoServiceProtocolEnum.WMTS,
        },
      },
    };
    return this.adminApiService.createGeoService$({ geoService: geoServiceModel, refreshCapabilities: true }).pipe(
      catchError((errorResponse) => {
        const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
        this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.error-creating-service:Error while creating geo service: ${message}`);
        return of(null);
      }),
      concatMap(createdService => {
        if (createdService) {
          this.updateGeoServiceState(createdService.id, 'add', createdService);
          return this.catalogService.addItemToCatalog$(catalogNodeId, createdService.id, CatalogItemKindEnum.GEO_SERVICE)
            .pipe(
              map(() => createdService),
            );
        }
        return of(null);
      }),
    );
  }

  public updateGeoService$(
    geoServiceId: string,
    getUpdatedService: (service: ExtendedGeoServiceModel) => Partial<GeoServiceUpdateModel>,
    getUpdatedSettings?: (settings: GeoServiceSettingsModel) => Partial<GeoServiceSettingsModel>,
  ) {
    return this.getGeoServiceById$(geoServiceId)
      .pipe(
        concatMap(service => {
          const updatedGeoService: GeoServiceWithIdUpdateModel = {
            ...getUpdatedService(service),
            settings: { ...service.settings, ...(getUpdatedSettings ? getUpdatedSettings(service.settings || {}) : {}) },
            id: service.id,
          };
          return this.adminApiService.updateGeoService$({ id: updatedGeoService.id, geoService: updatedGeoService }).pipe(
            this.handleUpdateGeoService($localize `:@@admin-core.catalog.error-updating-service:Error while updating geo service: `),
          );
        }),
      );
  }

  public deleteGeoService$(geoServiceId: string, catalogNodeId: string): Observable<DeleteGeoServiceResponse> {
    // Check if this service is used in any application
    return this.getApplicationsUsingService$(geoServiceId)
      .pipe(
        take(1),
        concatMap(applicationsUsingService => {
          if (applicationsUsingService.length) {
            // Service is used, return error
            return of({
              success: false,
              applicationsUsingService,
            });
          }
          // Delete the service
          return this.adminApiService.deleteGeoService$({ id: geoServiceId }).pipe(
            catchError((errorResponse) => {
              const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
              this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.error-deleting-service:Error while deleting geo service: ${message}`);
              return of(null);
            }),
            tap(success => {
              if (success) {
                // Remove the service from the store
                this.updateGeoServiceState(geoServiceId, 'remove');
              }
            }),
            concatMap(success => {
              // Remove the service from the catalog
              if (success) {
                return this.catalogService.removeItemFromCatalog$(catalogNodeId, geoServiceId, CatalogItemKindEnum.GEO_SERVICE)
                  .pipe(map(response => !!response && !!success));
              }
              return of(false);
            }),
            // Return whether everything was successful
            map(success => ({ success: !!success })),
          );
        }),
      );
  }

  public getApplicationsUsingService$(serviceId: string) {
    return this.applicationService.getApplications$()
      .pipe(
        map(applications => {
          return applications.filter(app => {
            const layerNodes = [
              ...app.contentRoot?.layerNodes || [],
              ...app.contentRoot?.baseLayerNodes || [],
            ];
            return layerNodes.some(layerNode => {
              return ApplicationModelHelper.isLayerTreeNode(layerNode) && layerNode.serviceId === serviceId;
            });
          });
        }),
      );
  }

  public refreshGeoService$(serviceId: string): Observable<GeoServiceModel | null> {
    return this.getGeoServiceById$(serviceId)
      .pipe(
        concatMap(service => {
          return this.adminApiService.refreshGeoService$({ id: service.id })
            .pipe(
              this.handleUpdateGeoService($localize `:@@admin-core.catalog.error-refreshing-service:Error while refreshing geo service: `),
            );
        }),
      );
  }

  public getGeoServicesAndLayers$(): Observable<{ services: ExtendedGeoServiceModel[]; layers: ExtendedGeoServiceLayerModel[] }> {
    return this.store$.select(selectCatalogLoadStatus)
      .pipe(
        tap(loadStatus => {
            if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
              this.store$.dispatch(loadCatalog());
            }
        }),
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        switchMap(() => this.store$.select(selectGeoServicesAndLayers)),
      );
  }

  private getGeoServiceById$(serviceId: string) {
    return this.store$.select(selectGeoServiceById(serviceId))
      .pipe(
        take(1),
        filter((service): service is ExtendedGeoServiceModel => !!service),
      );
  }

  private handleUpdateGeoService(errorMsg: string): MonoTypeOperatorFunction<GeoServiceWithLayersModel | null> {
    return pipe(
      catchError((errorResponse) => {
        const message = ApiResponseHelper.getAdminApiErrorMessage(errorResponse);
        this.adminSnackbarService.showMessage(errorMsg + message);
        return of(null);
      }),
      map((updatedService: GeoServiceWithLayersModel | null) => {
        if (updatedService) {
          this.updateGeoServiceState(updatedService.id, 'update', updatedService);
          return updatedService;
        }
        return null;
      }),
    );
  }

  private updateGeoServiceState(
    id: string,
    type: 'add' | 'update' | 'remove',
    geoService?: GeoServiceWithLayersModel | null,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`geo-service-${type}-${id}`, () => {
      if (type === 'add' && geoService) {
        this.store$.dispatch(addGeoService({ service: geoService }));
      }
      if (type === 'update' && geoService) {
        this.store$.dispatch(updateGeoService({ service: geoService }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteGeoService({ id }));
      }
    }, 50);
  }

}
