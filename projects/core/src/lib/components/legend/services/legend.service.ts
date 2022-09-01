import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, concatMap, forkJoin, map, Observable, of, Subject, switchMap } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { AppLayerWithServiceModel } from '../../../map/models';

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

  public getAppLayerAndUrl$(appLayers$: Observable<AppLayerWithServiceModel[]>):
    Observable<Array<{ layer: AppLayerWithServiceModel; url: string }>> {
    return this.mapService.getLayerManager$()
      .pipe(
        switchMap(layerManager => appLayers$.pipe(
          map(appLayers => {
            return appLayers.map(layer => ({
              layer,
              url: layer.legendImageUrl
                ? layer.legendImageUrl
                : layerManager.getLegendUrl(`${layer.id}`),
            }));
          }),
        )),
      );
  }

  public getLegendImages$(appLayers$: Observable<AppLayerWithServiceModel[]>, urlCallback?: (layer: AppLayerWithServiceModel, url: URL) => void):
    Observable<Array<{ appLayer: AppLayerWithServiceModel; imageData: string; width: number; height: number }>> {
    return this.getAppLayerAndUrl$(appLayers$).pipe(
      concatMap(appLayerAndUrls => {
        if (appLayerAndUrls.length === 0) {
          return of([]);
        }
        return forkJoin(appLayerAndUrls.filter(lu => lu.url !== '').map(appLayerWithLegendUrl => {
          const url = new URL(appLayerWithLegendUrl.url);
          if (urlCallback) {
            urlCallback(appLayerWithLegendUrl.layer, url);
          }
          return LegendService.imageUrlToPng$(url.toString()).pipe(
            catchError((e) => {
              console.log(`Error getting legend from URL ${appLayerWithLegendUrl.url}`, e);
              return of(null);
            }),
            map(legendImage => ({
                  ...legendImage,
                  appLayer: appLayerWithLegendUrl.layer,
            })),
          );
        }));
      }),
      map(array => {
        return array.filter(a => a !== null) as Array<{ appLayer: AppLayerWithServiceModel; imageData: string; width: number; height: number }>;
      }),
    );
  }

  public static imageUrlToPng$(imageUrl: string): Observable<{ imageData: string; width: number; height: number }> {
    const subject = new Subject<{ imageData: string; width: number; height: number }>();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      subject.error('Context is null');
      subject.complete();
    } else {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.addEventListener('load', () => {
        try {
          const width = img.width;
          const height = img.height;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = canvas.toDataURL('image/png');
          subject.next({ imageData, width, height });
        } catch (e) {
          subject.error(e);
        }
        subject.complete();
      });
      img.addEventListener('error', (e) => {
        subject.error(e);
        subject.complete();
      });
      img.setAttribute('src', imageUrl);
    }
    return subject.asObservable();
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

