import { Injectable } from '@angular/core';
import { UploadInUseItem, UploadRemoveServiceModel } from '../../shared/components/select-upload/models/upload-remove-service.model';
import { GeoServiceService } from './geo-service.service';
import { map, take } from 'rxjs';
import { CatalogRouteHelper } from '../helpers/catalog-route.helper';

@Injectable()
export class LegendImageRemoveService implements UploadRemoveServiceModel {

  constructor(
    private geoServiceService: GeoServiceService,
  ) {
  }

  public isImageInUse$(imageId: string) {
    return this.geoServiceService.getGeoServicesAndLayers$()
      .pipe(
        take(1),
        map(({ services, layers }) => {
          return services.reduce<UploadInUseItem[]>((layersWithImage, geoService) => {
            const inUseItems = Object.entries(geoService.settings?.layerSettings || {})
              .filter(([ _layerName, layerSettings ]) => layerSettings.legendImageId === imageId)
              .map<UploadInUseItem | null>(([ layerName, layerSettings ]) => {
                const layer = layers.find(l => l.name === layerName && l.serviceId === geoService.id);
                if (!layer) {
                  return null;
                }
                return {
                  id: layer.id,
                  name: layerSettings.title || layer.name,
                  url: CatalogRouteHelper.getGeoServiceLayerUrl(layer),
                };
              })
              .filter((item): item is UploadInUseItem => item !== null);
            return [ ...layersWithImage, ...inUseItems ];
          }, []);
        }),
      );
  }

}
