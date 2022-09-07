import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, concatMap, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { MapResolutionModel, MapService, ScaleHelper } from '@tailormap-viewer/map';
import { AppLayerWithServiceModel } from '../../../map/models';
import { ImageHelper } from '../../../shared/helpers/image.helper';
import { LegendInfoModel } from '../models/legend-info.model';

export interface GeoServerLegendOptions {
  fontName?: string;
  fontStyle?: 'italic' | 'bold';
  fontSize?: number;
  fontColor?: string;
  fontAntiAliasing?: boolean;
  bgColor?: string;
  dpi?: number;
  forceLabels?: 'on' | 'off';
  forceTitles?: 'on' | 'off';
  labelMargin?: number;
  layout?: 'vertical' | 'horizontal';
  columnheight?: number;
  rowwidth?: number;
  columns?: number;
  rows?: number;
  grouplayout?: 'vertical' | 'horizontal';
  countMatched?: boolean;
  hideEmptyRules?: boolean;
  wrap?: boolean;
  wrap_limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LegendService {

  private visibleSubject$ = new BehaviorSubject(false);

  constructor(
    private mapService: MapService,
  ) {
  }

  public toggleVisible() {
    this.visibleSubject$.next(!this.visibleSubject$.value);
  }

  public isVisible$(): Observable<boolean> {
    return this.visibleSubject$.asObservable();
  }

  public getLegendInfo$(appLayers$: Observable<AppLayerWithServiceModel[]>, mapResolution$?: Observable<MapResolutionModel>):
    Observable<LegendInfoModel[]> {
    return this.mapService.getLayerManager$()
      .pipe(
        switchMap(layerManager => combineLatest([ appLayers$, mapResolution$ || of(null) ]).pipe(
          map(([ appLayers, mapResolution ]) => {
            return appLayers.map(layer => {
              let url = layer.legendImageUrl
                ? layer.legendImageUrl
                : layerManager.getLegendUrl(`${layer.id}`);
              if (mapResolution) {
                try {
                  const urlObject = new URL(url);
                  urlObject.searchParams.set('SCALE', mapResolution.scale.toString());
                  url = urlObject.toString();
                } catch(_ignored) {}
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

  public getLegendImages$(appLayers$: Observable<AppLayerWithServiceModel[]>, urlCallback?: (layer: AppLayerWithServiceModel, url: URL) => void):
    Observable<Array<{ appLayer: AppLayerWithServiceModel; imageData: string | null; width: number; height: number; error?: any }>> {
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

  public static isGetLegendGraphicRequest(url: string): boolean {
    try {
      const u = new URL(url);
      return u.searchParams.get('REQUEST') === 'GetLegendGraphic';
    } catch(e) {
      return false;
    }
  }

  public static addGeoServerLegendOptions(url: string, legendOptions: GeoServerLegendOptions): string {
    try {
      const u = new URL(url);
      u.searchParams.set('LEGEND_OPTIONS', Object.entries(legendOptions).map(entry => entry.join(':')).join(';'));
      return u.toString();
    } catch(e) {
      return url;
    }
  }
}

