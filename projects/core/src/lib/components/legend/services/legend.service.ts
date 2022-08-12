import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap } from 'rxjs';
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

}
