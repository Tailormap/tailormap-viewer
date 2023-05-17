import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ApplicationModel,
  CatalogItemKindEnum,
  GeoServiceModel,
  GeoServiceProtocolEnum, GeoServiceSettingsModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, filter, map, Observable, of, take, tap } from 'rxjs';
import { addGeoServices, deleteGeoService, updateGeoService } from '../state/catalog.actions';
import { CatalogService } from './catalog.service';
import { GeoServiceCreateModel, GeoServiceUpdateModel, GeoServiceWithIdUpdateModel } from '../models/geo-service-update.model';
import { selectGeoServiceById } from '../state/catalog.selectors';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ApplicationService } from '../../application/services/application.service';
import { ApplicationModelHelper } from '../../application/helpers/application-model.helper';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

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
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private adminSnackbarService: AdminSnackbarService,
    private catalogService: CatalogService,
    private applicationService: ApplicationService,
  ) { }

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
    return this.adminApiService.createGeoService$({ geoService: geoServiceModel }).pipe(
      catchError(() => {
        this.adminSnackbarService.showMessage($localize `Error while creating geo service.`);
        return of(null);
      }),
      concatMap(createdService => {
        if (createdService) {
          this.store$.dispatch(addGeoServices({ services: [createdService], parentNode: catalogNodeId }));
          return this.catalogService.addNodeToCatalog$(catalogNodeId, createdService.id, CatalogItemKindEnum.GEO_SERVICE)
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
    return this.store$.select(selectGeoServiceById(geoServiceId))
      .pipe(
        take(1),
        filter((service): service is ExtendedGeoServiceModel => !!service),
        concatMap(service => {
          return this._updateGeoService$({
            ...getUpdatedService(service),
            settings: { ...service.settings, ...(getUpdatedSettings ? getUpdatedSettings(service.settings || {}) : {}) },
            id: service.id,
          }, service.catalogNodeId);
        }),
      );
  }

  private _updateGeoService$(geoService: GeoServiceWithIdUpdateModel, catalogNodeId: string) {
    return this.adminApiService.updateGeoService$({ id: geoService.id, geoService }).pipe(
      catchError(() => {
        this.adminSnackbarService.showMessage($localize `Error while updating geo service.`);
        return of(null);
      }),
      map(updatedService => {
        if (updatedService) {
          this.store$.dispatch(updateGeoService({ service: updatedService, parentNode: catalogNodeId }));
          return updatedService;
        }
        return null;
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
            catchError(() => {
              this.adminSnackbarService.showMessage($localize `Error while deleting geo service.`);
              return of(null);
            }),
            tap(success => {
              if (success) {
                // Remove the service from the store
                this.store$.dispatch(deleteGeoService({ id: geoServiceId }));
              }
            }),
            concatMap(success => {
              // Remove the service from the catalog
              if (success) {
                return this.catalogService.removeNodeFromCatalog$(catalogNodeId, geoServiceId, CatalogItemKindEnum.GEO_SERVICE)
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

}
