import { inject, Injectable } from '@angular/core';
import { UploadInUseItem, UploadRemoveServiceModel } from '../components/select-upload/models/upload-remove-service.model';
import { map } from 'rxjs';
import { GeoServiceService } from '../../catalog/services/geo-service.service';
import { take, withLatestFrom } from 'rxjs/operators';
import { ApplicationService } from '../../application/services/application.service';
import { CatalogRouteHelper } from '../../catalog/helpers/catalog-route.helper';
import { Routes } from '../../routes';

@Injectable()
export class LayerAttachedFileRemoveService implements UploadRemoveServiceModel {
  private geoServiceService = inject(GeoServiceService);
  private applicationService = inject(ApplicationService);

  public isUploadInUse$(fileId: string) {
    const servicesAndLayers$ = this.geoServiceService.getGeoServicesAndLayers$();
    const applications$ = this.applicationService.getApplications$();

    const search = "upload://" + fileId;

    return servicesAndLayers$.pipe(
      withLatestFrom(applications$),
      take(1),
      map(([ servicesAndLayers, applications ]) => {
        const { services, layers } = servicesAndLayers;

        const inUseInServiceDefaultLayerDescription = services.reduce<UploadInUseItem[]>((serviceWithUploadInDefaultLayerDescription, geoService) => {
          const defaultLayerSettings = geoService.settings?.defaultLayerSettings;
          if (defaultLayerSettings?.description?.includes(search)) {
            const item = {
              id: geoService.id,
              name: geoService.title,
              url: CatalogRouteHelper.getGeoServiceUrl(geoService),
            };
            return [ ...serviceWithUploadInDefaultLayerDescription, item ];
          }
          return serviceWithUploadInDefaultLayerDescription;
        }, []);

        const inUseInServiceLayerDescription = services.reduce<UploadInUseItem[]>((layersWithUploadInDescription, geoService) => {
          const matchingLayers = Object.entries(geoService.settings?.layerSettings || {})
            .filter(([ _layerName, layerSettings ]) => layerSettings.description?.includes(search))
            .map(([ layerName, settings ]) => {
              const layer = layers.find(l => l.name === layerName && l.serviceId === geoService.id);
              if (!layer) {
                return null;
              }
              return {
                id: layer.id,
                name: settings.title || layer.name,
                url: CatalogRouteHelper.getGeoServiceLayerUrl(layer),
              };
            })
            .filter((item): item is UploadInUseItem => item !== null);
          return [ ...layersWithUploadInDescription, ...matchingLayers ];
        }, []);

        const inUseInAppLayerDescription = applications.reduce<UploadInUseItem[]>((acc, app) => {
          const matchingLayers = Object.entries(app.settings?.layerSettings || {})
            .filter(([ _layerId, layerNode ]) => layerNode.description?.includes(search))
            .map(([ layerId, _layerNode ]) => ({
              id: app.id,
              name: (app.title || app.name) + ', ' + layerId, // TODO get title from appLayer title, geoService layer settings title, geoService layer title, name
              url: [
                '/admin',
                Routes.APPLICATION,
                Routes.APPLICATION_DETAILS.replace(':applicationId', app.id),
                Routes.APPLICATION_DETAILS_LAYERS,
              ].join('/'),
            }));
          return [ ...acc, ...matchingLayers ];
        }, []);

        return [ ...inUseInServiceDefaultLayerDescription, ...inUseInServiceLayerDescription, ...inUseInAppLayerDescription ];

      }));
  }
}
