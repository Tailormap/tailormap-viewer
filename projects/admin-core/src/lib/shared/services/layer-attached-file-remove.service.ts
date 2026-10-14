import { inject, Injectable } from '@angular/core';
import { UploadInUseItem, UploadRemoveServiceModel } from '../components/select-upload/models/upload-remove-service.model';
import { combineLatest, map } from 'rxjs';
import { GeoServiceService } from '../../catalog/services/geo-service.service';
import { take } from 'rxjs/operators';
import { ApplicationService } from '../../application/services/application.service';
import { CatalogRouteHelper } from '../../catalog/helpers/catalog-route.helper';
import { Routes } from '../../routes';
import { ApplicationTreeHelper } from '../../application/helpers/application-tree.helper';

@Injectable()
export class LayerAttachedFileRemoveService implements UploadRemoveServiceModel {
  private geoServiceService = inject(GeoServiceService);
  private applicationService = inject(ApplicationService);

  public isUploadInUse$(fileId: string) {
    const servicesAndLayers$ = this.geoServiceService.getGeoServicesAndLayers$();
    const applications$ = this.applicationService.getApplications$();

    const search = "upload://" + fileId;

    return combineLatest([ servicesAndLayers$, applications$ ]).pipe(
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

        const layerMap = ApplicationTreeHelper.getLayerMap(servicesAndLayers.layers);

        const inUseInAppLayerDescription = applications.reduce<UploadInUseItem[]>((acc, app) => {
          const matchingLayers = Object.entries(app.settings?.layerSettings || {})
            .filter(([ _layerId, layerNode ]) => layerNode.description?.includes(search))
            .map<UploadInUseItem | null>(([ appLayerId, _layerNode ]) => {
              const layerNode = app.contentRoot?.layerNodes.find(node => node.id === appLayerId);
              if (!layerNode) {
                return null;
              }
              const appLayerTitle = ApplicationTreeHelper.getTreeModelLabel(layerNode, layerMap, app.settings?.layerSettings || null, 'layer');
              return {
                id: app.id,
                name: (app.title || app.name) + ': ' + appLayerTitle,
                url: [
                  '/admin',
                  Routes.APPLICATION,
                  Routes.APPLICATION_DETAILS.replace(':applicationId', app.id),
                  Routes.APPLICATION_DETAILS_LAYERS,
                ].join('/'),
              };
            })
            .filter((item): item is UploadInUseItem => !!item);
          return [ ...acc, ...matchingLayers ];
        }, []);

        return [ ...inUseInServiceDefaultLayerDescription, ...inUseInServiceLayerDescription, ...inUseInAppLayerDescription ];

      }));
  }
}
