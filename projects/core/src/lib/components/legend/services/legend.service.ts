import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { catchError, combineLatest, concatMap, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { MapService, MapViewDetailsModel, ScaleHelper } from '@tailormap-viewer/map';
import { ExtendedAppLayerModel } from '../../../map/models';
import { ImageHelper } from '../../../shared/helpers/image.helper';
import { TypesHelper } from '@tailormap-viewer/shared';
import { LegendInfoModel } from '../models/legend-info.model';

@Injectable({
  providedIn: 'root',
})
export class LegendService {

  constructor(
    private mapService: MapService,
    @Inject(LOCALE_ID) private localeId: string,
  ) {
  }

  public getLegendInfo$(appLayers$: Observable<Array<ExtendedAppLayerModel | null> | ExtendedAppLayerModel | null>, mapResolution$?: Observable<MapViewDetailsModel>):
    Observable<LegendInfoModel[]> {
    return this.mapService.getLayerManager$()
      .pipe(
        switchMap(layerManager => combineLatest([ appLayers$, mapResolution$ || of(null) ]).pipe(
          map(([ appLayers, mapResolution ]) => {
            const layers = Array.isArray(appLayers) ? appLayers : [appLayers];
            return layers.filter(TypesHelper.isDefined).map(layer => {
              let url = layer.legendImageUrl
                ? layer.legendImageUrl
                : layerManager.getLegendUrl(`${layer.id}`);
              if (mapResolution && layer.legendType === 'dynamic') {
                try {
                  const urlObject = new URL(url);
                  urlObject.searchParams.set('SCALE', mapResolution.scale.toString());
                  if(this.localeId && layer.service?.serverType === 'geoserver') {
                    urlObject.searchParams.set('LANGUAGE', this.localeId);
                  }
                  url = urlObject.toString();
                } catch(_ignored) {
                  // Ignore errors
                }
              }
              return {
                layer,
                url: url.toString(),
                isInScale: ScaleHelper.isInScale(mapResolution?.scale, layer.minScale, layer.maxScale),
              };
            });
          }),
        )),
      );
  }

  public getLegendImages$(appLayers$: Observable<ExtendedAppLayerModel[]>, urlCallback?: (layer: ExtendedAppLayerModel, url: URL) => void):
    Observable<Array<{ appLayer: ExtendedAppLayerModel; imageData: string | null; width: number; height: number; error?: any }>> {
    return this.getLegendInfo$(appLayers$).pipe(
      concatMap(appLayerAndUrls => {
        if (appLayerAndUrls.length === 0) {
          return of([]);
        }
        return forkJoin(appLayerAndUrls.filter(lu => lu.url !== '').map(appLayerWithLegendUrl => {
          const url = new URL(appLayerWithLegendUrl.url);
          if (urlCallback) {
            urlCallback(appLayerWithLegendUrl.layer, url);
          }
          return ImageHelper.imageUrlToPng$(url.toString()).pipe(
            catchError((error) => {
              console.log(`Error getting legend from URL ${appLayerWithLegendUrl.url}`, error);
              return of({ imageData: null, width: 0, height: 0, appLayer: appLayerWithLegendUrl.layer, error });
            }),
            map(legendImage => ({
                  ...legendImage,
                  appLayer: appLayerWithLegendUrl.layer,
            })),
          );
        }));
      }),
    );
  }

}

