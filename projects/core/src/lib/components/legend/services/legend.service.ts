import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap } from 'rxjs';
import { AppLayerModel, ServiceModel } from '@tailormap-viewer/api';
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

  public getAppLayerAndUrl$(appLayers$: Observable<Array<{ layer: AppLayerModel; service?: ServiceModel}>>):
    Observable<Array<{ layer: AppLayerModel; service?: ServiceModel; url: string }>> {
    return this.mapService.getLayerManager$()
      .pipe(
        switchMap(layerManager => appLayers$.pipe(
          map(appLayers => {
            return appLayers.map(appLayerAndService => ({
              ...appLayerAndService,
              url: appLayerAndService.layer.legendImageUrl
                ? appLayerAndService.layer.legendImageUrl
                : layerManager.getLegendUrl(`${appLayerAndService.layer.id}`),
            }));
          }),
        )),
      );
  }

}
