import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap } from 'rxjs';
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

