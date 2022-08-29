import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, concatMap, forkJoin, map, Observable, of, Subject, switchMap } from 'rxjs';
import { AppLayerModel } from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';

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

  public getAppLayerAndUrl$(appLayers$: Observable<AppLayerModel[]>): Observable<Array<{ appLayer: AppLayerModel; url: string }>> {
    return this.mapService.getLayerManager$()
      .pipe(
        switchMap(layerManager => appLayers$.pipe(
          map(appLayers => {
            return appLayers.map(appLayer => ({
              appLayer,
              url: appLayer.legendImageUrl
                ? appLayer.legendImageUrl
                : layerManager.getLegendUrl(`${appLayer.id}`),
            }));
          }),
        )),
      );
  }

  public getLegendImages$(appLayers$: Observable<AppLayerModel[]>, urlCallback?: (layer: AppLayerModel, url: URL) => void):
    Observable<Array<{ appLayer: AppLayerModel; imageData: string; width: number; height: number }>> {
    return this.getAppLayerAndUrl$(appLayers$).pipe(
      concatMap(appLayerAndUrls => {
        return forkJoin(appLayerAndUrls.filter(lu => lu.url !== '').map(appLayerWithLegendUrl => {
          const url = new URL(appLayerWithLegendUrl.url);
          if (urlCallback) {
            urlCallback(appLayerWithLegendUrl.appLayer, url);
          }
          return LegendService.imageUrlToPng$(url.toString()).pipe(
            catchError((e) => {
              console.log(`Error getting legend from URL ${appLayerWithLegendUrl.url}`, e);
              return of(null);
            }),
            map(legendImage => ({
                  ...legendImage,
                  appLayer: appLayerWithLegendUrl.appLayer,
            })),
          );
        }));
      }),
      map(array => {
        return array.filter(a => a !== null) as Array<{ appLayer: AppLayerModel; imageData: string; width: number; height: number }>;
      }),
    );
  }

  public static imageUrlToPng$(imageUrl: string): Observable<{ imageData: string; width: number; height: number }> {
    const subject = new Subject<{ imageData: string; width: number; height: number}>();
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
}
