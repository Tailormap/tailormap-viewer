import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CatalogItemKindEnum,
  GeoServiceModel,
  GeoServiceProtocolEnum, GeoServiceSettingsModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, concatMap, filter, map, of, take, tap } from 'rxjs';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { addGeoServices, deleteGeoService, updateGeoService } from '../state/catalog.actions';
import { CatalogService } from './catalog.service';
import { GeoServiceCreateModel, GeoServiceUpdateModel, GeoServiceWithIdUpdateModel } from '../models/geo-service-update.model';
import { selectGeoServiceById } from '../state/catalog.selectors';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';

@Injectable({
  providedIn: 'root',
})
export class GeoServiceService {

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private snackBar: MatSnackBar,
    private catalogService: CatalogService,
  ) { }

  public createGeoService$(geoService: GeoServiceCreateModel, catalogNodeId: string) {
    const geoServiceModel: Omit<GeoServiceModel, 'id' | 'type'> = {
      ...geoService,
      settings: {
        defaultLayerSettings: {
          hiDpiDisabled: geoService.protocol === GeoServiceProtocolEnum.WMTS,
        },
      },
    };
    return this.adminApiService.createGeoService$({ geoService: geoServiceModel }).pipe(
      catchError(() => {
        this.showErrorMessage($localize `Error while creating geo service.`);
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
        this.showErrorMessage($localize `Error while updating geo service.`);
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

  public deleteGeoService$(geoServiceId: string) {
    return this.adminApiService.deleteGeoService$({ id: geoServiceId }).pipe(
      catchError(() => {
        this.showErrorMessage($localize `Error while deleting geo service.`);
        return of(null);
      }),
      tap(success => {
        if (success) {
          this.store$.dispatch(deleteGeoService({ id: geoServiceId }));
        }
      }),
    );
  }

  private showErrorMessage(message: string) {
    SnackBarMessageComponent.open$(this.snackBar, {
      message,
      duration: 3000,
      showCloseButton: true,
    });
  }

}
